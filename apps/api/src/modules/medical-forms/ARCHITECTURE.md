# Medical Forms System - Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Form Builder │  │  Form Viewer │  │ Form Filler  │         │
│  │   (Admin)    │  │   (Staff)    │  │  (End User)  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              RESTful API Endpoints                        │  │
│  │  /api/forms/templates    /api/forms/instances             │  │
│  │  /api/forms/export       /api/forms/approve               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Business Logic Layer                      │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Template   │  │   Instance   │  │   Export     │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Validation  │  │   Workflow   │  │   Audit      │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Access Layer                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Repository  │  │   Cache      │  │   Storage    │         │
│  │  Pattern     │  │  (Redis)     │  │   (S3)       │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Database Layer                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              MySQL/PostgreSQL Database                   │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Templates  │  │  Instances   │  │   Audit      │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │  │
│  │  │   Versions   │  │   Approvals  │  │   Comments   │  │  │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Form Creation Flow
```
Admin User
    │
    ├─→ Create Template (JSON)
    │       │
    │       ├─→ Validate Schema
    │       ├─→ Save to form_templates
    │       └─→ Create Version in form_template_versions
    │
    └─→ Activate Template
            │
            └─→ Update status = 'active'
```

### Form Filling Flow
```
End User
    │
    ├─→ Select Template
    │       │
    │       └─→ GET /api/forms/templates/:id
    │
    ├─→ Fill Form Fields
    │       │
    │       ├─→ Validate Inputs
    │       ├─→ Auto-save (draft)
    │       └─→ Calculate Fields (BMI, etc.)
    │
    ├─→ Complete Form
    │       │
    │       └─→ POST /api/forms/instances
    │               │
    │               ├─→ Save to form_instances
    │               ├─→ Log in form_audit_log
    │               └─→ status = 'completed'
    │
    ├─→ Submit for Approval
    │       │
    │       └─→ POST /api/forms/:id/submit
    │               │
    │               ├─→ status = 'submitted'
    │               └─→ Notify Approvers
    │
    └─→ Approver Review
            │
            ├─→ GET /api/forms/:id
            │
            ├─→ Approve
            │       │
            │       └─→ POST /api/forms/:id/approve
            │               │
            │               ├─→ status = 'approved'
            │               ├─→ Save to form_approval_history
            │               └─→ Log audit
            │
            └─→ Reject
                    │
                    └─→ POST /api/forms/:id/reject
                            │
                            ├─→ status = 'rejected'
                            └─→ Return to user
```

### Export Flow
```
User Request
    │
    ├─→ POST /api/forms/:id/export
    │       │
    │       ├─→ Get Form Instance
    │       ├─→ Get Template
    │       └─→ Load Export Template
    │
    ├─→ Render
    │       │
    │       ├─→ DOCX: Use docx-template
    │       ├─→ PDF: Use pdf-lib or puppeteer
    │       ├─→ HTML: Use template engine
    │       └─→ JSON: Serialize form_data
    │
    └─→ Save & Return
            │
            ├─→ Save to form_exports
            ├─→ Upload to Storage (S3)
            └─→ Return download URL
```

## Component Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                     FormTemplate                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  id: string                                            │  │
│  │  name: string                                          │  │
│  │  specialty: Specialty                                  │  │
│  │  sections: FormSection[] ───────────────────┐          │  │
│  │  settings: FormSettings                     │          │  │
│  │  exportConfig: ExportConfig                 │          │  │
│  └─────────────────────────────────────────────┼──────────┘  │
└─────────────────────────────────────────────────┼────────────┘
                                                   │
                                                   ▼
┌──────────────────────────────────────────────────────────────┐
│                     FormSection                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  id: string                                            │  │
│  │  name: string                                          │  │
│  │  repeatable: boolean                                   │  │
│  │  fields: FormField[] ──────────────────────┐           │  │
│  └────────────────────────────────────────────┼───────────┘  │
└─────────────────────────────────────────────────┼────────────┘
                                                    │
                                                    ▼
