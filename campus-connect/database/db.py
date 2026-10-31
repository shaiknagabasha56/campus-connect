import mysql.connector
from mysql.connector import Error
from threading import Lock

from config import Config

# Run lightweight, additive schema compatibility checks once per process.
# This deliberately does not alter the existing general `complaints` table.
_SCHEMA_READY = False
_SCHEMA_ATTEMPTED = False
_SCHEMA_LOCK = Lock()


def ensure_runtime_schema(connection):
    global _SCHEMA_READY, _SCHEMA_ATTEMPTED
    if _SCHEMA_READY or _SCHEMA_ATTEMPTED:
        return
    with _SCHEMA_LOCK:
        if _SCHEMA_READY or _SCHEMA_ATTEMPTED:
            return
        cursor = connection.cursor()
        try:
            cursor.execute("SELECT DATABASE()")
            row = cursor.fetchone()
            database_name = row[0] if row else None
            if not database_name:
                raise RuntimeError("No MySQL database is selected.")

            cursor.execute("""
                SELECT COLUMN_NAME
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_SCHEMA = %s AND TABLE_NAME = 'updates'
            """, (database_name,))
            existing = {item[0] for item in cursor.fetchall()}
            required = {
                "attachment_url": "TEXT NULL",
                "attachment_name": "VARCHAR(255) NULL",
                "attachment_mime": "VARCHAR(150) NULL",
            }
            for column, definition in required.items():
                if column not in existing:
                    cursor.execute(f"ALTER TABLE updates ADD COLUMN {column} {definition}")

            # Separate inbox for the Raise a Complaint button on each category page.
            # No reads/writes are made to the existing general `complaints` table.
            cursor.execute("""
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
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """)
            connection.commit()
            _SCHEMA_READY = True
            _SCHEMA_ATTEMPTED = True
            print("Campus Connect schema check complete (updates attachments + separate category complaints).")
        except Exception as error:
            # Do not take the entire application (including login) offline if
            # the MySQL account lacks DDL privileges. The migration file can
            # be executed by a database administrator, then restart Flask.
            _SCHEMA_ATTEMPTED = True
            print("Campus Connect schema setup failed. Run the migration SQL with a DB user that has ALTER/CREATE privileges:", error)
        finally:
            cursor.close()


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )

        if connection.is_connected():
            ensure_runtime_schema(connection)
            return connection

    except Error as error:
        print(f"Database connection/schema initialization error: {error}")
        try:
            if 'connection' in locals() and connection and connection.is_connected():
                connection.close()
        except Exception:
            pass

    return None

