/**
 * Medical Forms - JSON Schema and TypeScript Interfaces
 * Supports dynamic form creation with flexible sections, fields, validation, and conditional logic
 */

// ============================================================================
// JSON SCHEMA DEFINITION
// ============================================================================

export const FORM_TEMPLATE_JSON_SCHEMA = {
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Medical Form Template",
  "description": "Dynamic medical form template with flexible sections and fields",
  "type": "object",
  "required": ["id", "name", "specialty", "version", "sections"],
  "properties": {
    id: {
      "type": "string",
      "description": "Unique template identifier (e.g., 'noi-kho-v1')"
    },
    name: {
      "type": "string",
      "description": "Display name of the form"
    },
    specialty: {
      "type": "string",
      "enum": ["noi-khoa", "tien-phau", "hau-phau", "ngoai-khoa", "san-phu-khoa", "pediatric"],
      "description": "Medical specialty category"
    },
    version: {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$",
      "description": "Semantic version (e.g., '1.0.0')"
    },
    description: {
      "type": "string",
      "description": "Form description and purpose"
    },
    status: {
      "type": "string",
      "enum": ["draft", "active", "deprecated"],
      "default": "draft"
    },
    tags: {
      "type": "array",
      "items": { "type": "string" },
      "description": "Tags for form categorization and search"
    },
    metadata: {
      "type": "object",
      "description": "Additional metadata (created_by, updated_at, etc.)"
    },
    sections: {
      "type": "array",
      "description": "Form sections containing fields",
      "items": {
        "type": "object",
        "required": ["id", "name", "fields"],
        "properties": {
          id: { "type": "string" },
          name: { "type": "string" },
          description: { "type": "string" },
          order: { "type": "number" },
          collapsible: { "type": "boolean", "default": false },
          collapsedByDefault: { "type": "boolean", "default": false },
          repeatable: {
            "type": "boolean",
            "description": "Can users add multiple instances of this section"
          },
          minRepeat: {
            "type": "number",
            "description": "Minimum number of section instances"
          },
          maxRepeat: {
            "type": "number",
            "description": "Maximum number of section instances"
          },
          conditionalDisplay: {
            "type": "object",
            "description": "Rules for showing/hiding this section",
            "properties": {
              showWhen: {
                "type": "string",
                "enum": ["equals", "not_equals", "contains", "greater_than", "less_than", "in_array"]
              },
              fieldId: { "type": "string" },
              value: {}
            }
          },
          fields: {
            "type": "array",
            "items": {
              "type": "object",
              "required": ["id", "name", "type"],
              "properties": {
                id: { "type": "string" },
                name: { "type": "string" },
                label: { "type": "string" },
                description: { "type": "string" },
                placeholder: { "type": "string" },
                type: {
                  "type": "string",
                  "enum": ["text", "textarea", "number", "date", "datetime", "select", "radio", "checkbox", "file", "signature"]
                },
                order: { "type": "number" },
                required: { "type": "boolean", "default": false },
                readonly: { "type": "boolean", "default": false },
                disabled: { "type": "boolean", "default": false },

                // Field-specific configurations
                defaultValue: {},

                // Text/Textarea specific
                minLength: { "type": "number" },
                maxLength: { "type": "number" },
                pattern: {
                  "type": "string",
                  "description": "Regex pattern for validation"
                },
                patternMessage: {
                  "type": "string",
                  "description": "Error message when pattern doesn't match"
                },

                // Number specific
                min: { "type": "number" },
                max: { "type": "number" },
                step: { "type": "number" },
                unit: { "type": "string" },

                // Date specific
                minDate: { "type": "string", "format": "date" },
                maxDate: { "type": "string", "format": "date" },
                dateFormat: {
                  "type": "string",
                  "enum": ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"],
                  "default": "DD/MM/YYYY"
                },

                // Select/Radio/Checkbox specific
                options: {
                  "type": "array",
                  "items": {
                    "type": "object",
                    "properties": {
                      value: { "type": "string" },
                      label: { "type": "string" },
                      color: { "type": "string" }
                    }
                  }
                },
                multiple: {
                  "type": "boolean",
                  "description": "Allow multiple selections (for select/checkbox)"
                },

                // File specific
                accept: {
                  "type": "array",
                  "items": { "type": "string" },
                  "description": "Accepted file types (e.g., ['image/*', '.pdf'])"
                },
                maxSize: {
                  "type": "number",
                  "description": "Max file size in bytes"
                },
                maxFiles: {
                  "type": "number",
                  "description": "Maximum number of files"
                },

                // Conditional logic
                conditionalDisplay: {
                  "type": "object",
                  "description": "Rules for showing/hiding this field",
                  "properties": {
                    operator: {
                      "type": "string",
                      "enum": ["AND", "OR"]
                    },
                    conditions: {
                      "type": "array",
                      "items": {
                        "type": "object",
                        "properties": {
                          fieldId: { "type": "string" },
                          operator: {
                            "type": "string",
                            "enum": ["equals", "not_equals", "contains", "greater_than", "less_than", "in_array", "is_empty", "is_not_empty"]
                          },
                          value: {}
                        }
                      }
                    }
                  }
                },

                // Calculated field
                calculated: {
                  "type": "boolean",
                  "description": "Is this a calculated field"
                },
                calculation: {
                  "type": "string",
                  "description": "Calculation formula (e.g., '{{field1}} + {{field2}}')"
                },

                // Validation
                customValidation: {
                  "type": "object",
                  "properties": {
                    validator: {
                      "type": "string",
                      "description": "Custom validator function name"
                    },
                    errorMessage: { "type": "string" }
                  }
                },

                // UI enhancements
                width: {
                  "type": "string",
                  "enum": ["full", "half", "third", "quarter"],
                  "default": "full"
                },
                showLabel: { "type": "boolean", "default": true },
                hint: { "type": "string" },

                // Grid layout for checkbox/radio
                columns: {
                  "type": "number",
                  "description": "Number of columns for option display"
                },

                // Autofill suggestions
                autocomplete: {
                  "type": "string",
                  "description": "HTML autocomplete attribute"
                },

                // Field category for grouping
                category: {
                  "type": "string",
                  "description": "Field category (e.g., 'vital_signs', 'symptoms')"
                }
              }
            }
          }
        }
      }
    },

    // Form-level settings
    settings: {
      "type": "object",
      "properties": {
        allowPartialSave: {
          "type": "boolean",
          "default": true
        },
        requireSignature: {
          "type": "boolean",
          "default": false
        },
        autoSaveInterval: {
          "type": "number",
          "description": "Auto-save interval in seconds"
        },
        confirmationRequired: {
          "type": "boolean",
          "default": true
        },
        submitButtonText: {
          "type": "string",
          "default": "Submit"
        },
        showProgress: {
          "type": "boolean",
          "default": true
        }
      }
    },

    // Export configurations
    exportConfig: {
      "type": "object",
      "properties": {
        docxTemplate: {
          "type": "string",
          "description": "Path to DOCX template file"
        },
        pdfTemplate: {
          "type": "string",
          "description": "Path to PDF template file"
        },
        customExportFunction: {
          "type": "string",
          "description": "Custom export function name"
        },
        includeTimestamp: {
          "type": "boolean",
          "default": true
        },
        includeSignature: {
          "type": "boolean",
          "default": true
        }
      }
    }
  }
};

