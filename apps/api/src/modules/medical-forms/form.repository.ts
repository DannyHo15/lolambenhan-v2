/**
 * Form Repository - Data access layer for forms
 */
import { eq, and, desc, asc, sql, isNull, or } from "drizzle-orm"
import { getDb } from "../../infrastructure/database/connection"
import {
  formTemplates,
  formSubmissions,
  submissionHistory,
  type FormTemplate,
  type NewFormTemplate,
  type FormSubmission,
  type NewFormSubmission,
  type SubmissionHistory,
  type NewSubmissionHistory,
  type Specialty,
  type TemplateStatus,
  type InstanceStatus,
} from "../../infrastructure/database/schema"

export class FormRepository {
  private db = getDb()

  // ============================================
  // FORM TEMPLATES
  // ============================================

  /**
   * List all form templates with optional filtering
   */
  async listTemplates(filters: {
    specialty?: Specialty
    status?: TemplateStatus
    limit?: number
    offset?: number
  } = {}) {
    const { specialty, status, limit = 100, offset = 0 } = filters

    let query = this.db
      .select({
        id: formTemplates.id,
        name: formTemplates.name,
        specialty: formTemplates.specialty,
        version: formTemplates.version,
        description: formTemplates.description,
        status: formTemplates.status,
        tags: formTemplates.tags,
        createdBy: formTemplates.createdBy,
        createdAt: formTemplates.createdAt,
        updatedAt: formTemplates.updatedAt,
      })
      .from(formTemplates)
      .where(isNull(formTemplates.deletedAt))

    if (specialty) {
      query = query.where(and(isNull(formTemplates.deletedAt), eq(formTemplates.specialty, specialty))) as typeof query
    }
    if (status) {
      query = query.where(and(isNull(formTemplates.deletedAt), eq(formTemplates.status, status))) as typeof query
    }

    return await query
      .orderBy(desc(formTemplates.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get a form template by ID
   */
  async getTemplateById(id: string): Promise<FormTemplate | null> {
    const results = await this.db
      .select()
      .from(formTemplates)
      .where(and(eq(formTemplates.id, id), isNull(formTemplates.deletedAt)))
      .limit(1)

    return results[0] || null
  }

  /**
   * Get template by specialty (active version)
   */
  async getTemplateBySpecialty(specialty: Specialty): Promise<FormTemplate | null> {
    const results = await this.db
      .select()
      .from(formTemplates)
      .where(
        and(
          eq(formTemplates.specialty, specialty),
          eq(formTemplates.status, 'active'),
          isNull(formTemplates.deletedAt)
        )
      )
      .orderBy(desc(formTemplates.version))
      .limit(1)

    return results[0] || null
  }

  /**
   * Create a new form template
   */
  async createTemplate(data: NewFormTemplate): Promise<FormTemplate> {
    const results = await this.db
      .insert(formTemplates)
      .values(data)
      .returning()

    return results[0]!
  }

  /**
   * Update a form template
   */
  async updateTemplate(id: string, data: Partial<NewFormTemplate>): Promise<FormTemplate | null> {
    const results = await this.db
      .update(formTemplates)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(formTemplates.id, id))
      .returning()

    return results[0] || null
  }

  /**
   * Soft delete a form template
   */
  async deleteTemplate(id: string): Promise<boolean> {
    const results = await this.db
      .update(formTemplates)
      .set({ deletedAt: new Date() })
      .where(eq(formTemplates.id, id))
      .returning()

    return results.length > 0
  }

  // ============================================
  // FORM SUBMISSIONS
  // ============================================

  /**
   * List form submissions with optional filtering
   */
  async listSubmissions(filters: {
    templateId?: string
    patientId?: string
    filledBy?: string
    status?: InstanceStatus
    limit?: number
    offset?: number
  } = {}) {
    const { templateId, patientId, filledBy, status, limit = 100, offset = 0 } = filters

    let query = this.db
      .select()
      .from(formSubmissions)
      .where(isNull(formSubmissions.deletedAt))

    const conditions = [isNull(formSubmissions.deletedAt)]

    if (templateId) conditions.push(eq(formSubmissions.templateId, templateId))
    if (patientId) conditions.push(eq(formSubmissions.patientId, patientId))
    if (filledBy) conditions.push(eq(formSubmissions.filledBy, filledBy))
    if (status) conditions.push(eq(formSubmissions.status, status))

    if (conditions.length > 1) {
      query = query.where(and(...conditions)) as typeof query
    }

    return await query
      .orderBy(desc(formSubmissions.createdAt))
      .limit(limit)
      .offset(offset)
  }

  /**
   * Get a form submission by ID
   */
  async getSubmissionById(id: string): Promise<FormSubmission | null> {
    const results = await this.db
      .select()
      .from(formSubmissions)
      .where(and(eq(formSubmissions.id, id), isNull(formSubmissions.deletedAt)))
      .limit(1)

    return results[0] || null
  }

  /**
   * Create a new form submission
   */
  async createSubmission(data: NewFormSubmission): Promise<FormSubmission> {
    const results = await this.db
      .insert(formSubmissions)
      .values(data)
      .returning()

    return results[0]!
  }

  /**
   * Update a form submission
   */
  async updateSubmission(id: string, data: Partial<NewFormSubmission>): Promise<FormSubmission | null> {
    const results = await this.db
      .update(formSubmissions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(formSubmissions.id, id))
      .returning()

    return results[0] || null
  }

  /**
   * Soft delete a form submission
   */
  async deleteSubmission(id: string): Promise<boolean> {
    const results = await this.db
      .update(formSubmissions)
      .set({ deletedAt: new Date() })
      .where(eq(formSubmissions.id, id))
      .returning()

    return results.length > 0
  }

  // ============================================
  // SUBMISSION HISTORY
  // ============================================

  /**
   * Add history entry for a submission
   */
  async addHistoryEntry(data: NewSubmissionHistory): Promise<SubmissionHistory> {
    const results = await this.db
      .insert(submissionHistory)
      .values(data)
      .returning()

    return results[0]!
  }

  /**
   * Get history for a submission
   */
  async getSubmissionHistory(submissionId: string, limit = 50): Promise<SubmissionHistory[]> {
    return await this.db
      .select()
      .from(submissionHistory)
      .where(eq(submissionHistory.submissionId, submissionId))
      .orderBy(desc(submissionHistory.createdAt))
      .limit(limit)
  }

  /**
   * Count submissions by status
   */
  async countSubmissionsByStatus(templateId?: string): Promise<Record<InstanceStatus, number>> {
    const whereConditions = templateId
      ? [eq(formSubmissions.templateId, templateId), isNull(formSubmissions.deletedAt)]
      : [isNull(formSubmissions.deletedAt)]

    const results = await this.db
      .select({
        status: formSubmissions.status,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(formSubmissions)
      .where(and(...whereConditions))
      .groupBy(formSubmissions.status)

    return {
      draft: results.find((r) => r.status === 'draft')?.count ?? 0,
      completed: results.find((r) => r.status === 'completed')?.count ?? 0,
      submitted: results.find((r) => r.status === 'submitted')?.count ?? 0,
      approved: results.find((r) => r.status === 'approved')?.count ?? 0,
      rejected: results.find((r) => r.status === 'rejected')?.count ?? 0,
    }
  }
}

// Singleton instance
export const formRepository = new FormRepository()
