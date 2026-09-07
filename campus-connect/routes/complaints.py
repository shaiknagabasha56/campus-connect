import json
import os
import random
import uuid
from flask import (
    Blueprint, render_template, request, jsonify, session, current_app
)
from werkzeug.utils import secure_filename
from database.queries import (
    create_complaint,
    get_complaints_by_user,
    get_complaints_by_organization,
    get_all_complaints,
    update_complaint_status,
    get_organization_by_slug
)

complaints_bp = Blueprint(
    "complaints",
    __name__,
    url_prefix="/complaints"
)


@complaints_bp.route("/")
def complaints_homepage():
    return render_template("complaints/complaint.html")


@complaints_bp.route("/admin")
def complaints_admin():
    if session.get("role") not in ["admin", "super_admin"]:
        return render_template("auth/login.html")
    return render_template("admin/complaint/complaint_admin.html")


# ==================================================
# SUBMIT COMPLAINT (Student / Anonymous)
# ==================================================
@complaints_bp.route("/submit", methods=["POST"])
def submit_complaint():
    user_id = session.get("user_id")

    # Supports both FormData (files) and JSON
    if request.is_json:
        data = request.get_json() or {}
        title = data.get("title", "").strip()
        category = data.get("category", "").strip()
        priority = data.get("priority", "Medium").strip()
        description = data.get("description", "").strip()
        name = data.get("name", "").strip()
        roll = data.get("roll", "").strip()
        phone = data.get("phone", "").strip()
        is_anonymous = bool(data.get("anonymous", False))
        attachments_list = data.get("attachments", [])
    else:
        title = request.form.get("title", "").strip()
        category = request.form.get("category", "").strip()
        priority = request.form.get("priority", "Medium").strip()
        description = request.form.get("description", "").strip()
        name = request.form.get("name", "").strip()
        roll = request.form.get("roll", "").strip()
        phone = request.form.get("phone", "").strip()
        is_anonymous = request.form.get("anonymous", "false").lower() in ["true", "1", "yes"]

        # Handle uploaded file attachments
        attachments_list = []
        uploaded_files = request.files.getlist("attachments")
        upload_folder = os.path.join(current_app.static_folder, "uploads", "complaints")
        os.makedirs(upload_folder, exist_ok=True)

        for file in uploaded_files:
            if file and file.filename:
                orig_filename = secure_filename(file.filename)
                filename = f"{uuid.uuid4().hex[:8]}_{orig_filename}"
                file_path = os.path.join(upload_folder, filename)
                file.save(file_path)
                rel_url = f"/static/uploads/complaints/{filename}"
                attachments_list.append({
                    "name": orig_filename,
                    "url": rel_url,
                    "type": file.mimetype or "application/octet-stream"
                })

    if not title or not category or not description:
        return jsonify({
            "success": False,
            "message": "Title, Category, and Description are required."
        }), 400

    # Determine organization_id if category matches an org slug
    org_id = None
    category_slug_map = {
        "hostel": "hostel",
        "infrastructure": "it-infra",
        "academic": "cse",
        "clubs & cells": "artix",
        "transport": "complaint"
    }
    target_slug = category_slug_map.get(category.lower(), "complaint")
    target_org = get_organization_by_slug(target_slug)
    if target_org:
        org_id = target_org["id"]

    ref_id = f"RGUKT-CMP-{random.randint(1000, 9999)}"
    attachments_json = json.dumps(attachments_list)

    complaint_id = create_complaint(
        reference_id=ref_id,
        user_id=user_id if not is_anonymous else None,
        name=name if not is_anonymous else "Anonymous",
        roll_number=roll if not is_anonymous else "N/A",
        phone=phone if not is_anonymous else "N/A",
        category=category,
        organization_id=org_id,
        priority=priority if priority in ["Low", "Medium", "High"] else "Medium",
        title=title,
        description=description,
        attachments_json=attachments_json,
        is_anonymous=is_anonymous
    )

    if not complaint_id:
        return jsonify({
            "success": False,
            "message": "Failed to save complaint to database."
        }), 500

    return jsonify({
        "success": True,
        "message": "Complaint submitted successfully.",
        "reference_id": ref_id,
        "complaint": {
            "id": ref_id,
            "title": title,
            "category": category,
            "priority": priority,
            "status": "new",
            "description": description,
            "date": "Just now",
            "anonymous": is_anonymous,
            "name": name if not is_anonymous else "Anonymous",
            "roll": roll if not is_anonymous else "N/A",
            "phone": phone if not is_anonymous else "N/A",
            "attachments": attachments_list
        }
    }), 201


