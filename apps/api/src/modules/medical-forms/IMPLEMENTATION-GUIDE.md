# Medical Forms System - Implementation Guide

## Quick Reference

### Files Created

1. **Schema & Types**: `/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/schemas/form-template.schema.ts`
2. **Templates**:
   - `/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/templates/noi-khoa.template.json`
   - `/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/templates/tien-phau.template.json`
   - `/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/templates/hau-phau.template.json`
3. **Database**: `/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/database/schema.sql`
4. **Documentation**: `/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/README.md`

---

## 1. JSON Schema Structure

### Core Schema
```json
{
  "id": "template-id",
  "name": "Form Name",
  "specialty": "noi-khoa|tien-phau|hau-phau|...",
  "version": "1.0.0",
  "status": "draft|active|deprecated",
  "sections": [
    {
      "id": "section-id",
      "name": "Section Name",
      "order": 1,
      "repeatable": false,
      "fields": [...]
    }
  ],
  "settings": {
    "allowPartialSave": true,
    "requireSignature": true
  },
  "exportConfig": {
    "docxTemplate": "path/to/template.docx",
    "pdfTemplate": "path/to/template.pdf"
  }
}
```

### Field Types
- `text` - Single line input
- `textarea` - Multi-line input
- `number` - Numeric input with min/max
- `date` - Date picker
- `datetime` - Date + time picker
- `select` - Dropdown (single/multiple)
- `radio` - Radio buttons (mutually exclusive)
- `checkbox` - Checkboxes (multiple selections)
- `file` - File upload
- `signature` - Digital signature

### Validation Rules
```json
{
  "required": true,
  "minLength": 2,
  "maxLength": 100,
  "min": 0,
  "max": 100,
  "pattern": "^[A-Z]\\d{2}$",
  "patternMessage": "Invalid format"
}
```

### Conditional Display
```json
{
  "conditionalDisplay": {
    "operator": "AND|OR",
    "conditions": [
      {
        "fieldId": "other-field",
        "operator": "equals|not_equals|contains|greater_than|less_than",
        "value": "expected-value"
      }
    ]
  }
}
```

---

## 2. Example Templates

### Nội Khoa (Internal Medicine)
**Sections**: Patient Info, Chief Complaint, Medical History, Vital Signs, Physical Exam, Diagnosis, Treatment Plan

**Key Features**:
- Auto-calculated BMI
- Conditional insurance number field
- Vital signs with units
- Multi-select lab tests
- ICD-10 code validation

**File**: `templates/noi-khoa.template.json`

### Tiền Phẫu (Pre-operative)
**Sections**: Surgery Info, ASA Classification, Vital Signs, Cardiovascular Assessment, Respiratory Assessment, Labs, Imaging, Airway Assessment, Risk Assessment, Fasting, Premedication, Consent, Summary

**Key Features**:
- ASA classification with descriptions
- Complex conditional logic (NYHA class)
- Repeatable vital signs monitoring
- Airway assessment with Mallampati
- Risk factor checklist
- Anesthesia planning

**File**: `templates/tien-phau.template.json`

### Hậu Phẫu (Post-operative)
**Sections**: Surgery Info, Recovery Room, Vital Signs Monitoring, Pain Management, Fluid Management, Wound Care, Complications, Mobility, Nutrition, Elimination, Discharge, Signatures

**Key Features**:
- **Repeatable vital signs** (min 1, max 50)
- Multiple pain scales
- Wound appearance assessment
- Complication tracking
- Mobility status
- Discharge planning
- Dual signature (nurse + doctor)

**File**: `templates/hau-phau.template.json`

---

## 3. TypeScript Interfaces

### Core Types
```typescript
type FieldType =
  | 'text' | 'textarea' | 'number'
  | 'date' | 'datetime'
  | 'select' | 'radio' | 'checkbox'
  | 'file' | 'signature';

type Specialty =
  | 'noi-khoa'      // Internal medicine
  | 'tien-phau'     // Pre-operative
  | 'hau-phau'      // Post-operative
  | 'ngoai-khoa'    // Surgery
  | 'san-phu-khoa'  // OB/GYN
  | 'pediatric';    // Pediatrics

type TemplateStatus = 'draft' | 'active' | 'deprecated';
```

