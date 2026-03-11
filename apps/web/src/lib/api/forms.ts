/**
 * Forms API Client
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/apis/v1'

export interface FormTemplate {
  id: string
  name: string
  specialty: string
  version: string
  description?: string
  status: 'draft' | 'active' | 'deprecated' | 'archived'
  tags: string[]
  templateSchema: {
    sections: FormSection[]
  }
  settings?: {
    allowPartialSave?: boolean
    requireSignature?: boolean
    autoSaveInterval?: number
    confirmationRequired?: boolean
    submitButtonText?: string
    showProgress?: boolean
  }
  exportConfig?: {
    docxTemplate?: string
    pdfTemplate?: string
    includeTimestamp?: boolean
    includeSignature?: boolean
  }
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface FormSection {
  id: string
  name: string
  description?: string
  order: number
  collapsible?: boolean
  collapsedByDefault?: boolean
  repeatable?: boolean
  minRepeat?: number
  maxRepeat?: number
  conditionalDisplay?: {
    operator?: 'AND' | 'OR'
    conditions?: Array<{
      fieldId: string
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_array'
      value?: unknown
    }>
  }
  fields: FormField[]
}

export interface FormField {
  id: string
  name: string
  label?: string
  description?: string
  placeholder?: string
  type: 'text' | 'textarea' | 'number' | 'date' | 'datetime' | 'select' | 'radio' | 'checkbox' | 'file' | 'signature'
  order: number
  required?: boolean
  readonly?: boolean
  disabled?: boolean
  defaultValue?: unknown
  // Text/Textarea
  minLength?: number
  maxLength?: number
  pattern?: string
  patternMessage?: string
  // Number
  min?: number
  max?: number
  step?: number
  unit?: string
  // Date
  minDate?: string
  maxDate?: string
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  // Select/Radio/Checkbox
  options?: Array<{ value: string; label: string; color?: string; icon?: string }>
  multiple?: boolean
  columns?: number
  // File
  accept?: string[]
  maxSize?: number
  maxFiles?: number
  // Conditional
  conditionalDisplay?: {
    operator?: 'AND' | 'OR'
    conditions?: Array<{
      fieldId: string
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_array'
      value?: unknown
    }>
  }
  // Calculated
  calculated?: boolean
  calculation?: string
  // Validation
  customValidation?: {
    validator: string
    errorMessage?: string
  }
  // UI
  width?: 'full' | 'half' | 'third' | 'quarter'
  showLabel?: boolean
  hint?: string
  autocomplete?: string
  category?: string
}

export interface FormSubmission {
  id: string
  templateId: string
  templateVersion: string
  patientId?: string
  filledBy: string
  filledAt: Date
  status: 'draft' | 'completed' | 'submitted' | 'approved' | 'rejected'
  formData: Record<string, unknown>
  sections?: Record<string, unknown[]>
  attachments?: Array<{
    id: string
    fieldId: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
    uploadedAt: string
  }>
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
  submittedAt?: Date
  approvedBy?: string
  approvedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  timestamp: string
}

// Helper to get auth token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  const authStorage = localStorage.getItem('auth-storage')
  if (!authStorage) return null
  try {
    const parsed = JSON.parse(authStorage)
    return parsed.state?.token || null
  } catch {
    return null
  }
}

class FormsApi {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE}${endpoint}`
    const token = getAuthToken()

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }))
      throw new Error(error.message || 'API request failed')
    }

    return response.json()
  }

  // Templates
  async listTemplates(filters?: {
    specialty?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ templates: FormTemplate[]; count: number }>> {
    const params = new URLSearchParams()
    if (filters?.specialty) params.set('specialty', filters.specialty)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.limit) params.set('limit', String(filters.limit))
    if (filters?.offset) params.set('offset', String(filters.offset))

    const query = params.toString() ? `?${params}` : ''
    return this.request(`/forms/templates${query}`)
  }

  async getTemplate(id: string): Promise<ApiResponse<{ template: FormTemplate }>> {
    return this.request(`/forms/templates/${id}`)
  }

  async getTemplateBySpecialty(
    specialty: string
  ): Promise<ApiResponse<{ template: FormTemplate }>> {
    return this.request(`/forms/template/${specialty}`)
  }

  async createTemplate(
    data: Partial<FormTemplate>
  ): Promise<ApiResponse<{ template: FormTemplate }>> {
    return this.request('/forms/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTemplate(
    id: string,
    data: Partial<FormTemplate>
  ): Promise<ApiResponse<{ template: FormTemplate }>> {
    return this.request(`/forms/templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async deleteTemplate(id: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return this.request(`/forms/templates/${id}`, { method: 'DELETE' })
  }

  // Submissions
  async listSubmissions(filters?: {
    templateId?: string
    patientId?: string
    filledBy?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<{ submissions: FormSubmission[]; count: number }>> {
    const params = new URLSearchParams()
    if (filters?.templateId) params.set('templateId', filters.templateId)
    if (filters?.patientId) params.set('patientId', filters.patientId)
    if (filters?.filledBy) params.set('filledBy', filters.filledBy)
    if (filters?.status) params.set('status', filters.status)
    if (filters?.limit) params.set('limit', String(filters.limit))
    if (filters?.offset) params.set('offset', String(filters.offset))

    const query = params.toString() ? `?${params}` : ''
    return this.request(`/forms/submissions${query}`)
  }

  async getSubmission(id: string): Promise<ApiResponse<{ submission: FormSubmission }>> {
    return this.request(`/forms/submissions/${id}`)
  }

  async getSubmissionHistory(id: string): Promise<ApiResponse<{ history: unknown[] }>> {
    return this.request(`/forms/submissions/${id}/history`)
  }

  async createSubmission(
    data: {
      templateId: string
      patientId?: string
      filledBy: string
      formData: Record<string, unknown>
      sections?: Record<string, unknown[]>
      attachments?: Array<{
        id: string
        fieldId: string
        fileName: string
        fileUrl: string
        fileSize: number
        mimeType: string
        uploadedAt: string
      }>
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
  ): Promise<ApiResponse<{ submission: FormSubmission }>> {
    return this.request('/forms/submissions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateSubmission(
    id: string,
    data: {
      formData?: Record<string, unknown>
      sections?: Record<string, unknown[]>
      status?: string
      filledBy: string
    }
  ): Promise<ApiResponse<{ submission: FormSubmission }>> {
    return this.request(`/forms/submissions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async submitSubmission(
    id: string,
    filledBy: string
  ): Promise<ApiResponse<{ submission: FormSubmission }>> {
    return this.request(`/forms/submissions/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify({ filledBy }),
    })
  }

  async deleteSubmission(id: string): Promise<ApiResponse<{ deleted: boolean; id: string }>> {
    return this.request(`/forms/submissions/${id}`, { method: 'DELETE' })
  }

  // Export
  async exportSubmission(
    id: string,
    options: {
      format?: 'docx' | 'pdf' | 'html' | 'json'
      includeSignature?: boolean
      includeTimestamp?: boolean
    } = {}
  ): Promise<ApiResponse<{ format: string; filename: string; mimeType: string; content: string }>> {
    const params = new URLSearchParams()
    if (options.format) params.set('format', options.format)
    if (options.includeSignature) params.set('includeSignature', 'true')
    if (!options.includeTimestamp) params.set('includeTimestamp', 'false')

    const query = params.toString() ? `?${params}` : ''
    return this.request(`/forms/submissions/${id}/export${query}`)
  }

  // Stats
  async getStats(templateId?: string): Promise<ApiResponse<{ stats: Record<string, number> }>> {
    const params = templateId ? `?templateId=${templateId}` : ''
    return this.request(`/forms/stats${params}`)
  }
}

export const formsApi = new FormsApi()
