from datetime import datetime
from uuid import uuid4

from flask import Blueprint, render_template, jsonify, request, session

from database.queries import (
    create_complaint,
    create_club_application,
    create_club_member,
    get_club_submissions,
    get_all_complaints,
    update_complaint_status,
    update_club_submission_status,
    get_organization_by_slug
)

complaints_bp=Blueprint(
    "complaints",
    __name__,
    url_prefix="/complaints"
)

@complaints_bp.route("/")
def complaints_homepage():
    return render_template("complaints/complaint.html")
    
@complaints_bp.route("/admin")
def complaints_admin():
    return render_template("admin/complaint/complaint_admin.html")


def _serialize_complaint(complaint):
    result = dict(complaint)
    created_at = result.get("created_at")
    if isinstance(created_at, datetime):
        result["created_at"] = created_at.isoformat()
    result["attachments"] = []
    return result


@complaints_bp.route("/api", methods=["GET"])
def complaints_api():
    if session.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403
    organization_id = session.get("organization_id") if session.get("role") == "admin" else None
    return jsonify({
        "success": True,
        "complaints": [
            _serialize_complaint(complaint)
            for complaint in get_all_complaints(organization_id)
        ]
    })


@complaints_bp.route("/submit", methods=["POST"])
def submit_complaint():
    anonymous = request.form.get("anonymous", "false").lower() == "true"
    # Club forms use ``subject`` and ``complaint`` while the shared
    # complaint page uses ``title`` and ``description``.  Accept both so
    # every entry point reaches the same persisted admin inbox.
    title = request.form.get("title", request.form.get("subject", "")).strip()
    category = request.form.get("category", "Club activity").strip()
    priority = request.form.get("priority", "Medium").strip().lower()
    description = request.form.get("description", request.form.get("complaint", "")).strip()

    if not title or not category or not description:
        return jsonify({
            "success": False,
            "message": "Title, category, and description are required."
        }), 400

    organization_id = None
    organization_slug = request.form.get("organization_slug", "").strip().lower()
    if organization_slug:
        organization = get_organization_by_slug(organization_slug)
        organization_id = organization["id"] if organization else None

    reference_id = f"CMP-{uuid4().hex[:8].upper()}"
    created = create_complaint(
        organization_id=organization_id,
        reference_id=reference_id,
        title=title,
        category=category,
        priority=priority,
        status="new",
        description=description,
        anonymous=anonymous,
        name=None if anonymous else request.form.get("name", "").strip(),
        roll=None if anonymous else request.form.get("roll", request.form.get("id_no", "")).strip(),
        phone=None if anonymous else request.form.get("phone", "").strip()
    )

    if not created:
        return jsonify({
            "success": False,
            "message": "Could not submit complaint."
        }), 500

    return jsonify({
        "success": True,
        "reference_id": reference_id
    }), 201


def _admin_organization_id():
    if session.get("role") != "admin" or not session.get("organization_id"):
        return None
    return session["organization_id"]


def _serialize_submissions(rows):
    serialized = []
    for row in rows:
        item = dict(row)
        if isinstance(item.get("created_at"), datetime):
            item["created_at"] = item["created_at"].isoformat()
        if isinstance(item.get("updated_at"), datetime):
            item["updated_at"] = item["updated_at"].isoformat()
        serialized.append(item)
    return serialized


@complaints_bp.route("/club-submissions/<string:submission_type>", methods=["GET"])
def club_submissions(submission_type):
    organization_id = _admin_organization_id()
    if not organization_id:
        return jsonify({"success": False, "message": "Admin access required."}), 403

    table = {
        "applications": "club_applications",
        "members": "club_members"
    }.get(submission_type)
    if not table:
        return jsonify({"success": False, "message": "Invalid submission type."}), 400

    return jsonify({
        "success": True,
        "submissions": _serialize_submissions(
            get_club_submissions(table, organization_id)
        )
    })


@complaints_bp.route("/club-submissions/<string:submission_type>/<int:submission_id>/status", methods=["PATCH"])
def update_club_submission_status_route(submission_type, submission_id):
    organization_id = _admin_organization_id()
    if not organization_id:
        return jsonify({"success": False, "message": "Admin access required."}), 403

    table = {
        "applications": "club_applications",
        "members": "club_members"
    }.get(submission_type)
    if not table:
        return jsonify({"success": False, "message": "Invalid submission type."}), 400

    status = str((request.get_json(silent=True) or {}).get("status", "")).strip().lower()
    allowed_statuses = {
        "applications": {"pending", "accepted", "rejected"},
        "members": {"pending", "accepted", "rejected"}
    }
    if status not in allowed_statuses[submission_type]:
        return jsonify({"success": False, "message": "Invalid submission status."}), 400

    if not update_club_submission_status(table, submission_id, organization_id, status):
        return jsonify({"success": False, "message": "Submission not found."}), 404

    return jsonify({"success": True, "status": status})


@complaints_bp.route("/club-submissions/<string:submission_type>", methods=["POST"])
def create_club_submission(submission_type):
    organization_slug = request.form.get("organization_slug", "").strip().lower()
    organization = get_organization_by_slug(organization_slug)
    if not organization:
        return jsonify({"success": False, "message": "Organization not found."}), 404

    data = {
        "name": request.form.get("name", "").strip(),
        "email": request.form.get("email", "").strip().lower(),
        "roll": request.form.get("roll", request.form.get("id_no", "")).strip(),
        "branch": request.form.get("branch", "").strip(),
        "year": request.form.get("year", "").strip(),
        "semester": request.form.get("semester", request.form.get("current_sem", "")).strip(),
        "phone": request.form.get("phone", "").strip(),
        "reason": request.form.get("reason", "").strip()
    }
    if not data["name"] or not data["email"]:
        return jsonify({"success": False, "message": "Name and email are required."}), 400

    if submission_type == "members":
        submission_id = create_club_member(organization["id"], data)
    elif submission_type == "applications":
        submission_id = create_club_application(organization["id"], data)
    else:
        return jsonify({"success": False, "message": "Invalid submission type."}), 400

    if not submission_id:
        return jsonify({"success": False, "message": "Could not save submission."}), 500
    return jsonify({"success": True, "submission_id": submission_id}), 201


@complaints_bp.route("/api/<string:reference_id>/status", methods=["PATCH", "POST"])
def update_complaint_status_route(reference_id):
    if session.get("role") != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    data = request.get_json(silent=True) or {}
    requested_status = str(data.get("status", "")).strip().lower()
    status_aliases = {
        "pending": "new",
        "new": "new",
        "under review": "under-review",
        "under-review": "under-review",
        "in progress": "in-progress",
        "in-progress": "in-progress",
        "resolved": "resolved",
        "rejected": "rejected"
    }
    status = status_aliases.get(requested_status)
    if not status:
        return jsonify({
            "success": False,
            "message": "Invalid complaint status."
        }), 400

    # A club admin may only alter complaints assigned to that club.  A
    # platform admin (without an organization) can still manage all rows.
    organization_id = session.get("organization_id")
    updated = update_complaint_status(reference_id, status, organization_id)
    if not updated:
        return jsonify({
            "success": False,
            "message": "Complaint not found or status was not updated."
        }), 404

    return jsonify({
        "success": True,
        "reference_id": reference_id,
        "status": status
    })
