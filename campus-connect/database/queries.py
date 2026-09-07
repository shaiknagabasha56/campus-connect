
from database.db import get_db_connection

# CHECK WHETHER EMAIL ALREADY EXISTS
# CHECK WHETHER USER EXISTS BY EMAIL
def get_user_by_email(email):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT
                id,
                username,
                phone,
                email,
                password_hash,
                profile_picture,
                role,
                organization_id,
                is_verified,
                auth_provider,
                google_id
            FROM users
            WHERE email = %s
        """
        cursor.execute(query, (email,))
        user = cursor.fetchone()
        return user
    finally:
        cursor.close()
        connection.close()

# CREATE NEW USER
def create_user(username, phone, email, password_hash):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO users (
                username,
                phone,
                email,
                password_hash,
                role,
                organization_id,
                is_verified,
                auth_provider
            )
            VALUES (
                %s,
                %s,
                %s,
                %s,
                'user',
                NULL,
                FALSE,
                'local'
            )
        """
        cursor.execute(
            query,
            (
                username,
                phone,
                email,
                password_hash
            )
        )

        # Save the changes permanently
        connection.commit()
        return True
    except Exception as error:
        # Undo changes if something fails
        connection.rollback()
        print("Database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


# MARK USER EMAIL AS VERIFIED
def mark_user_as_verified(email):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        # Update the user's verification status
        query = """
            UPDATE users
            SET is_verified = TRUE
            WHERE email = %s
        """
        cursor.execute(query, (email,))
        connection.commit()
        # Check whether a user was actually updated
        if cursor.rowcount == 0:
            return False
        return True
    except Exception as error:
        # Undo changes if something fails
        connection.rollback()
        print("Database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()

# ==========================================
# GET ORGANIZATION BY SLUG
# ==========================================
def get_organization_by_slug(slug):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, name, slug
            FROM organizations
            WHERE slug = %s
        """
        cursor.execute(query, (slug,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()
#------------------------
#GET ORGANIZATION BY ID
#------------------------
def get_organization_by_id(organization_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT id, name, slug, category
            FROM organizations
            WHERE id = %s
        """
        cursor.execute(query, (organization_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()



# ==================================================
# UPDATE USER PASSWORD
# ==================================================
def update_user_password(email, password_hash):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        query = """
            UPDATE users
            SET password_hash = %s
            WHERE email = %s
        """
        cursor.execute(
            query,
            (
                password_hash,
                email
            )
        )
        connection.commit()
        return cursor.rowcount > 0
    except Exception as error:
        connection.rollback()
        print("Database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()

#Get user by Google ID:-
def get_user_by_google_id(google_id):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                username,
                email,
                profile_picture,
                role,
                organization_id,
                is_verified,
                auth_provider,
                google_id
            FROM users
            WHERE google_id = %s
        """

        cursor.execute(query, (google_id,))
        return cursor.fetchone()

    finally:
        cursor.close()
        connection.close()

#Create Google user:-
def create_google_user(
    username,
    email,
    profile_picture,
    google_id
):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            INSERT INTO users (
                username,
                phone,
                email,
                password_hash,
                profile_picture,
                role,
                organization_id,
                is_verified,
                auth_provider,
                google_id
            )
            VALUES (
                %s,
                NULL,
                %s,
                NULL,
                %s,
                'user',
                NULL,
                TRUE,
                'google',
                %s
            )
        """

        cursor.execute(
            query,
            (
                username,
                email,
                profile_picture,
                google_id
            )
        )

        connection.commit()

        return cursor.lastrowid

    except Exception as error:

        connection.rollback()
        print("Google user creation error:", error)

        return None

    finally:
        cursor.close()
        connection.close()


# ==================================================
# UPDATES MODULE
# ==================================================

# --------------------------------------------------
# CREATE UPDATE
# --------------------------------------------------
def create_update(
    organization_id,
    created_by,
    cover_image,
    category_tag,
    title,
    description,
    post_date,
    post_time=None,
    event_date=None,
    deadline=None,
    contact_email=None,
    enable_application=False,
    application_url=None,
    status="published"
):
    connection = get_db_connection()

    if not connection:
        return None

    cursor = connection.cursor()

    try:
        query = """
            INSERT INTO updates (
                organization_id,
                created_by,
                cover_image,
                category_tag,
                title,
                description,
                post_date,
                post_time,
                event_date,
                deadline,
                contact_email,
                enable_application,
                application_url,
                status
            )
            VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s
            )
        """

        cursor.execute(
            query,
            (
                organization_id,
                created_by,
                cover_image,
                category_tag,
                title,
                description,
                post_date,
                post_time,
                event_date,
                deadline,
                contact_email,
                enable_application,
                application_url,
                status
            )
        )

        connection.commit()

        return cursor.lastrowid

    except Exception as error:
        connection.rollback()
        print("Create update database error:", error)
        return None

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# GET ALL UPDATES FOR ONE ORGANIZATION
# --------------------------------------------------
def get_updates_by_organization(organization_id):
    connection = get_db_connection()

    if not connection:
        return []

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                organization_id,
                created_by,
                cover_image,
                category_tag,
                title,
                description,
                post_date,
                post_time,
                event_date,
                deadline,
                contact_email,
                enable_application,
                application_url,
                status,
                created_at,
                updated_at
            FROM updates
            WHERE organization_id = %s
            ORDER BY created_at DESC
        """

        cursor.execute(
            query,
            (organization_id,)
        )

        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# GET PUBLISHED UPDATES FOR ONE ORGANIZATION
# Used by normal user-facing organization pages
# --------------------------------------------------

def get_published_updates_by_organization(
    organization_id
):

    connection = get_db_connection()

    if not connection:
        return []

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        query = """
            SELECT
                id,
                organization_id,
                cover_image,
                category_tag,
                title,
                description,
                post_date,
                post_time,
                event_date,
                deadline,
                contact_email,
                enable_application,
                application_url,
                status,
                created_at,
                updated_at
            FROM updates
            WHERE organization_id = %s
            AND status = 'published'
            ORDER BY created_at DESC
        """

        cursor.execute(
            query,
            (organization_id,)
        )

        return cursor.fetchall()

    finally:

        cursor.close()
        connection.close()

# --------------------------------------------------
# GET ONE UPDATE
# Only returns the update if it belongs to the
# given organization.
# --------------------------------------------------
def get_update_by_id(
    update_id,
    organization_id
):
    connection = get_db_connection()

    if not connection:
        return None

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                organization_id,
                created_by,
                cover_image,
                category_tag,
                title,
                description,
                post_date,
                post_time,
                event_date,
                deadline,
                contact_email,
                enable_application,
                application_url,
                status,
                created_at,
                updated_at
            FROM updates
            WHERE id = %s
            AND organization_id = %s
            LIMIT 1
        """

        cursor.execute(
            query,
            (
                update_id,
                organization_id
            )
        )

        return cursor.fetchone()

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# UPDATE EXISTING UPDATE
# --------------------------------------------------
def update_update(
    update_id,
    organization_id,
    cover_image,
    category_tag,
    title,
    description,
    post_date,
    post_time=None,
    event_date=None,
    deadline=None,
    contact_email=None,
    enable_application=False,
    application_url=None,
    status="published"
):
    connection = get_db_connection()

    if not connection:
        return False

    cursor = connection.cursor()

    try:
        query = """
            UPDATE updates
            SET
                cover_image = %s,
                category_tag = %s,
                title = %s,
                description = %s,
                post_date = %s,
                post_time = %s,
                event_date = %s,
                deadline = %s,
                contact_email = %s,
                enable_application = %s,
                application_url = %s,
                status = %s
            WHERE id = %s
            AND organization_id = %s
        """

        cursor.execute(
            query,
            (
                cover_image,
                category_tag,
                title,
                description,
                post_date,
                post_time,
                event_date,
                deadline,
                contact_email,
                enable_application,
                application_url,
                status,
                update_id,
                organization_id
            )
        )

        connection.commit()

        return cursor.rowcount > 0

    except Exception as error:
        connection.rollback()
        print("Update database error:", error)
        return False

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# DELETE UPDATE
# Only deletes if it belongs to the organization.
# --------------------------------------------------
def delete_update(
    update_id,
    organization_id
):
    connection = get_db_connection()

    if not connection:
        return False

    cursor = connection.cursor()

    try:
        query = """
            DELETE FROM updates
            WHERE id = %s
            AND organization_id = %s
        """

        cursor.execute(
            query,
            (
                update_id,
                organization_id
            )
        )

        connection.commit()

        return cursor.rowcount > 0

    except Exception as error:
        connection.rollback()
        print("Delete update database error:", error)
        return False

    finally:
        cursor.close()
        connection.close()

# ==================================================
# GET PUBLISHED UPDATES FOR PUBLIC ORGANIZATION PAGE
# ==================================================

def get_published_updates_by_organization(
    organization_id
):

    connection = get_db_connection()

    if not connection:
        return []

    cursor = connection.cursor(
        dictionary=True
    )

    try:

        query = """
            SELECT
                id,
                organization_id,
                cover_image,
                category_tag,
                title,
                description,
                post_date,
                post_time,
                event_date,
                deadline,
                contact_email,
                enable_application,
                application_url,
                created_at
            FROM updates
            WHERE organization_id = %s
            AND status = 'published'
            ORDER BY created_at DESC
        """

        cursor.execute(
            query,
            (organization_id,)
        )

        return cursor.fetchall()

    finally:

        cursor.close()
        connection.close()


# ==================================================
# USER PROFILE & SUPER ADMIN QUERIES
# ==================================================

def get_user_by_id(user_id):
    connection = get_db_connection()
    if not connection:
        return None
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, username, phone, email, password_hash, profile_picture,
                   role, organization_id, is_verified, auth_provider, google_id, created_at
            FROM users
            WHERE id = %s
        """
        cursor.execute(query, (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()


def update_user_profile(user_id, username, phone, profile_picture=None):
    connection = get_db_connection()
    if not connection:
        return False
    cursor = connection.cursor()
    try:
        if profile_picture:
            query = """
                UPDATE users
                SET username = %s, phone = %s, profile_picture = %s
                WHERE id = %s
            """
            cursor.execute(query, (username, phone, profile_picture, user_id))
        else:
            query = """
                UPDATE users
                SET username = %s, phone = %s
                WHERE id = %s
            """
            cursor.execute(query, (username, phone, user_id))
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print("Update user profile error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


def update_user_password_by_id(user_id, password_hash):
    connection = get_db_connection()
    if not connection:
        return False
    cursor = connection.cursor()
    try:
        query = "UPDATE users SET password_hash = %s WHERE id = %s"
        cursor.execute(query, (password_hash, user_id))
        connection.commit()
        return cursor.rowcount > 0
    except Exception as error:
        connection.rollback()
        print("Update password by ID error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


def get_all_users():
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT u.id, u.username, u.phone, u.email, u.role, u.is_verified,
                   u.organization_id, o.name AS organization_name, u.created_at
            FROM users u
            LEFT JOIN organizations o ON u.organization_id = o.id
            ORDER BY u.created_at DESC
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def update_user_role_and_org(user_id, role, organization_id=None):
    connection = get_db_connection()
    if not connection:
        return False
    cursor = connection.cursor()
    try:
        query = "UPDATE users SET role = %s, organization_id = %s WHERE id = %s"
        cursor.execute(query, (role, organization_id, user_id))
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print("Update user role/org error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


def get_all_organizations():
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = "SELECT id, name, slug, category, created_at FROM organizations ORDER BY category, name"
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


# ==================================================
# COMPLAINTS MODULE QUERIES
# ==================================================

def create_complaint(
    reference_id,
    user_id,
    name,
    roll_number,
    phone,
    category,
    organization_id,
    priority,
    title,
    description,
    attachments_json="[]",
    is_anonymous=False
):
    connection = get_db_connection()
    if not connection:
        return None
    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO complaints (
                reference_id, user_id, name, roll_number, phone,
                category, organization_id, priority, title, description,
                attachments, is_anonymous, status
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, 'new'
            )
        """
        cursor.execute(query, (
            reference_id, user_id, name, roll_number, phone,
            category, organization_id, priority, title, description,
            attachments_json, is_anonymous
        ))
        connection.commit()
        return cursor.lastrowid
    except Exception as error:
        connection.rollback()
        print("Create complaint error:", error)
        return None
    finally:
        cursor.close()
        connection.close()


def get_complaints_by_user(user_id):
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, reference_id, user_id, name, roll_number, phone, category,
                   organization_id, priority, title, description, attachments,
                   is_anonymous, status, admin_reply, created_at, updated_at
            FROM complaints
            WHERE user_id = %s
            ORDER BY created_at DESC
        """
        cursor.execute(query, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def get_complaints_by_organization(organization_id):
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, reference_id, user_id, name, roll_number, phone, category,
                   organization_id, priority, title, description, attachments,
                   is_anonymous, status, admin_reply, created_at, updated_at
            FROM complaints
            WHERE organization_id = %s OR organization_id IS NULL
            ORDER BY created_at DESC
        """
        cursor.execute(query, (organization_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def get_all_complaints():
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT c.id, c.reference_id, c.user_id, c.name, c.roll_number, c.phone, c.category,
                   c.organization_id, o.name AS organization_name, c.priority, c.title,
                   c.description, c.attachments, c.is_anonymous, c.status, c.admin_reply,
                   c.created_at, c.updated_at
            FROM complaints c
            LEFT JOIN organizations o ON c.organization_id = o.id
            ORDER BY c.created_at DESC
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def update_complaint_status(complaint_id, status, admin_reply=None, organization_id=None):
    connection = get_db_connection()
    if not connection:
        return False
    cursor = connection.cursor()
    try:
        is_numeric = str(complaint_id).isdigit()
        params = [status, admin_reply]
        where_clause = "WHERE id = %s" if is_numeric else "WHERE reference_id = %s"
        params.append(int(complaint_id) if is_numeric else str(complaint_id))

        if organization_id:
            where_clause += " AND (organization_id = %s OR organization_id IS NULL)"
            params.append(organization_id)

        query = f"""
            UPDATE complaints
            SET status = %s, admin_reply = COALESCE(%s, admin_reply)
            {where_clause}
        """
        cursor.execute(query, params)
        connection.commit()
        return cursor.rowcount > 0
    except Exception as error:
        connection.rollback()
        print("Update complaint status error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


# ==================================================
# APPLICATIONS MODULE QUERIES
# ==================================================

def create_application(
    reference_id,
    user_id,
    organization_id,
    update_id,
    applicant_name,
    roll_number,
    email,
    phone,
    branch,
    year,
    reason,
    attachments_json="[]"
):
    connection = get_db_connection()
    if not connection:
        return None
    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO applications (
                reference_id, user_id, organization_id, update_id,
                applicant_name, roll_number, email, phone, branch,
                year, reason, attachments, status
            ) VALUES (
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, 'pending'
            )
        """
        cursor.execute(query, (
            reference_id, user_id, organization_id, update_id,
            applicant_name, roll_number, email, phone, branch,
            year, reason, attachments_json
        ))
        connection.commit()
        return cursor.lastrowid
    except Exception as error:
        connection.rollback()
        print("Create application error:", error)
        return None
    finally:
        cursor.close()
        connection.close()


def get_applications_by_user(user_id):
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT a.id, a.reference_id, a.user_id, a.organization_id, o.name AS organization_name,
                   a.update_id, u.title AS update_title, a.applicant_name, a.roll_number,
                   a.email, a.phone, a.branch, a.year, a.reason, a.attachments,
                   a.status, a.admin_notes, a.created_at, a.updated_at
            FROM applications a
            LEFT JOIN organizations o ON a.organization_id = o.id
            LEFT JOIN updates u ON a.update_id = u.id
            WHERE a.user_id = %s
            ORDER BY a.created_at DESC
        """
        cursor.execute(query, (user_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def get_applications_by_organization(organization_id):
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT a.id, a.reference_id, a.user_id, a.organization_id, o.name AS organization_name,
                   a.update_id, u.title AS update_title, a.applicant_name, a.roll_number,
                   a.email, a.phone, a.branch, a.year, a.reason, a.attachments,
                   a.status, a.admin_notes, a.created_at, a.updated_at
            FROM applications a
            LEFT JOIN organizations o ON a.organization_id = o.id
            LEFT JOIN updates u ON a.update_id = u.id
            WHERE a.organization_id = %s
            ORDER BY a.created_at DESC
        """
        cursor.execute(query, (organization_id,))
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def get_all_applications():
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT a.id, a.reference_id, a.user_id, a.organization_id, o.name AS organization_name,
                   a.update_id, u.title AS update_title, a.applicant_name, a.roll_number,
                   a.email, a.phone, a.branch, a.year, a.reason, a.attachments,
                   a.status, a.admin_notes, a.created_at, a.updated_at
            FROM applications a
            LEFT JOIN organizations o ON a.organization_id = o.id
            LEFT JOIN updates u ON a.update_id = u.id
            ORDER BY a.created_at DESC
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def update_application_status(application_id, status, admin_notes=None, organization_id=None):
    connection = get_db_connection()
    if not connection:
        return False
    cursor = connection.cursor()
    try:
        is_numeric = str(application_id).isdigit()
        params = [status, admin_notes]
        where_clause = "WHERE id = %s" if is_numeric else "WHERE reference_id = %s"
        params.append(int(application_id) if is_numeric else str(application_id))

        if organization_id:
            where_clause += " AND organization_id = %s"
            params.append(organization_id)

        query = f"""
            UPDATE applications
            SET status = %s, admin_notes = COALESCE(%s, admin_notes)
            {where_clause}
        """
        cursor.execute(query, params)
        connection.commit()
        return cursor.rowcount > 0
    except Exception as error:
        connection.rollback()
        print("Update application status error:", error)
        return False
    finally:
        cursor.close()
        connection.close()



# ==================================================
# EMERGENCY NOTICES MODULE QUERIES
# ==================================================

def get_active_emergency_notices():
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, title, details, category, priority, is_active, created_at
            FROM emergency_notices
            WHERE is_active = 1
            ORDER BY created_at DESC
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def get_all_emergency_notices():
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT id, title, details, category, priority, is_active, created_at
            FROM emergency_notices
            ORDER BY created_at DESC
        """
        cursor.execute(query)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def create_emergency_notice(title, details, category="Emergency", priority="High", created_by=None):

    connection = get_db_connection()
    if not connection:
        return None
    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO emergency_notices (title, details, category, priority, is_active, created_by)
            VALUES (%s, %s, %s, %s, 1, %s)
        """
        cursor.execute(query, (title, details, category, priority, created_by))
        connection.commit()
        return cursor.lastrowid
    except Exception as error:
        connection.rollback()
        print("Create emergency notice error:", error)
        return None
    finally:
        cursor.close()
        connection.close()

# ==========================================
# ADMIN REQUESTS
# ==========================================

def create_admin_request(user_id, organization_id):
    connection = get_db_connection()
    if connection is None:
        return None
    try:
        cursor = connection.cursor(dictionary=True)

        # Don't allow duplicate pending requests from the same user
        cursor.execute(
            "SELECT id FROM admin_requests WHERE user_id = %s AND status = 'pending'",
            (user_id,)
        )
        if cursor.fetchone():
            return "duplicate"

        cursor.execute(
            """
            INSERT INTO admin_requests (user_id, organization_id, status)
            VALUES (%s, %s, 'pending')
            """,
            (user_id, organization_id)
        )
        connection.commit()
        return cursor.lastrowid
    finally:
        connection.close()


def get_pending_admin_requests():
    connection = get_db_connection()
    if connection is None:
        return []
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT ar.id, ar.status, ar.requested_at,
                   u.id AS user_id, u.username, u.email,
                   o.id AS organization_id, o.name AS organization_name
            FROM admin_requests ar
            JOIN users u ON ar.user_id = u.id
            JOIN organizations o ON ar.organization_id = o.id
            WHERE ar.status = 'pending'
            ORDER BY ar.requested_at ASC
            """
        )
        return cursor.fetchall()
    finally:
        connection.close()

def get_all_organizations_list():
    connection = get_db_connection()
    if connection is None:
        return []
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT id, name, slug FROM organizations ORDER BY name ASC")
        return cursor.fetchall()
    finally:
        connection.close()