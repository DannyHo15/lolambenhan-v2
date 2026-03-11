/**
 * Medical Forms Hub - Central page for all specialty forms
 */
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { formsApi, type FormTemplate } from '@/lib/api/forms'

const specialtyInfo: Record<
  string,
  { name: string; icon: string; color: string; description: string }
> = {
  'noi-khoa': {
    name: 'Nội khoa',
    icon: '🏥',
    color: 'from-blue-500 to-cyan-500',
    description: 'Bệnh án nội khoa tiêu chuẩn',
  },
  'tien-phau': {
    name: 'Tiền phẫu thuật',
    icon: '🔪',
    color: 'from-red-500 to-orange-500',
    description: 'Đánh giá trước phẫu thuật',
  },
  'hau-phau': {
    name: 'Hậu phẫu thuật',
    icon: '🩺',
    color: 'from-purple-500 to-pink-500',
    description: 'Theo dõi sau phẫu thuật',
  },
  'san-khoa': {
    name: 'Sản khoa',
    icon: '👶',
    color: 'from-pink-500 to-rose-500',
    description: 'Bệnh án sản khoa',
  },
  'phu-khoa': {
    name: 'Phụ khoa',
    icon: '🌸',
    color: 'from-fuchsia-500 to-pink-500',
    description: 'Bệnh án phụ khoa',
  },
  'nhi-khoa': {
    name: 'Nhi khoa',
    icon: '🧒',
    color: 'from-yellow-500 to-amber-500',
    description: 'Bệnh án nhi khoa',
  },
  'yhct': {
    name: 'Y học cổ truyền',
    icon: '🌿',
    color: 'from-green-500 to-emerald-500',
    description: 'Bệnh án YHCT',
  },
  'dieu-duong': {
    name: 'Điều dưỡng',
    icon: '💉',
    color: 'from-teal-500 to-cyan-500',
    description: 'Bệnh án điều dưỡng',
  },
  'gmhs-sv': {
    name: 'Gây mê hồi sức (Sinh viên)',
    icon: '😴',
    color: 'from-indigo-500 to-violet-500',
    description: 'Bệnh án gây mê hồi sức',
  },
  'gmhs-bs': {
    name: 'Gây mê hồi sức (Bác sĩ)',
    icon: '👨‍⚕️',
    color: 'from-violet-500 to-purple-500',
    description: 'Bệnh án gây mê hồi sức',
  },
}

export default function MedicalFormsHubPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTemplates()
  }, [])

  async function loadTemplates() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-2">Hệ thống Bệnh án Điện tử</h1>
          <p className="text-blue-100 text-lg">
            Chọn loại bệnh án để bắt đầu lập hoặc xem danh sách bệnh án đã lưu
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => router.push('/benhan-dynamic/submissions')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02] text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                📋
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Danh sách bệnh án</h3>
                <p className="text-sm text-gray-500">Xem và quản lý bệnh án đã lưu</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/')}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02] text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                🏠
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Trang chủ</h3>
                <p className="text-sm text-gray-500">Quay lại trang chủ</p>
              </div>
            </div>
          </button>

          <button
            onClick={loadTemplates}
            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02] text-left group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                🔄
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Làm mới</h3>
                <p className="text-sm text-gray-500">Tải lại danh sách mẫu</p>
              </div>
            </div>
          </button>
        </div>

        {/* Form Templates Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Các loại bệnh án</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Đang tải danh sách...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {templates.map((template) => {
                const info = specialtyInfo[template.specialty] || {
                  name: template.name,
                  icon: '📄',
                  color: 'from-gray-500 to-gray-600',
                  description: template.description || '',
                }

                return (
                  <button
                    key={template.id}
                    onClick={() => router.push(`/benhan-dynamic/${template.specialty}`)}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all hover:scale-[1.02] group"
                  >
                    <div className={`w-16 h-16 bg-gradient-to-br ${info.color} rounded-2xl flex items-center justify-center text-3xl shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                      {info.icon}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{info.name}</h3>
                    <p className="text-sm text-gray-500 mb-3">{info.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Mẫu {template.version}</span>
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">
                        {template.status === 'active' ? 'Hoạt động' : template.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {template.templateSchema?.sections?.length || 0} phần
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
          <h3 className="text-xl font-bold mb-4">Thông tin hệ thống</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <p className="text-3xl font-bold">{templates.length}</p>
              <p className="text-blue-100 text-sm">Loại bệnh án</p>
            </div>
            <div>
              <p className="text-3xl font-bold">DOCX</p>
              <p className="text-blue-100 text-sm">Xuất Word</p>
            </div>
            <div>
              <p className="text-3xl font-bold">PDF</p>
              <p className="text-blue-100 text-sm">Xuất PDF</p>
            </div>
            <div>
              <p className="text-3xl font-bold">JSON</p>
              <p className="text-blue-100 text-sm">Xuất dữ liệu</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
