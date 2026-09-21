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
# COMPLAINTS
# ==================================================

# --------------------------------------------------
# CREATE COMPLAINT
# --------------------------------------------------
def create_complaint(
    reference_id,
    title,
    category,
    priority,
    description,
    anonymous,
    name,
    roll,
    phone,
    attachments
):
    connection = get_db_connection()

    if not connection:
        return None

    cursor = connection.cursor()

    try:
        query = """
            INSERT INTO complaints (
                reference_id,
                title,
                category,
                priority,
                status,
                description,
                anonymous,
                name,
                roll,
                phone,
                attachments
            )
            VALUES (
                %s, %s, %s, %s, 'pending',
                %s, %s, %s, %s, %s, %s
            )
        """

        cursor.execute(
            query,
            (
                reference_id,
                title,
                category,
                priority,
                description,
                anonymous,
                name,
                roll,
                phone,
                attachments
            )
        )

        connection.commit()

        return cursor.lastrowid

    except Exception as error:
        connection.rollback()
        print("Create complaint database error:", error)
        return None

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# GET ALL COMPLAINTS
# --------------------------------------------------
def get_all_complaints():
    connection = get_db_connection()

    if not connection:
        return []

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                reference_id,
                title,
                category,
                priority,
                status,
                description,
                anonymous,
                name,
                roll,
                phone,
                attachments,
                created_at
            FROM complaints
            ORDER BY created_at DESC
        """

        cursor.execute(query)
        return cursor.fetchall()

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# GET COMPLAINT BY REFERENCE ID
# --------------------------------------------------
def get_complaint_by_reference(reference_id):
    connection = get_db_connection()

    if not connection:
        return None

    cursor = connection.cursor(dictionary=True)

    try:
        query = """
            SELECT
                id,
                reference_id,
                title,
                category,
                priority,
                status,
                description,
                anonymous,
                name,
                roll,
                phone,
                attachments,
                created_at
            FROM complaints
            WHERE reference_id = %s
        """

        cursor.execute(query, (reference_id,))
        return cursor.fetchone()

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# UPDATE COMPLAINT STATUS
# --------------------------------------------------
def update_complaint_status(reference_id, status):
    connection = get_db_connection()

    if not connection:
        return False

    cursor = connection.cursor()

    try:
        query = """
            UPDATE complaints
            SET status = %s
            WHERE reference_id = %s
        """

        cursor.execute(query, (status, reference_id))
        connection.commit()

        return cursor.rowcount > 0

    except Exception as error:
        connection.rollback()
        print("Update complaint status database error:", error)
        return False

    finally:
        cursor.close()
        connection.close()


# ==================================================
# ORGANIZATION PROFILE (BASIC INFO + CONTACT + LEADERS)
# ==================================================

# --------------------------------------------------
# GET FULL ORGANIZATION PROFILE
# Combines organization_basic_info, organization_contact_info
# and organization_leaders into one dict for a club/cell page.
# --------------------------------------------------
def get_organization_profile(organization_id):
    connection = get_db_connection()

    if not connection:
        return None

    cursor = connection.cursor(dictionary=True)

    try:
        profile = {}

        # ----------------------------------------------
        # BASIC INFO (logo, title, description)
        # ----------------------------------------------
        cursor.execute(
            """
                SELECT logo, title, description
                FROM organization_basic_info
                WHERE organization_id = %s
            """,
            (organization_id,)
        )
        basic_info = cursor.fetchone()

        if basic_info:
            profile.update(basic_info)

        # ----------------------------------------------
        # CONTACT INFO (email, phone, socials, etc.)
        # ----------------------------------------------
        cursor.execute(
            """
                SELECT
                    email,
                    phone,
                    location,
                    website,
                    instagram,
                    linkedin,
                    youtube
                FROM organization_contact_info
                WHERE organization_id = %s
            """,
            (organization_id,)
        )
        contact_info = cursor.fetchone()

        if contact_info:
            profile.update(contact_info)

        # ----------------------------------------------
        # LEADERS (ordered by display_order)
        # ----------------------------------------------
        cursor.execute(
            """
                SELECT
                    id,
                    name,
                    position,
                    profile_picture,
                    email,
                    phone,
                    display_order
                FROM organization_leaders
                WHERE organization_id = %s
                ORDER BY display_order ASC
            """,
            (organization_id,)
        )
        profile["leaders"] = cursor.fetchall()

        return profile

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# CREATE OR UPDATE AN ORGANIZATION'S BASIC + CONTACT INFO
# data may contain any of: logo, title, description,
# email, phone, location, website, instagram, linkedin, youtube
# --------------------------------------------------
def upsert_organization_profile(organization_id, data):
    connection = get_db_connection()

    if not connection:
        return False

    cursor = connection.cursor()

    try:
        # ----------------------------------------------
        # BASIC INFO
        # ----------------------------------------------
        cursor.execute(
            """
                INSERT INTO organization_basic_info (
                    organization_id, logo, title, description
                )
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    logo = VALUES(logo),
                    title = VALUES(title),
                    description = VALUES(description)
            """,
            (
                organization_id,
                data.get("logo"),
                data.get("title"),
                data.get("description")
            )
        )

        # ----------------------------------------------
        # CONTACT INFO
        # ----------------------------------------------
        cursor.execute(
            """
                INSERT INTO organization_contact_info (
                    organization_id, email, phone, location,
                    website, instagram, linkedin, youtube
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    email = VALUES(email),
                    phone = VALUES(phone),
                    location = VALUES(location),
                    website = VALUES(website),
                    instagram = VALUES(instagram),
                    linkedin = VALUES(linkedin),
                    youtube = VALUES(youtube)
            """,
            (
                organization_id,
                data.get("email"),
                data.get("phone"),
                data.get("location"),
                data.get("website"),
                data.get("instagram"),
                data.get("linkedin"),
                data.get("youtube")
            )
        )

        connection.commit()
        return True

    except Exception as error:
        connection.rollback()
        print("Upsert organization profile database error:", error)
        return False

    finally:
        cursor.close()
        connection.close()


# --------------------------------------------------
# CREATE OR UPDATE ONE LEADER AT A GIVEN DISPLAY ORDER
# data may contain: name, position, profile_picture, email, phone
# --------------------------------------------------
def upsert_organization_leader(organization_id, display_order, data):
    connection = get_db_connection()

    if not connection:
        return False

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
                SELECT id
                FROM organization_leaders
                WHERE organization_id = %s AND display_order = %s
            """,
            (organization_id, display_order)
        )
        existing = cursor.fetchone()

        if existing:
            cursor.execute(
                """
                    UPDATE organization_leaders
                    SET
                        name = %s,
                        position = %s,
                        profile_picture = %s,
                        email = %s,
                        phone = %s
                    WHERE id = %s
                """,
                (
                    data.get("name"),
                    data.get("position"),
                    data.get("profile_picture"),
                    data.get("email"),
                    data.get("phone"),
                    existing["id"]
                )
            )
        else:
            cursor.execute(
                """
                    INSERT INTO organization_leaders (
                        organization_id, name, position,
                        profile_picture, email, phone, display_order
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    organization_id,
                    data.get("name"),
                    data.get("position"),
                    data.get("profile_picture"),
                    data.get("email"),
                    data.get("phone"),
                    display_order
                )
            )

        connection.commit()
        return True

    except Exception as error:
        connection.rollback()
        print("Upsert organization leader database error:", error)
        return False

    finally:
        cursor.close()
        connection.close()