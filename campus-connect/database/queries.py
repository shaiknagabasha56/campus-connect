
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