### Form Template
```typescript
interface FormTemplate {
  id: string;
  name: string;
  specialty: Specialty;
  version: string;
  status: TemplateStatus;
  sections: FormSection[];
  settings?: FormSettings;
  exportConfig?: ExportConfig;
}
```

### Form Section
```typescript
interface FormSection {
  id: string;
  name: string;
  order: number;
  collapsible?: boolean;
  collapsedByDefault?: boolean;
  repeatable?: boolean;        // Allow multiple instances
  minRepeat?: number;
  maxRepeat?: number;
  conditionalDisplay?: ConditionalDisplay;
  fields: FormField[];
}
```

### Form Field
```typescript
interface FormField {
  id: string;
  name: string;
  label?: string;
  type: FieldType;
  order: number;
  required?: boolean;
  readonly?: boolean;
  disabled?: boolean;
  defaultValue?: any;

  // Validation
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  patternMessage?: string;

  // Conditional logic
  conditionalDisplay?: ConditionalDisplay;

  // Calculated
  calculated?: boolean;
  calculation?: string;

  // UI
  width?: 'full' | 'half' | 'third' | 'quarter';
  hint?: string;

  // Type-specific
  options?: FieldOption[];     // select/radio/checkbox
  accept?: string[];           // file types
  unit?: string;               // number
}
```

### Form Instance (Filled Form)
```typescript
interface FormInstance {
  id: string;
  templateId: string;
  templateVersion: string;
  patientId?: string;
  filledBy: string;
  filledAt: string;
  status: 'draft' | 'completed' | 'submitted' | 'approved';

  // Dynamic data matching template
  data: Record<string, any>;

  // For repeatable sections
  sections: Record<string, any[]>;

  attachments?: FormAttachment[];
  signature?: {
    imageUrl: string;
    signedBy: string;
    signedAt: string;
  };
}
```

---

## 4. Database Design

### Primary Tables

#### form_templates
Stores form templates with flexible JSON schema.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key |
| name | VARCHAR(500) | Template name |
| specialty | VARCHAR(50) | Medical specialty |
| version | VARCHAR(20) | Semantic version |
| status | ENUM | draft/active/deprecated |
| template_schema | JSON | Full template definition |
| settings | JSON | Form behavior settings |
| export_config | JSON | Export configuration |
| created_at | TIMESTAMP | Creation time |
| created_by | VARCHAR(100) | Creator ID |

**Indexes**:
- `idx_specialty` (specialty)
- `idx_status` (status)
- `ft_search` FULLTEXT (name, description)

#### form_instances
Stores filled form instances.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key |
| template_id | VARCHAR(255) | FK to templates |
| template_version | VARCHAR(20) | Version used |
| patient_id | VARCHAR(100) | Patient ID |
| filled_by | VARCHAR(100) | User who filled |
| filled_at | TIMESTAMP | Fill time |
| status | ENUM | draft/completed/submitted |
| form_data | JSON | Field values |
| sections | JSON | Repeatable sections |
| attachments | JSON | File attachments |
| signature | JSON | Digital signature |

**Indexes**:
- `idx_template` (template_id)
- `idx_patient` (patient_id)
- `idx_status` (status)
- `idx_filled_at` (filled_at)

#### form_approval_history
Tracks approval workflow.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key |
| form_instance_id | VARCHAR(255) | FK to instances |
| approver_id | VARCHAR(100) | Approver ID |
| role | VARCHAR(100) | Approver role |
| status | ENUM | pending/approved/rejected |
| comment | TEXT | Approval comments |
| timestamp | TIMESTAMP | Action time |

#### form_audit_log
Complete audit trail.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR(255) | Primary key |
| entity_type | ENUM | template/instance/comment |
| entity_id | VARCHAR(255) | Entity reference |
| action | ENUM | create/read/update/delete |
| user_id | VARCHAR(100) | User who acted |
| old_value | JSON | Previous value (update) |
| new_value | JSON | New value |
| timestamp | TIMESTAMP | Action time |

### Supporting Tables

- `form_template_versions` - Version history
- `form_sharing` - Cross-department sharing
- `form_comments` - Form discussions
- `form_exports` - Export tracking
- `form_custom_validators` - Custom validation logic
- `form_field_options` - Reusable option sets

---

## 5. Key Features