// ============================================================================
// TYPESCRIPT INTERFACES
// ============================================================================

/**
 * Base types
 */
export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'file'
  | 'signature';

export type Specialty =
  | 'noi-khoa'
  | 'tien-phau'
  | 'hau-phau'
  | 'ngoai-khoa'
  | 'san-phu-khoa'
  | 'pediatric';

export type TemplateStatus = 'draft' | 'active' | 'deprecated';

export type FieldWidth = 'full' | 'half' | 'third' | 'quarter';

export type ConditionalOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than'
  | 'in_array'
  | 'is_empty'
  | 'is_not_empty';

/**
 * Field option for select/radio/checkbox
 */
export interface FieldOption {
  value: string;
  label: string;
  color?: string;
  icon?: string;
}

/**
 * Conditional display rule
 */
export interface ConditionalDisplay {
  showWhen?: ConditionalOperator;
  fieldId: string;
  value?: any;

  // Complex conditions (AND/OR)
  operator?: 'AND' | 'OR';
  conditions?: ConditionalCondition[];
}

export interface ConditionalCondition {
  fieldId: string;
  operator: ConditionalOperator;
  value?: any;
}

/**
 * Validation rules
 */
export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;
  customValidation?: {
    validator: string;
    errorMessage?: string;
  };
}

/**
 * Form field definition
 */
export interface FormField {
  id: string;
  name: string;
  label?: string;
  description?: string;
  placeholder?: string;
  type: FieldType;
  order: number;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  defaultValue?: any;

  // Text/Textarea
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  patternMessage?: string;

  // Number
  min?: number;
  max?: number;
  step?: number;
  unit?: string;

  // Date
  minDate?: string;
  maxDate?: string;
  dateFormat?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';

  // Select/Radio/Checkbox
  options?: FieldOption[];
  multiple?: boolean;
  columns?: number;

  // File
  accept?: string[];
  maxSize?: number;
  maxFiles?: number;

  // Conditional logic
  conditionalDisplay?: ConditionalDisplay;

  // Calculated field
  calculated?: boolean;
  calculation?: string;

