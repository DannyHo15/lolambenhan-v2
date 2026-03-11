/**
 * Database Schema - Drizzle ORM
 */
import { pgTable, serial, text, boolean, integer, timestamp, bigserial, index, jsonb, uuid, unique } from "drizzle-orm/pg-core"

export const comments = pgTable(
  "comments",
  {
    id: serial("id").primaryKey(),
    username: text("username").notNull(),
    text: text("text").notNull(),
    heart: boolean("heart").notNull().default(false),
    ip: text("ip"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    ipCreatedAtIdx: index("idx_comments_ip_created_at").on(table.ip, table.createdAt),
  })
)

export const hoichanMessages = pgTable(
  "hoichan_messages",
  {
    id: text("id").primaryKey(),
    sub: text("sub").notNull(),
    name: text("name").notNull(),
    isAdmin: boolean("is_admin").notNull().default(false),
    heart: boolean("heart").notNull().default(false),
    heartCount: integer("heart_count").notNull().default(0),
    text: text("text").notNull(),
    fileName: text("file_name"),
    fileMime: text("file_mime"),
    fileSize: integer("file_size"),
    fileUrl: text("file_url"),
    filePublicId: text("file_public_id"),
    fileResourceType: text("file_resource_type"),
    at: bigserial("at", { mode: "number" }).notNull(),
  },
  (table) => ({
    atIdx: index("idx_hoichan_messages_at").on(table.at),
  })
)

export type Comment = typeof comments.$inferSelect
export type NewComment = typeof comments.$inferInsert
export type HoichanMessage = typeof hoichanMessages.$inferSelect
export type NewHoichanMessage = typeof hoichanMessages.$inferInsert

// ============================================
// FORMS SYSTEM
// ============================================

/**
 * Specialty type for medical forms
 */
export type Specialty =
  | 'noi-khoa'      // Internal medicine
  | 'tien-phau'     // Pre-operative
  | 'hau-phau'      // Post-operative
  | 'san-khoa'      // Obstetrics
  | 'phu-khoa'      // Gynecology
  | 'nhi-khoa'      // Pediatrics
  | 'yhct'          // Traditional medicine
  | 'dieu-duong'    // Nursing
  | 'gmhs-sv'       // Anesthesia - Student
  | 'gmhs-bs'       // Anesthesia - Doctor
  | 'khac';         // Other

/**
 * Form status type
 */
export type TemplateStatus = 'draft' | 'active' | 'deprecated' | 'archived';

/**
 * Form instance status type
 */
export type InstanceStatus = 'draft' | 'completed' | 'submitted' | 'approved' | 'rejected';

/**
 * Form Templates - stores form definitions
 */
export const formTemplates = pgTable(
  "form_templates",
  {
    id: text("id").primaryKey(), // e.g., 'noi-khoa-v1'
    name: text("name").notNull(),
    specialty: text("specialty").notNull().$type<Specialty>(),
    version: text("version").notNull(), // Semantic version e.g., '1.0.0'
    description: text("description"),
    status: text("status").notNull().default('draft').$type<TemplateStatus>(),
    tags: jsonb("tags").$type<string[]>(),

    // Full template schema with sections and fields
    templateSchema: jsonb("template_schema").notNull().$type<{
      sections: Array<{
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
            operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_array' | 'is_empty' | 'is_not_empty'
            value?: unknown
          }>
        }
        fields: Array<{
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
              operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in_array' | 'is_empty' | 'is_not_empty'
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
        }>
      }>
    }>(),

    // Settings
    settings: jsonb("settings").$type<{
      allowPartialSave?: boolean
      requireSignature?: boolean
      autoSaveInterval?: number
      confirmationRequired?: boolean
      submitButtonText?: string
      showProgress?: boolean
    }>(),

    // Export configuration
    exportConfig: jsonb("export_config").$type<{
      docxTemplate?: string
      pdfTemplate?: string
      customExportFunction?: string
      includeTimestamp?: boolean
      includeSignature?: boolean
    }>(),

    // Metadata
    metadata: jsonb("metadata").$type<{
      createdBy?: string
      createdAt?: string
      updatedBy?: string
      updatedAt?: string
      approvedBy?: string
      approvedAt?: string
      department?: string
      language?: string
    }>(),

    // Direct fields for indexing
    createdBy: text("created_by").notNull(),
    updatedBy: text("updated_by"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    specialtyIdx: index("idx_form_templates_specialty").on(table.specialty),
    statusIdx: index("idx_form_templates_status").on(table.status),
    nameIdx: index("idx_form_templates_name").on(table.name),
    createdByIdx: index("idx_form_templates_created_by").on(table.createdBy),
    // Composite index for active templates query (status + soft delete)
    statusDeletedIdx: index("idx_form_templates_status_deleted").on(table.status, table.deletedAt),
    // Composite index for specialty + status filtering
    specialtyStatusIdx: index("idx_form_templates_specialty_status").on(table.specialty, table.status),
    // Index for updated_at for recent templates query
    updatedAtIdx: index("idx_form_templates_updated_at").on(table.updatedAt),
  })
)