┌──────────────────────────────────────────────────────────────┐
│                     FormField                                 │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  id: string                                            │  │
│  │  name: string                                          │  │
│  │  type: FieldType                                       │  │
│  │  validation: ValidationRules                           │  │
│  │  conditionalDisplay: ConditionalDisplay ──┐            │  │
│  └────────────────────────────────────────────┼────────────┘  │
└─────────────────────────────────────────────────┼────────────┘
                                                     │
                                                     ▼
┌──────────────────────────────────────────────────────────────┐
│                 FormInstance (Filled Form)                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  id: string                                            │  │
│  │  templateId: string ───────────────────────┐           │  │
│  │  templateVersion: string                    │           │  │
│  │  status: FormStatus                         │           │  │
│  │  data: Record<string, any> ──────┐         │           │  │
│  │  sections: Record<string, any[]> │         │           │  │
│  │  signature: Signature             │         │           │  │
│  └──────────────────────────────────┼─────────┼───────────┘  │
└─────────────────────────────────────┼─────────┼──────────────┘
                                      │         │
                    ┌─────────────────┘         └─────────────────┐
                    ▼                                               ▼
          ┌─────────────────────┐                     ┌─────────────────────┐
          │   ConditionalDisplay│                     │   ValidationRules    │
          │  ┌───────────────┐  │                     │  ┌───────────────┐  │
          │  │ operator: AND │  │                     │  │ required: bool│  │
          │  │ conditions[]  │  │                     │  │ min: number   │  │
          │  └───────────────┘  │                     │  │ pattern: regex│  │
          └─────────────────────┘                     │  └───────────────┘  │
                                                     └─────────────────────┘
```

## Database Schema Relationships

```
form_templates (1) ──────< (many) form_instances
       │                              │
       │                              │
       ├────────────────────< (many) form_template_versions
       │
       └────────────────────< (many) form_sharing

form_instances (1) ──────< (many) form_approval_history
       │
       ├────────────────────< (many) form_comments
       │
       ├────────────────────< (many) form_exports
       │
       └────────────────────< (many) form_audit_log

form_templates (1) ──────< (many) form_field_options
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                   Security Stack                         │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization                 │   │
│  │  - JWT Tokens                                   │   │
│  │  - Role-Based Access Control (RBAC)             │   │
│  │  - Department Isolation                         │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Input Validation                               │   │
│  │  - Schema Validation (JSON Schema)              │   │
│  │  - Business Rules                               │   │
│  │  - SQL Injection Prevention                     │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Data Protection                                │   │
│  │  - Encryption at Rest                           │   │
│  │  - Encryption in Transit (TLS)                  │   │
│  │  - PII Redaction                                │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Audit & Compliance                             │   │
│  │  - Complete Audit Trail                         │   │
│  │  - Immutable Logs                               │   │
│  │  - Compliance Reporting                         │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Performance Optimization

### Caching Strategy
```
┌──────────────────┐
│   Redis Cache    │
├──────────────────┤
│  Template Cache  │ ───→ Active templates (1 hour)
│  Schema Cache    │ ───→ Form schemas (30 min)
│  User Session    │ ───→ Active users (24 hours)
│  Query Results   │ ───→ Frequent queries (5 min)
└──────────────────┘
```

### Database Optimization
```
Indexing Strategy:
├── Primary Keys: All id columns
├── Foreign Keys: template_id, patient_id, user_id
├── Status Fields: status, specialty
├── Timestamps: created_at, filled_at
└── JSON Path: template_schema->'$.specialty'
└── Full-Text: name, description

Query Optimization:
├── Use LIMIT for pagination
├── Filter by status first
├── Index-covered queries
└── Avoid SELECT *
```

