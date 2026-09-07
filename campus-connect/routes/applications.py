import json
import random
from flask import Blueprint, request, jsonify, session
from database.queries import (
    create_application,
    get_applications_by_user,
    get_applications_by_organization,
    get_all_applications,
    update_application_status,
    get_organization_by_slug
)

applications_bp = Blueprint(
    "applications",
    __name__,
    url_prefix="/applications"
)


# ==================================================
# SUBMIT APPLICATION (Student)
# ==================================================
@applications_bp.route("/apply", methods=["POST"])
def apply():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": False, "message": "Please log in to apply."}), 401

    data = request.get_json() or request.form
    org_slug = data.get("organization_slug", "").strip()
    org_id = data.get("organization_id")
    update_id = data.get("update_id")

    if not org_id and org_slug:
        org = get_organization_by_slug(org_slug)
        if org:
            org_id = org["id"]

    if not org_id:
        return jsonify({"success": False, "message": "Valid Organization is required."}), 400

    applicant_name = data.get("applicant_name") or data.get("name") or session.get("username", "")
    roll_number = data.get("roll_number") or data.get("roll") or "N/A"
    email = data.get("email") or session.get("email", "")
    phone = data.get("phone", "").strip()
    branch = data.get("branch", "").strip()
    year = data.get("year", "").strip()
    reason = data.get("reason") or data.get("statement") or data.get("description", "Application to join").strip()

    ref_id = f"APP-{random.randint(10000, 99999)}"

    app_id = create_application(
        reference_id=ref_id,
        user_id=user_id,
        organization_id=org_id,
        update_id=update_id if update_id else None,
        applicant_name=applicant_name,
        roll_number=roll_number,
        email=email,
        phone=phone,
        branch=branch,
        year=year,
        reason=reason,
        attachments_json="[]"
    )

    if not app_id:
        return jsonify({"success": False, "message": "Failed to record application in database."}), 500

    return jsonify({
        "success": True,
        "message": "Application submitted successfully!",
        "reference_id": ref_id,
        "application_id": app_id
    }), 201


# ==================================================
# GET MY APPLICATIONS (Student)
# ==================================================
@applications_bp.route("/my-applications", methods=["GET"])
def get_my_applications():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": True, "applications": []})

    apps = get_applications_by_user(user_id)
    result = []
    for a in apps:
        date_str = a["created_at"].strftime("%d %b %Y, %I:%M %p") if a.get("created_at") else ""
        result.append({
            "id": a["reference_id"],
            "db_id": a["id"],
            "organization_name": a.get("organization_name") or "Organization",
            "update_title": a.get("update_title") or "",
            "applicant_name": a["applicant_name"],
            "roll_number": a["roll_number"],
            "email": a["email"],
            "status": a["status"],
            "admin_notes": a.get("admin_notes") or "",
            "created_at": date_str
        })

    return jsonify({"success": True, "applications": result})


# ==================================================
# ADMIN: GET ORGANIZATION APPLICATIONS
# ==================================================
@applications_bp.route("/organization/<slug>", methods=["GET"])
def get_org_applications(slug):
    role = session.get("role")
    if role not in ["admin", "super_admin"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    if role == "super_admin":
        apps = get_all_applications()
    else:
        org_id = session.get("organization_id")
        apps = get_applications_by_organization(org_id)

    result = []
    for a in apps:
        date_str = a["created_at"].strftime("%d %b %Y, %I:%M %p") if a.get("created_at") else ""
        result.append({
            "id": a["reference_id"],
            "db_id": a["id"],
            "organization_name": a.get("organization_name") or "",
            "update_title": a.get("update_title") or "",
            "applicant_name": a["applicant_name"],
            "roll_number": a["roll_number"],
            "email": a["email"],
            "phone": a.get("phone") or "",
            "branch": a.get("branch") or "",
            "year": a.get("year") or "",
            "reason": a.get("reason") or "",
            "status": a["status"],
            "admin_notes": a.get("admin_notes") or "",
            "created_at": date_str
        })

    return jsonify({"success": True, "applications": result})


# ==================================================
# ADMIN: UPDATE APPLICATION STATUS (Approve / Reject)
# ==================================================
@applications_bp.route("/<app_id>/update-status", methods=["POST"])
def update_app_status(app_id):
    role = session.get("role")
    if role not in ["admin", "super_admin"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or request.form
    status = data.get("status", "").strip().lower()
    admin_notes = data.get("admin_notes", "").strip()

    if status not in ["approved", "rejected", "pending"]:
        return jsonify({"success": False, "message": "Status must be approved, rejected, or pending."}), 400

    org_id = session.get("organization_id") if role != "super_admin" else None
    updated = update_application_status(app_id, status, admin_notes, org_id)

    if updated:
        return jsonify({"success": True, "message": f"Application {status} successfully."})
    return jsonify({"success": False, "message": "Failed to update application status."}), 500
