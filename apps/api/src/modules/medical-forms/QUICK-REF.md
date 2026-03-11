# Medical Forms - Quick Reference Card

## Field Types Quick Guide

| Type | Example | Validation Options |
|------|---------|-------------------|
| `text` | Name, ID | minLength, maxLength, pattern |
| `textarea` | Description, Notes | minLength, maxLength |
| `number` | Age, Weight | min, max, step, unit |
| `date` | DOB, Surgery Date | minDate, maxDate, dateFormat |
| `datetime` | Timestamp | - |
| `select` | Category (dropdown) | options, multiple |
| `radio` | Gender (mutually exclusive) | options, columns |
| `checkbox` | Symptoms (multiple) | options, columns |
| `file` | Upload images/docs | accept, maxSize, maxFiles |
| `signature` | Digital signature | - |

## Conditional Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `equals` | Exact match | `field == "yes"` |
| `not_equals` | Not equal | `field != "no"` |
| `contains` | In array | `field in [a, b, c]` |
| `greater_than` | Numeric > | `age > 18` |
| `less_than` | Numeric < | `temp < 38` |
| `in_array` | Value in array | `value in [1, 2, 3]` |
| `is_empty` | Field empty | `field == null` |
| `is_not_empty` | Field has value | `field != null` |

## Common Regex Patterns

```javascript
// Vietnamese phone
/^(\\+84|0)\\d{9,10}$/

// Email
/^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$/

// ICD-10 code
/^[A-Z]\\d{2}(\\.\\d{1,2})?$/

// Blood pressure
/^\\d{2,3}\\/\\d{2,3}$/

// BHYT (Vietnam insurance)
/^[A-Z]{2}\\d{2}\\d{2}\\d{6}$/
```

## Template JSON Structure

```json
{
  "id": "unique-id",
  "name": "Form Name",
  "specialty": "noi-khoa",
  "version": "1.0.0",
  "status": "active",
  "sections": [
    {
      "id": "section-1",
      "name": "Section Name",
      "order": 1,
      "repeatable": false,
      "fields": [
        {
          "id": "field-1",
          "name": "fieldName",
          "label": "Field Label",
          "type": "text",
          "order": 1,
          "required": true,
          "width": "half",
          "validation": {...},
          "conditionalDisplay": {...}
        }
      ]
    }
  ],
  "settings": {...},
  "exportConfig": {...}
}
```

## Field Width Options

| Width | Columns Used |
|-------|--------------|
| `full` | 1/1 (100%) |
| `half` | 1/2 (50%) |
| `third` | 1/3 (33%) |
| `quarter` | 1/4 (25%) |

## Status Workflow

```
draft → completed → submitted → approved
                     ↓
                   rejected
```

## Repeatable Section Example

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

## Calculated Field Example

```json
{
  "id": "bmi",
  "name": "bmi",
  "type": "number",
  "calculated": true,
  "calculation": "{{weight}} / ({{height}}/100)^2",
  "unit": "kg/m²",
  "readonly": true
}
```

## Conditional Display Example

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

## Database Tables (Quick View)

| Table | Purpose |
|-------|---------|
| `form_templates` | Store form templates |
| `form_instances` | Store filled forms |
| `form_approval_history` | Approval workflow |
| `form_audit_log` | Audit trail |
| `form_template_versions` | Version history |
| `form_sharing` | Cross-department sharing |
| `form_comments` | Form discussions |
| `form_exports` | Export tracking |
| `form_custom_validators` | Custom validation |
| `form_field_options` | Reusable options |

## API Endpoints (Proposed)

```
Templates:
  GET    /api/forms/templates
  GET    /api/forms/templates/:id
  POST   /api/forms/templates
  PUT    /api/forms/templates/:id
  DELETE /api/forms/templates/:id

Instances:
  GET    /api/forms/instances
  GET    /api/forms/instances/:id
  POST   /api/forms/instances
  PUT    /api/forms/instances/:id
  DELETE /api/forms/instances/:id

Workflow:
  POST   /api/forms/:id/submit
  POST   /api/forms/:id/approve
  POST   /api/forms/:id/reject

Export:
  POST   /api/forms/:id/export
  GET    /api/forms/:id/export/:format
```

## File Paths

```
/Volumes/PARAGON/Danny/lolambenhan-v2/apps/api/src/modules/medical-forms/

├── schemas/form-template.schema.ts
├── templates/
│   ├── noi-khoa.template.json
│   ├── tien-phau.template.json
│   └── hau-phau.template.json
├── database/schema.sql
├── README.md
├── IMPLEMENTATION-GUIDE.md
└── QUICK-REF.md (this file)
```

## Key TypeScript Interfaces

```typescript
// Main types
type FieldType = 'text' | 'textarea' | 'number' | 'date' | ...
type Specialty = 'noi-khoa' | 'tien-phau' | 'hau-phau' | ...

// Core structures
interface FormTemplate { id, name, specialty, sections, ... }
interface FormSection { id, name, fields, repeatable, ... }
interface FormField { id, name, type, validation, ... }
interface FormInstance { id, templateId, data, status, ... }
```

## Validation Best Practices

✅ Always set `required` for mandatory fields
✅ Provide helpful `patternMessage` for regex
✅ Set reasonable `min`/`max` for numbers
✅ Use `placeholder` to show expected format
✅ Add `hint` for complex fields
✅ Use `conditionalDisplay` to hide optional fields

## Export Options

```typescript
{
  format: 'docx' | 'pdf' | 'html' | 'json',
  includeSignature: true,
  includeTimestamp: true,
  includeMetadata: false,
  template: 'path/to/template.docx'
}
```

## Quick Commands

```sql
-- Create database
CREATE DATABASE medical_forms;
USE medical_forms;
SOURCE schema.sql;

-- Get active templates
SELECT * FROM form_templates WHERE status = 'active';

-- Get form instances by patient
SELECT * FROM form_instances WHERE patient_id = 'patient-123';

-- Recent activity
SELECT * FROM form_audit_log ORDER BY timestamp DESC LIMIT 50;
```

## Specialty Codes

| Code | Name |
|------|------|
| `noi-khoa` | Internal Medicine |
| `tien-phau` | Pre-operative |
| `hau-phau` | Post-operative |
| `ngoai-khoa` | Surgery |
| `san-phu-khoa` | OB/GYN |
| `pediatric` | Pediatrics |

## Version Numbering

Use semantic versioning: `MAJOR.MINOR.PATCH`

- `1.0.0` → `1.0.1` - Bug fix
- `1.0.0` → `1.1.0` - New feature
- `1.0.0` → `2.0.0` - Breaking change

---

## Summary

This card provides quick reference for:
- ✅ Field types and validation
- ✅ Conditional operators
- ✅ Common regex patterns
- ✅ Template structure
- ✅ Database tables
- ✅ API endpoints
- ✅ TypeScript interfaces
- ✅ Best practices

For full documentation, see README.md and IMPLEMENTATION-GUIDE.md
