-- Run this migration once against the Campus Connect MySQL database.
CREATE TABLE IF NOT EXISTS emergencies (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(40) NOT NULL,
    priority ENUM('critical', 'warning', 'info') NOT NULL DEFAULT 'info',
    is_important BOOLEAN NOT NULL DEFAULT FALSE,
    status ENUM('pending', 'approved') NOT NULL DEFAULT 'pending',
    created_by BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_emergencies_status_created (status, created_at),
    INDEX idx_emergencies_created_by (created_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
