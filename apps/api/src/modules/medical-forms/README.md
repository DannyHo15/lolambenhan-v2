# Medical Forms - Dynamic Form System

A comprehensive, flexible medical form system supporting dynamic sections, fields, validation, conditional logic, and multi-format exports.

## Overview

This module provides:
- **Dynamic form templates** for medical specialties
- **Flexible sections** - add/remove sections as needed
- **Flexible fields** - 10+ field types with validation
- **Conditional logic** - show/hide based on other fields
- **Multi-format export** - DOCX, PDF, HTML, JSON
- **Approval workflow** - track form submissions and approvals
- **Version control** - track template changes
- **Audit trail** - complete logging of all actions

## Architecture

### Directory Structure

```
medical-forms/
├── schemas/
│   └── form-template.schema.ts    # JSON schema + TypeScript interfaces
├── templates/
│   ├── noi-khoa.template.json     # Internal medicine form
│   ├── tien-phau.template.json    # Pre-operative form
│   └── hau-phau.template.json     # Post-operative form
├── database/
│   └── schema.sql                 # Database schema & stored procedures
└── README.md                      # This file
```

### Components

#### 1. Form Template Schema
- **File**: `form-template.schema.ts`
- **Contains**:
  - JSON Schema definition
  - TypeScript interfaces
  - Database table types
  - Export configuration types

#### 2. Form Templates
- **File**: `templates/*.json`
- **Predefined templates**:
  - `noi-khoa-v1`: Internal medicine examination
  - `tien-phau-v1`: Pre-operative assessment
  - `hau-phau-v1`: Post-operative monitoring

#### 3. Database Schema
- **File**: `schema.sql`
- **Tables**:
  - `form_templates`: Template definitions
  - `form_instances`: Filled forms
  - `form_approval_history`: Approval workflow
  - `form_audit_log`: Audit trail
  - And 7 more supporting tables

## Field Types

| Type | Description | Use Case |
|------|-------------|----------|
| `text` | Single line text | Names, codes |
| `textarea` | Multi-line text | Descriptions, notes |
| `number` | Numeric input | Vital signs, lab values |
| `date` | Date picker | Dates of birth, surgery |
| `datetime` | Date + time | Timestamps |
| `select` | Dropdown | Categories, choices |
| `radio` | Radio buttons | Mutually exclusive options |
| `checkbox` | Checkboxes | Multiple selections |
| `file` | File uploads | Images, documents |
| `signature` | Digital signature | Approvals |

## Validation Rules

```typescript
interface ValidationRules {
  required?: boolean;           // Field is mandatory
  minLength?: number;           // Min text length
  maxLength?: number;           // Max text length
  min?: number;                // Min numeric value
  max?: number;                // Max numeric value
  pattern?: string;            // Regex pattern
  patternMessage?: string;     // Custom error message
  customValidation?: {
    validator: string;         // Custom validator name
    errorMessage?: string;
  };
}
```

## Conditional Logic

Show/hide fields based on other field values:

```json
{
  "conditionalDisplay": {
    "operator": "AND",
    "conditions": [
      {
        "fieldId": "insurance",
        "operator": "equals",
        "value": "yes"
      },
      {
        "fieldId": "age",
        "operator": "greater_than",
        "value": 65
      }
    ]
  }
}
```

### Operators

- `equals` - Exact match
- `not_equals` - Not equal
- `contains` - Contains value (arrays)
- `greater_than` - Numeric comparison
- `less_than` - Numeric comparison
- `in_array` - Value in array
- `is_empty` - Field is empty
- `is_not_empty` - Field has value

## Template Structure

