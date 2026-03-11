/**
 * Export Service - Export forms to DOCX/PDF
 */
import { formRepository } from "./form.repository"
import { FormSubmission } from "../../infrastructure/database/schema"
import type { FormTemplate } from "../../infrastructure/database/schema"

export interface ExportOptions {
  format: 'docx' | 'pdf' | 'html' | 'json'
  includeSignature?: boolean
  includeTimestamp?: boolean
  includeMetadata?: boolean
}

export interface ExportResult {
  format: string
  content: string
  filename: string
  mimeType: string
}

class ExportService {
  /**
   * Export a submission to various formats
   */
  async exportSubmission(submissionId: string, options: ExportOptions = { format: 'docx' }): Promise<ExportResult> {
    const submission = await formRepository.getSubmissionById(submissionId)
    if (!submission) {
      throw new Error('Submission not found')
    }

    const template = await formRepository.getTemplateById(submission.templateId)
    if (!template) {
      throw new Error('Template not found')
    }

    switch (options.format) {
      case 'docx':
        return this.exportToDocx(submission, template, options)
      case 'pdf':
        return this.exportToPdf(submission, template, options)
      case 'html':
        return this.exportToHtml(submission, template, options)
      case 'json':
        return this.exportToJson(submission, template, options)
      default:
        throw new Error(`Unsupported format: ${options.format}`)
    }
  }

  /**
   * Export to DOCX format
   */
  private async exportToDocx(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): Promise<ExportResult> {
    const content = this.generateTextContent(submission, template, options)

    // For now, return a text-based format
    // In production, use docx library to generate proper DOCX
    const filename = `${template.name}_${new Date().getTime()}.doc`

    return {
      format: 'docx',
      content: this.generateDocxContent(submission, template, options),
      filename,
      mimeType: 'application/msword',
    }
  }

  /**
   * Export to PDF format
   */
  private async exportToPdf(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): Promise<ExportResult> {
    const filename = `${template.name}_${new Date().getTime()}.pdf`

    return {
      format: 'pdf',
      content: this.generatePdfContent(submission, template, options),
      filename,
      mimeType: 'application/pdf',
    }
  }

  /**
   * Export to HTML format
   */
  private async exportToHtml(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): Promise<ExportResult> {
    const filename = `${template.name}_${new Date().getTime()}.html`

    return {
      format: 'html',
      content: this.generateHtmlContent(submission, template, options),
      filename,
      mimeType: 'text/html',
    }
  }

  /**
   * Export to JSON format
   */
  private async exportToJson(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): Promise<ExportResult> {
    const filename = `${template.name}_${new Date().getTime()}.json`

    const data = {
      template: {
        id: template.id,
        name: template.name,
        specialty: template.specialty,
        version: template.version,
      },
      submission: {
        id: submission.id,
        patientId: submission.patientId,
        status: submission.status,
        formData: submission.formData,
        sections: submission.sections,
      },
      metadata: options.includeMetadata ? submission.metadata : undefined,
      exportedAt: new Date().toISOString(),
    }

    return {
      format: 'json',
      content: JSON.stringify(data, null, 2),
      filename,
      mimeType: 'application/json',
    }
  }

  /**
   * Generate text content for export
   */
  private generateTextContent(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): string {
    const lines: string[] = []

    // Header
    lines.push('=' .repeat(60))
    lines.push(template.name.toUpperCase())
    lines.push(`Mẫu: ${template.version} | Khoa: ${template.specialty}`)
    lines.push('='.repeat(60))
    lines.push('')

    // Submission info
    lines.push('THÔNG TIN BỆNH ÁN')
    lines.push('-'.repeat(40))
    lines.push(`Mã số: ${submission.id}`)
    if (submission.patientId) lines.push(`Mã bệnh nhân: ${submission.patientId}`)
    lines.push(`Người lập: ${submission.filledBy}`)
    lines.push(`Ngày lập: ${new Date(submission.filledAt).toLocaleString('vi-VN')}`)
    if (submission.submittedAt) {
      lines.push(`Ngày gửi: ${new Date(submission.submittedAt).toLocaleString('vi-VN')}`)
    }
    lines.push(`Trạng thái: ${this.translateStatus(submission.status)}`)
    lines.push('')

    // Form data
    lines.push('NỘI DUNG')
    lines.push('-'.repeat(40))

    for (const [key, value] of Object.entries(submission.formData)) {
      if (value !== null && value !== undefined && value !== '') {
        const label = this.fieldLabel(key, template)
        const displayValue = this.formatValue(value)
        lines.push(`${label}: ${displayValue}`)
      }
    }

    // Signature
    if (options.includeSignature && submission.signature) {
      lines.push('')
      lines.push('CHỮ KÝ')
      lines.push('-'.repeat(40))
      lines.push(`Người ký: ${submission.signature.signedBy}`)
      lines.push(`Ngày ký: ${new Date(submission.signature.signedAt).toLocaleString('vi-VN')}`)
    }

    // Footer
    if (options.includeTimestamp) {
      lines.push('')
      lines.push('='.repeat(60))
      lines.push(`Xuất vào: ${new Date().toLocaleString('vi-VN')}`)
      lines.push('Hệ thống Bệnh án Điện tử LoLamBenhAn')
      lines.push('='.repeat(60))
    }

    return lines.join('\n')
  }

