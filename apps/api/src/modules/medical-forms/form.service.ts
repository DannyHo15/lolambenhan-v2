/**
 * Form Service - Business logic for medical forms
 */
import { randomUUID } from "crypto"
import { formRepository } from "./form.repository"
import { BadRequestError } from "../../shared/response.dto"
import { cache, CacheKeys } from "../../infrastructure/cache"
import type {
  FormTemplate,
  FormSubmission,
  Specialty,
  InstanceStatus,
} from "../../infrastructure/database/schema"
import type {
  FormInstance,
  FormAttachment,
} from "./schemas/form-template.schema"

interface CreateTemplateInput {
  id: string
  name: string
  specialty: Specialty
  version: string
  description?: string
  templateSchema: Parameters<typeof formRepository.createTemplate>[0]["templateSchema"]
  settings?: Parameters<typeof formRepository.createTemplate>[0]["settings"]
  exportConfig?: Parameters<typeof formRepository.createTemplate>[0]["exportConfig"]
  tags?: string[]
  createdBy: string
}

interface UpdateTemplateInput {
  name?: string
  description?: string
  status?: 'draft' | 'active' | 'deprecated' | 'archived'
  templateSchema?: Parameters<typeof formRepository.createTemplate>[0]["templateSchema"]
  settings?: Parameters<typeof formRepository.createTemplate>[0]["settings"]
  exportConfig?: Parameters<typeof formRepository.createTemplate>[0]["exportConfig"]
  tags?: string[]
  updatedBy: string
}

interface CreateSubmissionInput {
  templateId: string
  patientId?: string
  filledBy: string
  formData: Record<string, unknown>
  sections?: Record<string, unknown[]>
  attachments?: FormAttachment[]
  signature?: {
    imageUrl: string
    signedBy: string
    signedAt: string
    ipAddress?: string
  }
  metadata?: {
    device?: string
    browser?: string
    ipAddress?: string
    location?: string
  }
}

interface UpdateSubmissionInput {
  formData?: Record<string, unknown>
  sections?: Record<string, unknown[]>
  attachments?: FormAttachment[]
  status?: InstanceStatus
  signature?: {
    imageUrl: string
    signedBy: string
    signedAt: string
    ipAddress?: string
  }
}

export class FormService {
  // ============================================
  // TEMPLATE METHODS
  // ============================================

  /**
   * List all templates with filtering
   */
  async listTemplates(filters: {
    specialty?: Specialty
    status?: 'draft' | 'active' | 'deprecated' | 'archived'
    limit?: number
    offset?: number
  } = {}) {
    const cacheKey = CacheKeys.templatesList(filters)
    return await cache.getOrSet(
      cacheKey,
      () => formRepository.listTemplates(filters),
      300 // Cache for 5 minutes
    )
  }

  /**
   * Get a template by ID
   */
  async getTemplate(id: string) {
    const cacheKey = CacheKeys.template(id)
    const template = await cache.getOrSet(
      cacheKey,
      () => formRepository.getTemplateById(id),
      3600 // Cache for 1 hour
    )
    if (!template) {
      throw new BadRequestError("Template not found")
    }
    return template
  }

  /**
   * Get template by specialty
   */
  async getTemplateBySpecialty(specialty: Specialty) {
    const cacheKey = CacheKeys.templateBySpecialty(specialty)
    const template = await cache.getOrSet(
      cacheKey,
      () => formRepository.getTemplateBySpecialty(specialty),
      3600 // Cache for 1 hour
    )
    if (!template) {
      throw new BadRequestError("No active template found for this specialty")
    }
    return template
  }