/**
 * Form Submissions - stores submitted form data
 */
export const formSubmissions = pgTable(
  "form_submissions",
  {
    id: text("id").primaryKey(), // e.g., 'sub-2025-001'
    templateId: text("template_id").notNull().references(() => formTemplates.id, { onDelete: 'restrict' }),
    templateVersion: text("template_version").notNull(), // e.g., '1.0.0'
    patientId: text("patient_id"), // Hospital patient ID
    filledBy: text("filled_by").notNull(), // User who filled the form
    filledAt: timestamp("filled_at").notNull().defaultNow(),
    status: text("status").notNull().default('draft').$type<InstanceStatus>(),

    // Dynamic data matching the template structure
    formData: jsonb("form_data").notNull().$type<Record<string, unknown>>(),

    // For repeatable sections - stores multiple instances of sections
    sections: jsonb("sections").$type<Record<string, unknown[]>>(),

    // Attachments
    attachments: jsonb("attachments").$type<Array<{
      id: string
      fieldId: string
      fileName: string
      fileUrl: string
      fileSize: number
      mimeType: string
      uploadedAt: string
    }>>(),

    // Signature
    signature: jsonb("signature").$type<{
      imageUrl: string
      signedBy: string
      signedAt: string
      ipAddress?: string
    } | null>(),

    // Metadata (device, browser, IP, location)
    metadata: jsonb("metadata").$type<{
      device?: string
      browser?: string
      ipAddress?: string
      location?: string
    } | null>(),

    // Workflow
    submittedAt: timestamp("submitted_at"),
    approvedBy: text("approved_by"),
    approvedAt: timestamp("approved_at"),

    // Audit timestamps
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    templateIdIdx: index("idx_form_submissions_template_id").on(table.templateId),
    filledByIdx: index("idx_form_submissions_filled_by").on(table.filledBy),
    statusIdx: index("idx_form_submissions_status").on(table.status),
    patientIdIdx: index("idx_form_submissions_patient_id").on(table.patientId),
    filledAtIdx: index("idx_form_submissions_filled_at").on(table.filledAt),
    // Composite index for template + status (common query pattern)
    templateStatusIdx: index("idx_form_submissions_template_status").on(table.templateId, table.status),
    // Composite index for filled_by + status (user's submissions by status)
    filledByStatusIdx: index("idx_form_submissions_filled_by_status").on(table.filledBy, table.status),
    // Composite index for patient_id + filled_at (patient timeline)
    patientFilledAtIdx: index("idx_form_submissions_patient_filled_at").on(table.patientId, table.filledAt),
    // Index for soft delete queries
    deletedAtIdx: index("idx_form_submissions_deleted_at").on(table.deletedAt),
  })
)

/**
 * Submission History - audit trail for submissions
 */
