from flask import Blueprint, session, redirect, abort
from database.queries import get_organization_by_id


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