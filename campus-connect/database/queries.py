
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


# GET USER BY AUTHENTICATED USER ID
def get_user_by_id(user_id):
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
            WHERE id = %s
        """
        cursor.execute(query, (user_id,))
        return cursor.fetchone()
    finally:
        cursor.close()
        connection.close()

# CREATE NEW USER
def create_user(username, phone, email, password_hash):
    connection = get_db_connection()
    cursor = connection.cursor(dictionary=True)
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


# UPDATE THE AUTHENTICATED USER'S DETAILS
def update_user_profile_details(user_id, username, email):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        query = """
            UPDATE users
            SET username = %s, email = %s
            WHERE id = %s
        """
        cursor.execute(query, (username, email, user_id))
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print("Profile details database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


# UPDATE THE AUTHENTICATED USER'S PASSWORD
def update_user_password_by_id(user_id, password_hash):
    connection = get_db_connection()
    cursor = connection.cursor()
    try:
        query = """
            UPDATE users
            SET password_hash = %s
            WHERE id = %s
        """
        cursor.execute(query, (password_hash, user_id))
        connection.commit()
        return cursor.rowcount > 0
    except Exception as error:
        connection.rollback()
        print("Profile password database error:", error)
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


# ==================================================
# COMPLAINTS
# ==================================================

def get_all_complaints(organization_id=None):
    connection = get_db_connection()
    if not connection:
        return []

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT
                id,
            organization_id,
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
                created_at
            FROM complaints
            {organization_filter}
            ORDER BY created_at DESC
        """
        organization_filter = "WHERE organization_id = %s" if organization_id else ""
        query = query.format(organization_filter=organization_filter)
        cursor.execute(query, (organization_id,) if organization_id else ())
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def create_complaint(
    organization_id,
    reference_id,
    title,
    category,
    priority,
    status,
    description,
    anonymous,
    name,
    roll,
    phone
):
    connection = get_db_connection()
    if not connection:
        return False

    cursor = connection.cursor()
    try:
        query = """
            INSERT INTO complaints (
                organization_id,
                reference_id,
                title,
                category,
                priority,
                status,
                description,
                anonymous,
                name,
                roll,
                phone
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(
            query,
            (
                organization_id,
                reference_id,
                title,
                category,
                priority,
                status,
                description,
                anonymous,
                name,
                roll,
                phone
            )
        )
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print("Complaint creation database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


def update_complaint_status(reference_id, status, organization_id=None):
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
        params = [status, reference_id]
        if organization_id:
            query += " AND organization_id = %s"
            params.append(organization_id)
        cursor.execute(query, tuple(params))
        connection.commit()
        if cursor.rowcount > 0:
            return True

        check_query = "SELECT 1 FROM complaints WHERE reference_id = %s"
        check_params = [reference_id]
        if organization_id:
            check_query += " AND organization_id = %s"
            check_params.append(organization_id)
        cursor.execute(check_query + " LIMIT 1", tuple(check_params))
        return cursor.fetchone() is not None
    except Exception as error:
        connection.rollback()
        print("Complaint status database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


def create_club_member(organization_id, data):
    return _create_club_submission("club_members", organization_id, data)


def create_club_application(organization_id, data):
    return _create_club_submission("club_applications", organization_id, data)


def _create_club_submission(table, organization_id, data):
    connection = get_db_connection()
    if not connection:
        return None
    cursor = connection.cursor()
    try:
        columns = (
            "organization_id, name, email, roll, branch, year, semester, "
            "phone, reason, status"
        )
        query = f"""
            INSERT INTO {table} ({columns})
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
        """
        cursor.execute(query, (
            organization_id,
            data.get("name"),
            data.get("email"),
            data.get("roll"),
            data.get("branch"),
            data.get("year"),
            data.get("semester"),
            data.get("phone"),
            data.get("reason")
        ))
        connection.commit()
        return cursor.lastrowid
    except Exception as error:
        connection.rollback()
        print(f"{table} creation database error:", error)
        return None
    finally:
        cursor.close()
        connection.close()


def get_club_submissions(table, organization_id):
    connection = get_db_connection()
    if not connection:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            f"""
                SELECT id, organization_id, name, email, roll, branch, year,
                       semester, phone, reason, status, created_at, updated_at
                FROM {table}
                WHERE organization_id = %s
                ORDER BY created_at DESC
            """,
            (organization_id,)
        )
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def update_club_submission_status(table, submission_id, organization_id, status):
    connection = get_db_connection()
    if not connection:
        return False
    cursor = connection.cursor()
    try:
        cursor.execute(
            f"""
                UPDATE {table}
                SET status = %s
                WHERE id = %s AND organization_id = %s
            """,
            (status, submission_id, organization_id)
        )
        connection.commit()
        return cursor.rowcount > 0
    except Exception as error:
        connection.rollback()
        print(f"{table} status database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


# ==================================================
# ORGANIZATION PROFILE DATA
# ==================================================

def get_organization_profile(organization_id):
    connection = get_db_connection()
    if not connection:
        return None

    cursor = connection.cursor(dictionary=True)
    try:
        query = """
            SELECT
                o.id,
                o.name,
                o.slug,
                o.category,
                b.logo,
                b.title,
                b.description,
                c.email,
                c.phone,
                c.location,
                c.website,
                c.instagram,
                c.linkedin,
                c.youtube,
                i.coordinator_label,
                i.coordinator_name,
                i.contact,
                i.meeting_details,
                i.location AS info_location
            FROM organizations o
            LEFT JOIN organization_basic_info b ON b.organization_id = o.id
            LEFT JOIN organization_contact_info c ON c.organization_id = o.id
            LEFT JOIN club_cell_info i ON i.organization_id = o.id
            WHERE o.id = %s
            LIMIT 1
        """
        cursor.execute(query, (organization_id,))
        profile = cursor.fetchone()
        if not profile:
            return None

        cursor.execute(
            """
                SELECT id, name, position, profile_picture, email, phone, display_order
                FROM organization_leaders
                WHERE organization_id = %s
                ORDER BY display_order, id
            """,
            (organization_id,)
        )
        profile["leaders"] = cursor.fetchall()
        return profile
    finally:
        cursor.close()
        connection.close()


def upsert_organization_profile(organization_id, data):
    connection = get_db_connection()
    if not connection:
        return False

    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT name FROM organizations WHERE id = %s",
            (organization_id,)
        )
        organization = cursor.fetchone()

        cursor.execute(
            "SELECT logo, title, description FROM organization_basic_info WHERE organization_id = %s",
            (organization_id,)
        )
        basic = cursor.fetchone() or {}
        basic_logo = data.get("logo")
        if basic_logo and len(basic_logo) > 500:
            basic_logo = basic.get("logo")

        cursor.execute(
            "SELECT email, phone, location, website, instagram, linkedin, youtube FROM organization_contact_info WHERE organization_id = %s",
            (organization_id,)
        )
        contact = cursor.fetchone() or {}

        cursor.execute(
            "SELECT coordinator_label, coordinator_name, contact, location, meeting_details FROM club_cell_info WHERE organization_id = %s",
            (organization_id,)
        )
        quick_info = cursor.fetchone() or {}

        cursor.execute(
            """
                INSERT INTO organization_basic_info
                    (organization_id, logo, title, description)
                VALUES (%s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    logo = VALUES(logo),
                    title = VALUES(title),
                    description = VALUES(description)
            """,
            (
                organization_id,
                basic_logo if basic_logo is not None else basic.get("logo"),
                data.get("title") or basic.get("title") or (organization or {}).get("name", "Club"),
                data.get("description") if data.get("description") is not None else basic.get("description")
            )
        )
        cursor.execute(
            """
                INSERT INTO organization_contact_info
                    (organization_id, email, phone, location, website, instagram, linkedin, youtube)
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
                data.get("email") if data.get("email") is not None else contact.get("email"),
                data.get("phone") if data.get("phone") is not None else contact.get("phone"),
                data.get("location") if data.get("location") is not None else contact.get("location"),
                data.get("website") if data.get("website") is not None else contact.get("website"),
                data.get("instagram") if data.get("instagram") is not None else contact.get("instagram"),
                data.get("linkedin") if data.get("linkedin") is not None else contact.get("linkedin"),
                data.get("youtube") if data.get("youtube") is not None else contact.get("youtube")
            )
        )
        cursor.execute(
            """
                INSERT INTO club_cell_info
                    (organization_id, coordinator_label, coordinator_name, contact, location, meeting_details)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    coordinator_label = VALUES(coordinator_label),
                    coordinator_name = VALUES(coordinator_name),
                    contact = VALUES(contact),
                    location = VALUES(location),
                    meeting_details = VALUES(meeting_details)
            """,
            (
                organization_id,
                data.get("coordinator_label") or quick_info.get("coordinator_label") or "Convener",
                data.get("coordinator_name") if data.get("coordinator_name") is not None else quick_info.get("coordinator_name"),
                data.get("contact") if data.get("contact") is not None else quick_info.get("contact"),
                data.get("location") if data.get("location") is not None else quick_info.get("location"),
                data.get("meeting_details") if data.get("meeting_details") is not None else quick_info.get("meeting_details")
            )
        )
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print("Organization profile database error:", error)
        return False
    finally:
        cursor.close()
        connection.close()