```typescript
interface FormTemplate {
  id: string;                  // Unique ID
  name: string;                // Display name
  specialty: Specialty;        // Medical specialty
  version: string;             // Semantic version
  status: 'draft' | 'active' | 'deprecated';
  tags: string[];              // Search tags
  sections: FormSection[];     // Form sections
  settings?: FormSettings;     // Form behavior
  exportConfig?: ExportConfig; // Export settings
}

interface FormSection {
  id: string;
  name: string;
  order: number;
  collapsible?: boolean;
  repeatable?: boolean;        // Can add multiple instances
  minRepeat?: number;
  maxRepeat?: number;
  fields: FormField[];         // Section fields
}

interface FormField {
  id: string;
  name: string;
  type: FieldType;
  required?: boolean;
  readonly?: boolean;
  conditionalDisplay?: ConditionalDisplay;
  validation?: ValidationRules;
  // ... type-specific properties
}
```

## Usage Examples

### Creating a Template

```typescript
import { FormTemplate } from './schemas/form-template.schema';

const myTemplate: FormTemplate = {
  id: 'custom-form-v1',
  name: 'Custom Examination Form',
  specialty: 'noi-khoa',
  version: '1.0.0',
  status: 'active',
  sections: [
    {
      id: 'patient-info',
      name: 'Patient Information',
      order: 1,
      fields: [
        {
          id: 'name',
          name: 'fullName',
          label: 'Full Name',
          type: 'text',
          order: 1,
          required: true,
          validation: {
            minLength: 2,
            maxLength: 100
          }
        }
      ]
    }
  ]
};
```

### Filling a Form

```typescript
const formInstance: FormInstance = {
  id: 'instance-123',
  templateId: 'noi-khoa-v1',
  templateVersion: '1.0.0',
  patientId: 'patient-456',
  filledBy: 'user-789',
  filledAt: new Date().toISOString(),
  status: 'completed',
  data: {
    'patient-info': {
      fullName: 'John Doe',
      dateOfBirth: '1990-01-15',
      gender: 'male'
    },
    'vital-signs': {
      temperature: 36.5,
      bloodPressure: '120/80',
      heartRate: 72
    }
  }
};
```

### Exporting Forms

```typescript
// Export to DOCX
const docxResult = await exportForm(formInstanceId, {
  format: 'docx',
  template: 'templates/noi-khoa.docx',
  includeSignature: true,
  includeTimestamp: true
});

// Export to PDF
const pdfResult = await exportForm(formInstanceId, {
  format: 'pdf',
  template: 'templates/noi-khoa.pdf'
});

// Export to JSON
const jsonResult = await exportForm(formInstanceId, {
  format: 'json',
  includeMetadata: true
});
```

## Database Schema

### Key Tables

#### form_templates
Stores form templates with JSON schema.

```sql
CREATE TABLE form_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    status ENUM('draft', 'active', 'deprecated'),
    template_schema JSON NOT NULL,
    settings JSON,
    export_config JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL
);
```

#### form_instances
Stores filled form instances.

```sql
CREATE TABLE form_instances (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    template_version VARCHAR(20) NOT NULL,
    patient_id VARCHAR(100),
    filled_by VARCHAR(100) NOT NULL,
    status ENUM('draft', 'completed', 'submitted', 'approved'),
    form_data JSON NOT NULL,
    sections JSON,
    attachments JSON,
    signature JSON,
    filled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Specialties

Currently supported:
- `noi-khoa` - Internal Medicine
- `tien-phau` - Pre-operative
- `hau-phau` - Post-operative
- `ngoai-khoa` - Surgery
- `san-phu-khoa` - Obstetrics/Gynecology
- `pediatric` - Pediatrics

## API Endpoints (Proposed)

```
GET    /api/v1/forms/templates              # List all templates
GET    /api/v1/forms/templates/:id          # Get template details
POST   /api/v1/forms/templates              # Create template
PUT    /api/v1/forms/templates/:id          # Update template
DELETE /api/v1/forms/templates/:id          # Delete template

GET    /api/v1/forms/instances              # List filled forms
GET    /api/v1/forms/instances/:id          # Get form instance
POST   /api/v1/forms/instances              # Fill form
PUT    /api/v1/forms/instances/:id          # Update form
DELETE /api/v1/forms/instances/:id          # Delete form

