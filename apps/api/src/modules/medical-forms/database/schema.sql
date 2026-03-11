-- ============================================================================
-- MEDICAL FORMS DATABASE SCHEMA
-- Supports dynamic medical forms with flexible sections and fields
-- ============================================================================

-- Enable UUID extension if using PostgreSQL
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- FORM TEMPLATES TABLE
-- Stores form templates for different medical specialties
-- ============================================================================
CREATE TABLE form_templates (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(500) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    description TEXT,
    status ENUM('draft', 'active', 'deprecated') DEFAULT 'draft',

    -- JSON storage for flexible schema
    template_schema JSON NOT NULL,

    -- Settings
    settings JSON,

    -- Export configuration
    export_config JSON,

    -- Metadata
    tags JSON,
    metadata JSON,

    -- Department
    department_id VARCHAR(100),

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Audit
    created_by VARCHAR(100) NOT NULL,
    updated_by VARCHAR(100) NOT NULL,

    -- Indexes
    INDEX idx_specialty (specialty),
    INDEX idx_status (status),
    INDEX idx_department (department_id),
    INDEX idx_created_at (created_at),

    -- Unique constraint for versioning
    UNIQUE KEY unique_version (id, version)
);

-- ============================================================================
-- FORM INSTANCES TABLE
-- Stores filled forms by end users
-- ============================================================================
CREATE TABLE form_instances (
    id VARCHAR(255) PRIMARY KEY,

    -- Template reference
    template_id VARCHAR(255) NOT NULL,
    template_version VARCHAR(20) NOT NULL,

    -- Patient/User
    patient_id VARCHAR(100),
    filled_by VARCHAR(100) NOT NULL,

    -- Timestamps
    filled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    approved_at TIMESTAMP NULL,

    -- Status workflow
    status ENUM('draft', 'completed', 'submitted', 'approved') DEFAULT 'draft',

    -- Dynamic form data storage
    form_data JSON NOT NULL,

    -- Repeatable sections storage
    sections JSON,

    -- Attachments
    attachments JSON,

    -- Signature
    signature JSON,

    -- Metadata
    metadata JSON,

    -- Approval
    approved_by VARCHAR(100),

    -- Foreign keys
    FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_template (template_id),
    INDEX idx_patient (patient_id),
    INDEX idx_filled_by (filled_by),
    INDEX idx_status (status),
    INDEX idx_filled_at (filled_at),
    INDEX idx_submitted_at (submitted_at)
);

