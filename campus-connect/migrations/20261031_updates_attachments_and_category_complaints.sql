-- Campus Connect additive migration.
-- This migration is intentionally independent of the existing general `complaints` table.
-- Run this against the exact database configured in .env.

DELIMITER $$
DROP PROCEDURE IF EXISTS migrate_updates_and_category_complaints$$
CREATE PROCEDURE migrate_updates_and_category_complaints()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'updates' AND COLUMN_NAME = 'attachment_url'
    ) THEN
        ALTER TABLE updates ADD COLUMN attachment_url TEXT NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'updates' AND COLUMN_NAME = 'attachment_name'
    ) THEN
        ALTER TABLE updates ADD COLUMN attachment_name VARCHAR(255) NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'updates' AND COLUMN_NAME = 'attachment_mime'
    ) THEN
        ALTER TABLE updates ADD COLUMN attachment_mime VARCHAR(150) NULL;
    END IF;
END$$
DELIMITER ;

CALL migrate_updates_and_category_complaints();
DROP PROCEDURE migrate_updates_and_category_complaints;

CREATE TABLE IF NOT EXISTS organization_page_complaints (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    reference_id VARCHAR(32) NOT NULL UNIQUE,
    organization_id INT NOT NULL,
    student_name VARCHAR(160) NOT NULL,
    roll_number VARCHAR(80) NOT NULL,
    email VARCHAR(255) NULL,
    phone VARCHAR(40) NULL,
    branch VARCHAR(100) NULL,
    year VARCHAR(40) NULL,
    semester VARCHAR(40) NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_org_page_complaints_org_created (organization_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verification. No statement above modifies the general `complaints` table.
SHOW COLUMNS FROM updates LIKE 'attachment_%';
SHOW TABLES LIKE 'organization_page_complaints';
SHOW COLUMNS FROM organization_page_complaints;
