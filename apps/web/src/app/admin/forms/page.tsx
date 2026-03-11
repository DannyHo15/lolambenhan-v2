/**
 * Admin Form Builder - Create and edit form templates
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formsApi, type FormTemplate, type FormSection, type FormField } from '@/lib/api/forms'

type FieldInput = Omit<FormField, 'id'> & { id?: string }

interface SectionInput {
  id?: string
  name: string
  description?: string
  order: number
  collapsible?: boolean
  collapsedByDefault?: boolean
  fields: FieldInput[]
}

interface TemplateInput {
  id?: string
  name: string
  specialty: string
  version: string
  description?: string
  status: 'draft' | 'active' | 'deprecated' | 'archived'
  tags: string[]
  sections: SectionInput[]
  settings?: {
    allowPartialSave?: boolean
    requireSignature?: boolean
    autoSaveInterval?: number
    confirmationRequired?: boolean
    submitButtonText?: string
    showProgress?: boolean
  }
  exportConfig?: {
    includeTimestamp?: boolean
    includeSignature?: boolean
  }
}

const specialties = [
  { value: 'noi-khoa', label: 'Nội khoa' },
  { value: 'tien-phau', label: 'Tiền phẫu thuật' },
  { value: 'hau-phau', label: 'Hậu phẫu thuật' },
  { value: 'san-khoa', label: 'Sản khoa' },
  { value: 'phu-khoa', label: 'Phụ khoa' },
  { value: 'nhi-khoa', label: 'Nhi khoa' },
  { value: 'yhct', label: 'Y học cổ truyền' },
  { value: 'dieu-duong', label: 'Điều dưỡng' },
  { value: 'gmhs-sv', label: 'Gây mê hồi sức (Sinh viên)' },
  { value: 'gmhs-bs', label: 'Gây mê hồi sức (Bác sĩ)' },
]

const fieldTypes: Array<{ value: FormField['type']; label: string }> = [
  { value: 'text', label: 'Văn bản ngắn' },
  { value: 'textarea', label: 'Văn bản dài' },
  { value: 'number', label: 'Số' },
  { value: 'date', label: 'Ngày' },
  { value: 'datetime', label: 'Ngày giờ' },
  { value: 'select', label: 'Danh sách chọn' },
  { value: 'radio', label: 'Radio button' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'file', label: 'Tệp đính kèm' },
  { value: 'signature', label: 'Chữ ký' },
]

const widthOptions = [
  { value: 'full', label: 'Đầy đủ' },
  { value: 'half', label: '1/2' },
  { value: 'third', label: '1/3' },
  { value: 'quarter', label: '1/4' },
]

export default function AdminFormBuilderPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list')

  // Form state
  const [template, setTemplate] = useState<TemplateInput>({
    name: '',
    specialty: 'noi-khoa',
    version: '1.0.0',
    description: '',
    status: 'draft',
    tags: [],
    sections: [],
    settings: {
      allowPartialSave: true,
      requireSignature: false,
      confirmationRequired: true,
      showProgress: true,
    },
    exportConfig: {
      includeTimestamp: true,
      includeSignature: true,
    },
  })

  // Editing state
  const [editingSection, setEditingSection] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<{ sectionIndex: number; fieldIndex: number } | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
    setLoading(true)
    try {
      const response = await formsApi.listTemplates()
      if (response.success) {
        setTemplates(response.data.templates)
      }
    } catch (err) {
      console.error('Failed to load templates:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      // Convert to proper format
      const templateData = {
        id: template.id,
        name: template.name,
        specialty: template.specialty,
        version: template.version,
        description: template.description,
        templateSchema: {
          sections: template.sections.map((s, si) => ({
            id: s.id || `section-${si}`,
            name: s.name,
            description: s.description,
            order: s.order,
            collapsible: s.collapsible,
            collapsedByDefault: s.collapsedByDefault,
            fields: s.fields.map((f, fi) => ({
              id: f.id || `field-${si}-${fi}`,
              name: f.name || `field-${si}-${fi}`,
              label: f.label,
              description: f.description,
              type: f.type,
              order: f.order,
              required: f.required,
              placeholder: f.placeholder,
              width: f.width,
              options: f.options,
              multiple: f.multiple,
              min: f.min,
              max: f.max,
              step: f.step,
              unit: f.unit,
              minLength: f.minLength,
              maxLength: f.maxLength,
              pattern: f.pattern,
              patternMessage: f.patternMessage,
            })),
          })),
        },
        settings: template.settings,
        exportConfig: template.exportConfig,
        tags: template.tags,
        createdBy: 'admin',
      }

      if (template.id) {
        await formsApi.updateTemplate(template.id, templateData)
      } else {
        await formsApi.createTemplate({
          ...templateData,
          id: `${template.specialty}-v1`,
        })
      }

      await loadTemplates()
      setView('list')
      setTemplate({
        name: '',
        specialty: 'noi-khoa',
        version: '1.0.0',
        description: '',
        status: 'draft',
        tags: [],
        sections: [],
        settings: {
          allowPartialSave: true,
          requireSignature: false,
          confirmationRequired: true,
          showProgress: true,
        },
        exportConfig: {
          includeTimestamp: true,
          includeSignature: true,
        },
      })
    } catch (err) {
      console.error('Failed to save template:', err)
      alert('Lưu thất bại!')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(tpl: FormTemplate) {
    setSelectedTemplate(tpl)
    setTemplate({
      id: tpl.id,
      name: tpl.name,
      specialty: tpl.specialty,
      version: tpl.version,
      description: tpl.description,
      status: tpl.status,
      tags: tpl.tags,
      sections: tpl.templateSchema.sections.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        order: s.order,
        collapsible: s.collapsible,
        collapsedByDefault: s.collapsedByDefault,
        fields: s.fields.map((f) => ({
          id: f.id,
          name: f.name,
          label: f.label,
          description: f.description,
          type: f.type,
          order: f.order,
          required: f.required,
          placeholder: f.placeholder,
          width: f.width,
          options: f.options,
          multiple: f.multiple,
          min: f.min,
          max: f.max,
          step: f.step,
          unit: f.unit,
          minLength: f.minLength,
          maxLength: f.maxLength,
          pattern: f.pattern,
          patternMessage: f.patternMessage,
        })),
      })),
      settings: tpl.settings,
      exportConfig: tpl.exportConfig,
    })
    setView('edit')
  }

  function startCreate() {
    setTemplate({
      name: '',
      specialty: 'noi-khoa',
      version: '1.0.0',
      description: '',
      status: 'draft',
      tags: [],
      sections: [],
      settings: {
        allowPartialSave: true,
        requireSignature: false,
        confirmationRequired: true,
        showProgress: true,
      },
      exportConfig: {
        includeTimestamp: true,
        includeSignature: true,
      },
    })
    setView('create')
  }

  function addSection() {
    const newSection: SectionInput = {
      name: 'Phần mới',
      order: template.sections.length,
      fields: [],
    }
    setTemplate((t) => ({ ...t, sections: [...t.sections, newSection] }))
  }

  function updateSection(index: number, updates: Partial<SectionInput>) {
    setTemplate((t) => ({
      ...t,
      sections: t.sections.map((s, i) => (i === index ? { ...s, ...updates } : s)),
    }))
  }

  function removeSection(index: number) {
    setTemplate((t) => ({
      ...t,
      sections: t.sections.filter((_, i) => i !== index),
    }))
  }

  function addField(sectionIndex: number) {
    const newField: FieldInput = {
      name: `field_${Date.now()}`,
      type: 'text',
      label: 'Trường mới',
      order: template.sections[sectionIndex]?.fields.length || 0,
    }
    setTemplate((t) => ({
      ...t,
      sections: t.sections.map((s, i) =>
        i === sectionIndex ? { ...s, fields: [...s.fields, newField] } : s
      ),
    }))
  }

  function updateField(sectionIndex: number, fieldIndex: number, updates: Partial<FieldInput>) {
    setTemplate((t) => ({
      ...t,
      sections: t.sections.map((s, si) =>
        si === sectionIndex
          ? {
              ...s,
              fields: s.fields.map((f, fi) =>
                fi === fieldIndex ? { ...f, ...updates } : f
              ),
            }
          : s
      ),
    }))
  }

  function removeField(sectionIndex: number, fieldIndex: number) {
    setTemplate((t) => ({
      ...t,
      sections: t.sections.map((s, si) =>
        si === sectionIndex
          ? { ...s, fields: s.fields.filter((_, fi) => fi !== fieldIndex) }
          : s
      ),
    }))
  }

  // List view
  if (view === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
        {/* Header */}
        <header className="glass-strong border-b">
          <div className="container mx-auto flex h-16 items-center px-4">
            <button
              onClick={() => router.push('/admin')}
              className="text-foreground/80 hover:text-foreground"
            >
              ← Quay lại
            </button>
            <h1 className="ml-4 text-xl font-semibold">Quản lý mẫu bệnh án</h1>
            <div className="ml-auto">
              <button
                onClick={startCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                + Tạo mẫu mới
              </button>
            </div>
          </div>
        </header>

        {/* Template List */}
        <main className="container mx-auto px-4 py-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid gap-4">
              {templates.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t.specialty} • v{t.version} • {t.templateSchema?.sections?.length || 0} phần
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          t.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {t.status === 'active' ? 'Hoạt động' : t.status}
                      </span>
                      <button
                        onClick={() => startEdit(t)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Chỉnh sửa
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    )
  }

  // Builder view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="glass-strong border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <button
            onClick={() => {
              if (confirm('Bạn có chắc muốn quay lại? Các thay đổi chưa lưu sẽ mất.')) {
                setView('list')
              }
            }}
            className="text-foreground/80 hover:text-foreground"
          >
            ← Quay lại
          </button>
          <h1 className="ml-4 text-xl font-semibold">
            {view === 'create' ? 'Tạo mẫu bệnh án mới' : 'Chỉnh sửa mẫu bệnh án'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setView('list')}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu mẫu'}
            </button>
          </div>
        </div>
      </header>

      {/* Builder */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4">Thông tin cơ bản</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tên mẫu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={template.name}
                    onChange={(e) => setTemplate((t) => ({ ...t, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="Bệnh án Nội khoa"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Khoa <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={template.specialty}
                    onChange={(e) => setTemplate((t) => ({ ...t, specialty: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    {specialties.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phiên bản <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={template.version}
                    onChange={(e) => setTemplate((t) => ({ ...t, version: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    placeholder="1.0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={template.status}
                    onChange={(e) => setTemplate((t) => ({ ...t, status: e.target.value as any }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  >
                    <option value="draft">Nháp</option>
                    <option value="active">Hoạt động</option>
                    <option value="deprecated">Lỗi thời</option>
                    <option value="archived">Lưu trữ</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Mô tả
                  </label>
                  <textarea
                    value={template.description}
                    onChange={(e) => setTemplate((t) => ({ ...t, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                    rows={2}
                    placeholder="Mô tả về mẫu bệnh án này..."
                  />
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Các phần bệnh án</h2>
                <button
                  onClick={addSection}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  + Thêm phần
                </button>
              </div>

              {template.sections.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Chưa có phần nào. Nhấn &quot;Thêm phần&quot; để bắt đầu.
                </p>
              ) : (
                <div className="space-y-4">
                  {template.sections.map((section, si) => (
                    <div
                      key={section.id || si}
                      className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden"
                    >
                      {/* Section Header */}
                      <div className="bg-gray-50 dark:bg-slate-700 px-4 py-3 flex items-center justify-between">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={section.name}
                            onChange={(e) => updateSection(si, { name: e.target.value })}
                            className="bg-transparent font-semibold text-gray-900 dark:text-white border-none focus:ring-0 w-full"
                            placeholder="Tên phần"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <input
                              type="checkbox"
                              checked={section.collapsible}
                              onChange={(e) => updateSection(si, { collapsible: e.target.checked })}
                              className="rounded"
                            />
                            Có thu gọn
                          </label>
                          <button
                            onClick={() => removeSection(si)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Section Description */}
                      <div className="px-4 py-2 border-b border-gray-200 dark:border-slate-600">
                        <input
                          type="text"
                          value={section.description || ''}
                          onChange={(e) => updateSection(si, { description: e.target.value })}
                          className="w-full text-sm text-gray-600 dark:text-gray-400 bg-transparent border-none focus:ring-0"
                          placeholder="Mô tả phần (không bắt buộc)"
                        />
                      </div>

                      {/* Fields */}
                      <div className="p-4 space-y-2">
                        {section.fields.length === 0 ? (
                          <p className="text-gray-400 text-sm text-center py-4">
                            Chưa có trường nào
                          </p>
                        ) : (
                          section.fields.map((field, fi) => (
                            <div
                              key={field.id || fi}
                              className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-slate-700 rounded-lg"
                            >
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {fieldTypes.find((t) => t.value === field.type)?.label || field.type}
                              </span>
                              <input
                                type="text"
                                value={field.label || ''}
                                onChange={(e) =>
                                  updateField(si, fi, { label: e.target.value })
                                }
                                className="flex-1 text-sm bg-transparent border-none focus:ring-0"
                                placeholder="Tên trường"
                              />
                              <input
                                type="text"
                                value={field.name || ''}
                                onChange={(e) =>
                                  updateField(si, fi, { name: e.target.value })
                                }
                                className="w-32 text-sm bg-gray-100 dark:bg-slate-600 rounded px-2 py-1"
                                placeholder="name"
                              />
                              <label className="flex items-center gap-1 text-xs text-gray-600">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) =>
                                    updateField(si, fi, { required: e.target.checked })
                                  }
                                  className="rounded"
                                />
                                Bắt buộc
                              </label>
                              <button
                                onClick={() => removeField(si, fi)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                              <button
                                onClick={() =>
                                  setEditingField({ sectionIndex: si, fieldIndex: fi })
                                }
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                              </button>
                            </div>
                          ))
                        )}
                        <button
                          onClick={() => addField(si)}
                          className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-lg text-gray-500 hover:border-blue-500 hover:text-blue-500 transition-colors text-sm"
                        >
                          + Thêm trường
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            {/* Settings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4">Cài đặt</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cho phép lưu nháp</span>
                  <input
                    type="checkbox"
                    checked={template.settings?.allowPartialSave}
                    onChange={(e) =>
                      setTemplate((t) => ({
                        ...t,
                        settings: { ...t.settings!, allowPartialSave: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Yêu cầu chữ ký</span>
                  <input
                    type="checkbox"
                    checked={template.settings?.requireSignature}
                    onChange={(e) =>
                      setTemplate((t) => ({
                        ...t,
                        settings: { ...t.settings!, requireSignature: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Xác nhận trước gửi</span>
                  <input
                    type="checkbox"
                    checked={template.settings?.confirmationRequired}
                    onChange={(e) =>
                      setTemplate((t) => ({
                        ...t,
                        settings: { ...t.settings!, confirmationRequired: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Hiển thị tiến độ</span>
                  <input
                    type="checkbox"
                    checked={template.settings?.showProgress}
                    onChange={(e) =>
                      setTemplate((t) => ({
                        ...t,
                        settings: { ...t.settings!, showProgress: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                </label>
              </div>
            </div>

            {/* Export Config */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4">Cấu hình xuất</h2>
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bao gồm thời gian</span>
                  <input
                    type="checkbox"
                    checked={template.exportConfig?.includeTimestamp}
                    onChange={(e) =>
                      setTemplate((t) => ({
                        ...t,
                        exportConfig: { ...t.exportConfig!, includeTimestamp: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Bao gồm chữ ký</span>
                  <input
                    type="checkbox"
                    checked={template.exportConfig?.includeSignature}
                    onChange={(e) =>
                      setTemplate((t) => ({
                        ...t,
                        exportConfig: { ...t.exportConfig!, includeSignature: e.target.checked },
                      }))
                    }
                    className="rounded"
                  />
                </label>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold mb-4">Thẻ</h2>
              <input
                type="text"
                value={template.tags.join(', ')}
                onChange={(e) =>
                  setTemplate((t) => ({
                    ...t,
                    tags: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                placeholder="nội khoa, tiêu chuẩn"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditorModal
          field={template.sections[editingField.sectionIndex].fields[editingField.fieldIndex]}
          onSave={(updates) => {
            updateField(editingField.sectionIndex, editingField.fieldIndex, updates)
            setEditingField(null)
          }}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  )
}

/**
 * Field Editor Modal Component
 */
function FieldEditorModal({
  field,
  onSave,
  onClose,
}: {
  field: FieldInput
  onSave: (updates: Partial<FieldInput>) => void
  onClose: () => void
}) {
  const [updates, setUpdates] = useState<Partial<FieldInput>>(field)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Chỉnh sửa trường</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên trường (label)
            </label>
            <input
              type="text"
              value={updates.label || ''}
              onChange={(e) => setUpdates((u) => ({ ...u, label: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tên biến (name)
            </label>
            <input
              type="text"
              value={updates.name || ''}
              onChange={(e) => setUpdates((u) => ({ ...u, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loại trường
            </label>
            <select
              value={updates.type}
              onChange={(e) => setUpdates((u) => ({ ...u, type: e.target.value as FormField['type'] }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              {fieldTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Chiều rộng
            </label>
            <select
              value={updates.width || 'full'}
              onChange={(e) => setUpdates((u) => ({ ...u, width: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            >
              {widthOptions.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Placeholder
            </label>
            <input
              type="text"
              value={updates.placeholder || ''}
              onChange={(e) => setUpdates((u) => ({ ...u, placeholder: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              value={updates.description || ''}
              onChange={(e) => setUpdates((u) => ({ ...u, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
              rows={2}
            />
          </div>

          {/* Validation */}
          <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Xác thực</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Độ dài tối thiểu
                </label>
                <input
                  type="number"
                  value={updates.minLength || ''}
                  onChange={(e) => setUpdates((u) => ({ ...u, minLength: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Độ dài tối đa
                </label>
                <input
                  type="number"
                  value={updates.maxLength || ''}
                  onChange={(e) => setUpdates((u) => ({ ...u, maxLength: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                />
              </div>
            </div>
          </div>

          {/* Options for select/radio/checkbox */}
          {['select', 'radio', 'checkbox'].includes(updates.type || '') && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Lựa chọn (mỗi dòng một giá trị: value|label)
              </h3>
              <textarea
                value={(updates.options || []).map((o) => `${o.value}|${o.label}`).join('\n')}
                onChange={(e) => {
                  const options = e.target.value
                    .split('\n')
                    .filter(Boolean)
                    .map((line) => {
                      const [value, label] = line.split('|')
                      return { value: value.trim(), label: label?.trim() || value.trim() }
                    })
                  setUpdates((u) => ({ ...u, options }))
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 font-mono text-sm"
                rows={4}
                placeholder="option1|Lựa chọn 1&#10;option2|Lựa chọn 2"
              />
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={updates.multiple}
                  onChange={(e) => setUpdates((u) => ({ ...u, multiple: e.target.checked }))}
                  className="rounded"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Cho phép chọn nhiều</span>
              </label>
            </div>
          )}

          {/* Number-specific */}
          {updates.type === 'number' && (
            <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Số</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Giá trị tối thiểu</label>
                  <input
                    type="number"
                    value={updates.min ?? ''}
                    onChange={(e) => setUpdates((u) => ({ ...u, min: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Giá trị tối đa</label>
                  <input
                    type="number"
                    value={updates.max ?? ''}
                    onChange={(e) => setUpdates((u) => ({ ...u, max: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bước nhảy</label>
                  <input
                    type="number"
                    value={updates.step ?? ''}
                    onChange={(e) => setUpdates((u) => ({ ...u, step: e.target.value ? Number(e.target.value) : undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  />
                </div>
              </div>
              <div className="mt-2">
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Đơn vị</label>
                <input
                  type="text"
                  value={updates.unit || ''}
                  onChange={(e) => setUpdates((u) => ({ ...u, unit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700"
                  placeholder="kg, cm,..."
                />
              </div>
            </div>
          )}

          {/* Required checkbox */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={updates.required}
              onChange={(e) => setUpdates((u) => ({ ...u, required: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Bắt buộc</span>
          </label>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(updates)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  )
}
