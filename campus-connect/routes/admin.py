from flask import Blueprint, session, redirect, abort, render_template, request
from werkzeug.security import generate_password_hash, check_password_hash

from database.queries import (
    get_organization_by_id,
    get_user_by_email,
    update_user_password,
    update_user_profile
)


# ==========================================
# ADMIN BLUEPRINT
# ==========================================

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin"
)


# ==========================================
# ADMIN REDIRECT
# ==========================================

@admin_bp.route("/")
def admin_redirect():

    # --------------------------------------
    # CHECK WHETHER USER IS AN ADMIN
    # --------------------------------------
    if session.get("role") != "admin":
        abort(403)


    # --------------------------------------
    # GET ADMIN'S ORGANIZATION ID
    # --------------------------------------
    organization_id = session.get("organization_id")

    # Some admin accounts (e.g. the Complaints Admin) are not tied
    # to a club/cell/academic organization row at all. Send these
    # straight to their own dedicated admin page instead of 403ing.
    if not organization_id:

        if session.get("email") == "complaints-admin@gmail.com":
            return redirect("/complaints/admin")

        abort(403)


    # --------------------------------------
    # GET ORGANIZATION DETAILS
    # --------------------------------------
    organization = get_organization_by_id(
        organization_id
    )

    if not organization:
        abort(404)


    # --------------------------------------
    # GET CATEGORY AND SLUG
    # --------------------------------------
    category = organization["category"]
    slug = organization["slug"]


    # --------------------------------------
    # MAP DATABASE CATEGORY TO URL PREFIX
    # --------------------------------------
    category_routes = {

        "club": "clubs",
        "clubs": "clubs",

        "cell": "cells",
        "cells": "cells",

        "academic": "academic",

        "non-academic": "non-academic",
        "non_academic": "non-academic"
    }


    # --------------------------------------
    # GET CORRECT URL CATEGORY
    # --------------------------------------
    url_category = category_routes.get(category)

    if not url_category:
        abort(404)


    # --------------------------------------
    # REDIRECT TO ADMIN'S OWN PAGE
    # --------------------------------------
    return redirect(
        f"/{url_category}/{slug}/admin"
    )


# ==========================================
# ADMIN PROFILE
# ==========================================

@admin_bp.route("/profile")
def admin_profile():

    if session.get("role") != "admin":
        abort(403)

    email = session.get("email")

    if not email:
        return redirect("/auth/login")

    profile = get_user_by_email(email)

    if not profile:
        abort(404)

    return render_template(
        "admin/profile.html",
        profile=profile,
        message=None,
        message_type=None
    )


# ==========================================
# UPDATE ADMIN PROFILE DETAILS
# ==========================================

@admin_bp.route("/profile/update-details", methods=["POST"])
def update_admin_profile_details():

    if session.get("role") != "admin":
        abort(403)

    current_email = session.get("email")

    if not current_email:
        return redirect("/auth/login")

    username = request.form.get("username", "").strip()
    new_email = request.form.get("email", "").strip()

    if not username or not new_email:
        profile = get_user_by_email(current_email)

        return render_template(
            "admin/profile.html",
            profile=profile,
            message="Username and email are required.",
            message_type="error"
        )

    success = update_user_profile(
        current_email,
        username,
        new_email
    )

    if not success:
        profile = get_user_by_email(current_email)

        return render_template(
            "admin/profile.html",
            profile=profile,
            message="Unable to update profile details.",
            message_type="error"
        )

    # Update session email if the user changed it
    session["email"] = new_email

    profile = get_user_by_email(new_email)

    return render_template(
        "admin/profile.html",
        profile=profile,
        message="Profile details updated successfully.",
        message_type="success"
    )


# ==========================================
# UPDATE ADMIN PASSWORD
# ==========================================

@admin_bp.route("/profile/update-password", methods=["POST"])
def update_admin_profile_password():

    if session.get("role") != "admin":
        abort(403)

    email = session.get("email")

    if not email:
        return redirect("/auth/login")

    current_password = request.form.get("current_password", "")
    new_password = request.form.get("new_password", "")
    confirm_password = request.form.get("confirm_password", "")

    profile = get_user_by_email(email)

    if not profile:
        abort(404)

    if new_password != confirm_password:
        return render_template(
            "admin/profile.html",
            profile=profile,
            message="New passwords do not match.",
            message_type="error"
        )

    if not check_password_hash(
        profile["password_hash"],
        current_password
    ):
        return render_template(
            "admin/profile.html",
            profile=profile,
            message="Current password is incorrect.",
            message_type="error"
        )

    new_password_hash = generate_password_hash(new_password)

    success = update_user_password(
        email,
        new_password_hash
    )

    if not success:
        return render_template(
            "admin/profile.html",
            profile=profile,
            message="Failed to update password.",
            message_type="error"
        )

    return render_template(
        "admin/profile.html",
        profile=get_user_by_email(email),
        message="Password updated successfully.",
        message_type="success"
    )