POST   /api/v1/forms/:id/submit             # Submit for approval
POST   /api/v1/forms/:id/approve            # Approve form
POST   /api/v1/forms/:id/reject             # Reject form

POST   /api/v1/forms/:id/export             # Export form
GET    /api/v1/forms/:id/export/:format     # Get exported file
```

## Features

### 1. Repeatable Sections
Allow users to add multiple instances of a section:

```json
{
  "id": "medications",
  "name": "Medications",
  "repeatable": true,
  "minRepeat": 0,
  "maxRepeat": 20,
  "fields": [...]
}
```

### 2. Calculated Fields
Auto-calculate values based on other fields:

```json
{
  "id": "bmi",
  "name": "bmi",
  "type": "number",
  "calculated": true,
  "calculation": "{{weight}} / ({{height}}/100)^2",
  "unit": "kg/m²"
}
```

### 3. Version Control
Track all template changes:

```sql
CREATE TABLE form_template_versions (
    id VARCHAR(255) PRIMARY KEY,
    template_id VARCHAR(255) NOT NULL,
    version VARCHAR(20) NOT NULL,
    template_snapshot JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. Audit Trail
Complete logging of all actions:

```sql
CREATE TABLE form_audit_log (
    id VARCHAR(255) PRIMARY KEY,
    entity_type ENUM('template', 'instance', 'comment', 'approval'),
    entity_id VARCHAR(255) NOT NULL,
    action ENUM('create', 'read', 'update', 'delete'),
    user_id VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. Approval Workflow

```
Draft → Completed → Submitted → Approved
                    ↓
                  Rejected
```

## Best Practices

### 1. Template Design
- Group related fields in sections
- Use logical field ordering
- Provide clear labels and descriptions
- Set appropriate validation rules
- Use conditional logic to reduce clutter

### 2. Field Naming
- Use camelCase for field IDs
- Be descriptive but concise
- Include units in labels, not IDs
- Example: `bloodPressureSystolic` not `bpsystolic`

### 3. Validation
- Always validate on both client and server
- Provide helpful error messages
- Use pattern messages for regex
- Set reasonable min/max values

### 4. Performance
- Index commonly queried fields
- Use JSON path indexes for JSON columns
- Archive old form instances
- Cleanup old audit logs

### 5. Security
- Implement row-level security
- Log all access
- Encrypt sensitive data
- Validate all inputs
- Use prepared statements

## Integration Points

### 1. With Patient System
```typescript
// Auto-fill patient data
const patient = await getPatient(patientId);
formInstance.data['patient-info'] = {
  fullName: patient.name,
  dateOfBirth: patient.dob,
  gender: patient.gender
};
```

### 2. With Lab System
```typescript
// Auto-import lab results
const labs = await getLabResults(patientId);
formInstance.data['labs'] = {
  hemoglobin: labs.hgb,
  platelets: labs.plt,
  inr: labs.inr
};
```

### 3. With Billing System
```typescript
// Trigger billing after form approval
if (formInstance.status === 'approved') {
  await createBillingCharge(formInstance);
}
```

## Future Enhancements

- [ ] Form builder UI for creating templates
- [ ] AI-powered field suggestions
- [ ] Voice-to-text for text fields
- [ ] Offline form filling
- [ ] Real-time collaboration
- [ ] Advanced analytics and reporting
- [ ] Integration with EMR systems
- [ ] Mobile app support
- [ ] Form templates marketplace
- [ ] Automated data entry from documents

## Contributing

When adding new templates:
1. Use semantic versioning
2. Follow the structure of existing templates
3. Include all relevant fields
4. Set appropriate validation
5. Add conditional logic where useful
6. Test with sample data
7. Update this README

## License

Copyright © 2025. All rights reserved.
