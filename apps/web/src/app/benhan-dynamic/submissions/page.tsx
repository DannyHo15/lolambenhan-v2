/**
 * Submissions List Page - View and manage form submissions
 */
'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { formsApi, FormSubmission, FormTemplate } from '@/lib/api/forms'
import { useFormExport } from '@/lib/hooks/useFormExport'

type FilterStatus = 'all' | 'draft' | 'completed' | 'submitted' | 'approved' | 'rejected'

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([])
  const [templates, setTemplates] = useState<Record<string, FormTemplate>>({})
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [filterTemplate, setFilterTemplate] = useState<string>('all')
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const { exportSubmission, exporting } = useFormExport()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
      const [submissionsRes, templatesRes] = await Promise.all([
        formsApi.listSubmissions(),
        formsApi.listTemplates(),
      ])

      if (submissionsRes.success) {
        setSubmissions(submissionsRes.data.submissions)
      }

      if (templatesRes.success) {
        const templateMap: Record<string, FormTemplate> = {}
        for (const t of templatesRes.data.templates) {
          templateMap[t.id] = t
        }
        setTemplates(templateMap)
      }
    } catch (err) {
      console.error('Failed to load submissions:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredSubmissions = submissions.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (filterTemplate !== 'all' && s.templateId !== filterTemplate) return false
    return true
  })

  const template = selectedSubmission
    ? templates[selectedSubmission.templateId]
    : null

  function handleExport(
    submissionId: string,
    format: 'docx' | 'pdf' | 'html' | 'json'
  ) {
    exportSubmission(submissionId, {
      format,
      includeSignature: true,
      includeTimestamp: true,
    })
  }

  function getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      completed: 'bg-blue-100 text-blue-700',
      submitted: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      draft: 'Nháp',
      completed: 'Hoàn thành',
      submitted: 'Đã gửi',
      approved: 'Đã duyệt',
      rejected: 'Từ chối',
    }
    return labels[status] || status
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách bệnh án</h1>
          <p className="text-gray-600 mt-2">Quản lý và xuất các bệnh án đã lập</p>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">Tất cả</option>
                <option value="draft">Nháp</option>
                <option value="completed">Hoàn thành</option>
                <option value="submitted">Đã gửi</option>
                <option value="approved">Đã duyệt</option>
                <option value="rejected">Từ chối</option>
              </select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Khoa
              </label>
              <select
                value={filterTemplate}
                onChange={(e) => setFilterTemplate(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">Tất cả</option>
                {Object.values(templates).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={loadData}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Làm mới
              </button>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Đang tải...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-gray-100">
            <svg
              className="mx-auto h-16 w-16 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-gray-600">Chưa có bệnh án nào</p>
          </div>
        ) : (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg overflow-hidden border border-gray-100">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Mã bệnh án
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Loại bệnh án
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Người lập
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Ngày lập
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredSubmissions.map((submission) => {
                  const tmpl = templates[submission.templateId]
                  return (
                    <tr
                      key={submission.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono text-sm text-gray-900">
                          {submission.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{tmpl?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700">{submission.filledBy}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {new Date(submission.filledAt).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}
                        >
                          {getStatusLabel(submission.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubmission(submission)
                              setShowPreview(true)
                            }}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Xem chi tiết"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>

                          <div className="relative group">
                            <button
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Xuất bệnh án"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </button>

                            {/* Export Dropdown */}
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <button
                                onClick={() => handleExport(submission.id, 'docx')}
                                disabled={exporting}
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 first:rounded-t-lg"
                              >
                                DOCX
                              </button>
                              <button
                                onClick={() => handleExport(submission.id, 'pdf')}
                                disabled={exporting}
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                PDF
                              </button>
                              <button
                                onClick={() => handleExport(submission.id, 'html')}
                                disabled={exporting}
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50"
                              >
                                HTML
                              </button>
                              <button
                                onClick={() => handleExport(submission.id, 'json')}
                                disabled={exporting}
                                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 last:rounded-b-lg"
                              >
                                JSON
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detail Modal */}
        {showPreview && selectedSubmission && template && (
          <SubmissionDetailModal
            submission={selectedSubmission}
            template={template}
            onClose={() => {
              setShowPreview(false)
              setSelectedSubmission(null)
            }}
            onExport={handleExport}
          />
        )}
      </div>
    </div>
  )
}

/**
 * Submission Detail Modal Component
 */
function SubmissionDetailModal({
  submission,
  template,
  onClose,
  onExport,
}: {
  submission: FormSubmission
  template: FormTemplate
  onClose: () => void
  onExport: (id: string, format: 'docx' | 'pdf' | 'html' | 'json') => void
}) {
  const [exportFormat, setExportFormat] = useState<'docx' | 'pdf' | 'html' | 'json'>('docx')
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      await onExport(submission.id, exportFormat)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{template.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Mã: {submission.id} • Ngày lập:{' '}
              {new Date(submission.filledAt).toLocaleString('vi-VN')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Info Section */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin bệnh án</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Người lập:</span>
                  <span className="ml-2 text-gray-900">{submission.filledBy}</span>
                </div>
                <div>
                  <span className="text-gray-500">Trạng thái:</span>
                  <span className="ml-2 text-gray-900">
                    {submission.status === 'draft' && 'Nháp'}
                    {submission.status === 'completed' && 'Hoàn thành'}
                    {submission.status === 'submitted' && 'Đã gửi'}
                    {submission.status === 'approved' && 'Đã duyệt'}
                    {submission.status === 'rejected' && 'Từ chối'}
                  </span>
                </div>
                {submission.patientId && (
                  <div>
                    <span className="text-gray-500">Mã bệnh nhân:</span>
                    <span className="ml-2 text-gray-900">{submission.patientId}</span>
                  </div>
                )}
                {submission.submittedAt && (
                  <div>
                    <span className="text-gray-500">Ngày gửi:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(submission.submittedAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Form Data Sections */}
            {template.templateSchema.sections
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <h4 className="font-semibold text-gray-900">{section.name}</h4>
                    {section.description && (
                      <p className="text-sm text-gray-500 mt-1">{section.description}</p>
                    )}
                  </div>
                  <div className="p-4 space-y-3">
                    {section.fields
                      .sort((a, b) => a.order - b.order)
                      .map((field) => {
                        const value = submission.formData[field.name]
                        if (value === null || value === undefined || value === '') {
                          return null
                        }
                        return (
                          <div key={field.id} className="flex">
                            <span className="w-48 text-sm font-medium text-gray-700 flex-shrink-0">
                              {field.label || field.name}
                              {field.required && <span className="text-red-500 ml-1">*</span>}:
                            </span>
                            <span className="text-sm text-gray-900 flex-1">
                              {formatFieldValue(value)}
                            </span>
                          </div>
                        )
                      })}
                  </div>
                </div>
              ))}

            {/* Signature */}
            {submission.signature && (
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Chữ ký</h4>
                <div className="text-sm space-y-1">
                  <p>
                    <span className="text-gray-600">Người ký:</span>{' '}
                    <span className="font-medium">{submission.signature.signedBy}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Ngày ký:</span>{' '}
                    <span className="font-medium">
                      {new Date(submission.signature.signedAt).toLocaleString('vi-VN')}
                    </span>
                  </p>
                  {submission.signature.imageUrl && (
                    <div className="mt-3">
                      <Image
                        src={submission.signature.imageUrl}
                        alt="Signature"
                        width={200}
                        height={64}
                        className="h-16 w-auto bg-white rounded border border-gray-200 object-contain"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Attachments */}
            {submission.attachments && submission.attachments.length > 0 && (
              <div className="bg-yellow-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Tệp đính kèm</h4>
                <div className="space-y-2">
                  {submission.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between text-sm bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{att.fileName}</p>
                        <p className="text-gray-500">
                          {(att.fileSize / 1024).toFixed(1)} KB • {att.mimeType}
                        </p>
                      </div>
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        Tải xuống
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Định dạng xuất:</label>
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
              className="px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="docx">DOCX (Word)</option>
              <option value="pdf">PDF</option>
              <option value="html">HTML</option>
              <option value="json">JSON</option>
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {exporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Xuất bệnh án
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'boolean') {
    return value ? 'Có' : 'Không'
  }
  if (Array.isArray(value)) {
    return value.join(', ')
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  return String(value)
}
