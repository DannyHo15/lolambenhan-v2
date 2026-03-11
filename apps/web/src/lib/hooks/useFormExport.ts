/**
 * Hook for exporting form submissions
 */
import { useState } from 'react'
import { formsApi } from '../api/forms'

export function useFormExport() {
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const exportSubmission = async (
    submissionId: string,
    options: {
      format?: 'docx' | 'pdf' | 'html' | 'json'
      includeSignature?: boolean
      includeTimestamp?: boolean
    } = {}
  ) => {
    try {
      setExporting(true)
      setError(null)

      const response = await formsApi.exportSubmission(submissionId, options)

      if (!response.success) {
        throw new Error(response.message || 'Export failed')
      }

      const { format, filename, mimeType, content } = response.data

      // Decode base64 content
      const binaryContent = atob(content)
      const bytes = new Uint8Array(binaryContent.length)
      for (let i = 0; i < binaryContent.length; i++) {
        bytes[i] = binaryContent.charCodeAt(i)
      }

      // Create blob and download
      const blob = new Blob([bytes], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true, filename }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setExporting(false)
    }
  }

  const exportToHtmlPreview = async (
    submissionId: string,
    options: { includeSignature?: boolean; includeTimestamp?: boolean } = {}
  ) => {
    try {
      setExporting(true)
      setError(null)

      const response = await formsApi.exportSubmission(submissionId, {
        format: 'html',
        ...options,
      })

      if (!response.success) {
        throw new Error(response.message || 'Export failed')
      }

      // Return HTML content directly for preview
      return atob(response.data.content)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed'
      setError(message)
      return null
    } finally {
      setExporting(false)
    }
  }

  return {
    exportSubmission,
    exportToHtmlPreview,
    exporting,
    error,
  }
}
