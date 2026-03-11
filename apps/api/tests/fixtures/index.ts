/**
 * Test Fixtures - Reusable test data
 */
import type { FormTemplate, FormSubmission, Comment, HoichanMessage, User, RefreshToken } from '../src/infrastructure/database/schema'

/**
 * Sample form template fixture
 */
export const formTemplateFixture: FormTemplate = {
  id: 'noi-khoa-v1',
  name: 'Bệnh án Nội khoa',
  specialty: 'noi-khoa',
  version: '1.0.0',
  description: 'Mẫu bệnh án nội khoa tiêu chuẩn',
  status: 'active',
  tags: ['nội khoa', 'tiêu chuẩn'],
  templateSchema: {
    sections: [
      {
        id: 'section-1',
        name: 'Thông tin bệnh nhân',
        order: 1,
        fields: [
          {
            id: 'field-1',
            name: 'fullName',
            label: 'Họ và tên',
            type: 'text',
            order: 1,
            required: true,
          },
          {
            id: 'field-2',
            name: 'age',
            label: 'Tuổi',
            type: 'number',
            order: 2,
            required: true,
          },
        ],
      },
    ],
  },
  settings: {
    allowPartialSave: true,
    requireSignature: false,
  },
  exportConfig: {
    includeTimestamp: true,
    includeSignature: true,
  },
  metadata: {
    createdBy: 'admin',
    createdAt: '2025-01-01T00:00:00.000Z',
  },
  createdBy: 'admin',
  updatedBy: null,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-01T00:00:00.000Z'),
  deletedAt: null,
}

/**
 * Sample form submission fixture
 */
export const formSubmissionFixture: FormSubmission = {
  id: 'sub-2025-001',
  templateId: 'noi-khoa-v1',
  templateVersion: '1.0.0',
  patientId: 'patient-001',
  filledBy: 'doctor-001',
  filledAt: new Date('2025-01-15T10:30:00.000Z'),
  status: 'draft',
  formData: {
    fullName: 'Nguyễn Văn A',
    age: 45,
  },
  sections: {},
  attachments: [],
  signature: null,
  metadata: {
    device: 'Desktop',
    browser: 'Chrome',
    ipAddress: '127.0.0.1',
  },
  submittedAt: null,
  approvedBy: null,
  approvedAt: null,
  createdAt: new Date('2025-01-15T10:30:00.000Z'),
  updatedAt: new Date('2025-01-15T10:30:00.000Z'),
  deletedAt: null,
}

/**
 * Sample comment fixture
 */
export const commentFixture: Comment = {
  id: 1,
  username: 'Test User',
  text: 'This is a test comment',
  heart: false,
  ip: '127.0.0.1',
  createdAt: new Date('2025-01-15T10:30:00.000Z'),
}

/**
 * Sample hoichan message fixture
 */
export const hoichanMessageFixture: HoichanMessage = {
  id: 'msg-001',
  sub: 'user-sub-001',
  name: 'Dr. Test',
  isAdmin: false,
  heart: false,
  heartCount: 0,
  text: 'Test message content',
  fileName: null,
  fileMime: null,
  fileSize: null,
  fileUrl: null,
  filePublicId: null,
  fileResourceType: null,
  at: 1,
}

/**
 * Create form template input fixture
 */
export const createTemplateInputFixture = {
  id: 'new-template-v1',
  name: 'New Template',
  specialty: 'noi-khoa' as const,
  version: '1.0.0',
  description: 'A new template',
  templateSchema: formTemplateFixture.templateSchema,
  createdBy: 'admin',
}

/**
 * Create form submission input fixture
 */
export const createSubmissionInputFixture = {
  templateId: 'noi-khoa-v1',
  patientId: 'patient-001',
  filledBy: 'doctor-001',
  formData: {
    fullName: 'Test Patient',
    age: 30,
  },
}

/**
 * User fixtures for different roles
 */
export const userFixtures = {
  admin: {
    id: 'admin-001',
    email: 'admin@hospital.com',
    username: 'admin_abc123',
    fullName: 'Admin User',
    role: 'admin',
    department: 'IT',
    isActive: true,
    lastLoginAt: new Date('2025-01-15T10:00:00.000Z'),
    createdAt: new Date('2025-01-01T00:00:00.000Z'),
    updatedAt: new Date('2025-01-15T10:00:00.000Z'),
    deletedAt: null,
  } as User,

  doctor: {
    id: 'doctor-001',
    email: 'doctor@hospital.com',
    username: 'doctor_def456',
    fullName: 'Dr. John Smith',
    role: 'doctor',
    department: 'Internal Medicine',
    isActive: true,
    lastLoginAt: new Date('2025-01-15T09:30:00.000Z'),
    createdAt: new Date('2025-01-05T00:00:00.000Z'),
    updatedAt: new Date('2025-01-15T09:30:00.000Z'),
    deletedAt: null,
  } as User,

  student: {
    id: 'student-001',
    email: 'student@university.edu',
    username: 'student_ghi789',
    fullName: 'Jane Doe',
    role: 'student',
    department: null,
    isActive: true,
    lastLoginAt: new Date('2025-01-15T08:00:00.000Z'),
    createdAt: new Date('2025-01-10T00:00:00.000Z'),
    updatedAt: new Date('2025-01-15T08:00:00.000Z'),
    deletedAt: null,
  } as User,

  guest: {
    id: 'guest-001',
    email: 'guest@example.com',
    username: 'guest_jkl012',
    fullName: 'Guest User',
    role: 'guest',
    department: null,
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date('2025-01-14T00:00:00.000Z'),
    updatedAt: new Date('2025-01-14T00:00:00.000Z'),
    deletedAt: null,
  } as User,
}

/**
 * Sample refresh token fixture
 */
export const refreshTokenFixture: RefreshToken = {
  id: 'rt-001',
  token: 'a'.repeat(64), // 64 char hex string
  userId: 'doctor-001',
  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
  createdAt: new Date(),
  revokedAt: null,
}

/**
 * Google user payload fixture
 */
export const googleUserPayloadFixture = {
  sub: 'google-sub-12345',
  email: 'newuser@gmail.com',
  emailVerified: true,
  name: 'New User',
  givenName: 'New',
  familyName: 'User',
  picture: 'https://example.com/photo.jpg',
  locale: 'vi',
}

/**
 * Token response fixture
 */
export const tokenResponseFixture = {
  accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test',
  refreshToken: 'b'.repeat(64),
  expiresIn: 3600,
  tokenType: 'Bearer' as const,
  user: userFixtures.doctor,
}