  /**
   * Create a new template
   */
  async createTemplate(input: CreateTemplateInput): Promise<FormTemplate> {
    // Check if ID already exists
    const existing = await formRepository.getTemplateById(input.id)
    if (existing) {
      throw new BadRequestError("Template ID already exists")
    }

    // Validate specialty
    const validSpecialties: Specialty[] = [
      'noi-khoa', 'tien-phau', 'hau-phau', 'san-khoa', 'phu-khoa',
      'nhi-khoa', 'yhct', 'dieu-duong', 'gmhs-sv', 'gmhs-bs', 'khac'
    ]
    if (!validSpecialties.includes(input.specialty)) {
      throw new BadRequestError("Invalid specialty")
    }

    const template = await formRepository.createTemplate({
      id: input.id,
      name: input.name,
      specialty: input.specialty,
      version: input.version,
      description: input.description,
      status: 'draft',
      tags: input.tags ?? [],
      templateSchema: input.templateSchema,
      settings: input.settings ?? {
        allowPartialSave: true,
        requireSignature: false,
      },
      exportConfig: input.exportConfig ?? {
        includeTimestamp: true,
        includeSignature: true,
      },
      metadata: {
        createdBy: input.createdBy,
        createdAt: new Date().toISOString(),
      },
      createdBy: input.createdBy,
    })

    // Invalidate cache
    await cache.invalidateTemplate(input.id, input.specialty)

    return template
  }

  /**
   * Update an existing template
   */
  async updateTemplate(id: string, input: UpdateTemplateInput): Promise<FormTemplate> {
    const template = await formRepository.getTemplateById(id)
    if (!template) {
      throw new BadRequestError("Template not found")
    }

    // Don't allow changing specialty
    if (template.specialty !== input.specialty) {
      // This would be a separate check if specialty was in input
    }

    const updateData: Parameters<typeof formRepository.updateTemplate>[1] = {
      updatedBy: input.updatedBy,
    }

    if (input.name) updateData.name = input.name
    if (input.description !== undefined) updateData.description = input.description
    if (input.status) updateData.status = input.status
    if (input.templateSchema) updateData.templateSchema = input.templateSchema
    if (input.settings) updateData.settings = input.settings
    if (input.exportConfig) updateData.exportConfig = input.exportConfig
    if (input.tags !== undefined) updateData.tags = input.tags

    const updated = await formRepository.updateTemplate(id, updateData)
    if (!updated) {
      throw new BadRequestError("Failed to update template")
    }

    // Invalidate cache
    await cache.invalidateTemplate(id, template.specialty)

    return updated
  }

  /**
   * Delete (soft delete) a template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const template = await formRepository.getTemplateById(id)
    if (!template) {
      throw new BadRequestError("Template not found")
    }

    const deleted = await formRepository.deleteTemplate(id)

    // Invalidate cache
    await cache.invalidateTemplate(id, template.specialty)

    return deleted
  }

  /**
   * Duplicate a template (create new version)
   */
  async duplicateTemplate(id: string, newVersion: string, createdBy: string): Promise<FormTemplate> {
    const template = await this.getTemplate(id)

    const newId = `${template.specialty}-v${newVersion.replace(/\./g, '-')}`

    return await this.createTemplate({
      id: newId,
      name: template.name,
      specialty: template.specialty,
      version: newVersion,
      description: template.description,
      templateSchema: template.templateSchema,
      settings: template.settings,
      exportConfig: template.exportConfig,
      tags: template.tags,
      createdBy,
    })
  }

  // ============================================
  // SUBMISSION METHODS
  // ============================================

  /**
   * List submissions with filtering
   */
  async listSubmissions(filters: {
    templateId?: string
    patientId?: string
    filledBy?: string
    status?: InstanceStatus
    limit?: number
    offset?: number
  } = {}) {
    return await formRepository.listSubmissions(filters)
  }

  /**
   * Get a submission by ID
   */
  async getSubmission(id: string) {
    const cacheKey = CacheKeys.submission(id)
    const cached = await cache.get<{ submission: FormSubmission; template: FormTemplate | null }>(cacheKey)

    if (cached) {
      return cached
    }

    const submission = await formRepository.getSubmissionById(id)
    if (!submission) {
      throw new BadRequestError("Submission not found")
    }

    // Get template info
    const template = await formRepository.getTemplateById(submission.templateId)

    const result = {
      ...submission,
      template,
    }

    // Cache for 5 minutes (submissions change frequently)
    await cache.set(cacheKey, result, 300)

    return result
  }

