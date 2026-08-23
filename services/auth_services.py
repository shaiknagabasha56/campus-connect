import email
import re
from flask import url_for
from werkzeug.security import generate_password_hash,check_password_hash
from database.queries import get_user_by_email, create_user,mark_user_as_verified,update_user_password,get_user_by_google_id,create_google_user
from utils.token_utils import generate_verification_token,verify_verification_token,generate_password_reset_token,verify_password_reset_token
from utils.email_utils import send_verification_email,send_password_reset_email

# EMAIL VALIDATION FUNCTION
def is_valid_email(email):
    email_pattern = r"^o2[1-6]\d+@rguktong\.ac\.in$"
    return re.match(email_pattern, email) is not None

# PHONE VALIDATION FUNCTION
def is_valid_phone(phone):
    return phone.isdigit() and len(phone) == 10

# USERNAME VALIDATION FUNCTION
def is_valid_username(username):
    username = username.strip()
    if not username:
        return False
    if len(username) < 3:
        return False
    if len(username) > 100:
        return False
    return True

# PASSWORD VALIDATION FUNCTION
def is_valid_password(password):
    if not password:
        return False
    if len(password) < 6:
        return False
    return True


# SIGNUP DATA VALIDATION
def validate_signup_data(data):
    if not data:
        return {
            "success": False,
            "message": "No signup data received."
        }
    
    username = data.get("username", "").strip()
    phone = data.get("phone", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    confirm_password = data.get("confirm_password","")


    # VALIDATE USERNAME
    if not username:
        return {
            "success": False,
            "message": "Please enter your username."
        }
    if len(username) < 3:
        return {
            "success": False,
            "message": "Username must be at least 3 characters."
        }
    if len(username) > 100:
        return {
            "success": False,
            "message": "Username is too long."
        }

    # VALIDATE PHONE NUMBER
    if not phone:
        return {
            "success": False,
            "message": "Please enter your phone number."
        }
    if not is_valid_phone(phone):
        return {
            "success": False,
            "message": "Please enter a valid 10-digit phone number."
        }
    
    # VALIDATE EMAIL
    if not email:
        return {
            "success": False,
            "message": "Please enter your email address."
        }
    if not is_valid_email(email):
        return {
            "success": False,
            "message": "Please enter a valid email address."
        }

    # VALIDATE PASSWORD
    if not password:
        return {
            "success": False,
            "message": "Please enter a password."
        }
    if len(password) < 6:
        return {
            "success": False,
            "message": "Password must be at least 6 characters."
        }

    # VALIDATE CONFIRM PASSWORD

    if not confirm_password:
        return {
            "success": False,
            "message": "Please confirm your password."
        }
    
    # CHECK PASSWORD MATCH
    if password != confirm_password:

        return {
            "success": False,
            "message": "Passwords do not match."
        }




    return {
        "success": True,
        "message": "verify your email address to complete signup.",

        "user_data": {

            "username": username,

            "phone": phone,

            "email": email,

            "password": password

        }

    }


# SIGNUP USER
def signup_user(data):

    # VALIDATE SIGNUP DATA
    validation_result = validate_signup_data(data)

    # If validation fails, immediately return error
    if not validation_result["success"]:
        return validation_result


    # GET CLEANED USER DATA
    user_data = validation_result["user_data"]
    username = user_data["username"]
    phone = user_data["phone"]
    email = user_data["email"]
    password = user_data["password"]


    existing_user = get_user_by_email(email)
    if existing_user:
        return {
            "success": False,
            "message": "This email already exists."
        }
    # HASH PASSWORD
    password_hash = generate_password_hash(password)


    # CREATE USER IN DATABASE
    user_created = create_user(
        username,
        phone,
        email,
        password_hash
    )

    # CHECK IF USER WAS CREATED SUCCESSFULLY
    if not user_created:

        return {
            "success": False,
            "message": "Could not create account. Please try again."
        }
    
    # GENERATE EMAIL VERIFICATION TOKEN
    verification_token = generate_verification_token(email)
    # CREATE EMAIL VERIFICATION URL
    verification_url = url_for(
    "auth.verify_email",
    token=verification_token,
    _external=True
    )


    #SEND VERIFICATION EMAIL
    email_sent = send_verification_email(
        email,
        verification_url
    )

    #CHECK WHETHER EMAIL WAS SENT:
    if not email_sent:
        return {
        "success": False,
        "message": "Account was created, but the verification email could not be sent. Please try again later."
        }


    #SIGNUP SUCCESSFUL
    return {
        "success": True,
        "message": "Signup successful. Please check your email to verify your account."
    }
   



# ==================================================
# VERIFY USER EMAIL
# ==================================================
def verify_user_email(token):
    # VERIFY AND DECODE TOKEN
    email = verify_verification_token(token)
    # Token is invalid or expired
    if not email:
        return {
            "success": False,
            "message": "Verification link is invalid or has expired."
        }
    # CHECK WHETHER USER EXISTS
    user = get_user_by_email(email)
    if not user:
        return {
            "success": False,
            "message": "User not found."
        }
    # CHECK IF EMAIL IS ALREADY VERIFIED
    # For this check, your get_user_by_email() must return is_verified too.
    if user.get("is_verified"):
        return {
            "success": True,
            "message": "Email is already verified."
        }


    # UPDATE USER VERIFICATION STATUS
    verified = mark_user_as_verified(email)
    if not verified:
        return {
            "success": False,
            "message": "Could not verify email. Please try again."
        }


    # EMAIL VERIFIED SUCCESSFULLY
    return {
        "success": True,
        "message": "Email verified successfully. You can now log in."
    }




# ==================================================
# LOGIN DATA VALIDATION
# ==================================================
def validate_login_data(data):
    # CHECK WHETHER DATA EXISTS
    if not data:
        return {
            "success": False,
            "message": "No login data received."
        }
    # GET EMAIL AND PASSWORD
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")
    # VALIDATE EMAIL
    if not email:
        return {
            "success": False,
            "message": "Please enter your email address."
        }
    # VALIDATE PASSWORD
    if not password:
        return {
            "success": False,
            "message": "Please enter your password."
        }
    # RETURN CLEAN DATA
    return {
        "success": True,
        "user_data": {
            "email": email,
            "password": password
        }
    }

# ==================================================
# LOGIN USER
# ==================================================
def login_user(data):
    # VALIDATE LOGIN DATA
    validation_result = validate_login_data(data)
    # Stop if validation fails
    if not validation_result["success"]:
        return validation_result
    # GET CLEANED DATA
    user_data = validation_result["user_data"]
    email = user_data["email"]
    password = user_data["password"]
    # FIND USER BY EMAIL
    user = get_user_by_email(email)
    # User does not exist
    if not user:
        return {
            "success": False,
            "message": "Invalid email or password."
        }
    # CHECK PASSWORD
    password_correct = check_password_hash(
        user["password_hash"],
        password
    )
    if not password_correct:
        return {
            "success": False,
            "message": "Invalid email or password."
        }
    # CHECK EMAIL VERIFICATION
    if not user["is_verified"]:
        return {
            "success": False,
            "message": "Please verify your email before logging in."
        }
    # LOGIN SUCCESSFUL
    return {
        "success": True,

        "message": "Login successful.",

        "user": {

            "id": user["id"],

            "username": user["username"],

            "email": user["email"],

            "role": user["role"],

            "organization_id": user["organization_id"]

        }
    }



# ==================================================
# FORGOT PASSWORD
# ==================================================
def forgot_password(data):
    # CHECK DATA
    if not data:
        return {
            "success": False,
            "message": "No data received."
        }
    # GET EMAIL
    email = data.get("email", "").strip().lower()
    # VALIDATE EMAIL
    if not email:
        return {
            "success": False,
            "message": "Please enter your email address."
        }
    # CHECK USER EXISTS
    user = get_user_by_email(email)
    if not user:
        return {
            "success": False,
            "message": "No account found with this email."
        }
    # GENERATE RESET TOKEN
    reset_token = generate_password_reset_token(email)
    # CREATE RESET URL
    reset_url = url_for(
        "auth.reset_password",
        token=reset_token,
        _external=True
    )
    # SEND EMAIL
    email_sent = send_password_reset_email(
        email,
        reset_url
    )
    if not email_sent:
        return {
            "success": False,
            "message": "Could not send reset email. Please try again."
        }
    return {
        "success": True,
        "message": "Password reset link sent. Please check your email."
    }


# ==================================================
# RESET PASSWORD
# ==================================================
def reset_user_password(token, data):
    # VERIFY RESET TOKEN
    email = verify_password_reset_token(token)
    if not email:
        return {
            "success": False,
            "message": "Reset link is invalid or has expired."
        }
    # CHECK DATA
    if not data:
        return {
            "success": False,
            "message": "No data received."
        }
    # GET PASSWORDS
    password = data.get("password", "")
    confirm_password = data.get("confirm_password", "")
    # VALIDATE PASSWORD
    if not password:
        return {
            "success": False,
            "message": "Please enter a new password."
        }
    if len(password) < 6:
        return {
            "success": False,
            "message": "Password must be at least 6 characters."
        }
    # VALIDATE CONFIRM PASSWORD
    if not confirm_password:
        return {
            "success": False,
            "message": "Please confirm your new password."
        }
    if password != confirm_password:
        return {
            "success": False,
            "message": "Passwords do not match."
        }
    # HASH NEW PASSWORD
    password_hash = generate_password_hash(password)
    # UPDATE PASSWORD IN DATABASE
    updated = update_user_password(
        email,
        password_hash
    )
    if not updated:
        return {
            "success": False,
            "message": "Could not reset password. Please try again."
        }
    return {
        "success": True,
        "message": "Password reset successfully. You can now log in."
    }


#GOOGLE LOGIN:-
def google_login_user(user_info):
    # Get data from Google
    google_id = user_info.get("sub")
    email = user_info.get("email")
    username = user_info.get("name")
    profile_picture = user_info.get("picture")
    # Safety check
    if not google_id or not email:
        return {
            "success": False,
            "message": "Could not get required information from Google."
        }

    # 1. CHECK GOOGLE ID
    user = get_user_by_google_id(google_id)
    if user:
        return {
            "success": True,
            "user": user
        }
    # 2. CHECK EMAIL
    user = get_user_by_email(email)
    if user:
        # Existing account found, We will handle linking Google later if needed.
        return {
            "success": True,
            "user": user
        }
    # 3. CREATE NEW GOOGLE USER
    user_id = create_google_user(
        username=username,
        email=email,
        profile_picture=profile_picture,
        google_id=google_id
    )
    if not user_id:
        return {
            "success": False,
            "message": "Could not create Google account."
        }
    # Get the newly created user
    user = get_user_by_google_id(google_id)
    return {
        "success": True,
        "user": user
    }