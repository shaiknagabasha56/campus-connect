"""Independent complaint inbox for the Raise a Complaint button on category pages.

This module intentionally never imports or calls the general complaints helpers.
"""
import uuid
from flask import Blueprint, jsonify, request, session

from database.queries import (
    get_organization_by_slug,
    create_organization_page_complaint,
    get_organization_page_complaints,
)

category_complaints_bp = Blueprint(
    "category_complaints", __name__, url_prefix="/category-complaints"
)


def _text(name, *aliases):
    for key in (name, *aliases):
        value = request.form.get(key)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


@category_complaints_bp.route("/submit", methods=["POST"])
def submit_category_complaint():
    # Students must be authenticated; organization is resolved from the
    # category page's slug and stored as an organization_id in its own table.
    if not session.get("user_id"):
        return jsonify(success=False, message="Please log in before submitting a complaint."), 401
    if session.get("role") == "admin":
        return jsonify(success=False, message="This form is for students only."), 403

    slug = _text("organization_slug").lower()
    organization = get_organization_by_slug(slug) if slug else None
    if not organization:
        return jsonify(success=False, message="Could not identify this category. Refresh the page and try again."), 400

    name = _text("name", "student_name")
    roll = _text("roll", "id_no", "roll_number")
    email = _text("email")
    phone = _text("phone")
    branch = _text("branch")
    year = _text("year")
    semester = _text("current_sem", "semester")
    subject = _text("title", "subject")
    description = _text("description", "complaint")

    missing = [label for label, value in (
        ("Name", name), ("ID number", roll), ("Subject", subject), ("Complaint details", description)
    ) if not value]
    if missing:
        return jsonify(success=False, message="Please provide: " + ", ".join(missing) + "."), 400

    reference_id = "ORG-" + uuid.uuid4().hex[:10].upper()
    saved = create_organization_page_complaint(
        reference_id=reference_id,
        organization_id=organization["id"],
        student_name=name,
        roll_number=roll,
        email=email,
        phone=phone,
        branch=branch,
        year=year,
        semester=semester,
        subject=subject,
        description=description,
    )
    if not saved:
        return jsonify(success=False, message="Could not save this category complaint. Please try again."), 500

    return jsonify(success=True, message="Your complaint was sent to the " + organization["name"] + " admin.", reference_id=reference_id), 201


@category_complaints_bp.route("/admin/list", methods=["GET"])
def list_category_complaints_for_admin():
    if session.get("role") != "admin" or not session.get("organization_id"):
        return jsonify(success=False, message="Organization admin access required."), 403

    # Never accept organization_id from query parameters or request body.
    rows = get_organization_page_complaints(session["organization_id"])
    return jsonify(success=True, complaints=rows)