### Export Optimization
```
┌──────────────────────────────────────┐
│        Export Pipeline               │
├──────────────────────────────────────┤
│  1. Load template from cache         │
│  2. Load form instance               │
│  3. Pre-compute calculated fields    │
│  4. Apply export template            │
│  5. Generate output format           │
│  6. Stream to storage (S3)           │
│  7. Cache result URL                 │
└──────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling
```
                    ┌─────────────┐
                    │   Load      │
                    │  Balancer   │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
  │  API Node  │      │  API Node  │      │  API Node  │
  │     #1     │      │     #2     │      │     #3     │
  └─────┬─────┘      └─────┬─────┘      └─────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Shared    │
                    │   Redis     │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  Database   │
                    │  (Primary)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  ┌─────▼─────┐      ┌─────▼─────┐      ┌─────▼─────┐
  │   Read     │      │   Read     │      │   Read     │
  │  Replica   │      │  Replica   │      │  Replica   │
  └───────────┘      └───────────┘      └───────────┘
```

### Data Partitioning
```
Partition by:
├── Specialty (noi-khoa, tien-phau, etc.)
├── Date (quarterly partitions)
├── Status (draft, completed, archived)
└── Department (for multi-tenant)

Archive Strategy:
├── Drafts > 30 days → Archive storage
├── Completed > 1 year → Cold storage
├── Audit logs > 2 years → Compress
└── Export files > 6 months → Delete
```

## Integration Points

```
                    ┌─────────────────┐
                    │  Medical Forms  │
                    │     System      │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
  ┌─────▼─────┐       ┌─────▼─────┐       ┌─────▼─────┐
  │  Patient  │       │   Lab     │       │  Billing  │
  │  System   │       │  System   │       │  System   │
  └───────────┘       └───────────┘       └───────────┘
        │                    │                    │
        ├─→ Auto-fill        ├─→ Import           ├─→ Charge
        │   patient info     │   lab results      │   generation
        │                    │                    │
        └─→ Update           └─→ Trigger          └─→ Notify
            patient record        orders            payment
```

## Monitoring & Observability

```
┌────────────────────────────────────────────────────┐
│              Metrics Collection                    │
├────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────┐ │
│  │  Application Metrics                          │ │
│  │  - Request rate                              │ │
│  │  - Response time                             │ │
│  │  - Error rate                                │ │
│  │  - Active users                              │ │
│  └──────────────────────────────────────────────┘ │
│  ┌──────────────────────────────────────────────┐ │
│  │  Business Metrics                            │ │
│  │  - Forms created per day                     │ │
│  │  - Forms approved vs rejected                │ │
│  │  - Average completion time                   │ │
│  │  - Template usage statistics                 │ │
│  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘
                        │
                        ▼
┌────────────────────────────────────────────────────┐
│              Alerting System                       │
├────────────────────────────────────────────────────┤
│  • High error rate > 5%                           │
│  • Slow response > 2s                             │
│  • Database connection pool exhausted             │
│  • Failed exports > 10/hour                       │
│  • Unusual activity patterns                      │
└────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend
```
Runtime: Bun / Node.js
Framework: Elysia / Express
Database: MySQL 8.0+ / PostgreSQL 14+
Cache: Redis 7+
Storage: S3 / MinIO
Queue: Bull / RabbitMQ
```

### Frontend
```
Framework: Next.js 14+
UI Library: shadcn/ui / Ant Design
Forms: React Hook Form + Zod
State: Zustand / Redux
Real-time: Socket.io
```

### Export Generation
```
DOCX: docx-template / docx
PDF: pdf-lib / puppeteer
HTML: Handlebars / EJS
JSON: Native JSON.stringify
```

---

## Summary

This architecture provides:

✅ **Scalability** - Horizontal scaling, caching, partitioning
✅ **Reliability** - Audit trail, versioning, backup
✅ **Security** - Multi-layer security, encryption, RBAC
✅ **Performance** - Caching, indexing, query optimization
✅ **Maintainability** - Clean architecture, separation of concerns
✅ **Flexibility** - Dynamic schema, pluggable validators
✅ **Observability** - Metrics, logging, alerting

For implementation details, see:
- IMPLEMENTATION-GUIDE.md - Detailed implementation guide
- QUICK-REF.md - Quick reference card
- README.md - Full documentation
