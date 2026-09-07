from flask import Blueprint,render_template,redirect,url_for,request,jsonify,session
from services.auth_services import signup_user,verify_user_email,login_user,forgot_password,reset_user_password,google_login_user
from extensions import oauth



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
    return jsonify({
        "success": True,
        "message": "Logged out successfully."
    })


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
    # Redirect to homepage
    return redirect(
        url_for("homepage.homepage")
    )


# ==================================================
# PROFILE DATA ENDPOINT
# ==================================================
@auth_bp.route("/profile", methods=["GET"])
def get_profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Not logged in."}), 401
    
    from database.queries import get_user_by_id
    user = get_user_by_id(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404
    
    return jsonify({
        "success": True,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "phone": user.get("phone") or "",
            "role": user["role"],
            "profile_picture": user.get("profile_picture") or "",
            "organization_id": user.get("organization_id")
        }
    })


# ==================================================
# EDIT PROFILE ENDPOINT
# ==================================================
@auth_bp.route("/profile/edit", methods=["POST"])
def edit_profile():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Not logged in."}), 401

    data = request.get_json() or request.form
    username = data.get("username", "").strip()
    phone = data.get("phone", "").strip()

    if not username:
        return jsonify({"success": False, "message": "Username is required."}), 400
    if len(username) < 3:
        return jsonify({"success": False, "message": "Username must be at least 3 characters."}), 400

    from database.queries import update_user_profile, get_user_by_id
    success = update_user_profile(user_id, username, phone)
    if success:
        session["username"] = username
        user = get_user_by_id(user_id)
        return jsonify({
            "success": True,
            "message": "Profile updated successfully.",
            "user": {
                "id": user["id"],
                "username": user["username"],
                "email": user["email"],
                "phone": user.get("phone") or "",
                "role": user["role"]
            }
        })
    return jsonify({"success": False, "message": "Failed to update profile."}), 500


# ==================================================
# CHANGE PASSWORD ENDPOINT
# ==================================================
@auth_bp.route("/change-password", methods=["POST"])
def change_password():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Not logged in."}), 401

    data = request.get_json() or request.form
    current_password = data.get("current_password", "")
    new_password = data.get("new_password", "")
    confirm_password = data.get("confirm_password", "")

    if not current_password or not new_password:
        return jsonify({"success": False, "message": "Current and new password are required."}), 400
    if len(new_password) < 6:
        return jsonify({"success": False, "message": "New password must be at least 6 characters."}), 400
    if new_password != confirm_password:
        return jsonify({"success": False, "message": "New passwords do not match."}), 400

    from database.queries import get_user_by_id, update_user_password_by_id
    from werkzeug.security import check_password_hash, generate_password_hash

    user = get_user_by_id(user_id)
    if not user or not user.get("password_hash"):
        return jsonify({"success": False, "message": "Unable to verify current password."}), 400

    if not check_password_hash(user["password_hash"], current_password):
        return jsonify({"success": False, "message": "Incorrect current password."}), 400

    new_hash = generate_password_hash(new_password)
    updated = update_user_password_by_id(user_id, new_hash)
    if updated:
        return jsonify({"success": True, "message": "Password changed successfully."})
    return jsonify({"success": False, "message": "Failed to update password."}), 500