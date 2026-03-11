/**
 * Form Template Entity
 * Pure domain entity - no framework dependencies
 */
export type Specialty =
  | "noi-khoa"
  | "tien-phau"
  | "hau-phau"
  | "san-khoa"
  | "phu-khoa"
  | "nhi-khoa"
  | "yhct"
  | "dieu-duong"
  | "gmhs-sv"
  | "gmhs-bs"
  | "khac"

export type TemplateStatus = "draft" | "active" | "deprecated" | "archived"
export type InstanceStatus = "draft" | "completed" | "submitted" | "approved" | "rejected"

export interface FormField {
  id: string
  name: string
  label?: string
  description?: string
  placeholder?: string
  type: "text" | "textarea" | "number" | "date" | "datetime" | "select" | "radio" | "checkbox" | "file" | "signature"
  order: number
  required?: boolean
  readonly?: boolean
  disabled?: boolean
  defaultValue?: unknown
  options?: Array<{ value: string; label: string }>
}

export interface FormSection {
  id: string
  name: string
  description?: string
  order: number
  collapsible?: boolean
  collapsedByDefault?: boolean
  fields: FormField[]
}

export interface FormTemplate {
  id: string
  name: string
  specialty: Specialty
  version: string
  description?: string
  status: TemplateStatus
  tags?: string[]
  templateSchema: {
    sections: FormSection[]
  }
  settings?: {
    allowPartialSave?: boolean
    requireSignature?: boolean
    autoSaveInterval?: number
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface FormSubmission {
  id: string
  templateId: string
  templateVersion: string
  patientId?: string
  filledBy: string
  filledAt: Date
  status: InstanceStatus
  formData: Record<string, unknown>
  sections?: Record<string, unknown[]>
  createdAt: Date
  updatedAt: Date
}