# ==================================================
# GET USER COMPLAINTS (Student View)
# ==================================================
@complaints_bp.route("/list", methods=["GET"])
def list_user_complaints():
    user_id = session.get("user_id")
    if not user_id:
        return jsonify({"success": True, "complaints": []})

    db_complaints = get_complaints_by_user(user_id)
    result = []
    for c in db_complaints:
        att = []
        if c.get("attachments"):
            try:
                att = json.loads(c["attachments"]) if isinstance(c["attachments"], str) else c["attachments"]
            except Exception:
                att = []

        date_str = c["created_at"].strftime("%d %b, %I:%M %p") if c.get("created_at") else "Recently"
        result.append({
            "id": c["reference_id"],
            "title": c["title"],
            "category": c["category"],
            "priority": c["priority"],
            "status": c["status"],
            "description": c["description"],
            "date": date_str,
            "anonymous": bool(c["is_anonymous"]),
            "name": c["name"],
            "roll": c["roll_number"],
            "phone": c["phone"],
            "attachments": att,
            "admin_reply": c.get("admin_reply") or ""
        })

    return jsonify({"success": True, "complaints": result})


# ==================================================
# ADMIN: GET COMPLAINTS
# ==================================================
@complaints_bp.route("/admin/list", methods=["GET"])
def admin_list_complaints():
    role = session.get("role")
    if role not in ["admin", "super_admin"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    if role == "super_admin":
        db_complaints = get_all_complaints()
    else:
        org_id = session.get("organization_id")
        db_complaints = get_complaints_by_organization(org_id)

    result = []
    for c in db_complaints:
        att = []
        if c.get("attachments"):
            try:
                att = json.loads(c["attachments"]) if isinstance(c["attachments"], str) else c["attachments"]
            except Exception:
                att = []

        date_str = c["created_at"].strftime("%d %b, %I:%M %p") if c.get("created_at") else "Recently"
        result.append({
            "id": c["reference_id"],
            "db_id": c["id"],
            "title": c["title"],
            "category": c["category"],
            "priority": c["priority"],
            "status": c["status"],
            "description": c["description"],
            "date": date_str,
            "anonymous": bool(c["is_anonymous"]),
            "name": c["name"] if not c["is_anonymous"] else "Anonymous",
            "roll": c["roll_number"] if not c["is_anonymous"] else "Not shared",
            "phone": c["phone"] if not c["is_anonymous"] else "Not shared",
            "attachments": att,
            "admin_reply": c.get("admin_reply") or ""
        })

    return jsonify({"success": True, "complaints": result})


# ==================================================
# ADMIN: UPDATE COMPLAINT STATUS
# ==================================================
@complaints_bp.route("/admin/update-status", methods=["POST"])
def admin_update_complaint_status():
    role = session.get("role")
    if role not in ["admin", "super_admin"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or request.form
    complaint_id = data.get("id") or data.get("reference_id")
    status = data.get("status", "").strip()
    admin_reply = data.get("admin_reply", "").strip()

    if not complaint_id or not status:
        return jsonify({"success": False, "message": "Complaint ID and status are required."}), 400

    org_id = session.get("organization_id") if role != "super_admin" else None
    updated = update_complaint_status(complaint_id, status, admin_reply, org_id)

    if updated:
        return jsonify({"success": True, "message": "Complaint status updated successfully."})
    return jsonify({"success": False, "message": "Failed to update complaint status."}), 500