### Repeatable Sections
Allow multiple instances of a section (e.g., medications, vital signs):

```json
{
  "id": "vital-signs-monitoring",
  "repeatable": true,
  "minRepeat": 1,
  "maxRepeat": 50
}
```

### Calculated Fields
Auto-calculate based on other fields:

```json
{
  "id": "bmi",
  "calculated": true,
  "calculation": "{{weight}} / ({{height}}/100)^2"
}
```

### Conditional Logic
Show/hide fields dynamically:

```json
{
  "conditionalDisplay": {
    "operator": "AND",
    "conditions": [
      { "fieldId": "insurance", "operator": "equals", "value": "yes" }
    ]
  }
}
```

### Validation Patterns
Common regex patterns:
- Vietnamese phone: `^(\\+84|0)\\d{9,10}$`
- Email: `^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$`
- ICD-10: `^[A-Z]\\d{2}(\\.\\d{1,2})?$`
- Blood pressure: `^\\d{2,3}\\/\\d{2,3}$`

---

## 6. Export Formats

### Supported Formats
- **DOCX** - Microsoft Word
- **PDF** - Portable Document Format
- **HTML** - Web page
- **JSON** - Raw data

### Export Options
```typescript
interface ExportOptions {
  format: 'docx' | 'pdf' | 'html' | 'json';
  includeSignature?: boolean;
  includeTimestamp?: boolean;
  includeMetadata?: boolean;
  template?: string;
  customData?: Record<string, any>;
}
```

### Template-Based Export
Use DOCX/PDF templates with placeholders:
- `{{patient-name}}` - Patient full name
- `{{field-id}}` - Any field value
- `{{section-id.field-id}}` - Nested field
- `{{timestamp}}` - Export time
- `{{signature}}` - Signature image

---

## 7. Workflow Status

### Form Lifecycle
```
Draft → Completed → Submitted → Approved
                     ↓
                   Rejected
```

### Status Definitions
- **draft** - Being filled
- **completed** - All required fields filled
- **submitted** - Sent for approval
- **approved** - Approved and finalized
- **rejected** - Rejected, needs revision

---

## 8. Database Setup

### Quick Start
```sql
-- Create database
CREATE DATABASE medical_forms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use database
USE medical_forms;

-- Execute schema
SOURCE /path/to/schema.sql;
```

### Grant Permissions
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON medical_forms.*
TO 'app_user'@'localhost';
FLUSH PRIVILEGES;
```

### Create Indexes
```sql
-- JSON path indexes (MySQL 8.0+)
CREATE INDEX idx_template_specialty
ON form_templates((CAST(template_schema->'$.specialty' AS CHAR(50))));

CREATE INDEX idx_form_data_patient
ON form_instances((CAST(form_data->'$.patientCode' AS CHAR(100))));
```

---

## 9. API Integration

### Template Management
```typescript
// List templates
GET /api/forms/templates?specialty=noi-khoa&status=active

// Get template
GET /api/forms/templates/noi-khoa-v1

// Create template
POST /api/forms/templates
Body: FormTemplate

// Update template
PUT /api/forms/templates/noi-khoa-v1
Body: Partial<FormTemplate>
```

### Form Filling
```typescript
// Create instance
POST /api/forms/instances
Body: {
  templateId: 'noi-khoa-v1',
  patientId: 'patient-123',
  data: { ... }
}

// Update instance
PUT /api/forms/instances/instance-456
Body: { data: { ... } }

// Submit for approval
POST /api/forms/instances/instance-456/submit
```

### Export
```typescript
// Export form
POST /api/forms/instances/instance-456/export
Body: {
  format: 'pdf',
  includeSignature: true
}

// Download
GET /api/forms/instances/instance-456/export/pdf
```

---

## 10. Best Practices

### Template Design
✅ Group related fields in sections
✅ Use logical field ordering
✅ Provide clear labels and descriptions
✅ Set appropriate validation
✅ Use conditional logic to reduce clutter
✅ Include helpful hints and examples

### Field Naming
✅ Use camelCase for IDs
✅ Be descriptive but concise
✅ Include units in labels, not IDs
✅ Use consistent naming patterns

### Performance
✅ Index commonly queried fields
✅ Archive old instances (>30 days draft, >1 year completed)
✅ Cleanup audit logs periodically
✅ Use JSON path indexes
✅ Optimize large repeatable sections

### Security
✅ Implement row-level security
✅ Log all access
✅ Encrypt sensitive data
✅ Validate all inputs
✅ Use prepared statements
✅ Implement approval workflow

---

## 11. Example Implementation

### Creating a Custom Template

```typescript
import { FormTemplate } from './schemas/form-template.schema';

