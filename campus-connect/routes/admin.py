import re

from flask import Blueprint, session, redirect, abort, render_template, request, url_for
from werkzeug.security import generate_password_hash, check_password_hash

from database.queries import (
    get_organization_by_id,
    get_user_by_id,
    get_user_by_email,
    update_user_profile_details,
    update_user_password_by_id
)


# ==========================================
# ADMIN BLUEPRINT
# ==========================================

admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/admin"
)


def _get_authenticated_admin():
    if session.get("role") != "admin":
        abort(403)

    user_id = session.get("user_id")
    if not user_id:
        abort(403)

    user = get_user_by_id(user_id)
    if not user:
        abort(404)

    return user


def _profile_view(user, message=None, message_type=None):
    profile = {
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "organization_id": user["organization_id"]
    }
    return render_template(
        "admin/profile.html",
        profile=profile,
        message=message,
        message_type=message_type
    )


@admin_bp.route("/profile", methods=["GET"])
def admin_profile():
    user = _get_authenticated_admin()
    return _profile_view(user)


@admin_bp.route("/profile/details", methods=["POST"])
def update_admin_profile_details():
    user = _get_authenticated_admin()
    username = request.form.get("username", "").strip()
    email = request.form.get("email", "").strip().lower()

    if len(username) < 3 or len(username) > 100:
        return _profile_view(
            user,
            "Username must be between 3 and 100 characters.",
            "error"
        ), 400

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return _profile_view(user, "Please enter a valid email address.", "error"), 400

    existing_user = get_user_by_email(email)
    if existing_user and existing_user["id"] != user["id"]:
        return _profile_view(user, "That email address is already in use.", "error"), 409

    updated = update_user_profile_details(
        session["user_id"],
        username,
        email
    )
    if not updated:
        return _profile_view(user, "Could not update your profile details.", "error"), 500

    session["username"] = username
    session["email"] = email
    user["username"] = username
    user["email"] = email
    return _profile_view(user, "Profile details updated successfully.", "success")


@admin_bp.route("/profile/password", methods=["POST"])
def update_admin_profile_password():
    user = _get_authenticated_admin()
    current_password = request.form.get("current_password", "")
    new_password = request.form.get("new_password", "")
    confirm_password = request.form.get("confirm_password", "")

    if not user.get("password_hash") or not check_password_hash(
        user["password_hash"],
        current_password
    ):
        return _profile_view(user, "Current password is incorrect.", "error"), 400

    if len(new_password) < 6:
        return _profile_view(
            user,
            "New password must be at least 6 characters.",
            "error"
        ), 400

    if new_password != confirm_password:
        return _profile_view(user, "New passwords do not match.", "error"), 400

    updated = update_user_password_by_id(
        session["user_id"],
        generate_password_hash(new_password)
    )
    if not updated:
        return _profile_view(user, "Could not update your password.", "error"), 500

    return redirect(url_for("admin.admin_profile"))


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

    if not organization_id:
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