-- ============================================================================
-- FORM APPROVAL HISTORY TABLE
-- Tracks approval workflow for form instances
-- ============================================================================
CREATE TABLE form_approval_history (
    id VARCHAR(255) PRIMARY KEY,

    -- Reference to form instance
    form_instance_id VARCHAR(255) NOT NULL,

    -- Approver info
    approver_id VARCHAR(100) NOT NULL,
    approver_name VARCHAR(255) NOT NULL,
    role VARCHAR(100) NOT NULL,

    -- Approval decision
    status ENUM('pending', 'approved', 'rejected') NOT NULL,

    -- Comments
    comment TEXT,

    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    FOREIGN KEY (form_instance_id) REFERENCES form_instances(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_form_instance (form_instance_id),
    INDEX idx_approver (approver_id),
    INDEX idx_status (status),
    INDEX idx_timestamp (timestamp)
);

-- ============================================================================
-- FORM VERSIONS TABLE
-- Tracks version history of templates
-- ============================================================================
CREATE TABLE form_template_versions (
    id VARCHAR(255) PRIMARY KEY,

    -- Template reference
    template_id VARCHAR(255) NOT NULL,

    -- Version info
    version VARCHAR(20) NOT NULL,

    -- Full template snapshot
    template_snapshot JSON NOT NULL,

    -- Change log
    change_description TEXT,

    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Foreign key
    FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_template (template_id),
    INDEX idx_version (version),
    INDEX idx_created_at (created_at),

    -- Unique constraint
    UNIQUE KEY unique_template_version (template_id, version)
);

-- ============================================================================
-- FORM SHARING TABLE
-- Controls form template sharing between departments/facilities
-- ============================================================================
CREATE TABLE form_sharing (
    id VARCHAR(255) PRIMARY KEY,

    -- Template reference
    template_id VARCHAR(255) NOT NULL,

    -- Sharing info
    shared_from VARCHAR(100) NOT NULL,
    shared_to VARCHAR(100) NOT NULL,

    -- Permissions
    can_view BOOLEAN DEFAULT TRUE,
    can_edit BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,

    -- Status
    status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',

    -- Timestamps
    shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,

    -- Foreign key
    FOREIGN KEY (template_id) REFERENCES form_templates(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_template (template_id),
    INDEX idx_shared_to (shared_to),
    INDEX idx_status (status)
);

-- ============================================================================
-- FORM COMMENTS TABLE
-- Comments and discussions on form instances
-- ============================================================================
CREATE TABLE form_comments (
    id VARCHAR(255) PRIMARY KEY,

    -- Form reference
    form_instance_id VARCHAR(255) NOT NULL,

    -- Comment info
    commenter_id VARCHAR(100) NOT NULL,
    commenter_name VARCHAR(255) NOT NULL,
    role VARCHAR(100),

    -- Comment
    comment TEXT NOT NULL,

    -- Parent comment (for replies)
    parent_id VARCHAR(255) NULL,

    -- Attachments
    attachments JSON,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    FOREIGN KEY (form_instance_id) REFERENCES form_instances(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES form_comments(id) ON DELETE SET NULL,

    -- Indexes
    INDEX idx_form_instance (form_instance_id),
    INDEX idx_commenter (commenter_id),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- FORM EXPORTS TABLE
-- Tracks exported forms and their metadata
-- ============================================================================
CREATE TABLE form_exports (
    id VARCHAR(255) PRIMARY KEY,

    -- Form reference
    form_instance_id VARCHAR(255) NOT NULL,

    -- Export info
    format ENUM('docx', 'pdf', 'html', 'json') NOT NULL,

    -- File info
    file_name VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,

    -- Export options
    export_options JSON,

    -- Requested by
    requested_by VARCHAR(100) NOT NULL,

    -- Timestamp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key
    FOREIGN KEY (form_instance_id) REFERENCES form_instances(id) ON DELETE CASCADE,

    -- Indexes
    INDEX idx_form_instance (form_instance_id),
    INDEX idx_format (format),
    INDEX idx_created_at (created_at)
);

-- ============================================================================
-- FORM CUSTOM VALIDATORS TABLE
-- Custom validation logic for fields
-- ============================================================================
CREATE TABLE form_custom_validators (
    id VARCHAR(255) PRIMARY KEY,

    -- Validator info
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,

    -- Validator function/stored procedure
    validator_code TEXT NOT NULL,

    -- Validator type
    type ENUM('function', 'stored_procedure', 'regex') NOT NULL,

    -- Parameters
    parameters JSON,

    -- Status
    status ENUM('active', 'inactive') DEFAULT 'active',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,

    -- Indexes
    INDEX idx_name (name),
    INDEX idx_status (status)
);

-- ============================================================================
-- FORM FIELD OPTIONS TABLE
-- Reusable field options (dropdowns, radio, checkbox)
-- ============================================================================
CREATE TABLE form_field_options (
    id VARCHAR(255) PRIMARY KEY,

    -- Option set info
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,

    -- Options
    options JSON NOT NULL,

    -- Usage tracking
    usage_count INT DEFAULT 0,

    -- Status
    status ENUM('active', 'inactive') DEFAULT 'active',

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- ============================================================================
-- FORM AUDIT LOG TABLE
-- Audit trail for all form operations
-- ============================================================================
CREATE TABLE form_audit_log (
    id VARCHAR(255) PRIMARY KEY,

    -- Entity info
    entity_type ENUM('template', 'instance', 'comment', 'approval') NOT NULL,
    entity_id VARCHAR(255) NOT NULL,

    -- Action
    action ENUM('create', 'read', 'update', 'delete', 'submit', 'approve', 'reject') NOT NULL,

    -- User info
    user_id VARCHAR(100) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(100),

    -- Changes (for update actions)
    old_value JSON,
    new_value JSON,

    -- IP and device info
    ip_address VARCHAR(50),
    user_agent TEXT,

    -- Timestamp
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Indexes
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_user (user_id),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
);

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active templates by specialty
CREATE VIEW active_templates_by_specialty AS
SELECT
    specialty,
    COUNT(*) as template_count,
    GROUP_CONCAT(id) as template_ids
FROM form_templates
WHERE status = 'active'
GROUP BY specialty;

-- Form instances by status
CREATE VIEW form_instances_by_status AS
SELECT
    template_id,
    status,
    COUNT(*) as count,
    MIN(filled_at) as earliest,
    MAX(filled_at) as latest
FROM form_instances
GROUP BY template_id, status;

-- Recent form activity
CREATE VIEW recent_form_activity AS
SELECT
    ft.id as template_id,
    ft.name as template_name,
    fi.id as instance_id,
    fi.status,
    fi.filled_at,
    fi.filled_by
FROM form_instances fi
JOIN form_templates ft ON fi.template_id = ft.id
ORDER BY fi.filled_at DESC
LIMIT 100;

-- ============================================================================
-- TRIGGERS FOR DATA INTEGRITY
-- ============================================================================

-- Trigger to update template version history
DELIMITER //
CREATE TRIGGER after_template_update
AFTER UPDATE ON form_templates
FOR EACH ROW
BEGIN
    IF OLD.version != NEW.version THEN
        INSERT INTO form_template_versions (
            id,
            template_id,
            version,
            template_snapshot,
            created_by
        )
        VALUES (
            UUID(),
            NEW.id,
            OLD.version,
            JSON_OBJECT(
                'name', OLD.name,
                'specialty', OLD.specialty,
                'template_schema', OLD.template_schema,
                'settings', OLD.settings,
                'status', OLD.status
            ),
            NEW.updated_by
        );
    END IF;
END//
DELIMITER ;

-- Trigger to log form instance creation
DELIMITER //
CREATE TRIGGER after_instance_create
AFTER INSERT ON form_instances
FOR EACH ROW
BEGIN
    INSERT INTO form_audit_log (
        id,
        entity_type,
        entity_id,
        action,
        user_id,
        user_name,
        new_value,
        timestamp
    )
    VALUES (
        UUID(),
        'instance',
        NEW.id,
        'create',
        NEW.filled_by,
        NEW.filled_by,
        JSON_OBJECT(
            'template_id', NEW.template_id,
            'status', NEW.status,
            'form_data', NEW.form_data
        ),
        NOW()
    );
END//
DELIMITER ;

-- ============================================================================
-- STORED PROCEDURES
-- ============================================================================

-- Get form template with latest version
DELIMITER //
CREATE PROCEDURE get_latest_template(
    IN p_template_id VARCHAR(255)
)
BEGIN
    SELECT * FROM form_templates
    WHERE id = p_template_id
    AND status = 'active'
    ORDER BY version DESC
    LIMIT 1;
END//
DELIMITER ;

-- Get form instance with full details
DELIMITER //
CREATE PROCEDURE get_form_instance_details(
    IN p_instance_id VARCHAR(255)
)
BEGIN
    SELECT
        fi.*,
        ft.name as template_name,
        ft.specialty,
        ft.export_config
    FROM form_instances fi
    JOIN form_templates ft ON fi.template_id = ft.id
    WHERE fi.id = p_instance_id;
END//
DELIMITER ;

-- Submit form for approval
DELIMITER //
CREATE PROCEDURE submit_form_for_approval(
    IN p_instance_id VARCHAR(255),
    IN p_submitted_by VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    UPDATE form_instances
    SET status = 'submitted',
        submitted_at = NOW()
    WHERE id = p_instance_id
    AND status = 'completed';

    INSERT INTO form_audit_log (
        id,
        entity_type,
        entity_id,
        action,
        user_id,
        user_name,
        new_value,
        timestamp
    )
    VALUES (
        UUID(),
        'instance',
        p_instance_id,
        'submit',
        p_submitted_by,
        p_submitted_by,
        JSON_OBJECT('status', 'submitted'),
        NOW()
    );

    COMMIT;
END//
DELIMITER ;

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample field options
INSERT INTO form_field_options (id, name, category, options) VALUES
('opt-asa-class', 'ASA Classification', 'anesthesia', JSON_ARRAY(
    JSON_OBJECT('value', 'asa1', 'label', 'ASA I: Healthy'),
    JSON_OBJECT('value', 'asa2', 'label', 'ASA II: Mild systemic disease'),
    JSON_OBJECT('value', 'asa3', 'label', 'ASA III: Severe systemic disease'),
    JSON_OBJECT('value', 'asa4', 'label', 'ASA IV: Life-threatening'),
    JSON_OBJECT('value', 'asa5', 'label', 'ASA V: Moribund'),
    JSON_OBJECT('value', 'asa6', 'label', 'ASA VI: Brain dead')
)),
('opt-yes-no', 'Yes/No', 'general', JSON_ARRAY(
    JSON_OBJECT('value', 'yes', 'label', 'Có'),
    JSON_OBJECT('value', 'no', 'label', 'Không')
)),
('opt-gender', 'Gender', 'demographics', JSON_ARRAY(
    JSON_OBJECT('value', 'male', 'label', 'Nam'),
    JSON_OBJECT('value', 'female', 'label', 'Nữ'),
    JSON_OBJECT('value', 'other', 'label', 'Khác')
)),
('opt-vital-signs-units', 'Vital Signs Units', 'clinical', JSON_ARRAY(
    JSON_OBJECT('value', 'celsius', 'label', '°C'),
    JSON_OBJECT('value', 'mmhg', 'label', 'mmHg'),
    JSON_OBJECT('value', 'bpm', 'label', 'lần/phút'),
    JSON_OBJECT('value', 'percent', 'label', '%'),
    JSON_OBJECT('value', 'kg', 'label', 'kg'),
    JSON_OBJECT('value', 'cm', 'label', 'cm')
));

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Full-text search on form names
ALTER TABLE form_templates ADD FULLTEXT INDEX ft_search (name, description);

-- JSON path indexes for common queries (MySQL 8.0+)
CREATE INDEX idx_template_specialty ON form_templates((CAST(template_schema->'$.specialty' AS CHAR(50))));
CREATE INDEX idx_form_data_patient ON form_instances((CAST(form_data->'$.patientCode' AS CHAR(100))));

-- ============================================================================
-- SECURITY POLICIES (Row-Level Security - PostgreSQL)
-- ============================================================================

-- Enable RLS
-- ALTER TABLE form_instances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see forms from their department
-- CREATE POLICY department_isolation ON form_instances
--     USING (department_id = current_setting('app.current_department'));

-- Policy: Doctors can update forms but nurses can only read
-- CREATE POLICY role_based_access ON form_instances
--     FOR UPDATE
--     USING (jsonb_exists(metadata, 'role') AND metadata->>'role' = 'doctor');

-- ============================================================================
-- MAINTENANCE QUERIES
-- ============================================================================

-- Archive old draft instances (older than 30 days)
-- DELETE FROM form_instances
-- WHERE status = 'draft'
-- AND filled_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- Cleanup old audit logs (older than 1 year)
-- DELETE FROM form_audit_log
-- WHERE timestamp < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- Update template usage statistics
-- UPDATE form_templates ft
-- SET metadata = JSON_SET(
--     COALESCE(metadata, '{}'),
--     '$.usage_count',
--     (SELECT COUNT(*) FROM form_instances WHERE template_id = ft.id)
-- );
