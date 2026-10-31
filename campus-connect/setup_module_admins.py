#!/usr/bin/env python3
"""
Create/update the dedicated Campus Connect Radio Admin and Emergency Admin.

Run from the Campus Connect project root:
    python3 setup_module_admins.py

Passwords are entered interactively and are NOT stored in this script.
"""

import getpass
import sys
from werkzeug.security import generate_password_hash
from database.db import get_db_connection

ACCOUNTS = [
    ("Radio Admin", "radio-admin@gmail.com", "radio_admin"),
    ("Emergency Admin", "emergency-admin@gmail.com", "emergency_admin"),
]


def ensure_role_enum(cursor):
    cursor.execute("""
        SELECT COLUMN_TYPE
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'role'
    """)
    row = cursor.fetchone()
    column_type = row[0] if row else ""

    if "radio_admin" in column_type and "emergency_admin" in column_type:
        return

    cursor.execute("""
        ALTER TABLE users
        MODIFY COLUMN role ENUM(
            'user',
            'admin',
            'radio_admin',
            'emergency_admin'
        ) NOT NULL DEFAULT 'user'
    """)


def upsert_account(cursor, username, email, role, password_hash):
    cursor.execute(
        "SELECT id FROM users WHERE email = %s LIMIT 1",
        (email,),
    )
    existing = cursor.fetchone()

    if existing:
        cursor.execute(
            """
            UPDATE users
            SET username = %s,
                password_hash = %s,
                role = %s,
                is_verified = 1,
                auth_provider = 'local'
            WHERE id = %s
            """,
            (username, password_hash, role, existing[0]),
        )
        return "updated"

    cursor.execute(
        """
        INSERT INTO users (
            username, phone, email, password_hash, role,
            organization_id, is_verified, auth_provider
        )
        VALUES (%s, NULL, %s, %s, %s, NULL, 1, 'local')
        """,
        (username, email, password_hash, role),
    )
    return "created"


def main():
    connection = get_db_connection()
    if not connection:
        print("Database connection unavailable.")
        sys.exit(1)

    cursor = connection.cursor()

    try:
        ensure_role_enum(cursor)

        for username, email, role in ACCOUNTS:
            print(f"\n{username}: {email}")
            password = getpass.getpass("Set password (min 8 chars): ")
            confirm = getpass.getpass("Confirm password: ")

            if len(password) < 8:
                raise ValueError("Password must contain at least 8 characters.")
            if password != confirm:
                raise ValueError("Passwords do not match.")

            result = upsert_account(
                cursor,
                username,
                email,
                role,
                generate_password_hash(password),
            )
            print(f"Account {result}.")

        connection.commit()

    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()

    print("\nSetup complete.")
    print("Radio Admin:     radio-admin@gmail.com")
    print("Emergency Admin: emergency-admin@gmail.com")
    print("Use the passwords you entered above.")


if __name__ == "__main__":
    main()