  /**
   * Create a new submission
   */
  async createSubmission(input: CreateSubmissionInput): Promise<FormSubmission> {
    // Get template to validate
    const template = await formRepository.getTemplateById(input.templateId)
    if (!template) {
      throw new BadRequestError("Template not found")
    }

    // Generate submission ID
    const submissionId = `sub-${Date.now()}-${randomUUID().slice(0, 8)}`

    // Create submission
    const submission = await formRepository.createSubmission({
      id: submissionId,
      templateId: input.templateId,
      templateVersion: template.version,
      patientId: input.patientId,
      filledBy: input.filledBy,
      status: 'draft',
      formData: input.formData,
      sections: input.sections ?? {},
      attachments: input.attachments ?? [],
      signature: input.signature ?? null,
      metadata: input.metadata ?? null,
    })

    // Add history entry
    await formRepository.addHistoryEntry({
      submissionId: submissionId,
      action: 'created',
      previousData: null,
      newData: input.formData,
      changedBy: input.filledBy,
      changedByName: input.metadata?.browser,
    })

    // Invalidate submission cache
    await cache.invalidateSubmission(submissionId)

    return submission
  }

  /**
   * Update a submission
   */
  async updateSubmission(id: string, input: UpdateSubmissionInput & { filledBy: string }): Promise<FormSubmission> {
    const submission = await formRepository.getSubmissionById(id)
    if (!submission) {
      throw new BadRequestError("Submission not found")
    }

    // Check if can update (only draft or completed can be updated)
    if (submission.status === 'submitted' || submission.status === 'approved') {
      throw new BadRequestError("Cannot update a submitted or approved submission")
    }

    const updateData: Parameters<typeof formRepository.updateSubmission>[1] = {}

    if (input.formData) updateData.formData = input.formData
    if (input.sections) updateData.sections = input.sections
    if (input.attachments) updateData.attachments = input.attachments
    if (input.signature) updateData.signature = input.signature
    if (input.status) updateData.status = input.status

    const updated = await formRepository.updateSubmission(id, updateData)
    if (!updated) {
      throw new BadRequestError("Failed to update submission")
    }

    // Add history entry if data changed
    if (input.formData || input.status) {
      await formRepository.addHistoryEntry({
        submissionId: id,
        action: 'updated',
        previousData: { formData: submission.formData, status: submission.status },
        newData: {
          formData: input.formData ?? submission.formData,
          status: input.status ?? submission.status,
        },
        changedBy: input.filledBy,
      })
    }

    // Invalidate cache
    await cache.invalidateSubmission(id)

    return updated
  }

  /**
   * Submit a submission for approval
   */
  async submitSubmission(id: string, filledBy: string): Promise<FormSubmission> {
    return await this.updateSubmission(id, {
      filledBy,
      status: 'submitted',
      submittedAt: new Date(),
    } as any)
  }

  /**
   * Approve or reject a submission
   */
  async reviewSubmission(
    id: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    reviewNotes?: string
  ): Promise<FormSubmission> {
    const submission = await formRepository.getSubmissionById(id)
    if (!submission) {
      throw new BadRequestError("Submission not found")
    }

    if (submission.status !== 'submitted') {
      throw new BadRequestError("Can only review submitted forms")
    }

    const updateData: Parameters<typeof formRepository.updateSubmission>[1] = {
      status,
      reviewedBy,
      reviewedAt: new Date(),
    }

    const updated = await formRepository.updateSubmission(id, updateData)
    if (!updated) {
      throw new BadRequestError("Failed to review submission")
    }

    // Add history entry
    await formRepository.addHistoryEntry({
      submissionId: id,
      action: status,
      previousData: { status: submission.status },
      newData: { status },
      changedBy: reviewedBy,
      notes: reviewNotes,
    })

    // Invalidate cache
    await cache.invalidateSubmission(id)

    return updated
  }

  /**
   * Delete (soft delete) a submission
   */
  async deleteSubmission(id: string): Promise<boolean> {
    const submission = await formRepository.getSubmissionById(id)
    if (!submission) {
      throw new BadRequestError("Submission not found")
    }

    const deleted = await formRepository.deleteSubmission(id)

    // Invalidate cache
    await cache.invalidateSubmission(id)

    return deleted
  }

  /**
   * Get submission history
   */
  async getSubmissionHistory(id: string) {
    const submission = await formRepository.getSubmissionById(id)
    if (!submission) {
      throw new BadRequestError("Submission not found")
    }

    return await formRepository.getSubmissionHistory(id)
  }

  /**
   * Get submission statistics
   */
  async getStats(templateId?: string) {
    return await formRepository.countSubmissionsByStatus(templateId)
  }
}

// Singleton instance
export const formService = new FormService()
