-- Club submission persistence
-- Existing complaints remain valid because organization_id is nullable.
ALTER TABLE complaints
    ADD COLUMN organization_id INT NULL AFTER id,
    ADD INDEX idx_complaints_organization_id (organization_id),
    ADD CONSTRAINT fk_complaints_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
        ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS club_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    update_id INT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    roll VARCHAR(80) NULL,
    branch VARCHAR(80) NULL,
    year VARCHAR(40) NULL,
    semester VARCHAR(40) NULL,
    phone VARCHAR(40) NULL,
    reason TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_applications_organization_id (organization_id),
    INDEX idx_applications_update_id (update_id),
    CONSTRAINT fk_applications_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    organization_id INT NOT NULL,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    roll VARCHAR(80) NULL,
    branch VARCHAR(80) NULL,
    year VARCHAR(40) NULL,
    semester VARCHAR(40) NULL,
    phone VARCHAR(40) NULL,
    reason TEXT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_members_organization_id (organization_id),
    CONSTRAINT fk_members_organization
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
        ON DELETE CASCADE
);