  // Validation
  customValidation?: {
    validator: string;
    errorMessage?: string;
  };

  // UI
  width?: FieldWidth;
  showLabel?: boolean;
  hint?: string;
  autocomplete?: string;
  category?: string;
}

/**
 * Form section
 */
export interface FormSection {
  id: string;
  name: string;
  description?: string;
  order: number;
  collapsible?: boolean;
  collapsedByDefault?: boolean;
  repeatable?: boolean;
  minRepeat?: number;
  maxRepeat?: number;
  conditionalDisplay?: ConditionalDisplay;
  fields: FormField[];
}

/**
 * Form template settings
 */
export interface FormSettings {
  allowPartialSave?: boolean;
  requireSignature?: boolean;
  autoSaveInterval?: number;
  confirmationRequired?: boolean;
  submitButtonText?: string;
  showProgress?: boolean;
}

/**
 * Export configuration
 */
export interface ExportConfig {
  docxTemplate?: string;
  pdfTemplate?: string;
  customExportFunction?: string;
  includeTimestamp?: boolean;
  includeSignature?: boolean;
}

/**
 * Form template metadata
 */
export interface TemplateMetadata {
  createdBy?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  department?: string;
  language?: string;
}

/**
 * Complete form template
 */
export interface FormTemplate {
  id: string;
  name: string;
  specialty: Specialty;
  version: string;
  description?: string;
  status: TemplateStatus;
  tags?: string[];
  metadata?: TemplateMetadata;
  sections: FormSection[];
  settings?: FormSettings;
  exportConfig?: ExportConfig;
}

/**
 * Form instance (filled form)
 */
export interface FormInstance {
  id: string;
  templateId: string;
  templateVersion: string;
  patientId?: string;
  filledBy?: string;
  filledAt: string;
  status: 'draft' | 'completed' | 'submitted' | 'approved';

  // Dynamic data structure matching the template
  data: Record<string, any>;

  // For repeatable sections
  sections: Record<string, any[]>;

  // Attachments
  attachments?: FormAttachment[];

  // Signature
  signature?: {
    imageUrl: string;
    signedBy: string;
    signedAt: string;
    ipAddress?: string;
  };

  // Metadata
  metadata?: {
    device?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
  };

  // Approval workflow
  approvals?: Approval[];
}

/**
 * Form attachment
 */
export interface FormAttachment {
  id: string;
  fieldId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
}

/**
 * Approval record
 */
export interface Approval {
  approverId: string;
  approverName: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  timestamp: string;
}

/**
 * Field value for form data
 */
export type FieldValue =
  | string
  | number
  | boolean
  | string[]
  | null
  | Date
  | FileValue;

export interface FileValue {
  url: string;
  name: string;
  size: number;
  type: string;
}

/**
 * Form data structure
 */
export interface FormData {
  [sectionId: string]: {
    [fieldId: string]: FieldValue | FieldValue[];
  };
}

// ============================================================================
// DATABASE SCHEMA TYPES
// ============================================================================

/**
 * Form template table
 */
export interface FormTemplateTable {
  id: string;
  name: string;
  specialty: Specialty;
  version: string;
  description: string | null;
  status: TemplateStatus;
  tags: string[];
  template_schema: FormTemplate; // JSON
  settings: FormSettings; // JSON
  export_config: ExportConfig; // JSON
  metadata: TemplateMetadata; // JSON
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by: string;
  department_id: string | null;
}

/**
 * Form instance table
 */
export interface FormInstanceTable {
  id: string;
  template_id: string;
  template_version: string;
  patient_id: string | null;
  filled_by: string;
  filled_at: Date;
  status: 'draft' | 'completed' | 'submitted' | 'approved';
  form_data: FormData; // JSON
  sections: Record<string, any[]>; // JSON for repeatable sections
  attachments: FormAttachment[]; // JSON
  signature: {
    imageUrl: string;
    signedBy: string;
    signedAt: string;
    ipAddress?: string;
  } | null;
  metadata: {
    device?: string;
    browser?: string;
    ipAddress?: string;
    location?: string;
  } | null;
  submitted_at: Date | null;
  approved_by: string | null;
  approved_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * Form approval history
 */
export interface FormApprovalHistory {
  id: string;
  form_instance_id: string;
  approver_id: string;
  approver_name: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  comment: string | null;
  timestamp: Date;
}

// ============================================================================
// EXPORT FORMAT TYPES
// ============================================================================

/**
 * Export configuration
 */
export interface ExportOptions {
  format: 'docx' | 'pdf' | 'html' | 'json';
  includeSignature?: boolean;
  includeTimestamp?: boolean;
  includeMetadata?: boolean;
  template?: string;
  customData?: Record<string, any>;
}

/**
 * Export result
 */
export interface ExportResult {
  format: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  generatedAt: string;
}