const customTemplate: FormTemplate = {
  id: 'pediatric-checkup-v1',
  name: 'Pediatric Check-up Form',
  specialty: 'pediatric',
  version: '1.0.0',
  status: 'active',

  sections: [
    {
      id: 'patient-info',
      name: 'Patient Information',
      order: 1,
      fields: [
        {
          id: 'child-name',
          name: 'childName',
          label: 'Child\'s Name',
          type: 'text',
          order: 1,
          required: true,
          width: 'half'
        },
        {
          id: 'birth-weight',
          name': 'birthWeight',
          label: 'Birth Weight (kg)',
          type: 'number',
          order: 2,
          required: true,
          width: 'half',
          min: 0.5,
          max: 10,
          step: 0.01,
          unit: 'kg'
        },
        {
          id: 'guardian',
          'name': 'guardianName',
          label: 'Guardian Name',
          type': 'text',
          order: 3,
          required: true,
          conditionalDisplay': {
            'operator': 'AND',
            'conditions': [
              {
                'fieldId': 'age',
                'operator': 'less_than',
                'value': 18
              }
            ]
          }
        }
      ]
    }
  ],

  settings: {
    allowPartialSave: true,
    requireSignature: true,
    autoSaveInterval: 30
  }
};
```

### Filling a Form

```typescript
const instance: FormInstance = {
  id: 'chk-2025-001',
  templateId: 'pediatric-checkup-v1',
  templateVersion: '1.0.0',
  patientId: 'pat-12345',
  filledBy: 'dr-smith',
  filledAt: new Date().toISOString(),
  status: 'completed',

  data: {
    'patient-info': {
      childName: 'John Doe',
      birthWeight: 3.2,
      guardianName: 'Jane Doe'
    },
    'vital-signs': {
      temperature: 37.0,
      heartRate: 95,
      respiratoryRate: 22
    }
  }
};
```

---

## 12. Troubleshooting

### Common Issues

**Issue**: Conditional logic not working
- **Solution**: Check field IDs match exactly
- **Solution**: Verify operator is correct for data type
- **Solution**: Check JSON structure is valid

**Issue**: Calculated field showing 0
- **Solution**: Verify referenced field IDs exist
- **Solution**: Check calculation formula syntax
- **Solution**: Ensure referenced fields have values

**Issue**: Export template not found
- **Solution**: Check file path in exportConfig
- **Solution**: Verify template file exists
- **Solution**: Check file permissions

---

## File Locations

All files are in:
```
/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/
├── schemas/
│   └── form-template.schema.ts          # JSON schema + TypeScript interfaces
├── templates/
│   ├── noi-khoa.template.json           # Internal medicine
│   ├── tien-phau.template.json          # Pre-operative
│   └── hau-phau.template.json           # Post-operative
├── database/
│   └── schema.sql                       # Database schema
├── README.md                            # Full documentation
└── IMPLEMENTATION-GUIDE.md              # This file
```

---

## Summary

This medical forms system provides:

✅ **Flexible schema** - Dynamic sections and fields
✅ **10+ field types** - text, number, date, select, file, signature
✅ **Validation** - Required, patterns, min/max, custom validators
✅ **Conditional logic** - Show/hide based on other fields
✅ **Repeatable sections** - Multiple instances (e.g., vital signs)
✅ **Calculated fields** - Auto-compute values (e.g., BMI)
✅ **3 templates** - Nội khoa, Tiền phẫu, Hậu phẫu
✅ **Version control** - Track template changes
✅ **Approval workflow** - Draft → Submitted → Approved
✅ **Audit trail** - Complete logging
✅ **Multi-format export** - DOCX, PDF, HTML, JSON
✅ **Database schema** - 12+ tables with indexes
✅ **TypeScript types** - Full type safety
✅ **Production-ready** - Security, performance, scalability

**Created**: 2025-02-08
**Version**: 1.0.0
**License**: Internal use
