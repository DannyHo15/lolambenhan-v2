/**
 * Form Template Repository Interface (Port)
 * Defines contract - no implementation
 */
import type { FormTemplate, FormSubmission, Specialty, TemplateStatus, InstanceStatus } from "../entities/form.entity"

export interface IFormTemplateRepository {
  findById(id: string): Promise<FormTemplate | null>
  findBySpecialty(specialty: Specialty): Promise<FormTemplate | null>
  findAll(filters?: {
    specialty?: Specialty
    status?: TemplateStatus
    limit?: number
    offset?: number
  }): Promise<FormTemplate[]>
  create(template: Omit<FormTemplate, "createdAt" | "updatedAt">): Promise<FormTemplate>
  update(id: string, data: Partial<FormTemplate>): Promise<FormTemplate | null>
  delete(id: string): Promise<boolean>
}

export interface IFormSubmissionRepository {
  findById(id: string): Promise<FormSubmission | null>
  findAll(filters?: {
    templateId?: string
    patientId?: string
    filledBy?: string
    status?: InstanceStatus
    limit?: number
    offset?: number
  }): Promise<FormSubmission[]>
  create(submission: Omit<FormSubmission, "createdAt" | "updatedAt">): Promise<FormSubmission>
  update(id: string, data: Partial<FormSubmission>): Promise<FormSubmission | null>
  delete(id: string): Promise<boolean>
}