  /**
   * Generate DOCX content
   */
  private generateDocxContent(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): string {
    // Simple DOCX-compatible HTML content
    return this.generateHtmlContent(submission, template, options)
  }

  /**
   * Generate PDF content
   */
  private generatePdfContent(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): string {
    // Return HTML content that can be converted to PDF
    return this.generateHtmlContent(submission, template, options)
  }

  /**
   * Generate HTML content
   */
  private generateHtmlContent(
    submission: FormSubmission,
    template: FormTemplate,
    options: ExportOptions
  ): string {
    const formData = submission.formData

    let html = `
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${template.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; color: #000; background: #fff; padding: 40px; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
    .header h1 { font-size: 24px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; }
    .header p { font-size: 12px; color: #666; }
    .info-table { width: 100%; margin-bottom: 20px; }
    .info-table td { padding: 5px 10px; }
    .info-table td:first-child { font-weight: bold; width: 150px; }
    .section { margin-bottom: 25px; }
    .section-title { font-weight: bold; font-size: 16px; margin-bottom: 10px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
    .field-row { display: flex; margin-bottom: 8px; }
    .field-label { font-weight: bold; width: 200px; flex-shrink: 0; }
    .field-value { flex: 1; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; text-align: center; font-size: 11px; color: #666; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 1px solid #000; }
    .signature p { margin-bottom: 5px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${template.name}</h1>
    <p>Mẫu: ${template.version} | Khoa: ${this.translateSpecialty(template.specialty)}</p>
  </div>

  <table class="info-table">
    <tr><td>Mã số bệnh án:</td><td>${submission.id}</td></tr>
    ${submission.patientId ? `<tr><td>Mã bệnh nhân:</td><td>${submission.patientId}</td></tr>` : ''}
    <tr><td>Người lập:</td><td>${submission.filledBy}</td></tr>
    <tr><td>Ngày lập:</td><td>${new Date(submission.filledAt).toLocaleString('vi-VN')}</td></tr>
    ${submission.submittedAt ? `<tr><td>Ngày gửi:</td><td>${new Date(submission.submittedAt).toLocaleString('vi-VN')}</td></tr>` : ''}
    <tr><td>Trạng thái:</td><td>${this.translateStatus(submission.status)}</td></tr>
  </table>
`

    // Add sections from template
    for (const section of template.templateSchema.sections.sort((a, b) => a.order - b.order)) {
      html += `
  <div class="section">
    <div class="section-title">${section.name}</div>
`

      for (const field of section.fields.sort((a, b) => a.order - b.order)) {
        const value = formData[field.name]
        if (value !== null && value !== undefined && value !== '') {
          html += `
    <div class="field-row">
      <div class="field-label">${field.label || field.name}${field.required ? ' *' : ''}:</div>
      <div class="field-value">${this.formatValue(value)}</div>
    </div>`
        }
      }

      html += `
  </div>`
    }

    // Signature
    if (options.includeSignature && submission.signature) {
      html += `
  <div class="signature">
    <p><strong>CHỮ KÝ</strong></p>
    <p>Người ký: ${submission.signature.signedBy}</p>
    <p>Ngày ký: ${new Date(submission.signature.signedAt).toLocaleString('vi-VN')}</p>
  </div>`
    }

    // Footer
    if (options.includeTimestamp) {
      html += `
  <div class="footer">
    <p>Xuất vào: ${new Date().toLocaleString('vi-VN')}</p>
    <p>Hệ thống Bệnh án Điện tử LoLamBenhAn</p>
  </div>`
    }

    html += `
</body>
</html>`

    return html
  }

  /**
   * Get field label from template
   */
  private fieldLabel(fieldId: string, template: FormTemplate): string {
    for (const section of template.templateSchema.sections) {
      const field = section.fields.find((f: { name: string; label?: string }) => f.name === fieldId)
      if (field) {
        return field.label || field.name
      }
    }
    return fieldId
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return ''
    }
    if (typeof value === 'boolean') {
      return value ? 'Có' : 'Không'
    }
    if (Array.isArray(value)) {
      return value.join(', ')
    }
    return String(value)
  }

  /**
   * Translate specialty to Vietnamese
   */
  private translateSpecialty(specialty: string): string {
    const translations: Record<string, string> = {
      'noi-khoa': 'Nội khoa',
      'tien-phau': 'Tiền phẫu thuật',
      'hau-phau': 'Hậu phẫu thuật',
      'san-khoa': 'Sản khoa',
      'phu-khoa': 'Phụ khoa',
      'nhi-khoa': 'Nhi khoa',
      'yhct': 'Y học cổ truyền',
      'dieu-duong': 'Điều dưỡng',
      'gmhs-sv': 'Gây mê hồi sức (Sinh viên)',
      'gmhs-bs': 'Gây mê hồi sức (Bác sĩ)',
      'khac': 'Khác',
    }
    return translations[specialty] || specialty
  }

  /**
   * Translate status to Vietnamese
   */
  private translateStatus(status: string): string {
    const translations: Record<string, string> = {
      'draft': 'Nháp',
      'completed': 'Hoàn thành',
      'submitted': 'Đã gửi',
      'approved': 'Đã duyệt',
      'rejected': 'Từ chối',
    }
    return translations[status] || status
  }
}

export const exportService = new ExportService()
