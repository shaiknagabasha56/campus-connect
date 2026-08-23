
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