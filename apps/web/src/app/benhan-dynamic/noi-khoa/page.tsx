'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DynamicForm } from '@/components/form/dynamic-form'
import { formsApi, type FormTemplate } from '@/lib/api/forms'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Send } from 'lucide-react'

export default function NoiKhoaDynamicPage() {
  const router = useRouter()
  const [template, setTemplate] = useState<FormTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function loadTemplate() {
      try {
        setLoading(true)
        // Try to load from API first
        const response = await formsApi.getTemplateBySpecialty('noi-khoa')
        setTemplate(response.data.template)
      } catch (err) {
        // Fallback to hardcoded template if API fails
        console.log('API not available, using fallback template')
        setTemplate(getFallbackTemplate())
      } finally {
        setLoading(false)
      }
    }

    loadTemplate()
  }, [])

  const handleSubmit = async (data: Record<string, unknown>) => {
    try {
      setSubmitting(true)

      // Try to save via API
      await formsApi.createSubmission({
        templateId: 'noi-khoa-v1',
        filledBy: 'student',
        formData: data,
      })

      // Success - navigate to success page or show message
      alert('Bệnh án đã được lưu thành công!')
    } catch (err) {
      console.error('Failed to save:', err)
      // Fallback: save to localStorage
      localStorage.setItem('benhan-noi-khoa', JSON.stringify(data))
      alert('Bệnh án đã được lưu cục bộ!')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSave = async (data: Record<string, unknown>) => {
    // Save as draft
    localStorage.setItem('benhan-noi-khoa-draft', JSON.stringify(data))
    alert('Đã lưu nháp!')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-muted-foreground">Đang tải...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.push('/')}>Quay lại trang chủ</Button>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <p className="text-muted-foreground">Không tìm thấy mẫu bệnh án</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b">
        <div className="container mx-auto flex h-16 items-center px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-foreground/80 hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </Button>
          <h1 className="ml-4 text-xl font-semibold text-foreground">
            {template.name}
          </h1>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Phiên bản {template.version}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Bệnh án Nội khoa
            </h2>
            <p className="text-muted-foreground">
              Nhập thông tin bệnh án nội khoa theo mẫu tiêu chuẩn.
            </p>
          </div>

          <DynamicForm
            template={template}
            onSubmit={handleSubmit}
            onSave={handleSave}
            initialData={{}}
            submitLabel="Gửi bệnh án"
            isSubmitting={submitting}
            persistenceKey="noi-khoa"
            enablePersistence={true}
          />
        </div>
      </main>
    </div>
  )
}

// Fallback template when API is not available
function getFallbackTemplate(): FormTemplate {
  return {
    id: 'noi-khoa-v1',
    name: 'Bệnh án Nội khoa',
    specialty: 'noi-khoa',
    version: '1.0.0',
    description: 'Bệnh án nội khoa tiêu chuẩn',
    status: 'active',
    tags: ['nội khoa', 'tiêu chuẩn'],
    templateSchema: {
      sections: [
        {
          id: 'admin-info',
          name: 'Thông tin hành chính',
          order: 1,
          collapsible: false,
          fields: [
            { id: 'hoten', name: 'hoten', label: 'Họ và tên', type: 'text', order: 1, required: true, width: 'full' },
            { id: 'gioitinh', name: 'gioitinh', label: 'Giới tính', type: 'radio', order: 2, required: true, width: 'half', options: [{ value: 'Nam', label: 'Nam' }, { value: 'Nữ', label: 'Nữ' }] },
            { id: 'namsinh', name: 'namsinh', label: 'Năm sinh', type: 'number', order: 3, required: true, width: 'half', min: 1900, max: 2025 },
            { id: 'dantoc', name: 'dantoc', label: 'Dân tộc', type: 'text', order: 4, required: true, width: 'half' },
            { id: 'nghenghiep', name: 'nghenghiep', label: 'Nghề nghiệp', type: 'text', order: 5, required: true, width: 'half' },
            { id: 'diachi', name: 'diachi', label: 'Địa chỉ', type: 'text', order: 6, required: true, width: 'full' },
          ],
        },
        {
          id: 'reason',
          name: 'Lý do vào viện',
          order: 2,
          collapsible: false,
          fields: [
            { id: 'ngaygio', name: 'ngaygio', label: 'Ngày giờ vào viện', type: 'datetime', order: 1, required: true, width: 'half' },
            { id: 'lydo', name: 'lydo', label: 'Lý do vào viện', type: 'textarea', order: 2, required: true, width: 'full' },
            { id: 'benhsu', name: 'benhsu', label: 'Bệnh sử', type: 'textarea', order: 3, required: true, width: 'full' },
          ],
        },
        {
          id: 'medical-history',
          name: 'Tiền sử',
          order: 3,
          collapsible: true,
          collapsedByDefault: false,
          fields: [
            { id: 'tiensu', name: 'tiensu', label: 'Tiền sử', type: 'textarea', order: 1, required: false, width: 'full' },
          ],
        },
        {
          id: 'vital-signs',
          name: 'Triệu chứng và signs',
          order: 4,
          collapsible: false,
          fields: [
            { id: 'mach', name: 'mach', label: 'Mạch', type: 'text', order: 1, required: true, width: 'third' },
            { id: 'nhietdo', name: 'nhietdo', label: 'Nhiệt độ', type: 'text', order: 2, required: true, width: 'third' },
            { id: 'nhiptho', name: 'nhiptho', label: 'Nhịp thở', type: 'text', order: 3, required: true, width: 'third' },
            { id: 'ha_tren', name: 'ha_tren', label: 'HA tối đa', type: 'text', order: 4, required: true, width: 'half' },
            { id: 'ha_duoi', name: 'ha_duoi', label: 'HA tối thiểu', type: 'text', order: 5, required: true, width: 'half' },
            { id: 'chieucao', name: 'chieucao', label: 'Chiều cao (cm)', type: 'number', order: 6, required: true, width: 'half' },
            { id: 'cannang', name: 'cannang', label: 'Cân nặng (kg)', type: 'number', order: 7, required: true, width: 'half' },
          ],
        },
        {
          id: 'physical-exam',
          name: 'Khám lâm sàng',
          order: 5,
          collapsible: false,
          fields: [
            { id: 'tongtrang', name: 'tongtrang', label: 'Tổng trạng', type: 'textarea', order: 1, required: true, width: 'full' },
            { id: 'timmach', name: 'timmach', label: 'Tim mạch', type: 'textarea', order: 2, required: true, width: 'full' },
            { id: 'hopho', name: 'hopho', label: 'Hô hấp', type: 'textarea', order: 3, required: true, width: 'full' },
            { id: 'tieuhoa', name: 'tieuhoa', label: 'Tiêu hóa', type: 'textarea', order: 4, required: true, width: 'full' },
            { id: 'than', name: 'than', label: 'Thận - Tiết niệu', type: 'textarea', order: 5, required: true, width: 'full' },
            { id: 'thankinh', name: 'thankinh', label: 'Thần kinh', type: 'textarea', order: 6, required: true, width: 'full' },
            { id: 'cokhop', name: 'cokhop', label: 'Cơ xương khớp', type: 'textarea', order: 7, required: true, width: 'full' },
            { id: 'coquankhac', name: 'coquankhac', label: 'Cơ quan khác', type: 'textarea', order: 8, required: true, width: 'full' },
          ],
        },
        {
          id: 'summary',
          name: 'Tóm tắt',
          order: 6,
          collapsible: false,
          fields: [
            { id: 'tomtat', name: 'tomtat', label: 'Tóm tắt bệnh án', type: 'textarea', order: 1, required: true, width: 'full' },
          ],
        },
        {
          id: 'diagnosis',
          name: 'Chẩn đoán',
          order: 7,
          collapsible: false,
          fields: [
            { id: 'chandoanso', name: 'chandoanso', label: 'Chẩn đoán sơ bộ', type: 'textarea', order: 1, required: true, width: 'full' },
            { id: 'chandoanpd', name: 'chandoanpd', label: 'Chẩn đoán phân biệt', type: 'textarea', order: 2, required: true, width: 'full' },
            { id: 'cls_thuongquy', name: 'cls_thuongquy', label: 'CLS thường quy', type: 'textarea', order: 3, required: true, width: 'full' },
            { id: 'cls_chuandoan', name: 'cls_chuandoan', label: 'CLS chẩn đoán', type: 'textarea', order: 4, required: true, width: 'full' },
            { id: 'ketqua', name: 'ketqua', label: 'Kết quả cận lâm sàng', type: 'textarea', order: 5, required: true, width: 'full' },
            { id: 'chandoanxacdinh', name: 'chandoanxacdinh', label: 'Chẩn đoán xác định', type: 'textarea', order: 6, required: true, width: 'full' },
          ],
        },
        {
          id: 'treatment',
          name: 'Điều trị',
          order: 8,
          collapsible: false,
          fields: [
            { id: 'huongdieutri', name: 'huongdieutri', label: 'Hướng điều trị', type: 'textarea', order: 1, required: true, width: 'full' },
            { id: 'dieutri', name: 'dieutri', label: 'Điều trị', type: 'textarea', order: 2, required: true, width: 'full' },
            { id: 'tienluong', name: 'tienluong', label: 'Tiên lượng', type: 'textarea', order: 3, required: true, width: 'full' },
            { id: 'bienluan', name: 'bienluan', label: 'Biện luận', type: 'textarea', order: 4, required: true, width: 'full' },
          ],
        },
      ],
    },
    settings: {
      allowPartialSave: true,
      requireSignature: false,
      confirmationRequired: true,
    },
    exportConfig: {
      includeTimestamp: true,
      includeSignature: true,
    },
    createdBy: 'system',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}
