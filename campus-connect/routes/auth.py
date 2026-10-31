from flask import Blueprint,render_template,redirect,url_for,request,jsonify,session
from services.auth_services import signup_user,verify_user_email,login_user,forgot_password,reset_user_password,google_login_user
from extensions import oauth
from database.queries import (
    get_user_by_email,
    update_user_password,
    update_user_profile,
    update_user_profile_by_id,
    update_user_password_by_id
)
from werkzeug.security import (
    check_password_hash,
    generate_password_hash
)



auth_bp=Blueprint(
    "auth",
    __name__,
    url_prefix="/auth"
)

# LOGIN
@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    # Show login page
    if request.method == "GET":
        return render_template("auth/login.html")
    # Get login data
    data = request.get_json()
    # Authenticate user
    result = login_user(data)
    # Stop if login failed
    if not result["success"]:
        return jsonify(result)
    # Get authenticated user
    user = result["user"]
    # CREATE USER SESSION
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    session["organization_id"] = user["organization_id"]
    # Mark session as permanent
    session.permanent = True
    # Return success
    return jsonify(result)


# LOGOUT
@auth_bp.route("/logout", methods=["POST"])
def logout():
    # Remove all session data
    session.clear()
    return redirect(url_for("auth.login"))


#SIGNUP:
@auth_bp.route("/signup",methods=["POST"])
def signup():
    data=request.get_json()
    result=signup_user(data)
    return jsonify(result)


# VERIFY EMAIL
@auth_bp.route("/verify-email/<token>", methods=["GET"])
def verify_email(token):
    # verify user email using the token
    result = verify_user_email(token)
    # if verification fails, return error message
    if not result["success"]:
        return result["message"]
    # if verification is successful, render the email verified page with a redirect to login page
    return render_template(
        "auth/email_verified.html",
        login_url=url_for("auth.login")
    )


# ==================================================
# FORGOT PASSWORD
# ==================================================
@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password_route():
    data = request.get_json()
    result = forgot_password(data)
    return jsonify(result)


# ==================================================
# RESET PASSWORD
# ==================================================
@auth_bp.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password(token):
    # SHOW RESET PASSWORD PAGE
    if request.method == "GET":
        # Verify token before showing page
        from utils.token_utils import verify_password_reset_token
        email = verify_password_reset_token(token)
        if not email:
            return "Reset link is invalid or has expired.", 400
        return render_template(
            "auth/reset-password.html",
            token=token
        )
    # HANDLE NEW PASSWORD SUBMISSION
    data = request.get_json()
    result = reset_user_password(
        token,
        data
    )
    return jsonify(result)


# ==================================================
# GOOGLE LOGIN
# ==================================================
@auth_bp.route("/google")
def google_login():
    redirect_uri = url_for(
        "auth.google_callback",
        _external=True
    )
    return oauth.google.authorize_redirect(
        redirect_uri
    )

# ==================================================
# GOOGLE CALLBACK
# ==================================================
@auth_bp.route("/google/callback")
def google_callback():
    # Get access token and Google user information
    token = oauth.google.authorize_access_token()
    user_info = token.get("userinfo")
    # Process Google login
    result = google_login_user(user_info)
    # Stop if login failed
    if not result["success"]:
        return result["message"], 400
    # Get authenticated user
    user = result["user"]
    # CREATE USER SESSION
    session.clear()
    session["user_id"] = user["id"]
    session["username"] = user["username"]
    session["email"] = user["email"]
    session["role"] = user["role"]
    session["organization_id"] = user["organization_id"]
    # Keep session for configured lifetime
    session.permanent = True
    # Redirect to homepage
    return redirect(
        url_for("homepage.homepage")
    )

# ==================================================
# UPDATE USER PROFILE
# ==================================================

@auth_bp.route("/update-profile", methods=["POST"])
def update_user_profile_route():
    user_id = session.get("user_id")
    current_email = session.get("email")
    if not user_id or not current_email:
        return jsonify({"success": False, "message": "Please login first."}), 401

    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()
    new_email = (data.get("email") or "").strip().lower()

    if len(username) < 3:
        return jsonify({"success": False, "message": "Username must be at least 3 characters."}), 400
    if not new_email:
        return jsonify({"success": False, "message": "Email is required."}), 400

    existing_user = get_user_by_email(new_email)
    if existing_user and int(existing_user.get("id")) != int(user_id):
        return jsonify({"success": False, "message": "This email is already in use."}), 409

    if not update_user_profile_by_id(user_id, username, new_email):
        return jsonify({"success": False, "message": "Profile could not be updated. Please try again."}), 500

    session["username"] = username
    session["email"] = new_email
    return jsonify({
        "success": True,
        "message": "Profile updated successfully.",
        "username": username,
        "email": new_email
    }), 200


@auth_bp.route("/update-password", methods=["POST"])
def update_user_password_route():
    user_id = session.get("user_id")
    email = session.get("email")
    if not user_id or not email:
        return jsonify({"success": False, "message": "Please login first."}), 401

    data = request.get_json(silent=True) or {}
    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""
    confirm_password = data.get("confirm_password") or ""

    if not current_password or not new_password or not confirm_password:
        return jsonify({"success": False, "message": "Please fill all password fields."}), 400
    if new_password != confirm_password:
        return jsonify({"success": False, "message": "New passwords do not match."}), 400
    if len(new_password) < 8:
        return jsonify({"success": False, "message": "Password must be at least 8 characters."}), 400

    user = get_user_by_email(email)
    if not user:
        return jsonify({"success": False, "message": "Account not found. Please log in again."}), 404
    stored_hash = user.get("password_hash")
    if not stored_hash:
        return jsonify({"success": False, "message": "This account uses Google sign-in and has no local password to change."}), 400
    if not check_password_hash(stored_hash, current_password):
        return jsonify({"success": False, "message": "Current password is incorrect."}), 400

    new_hash = generate_password_hash(new_password)
    if not update_user_password_by_id(user_id, new_hash):
        return jsonify({"success": False, "message": "Password could not be updated. Please try again."}), 500

    return jsonify({"success": True, "message": "Password updated successfully."}), 200