export const submissionHistory = pgTable(
  "submission_history",
  {
    id: bigserial("id", { mode: 'number' }).primaryKey(),
    submissionId: text("submission_id").notNull().references(() => formSubmissions.id, { onDelete: 'cascade' }),
    action: text("action").notNull(), // 'created' | 'updated' | 'submitted' | 'approved' | 'rejected' | 'restored'
    previousData: jsonb("previous_data").$type<Record<string, unknown> | null>(),
    newData: jsonb("new_data").$type<Record<string, unknown> | null>(),
    changedBy: text("changed_by").notNull(),
    changedByName: text("changed_by_name"),
    changes: jsonb("changes").$type<Array<{
      field: string
      oldValue: unknown
      newValue: unknown
    }> | null>(),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    submissionIdIdx: index("idx_submission_history_submission_id").on(table.submissionId),
    createdAtIdx: index("idx_submission_history_created_at").on(table.createdAt),
    // Index for action type filtering (e.g., get all approvals)
    actionIdx: index("idx_submission_history_action").on(table.action),
    // Composite index for submission + created_at (timeline per submission)
    submissionCreatedIdx: index("idx_submission_history_submission_created").on(table.submissionId, table.createdAt),
    // Index for changed_by (user's activity history)
    changedByIdx: index("idx_submission_history_changed_by").on(table.changedBy),
  })
)

/**
 * Users - for authentication and authorization
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    username: text("username").notNull().unique(),
    fullName: text("full_name").notNull(),
    role: text("role").notNull().default('student'), // 'admin' | 'doctor' | 'student' | 'guest'
    department: text("department"),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    emailIdx: index("idx_users_email").on(table.email),
    usernameIdx: index("idx_users_username").on(table.username),
    roleIdx: index("idx_users_role").on(table.role),
    // Composite index for active users query
    isActiveDeletedIdx: index("idx_users_is_active_deleted").on(table.isActive, table.deletedAt),
    // Composite index for role + active (e.g., get all active doctors)
    roleActiveIdx: index("idx_users_role_active").on(table.role, table.isActive),
    // Index for department filtering
    departmentIdx: index("idx_users_department").on(table.department),
    // Index for last login (inactive user detection)
    lastLoginIdx: index("idx_users_last_login").on(table.lastLoginAt),
  })
)

/**
 * Refresh Tokens - for JWT refresh token storage
 */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    token: text("token").notNull().unique(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    revokedAt: timestamp("revoked_at"),
  },
  (table) => ({
    tokenIdx: index("idx_refresh_tokens_token").on(table.token),
    userIdIdx: index("idx_refresh_tokens_user_id").on(table.userId),
    expiresAtIdx: index("idx_refresh_tokens_expires_at").on(table.expiresAt),
    // Composite index for cleanup queries (find expired tokens)
    revokedExpiresIdx: index("idx_refresh_tokens_revoked_expires").on(table.revokedAt, table.expiresAt),
  })
)

/**
 * Form Permissions - access control for forms
 */
export const formPermissions = pgTable(
  "form_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: text("template_id").notNull().references(() => formTemplates.id, { onDelete: 'cascade' }),
    role: text("role").notNull(), // 'admin' | 'doctor' | 'student' | 'guest'
    canView: boolean("can_view").notNull().default(true),
    canCreate: boolean("can_create").notNull().default(true),
    canEdit: boolean("can_edit").notNull().default(false),
    canDelete: boolean("can_delete").notNull().default(false),
    canReview: boolean("can_review").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    templateRoleIdx: unique("idx_form_permissions_template_role").on(table.templateId, table.role),
  })
)

// Form Types
export type FormTemplate = typeof formTemplates.$inferSelect
export type NewFormTemplate = typeof formTemplates.$inferInsert
export type FormSubmission = typeof formSubmissions.$inferSelect
export type NewFormSubmission = typeof formSubmissions.$inferInsert
export type SubmissionHistory = typeof submissionHistory.$inferSelect
export type NewSubmissionHistory = typeof submissionHistory.$inferInsert
export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type RefreshToken = typeof refreshTokens.$inferSelect
export type NewRefreshToken = typeof refreshTokens.$inferInsert
export type FormPermission = typeof formPermissions.$inferSelect
export type NewFormPermission = typeof formPermissions.$inferInsert