def upsert_organization_leader(organization_id, display_order, data):
    connection = get_db_connection()
    if not connection:
        return False

    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT id, profile_picture
                FROM organization_leaders
                WHERE organization_id = %s AND display_order = %s
                LIMIT 1
            """,
            (organization_id, display_order)
        )
        existing = cursor.fetchone()
        profile_picture = data.get("profile_picture")
        if profile_picture and len(profile_picture) > 500:
            profile_picture = existing[1] if existing else None
        values = (
            organization_id,
            data.get("name"),
            data.get("position"),
            profile_picture,
            data.get("email"),
            data.get("phone"),
            display_order
        )
        if existing:
            cursor.execute(
                """
                    UPDATE organization_leaders
                    SET name = %s, position = %s, profile_picture = %s,
                        email = %s, phone = %s
                    WHERE id = %s AND organization_id = %s
                """,
                (
                    data.get("name"),
                    data.get("position"),
                    profile_picture,
                    data.get("email"),
                    data.get("phone"),
                    existing[0],
                    organization_id
                )
            )
        else:
            cursor.execute(
                """
                    INSERT INTO organization_leaders
                        (organization_id, name, position, profile_picture, email, phone, display_order)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                values
            )
        connection.commit()
        return True
    except Exception as error:
        connection.rollback()
        print("Organization leader database error:", error)
        return False
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
