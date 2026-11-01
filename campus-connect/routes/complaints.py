import json
import uuid

import cloudinary
import cloudinary.uploader

from flask import (
    Blueprint,
    render_template,
    jsonify,
    request,
    session,
    current_app
)

from database.queries import (
    create_complaint,
    get_all_complaints,
    get_complaint_by_reference,
    update_complaint_status,
    get_organization_by_slug
)

# ==================================================
# COMPLAINTS BLUEPRINT
# ==================================================

complaints_bp = Blueprint(
    "complaints",
    __name__,
    url_prefix="/complaints"
)


# ==================================================
# ALLOWED COMPLAINT STATUSES
# ==================================================
#
# pending   - just submitted, not yet looked at
# accessed  - an admin has opened / is reviewing it
# solved    - the issue has been resolved
# rejected  - the admin declined the complaint
# ==================================================

ALLOWED_STATUSES = {
    "pending",
    "accessed",
    "solved",
    "rejected"
}


# ==================================================
# CLOUDINARY HELPERS (ATTACHMENTS)
# ==================================================

def configure_cloudinary():
    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"]
    )


def upload_attachment(file):
    """Upload a single complaint attachment to Cloudinary.

    Returns a dict describing the file, or None on failure.
    """

    configure_cloudinary()

    public_id = f"campus_connect/complaints/{uuid.uuid4().hex}"

    result = cloudinary.uploader.upload(
        file,
        public_id=public_id,
        resource_type="auto",
        overwrite=False
    )

    url = result.get("secure_url")

    if not url:
        return None

    return {
        "name": file.filename,
        "url": url,
        "type": file.mimetype or ""
    }


# ==================================================
# HELPER: SERIALIZE A COMPLAINT ROW
# ==================================================

def serialize_complaint(complaint):
    if not complaint:
        return complaint

    serialized = dict(complaint)

    # Attachments are stored as a JSON string in the database
    raw_attachments = serialized.get("attachments")

    try:
        serialized["attachments"] = (
            json.loads(raw_attachments) if raw_attachments else []
        )
    except (TypeError, ValueError):
        serialized["attachments"] = []

    if serialized.get("created_at"):
        serialized["created_at"] = serialized["created_at"].strftime(
            "%Y-%m-%d %H:%M:%S"
        )

    return serialized


# ==================================================
# COMPLAINTS HOMEPAGE (STUDENT VIEW)
# ==================================================

@complaints_bp.route("/")
def complaints_homepage():
    return render_template("complaints/complaint.html")


# ==================================================
# COMPLAINTS ADMIN PAGE
# ==================================================

@complaints_bp.route("/admin")
def complaints_admin():
    # Only the dedicated central complaints administrator may open this page.
    if (
        session.get("role") != "admin"
        or (session.get("email") or "").strip().lower() != "complaints-admin@gmail.com"
        or session.get("organization_id")
    ):
        return jsonify({"success": False, "message": "Central complaints administrator access required."}), 403

    return render_template("admin/complaint/complaint_admin.html")


# ==================================================
# GET ALL COMPLAINTS
# GET /complaints/api
# ==================================================

@complaints_bp.route("/api", methods=["GET"])
def list_complaints():
    role = session.get("role")
    email = (session.get("email") or "").strip().lower()
    is_central_complaints_admin = (
        role == "admin"
        and email == "complaints-admin@gmail.com"
        and not session.get("organization_id")
    )

    # Students must be logged in to view the general complaints board.
    # Organization admins must not access the central complaints inbox.
    if not session.get("user_id") or (role == "admin" and not is_central_complaints_admin):
        return jsonify({"success": False, "message": "You are not authorized to view these complaints."}), 403

    complaints = get_all_complaints()

    serialized = [serialize_complaint(complaint) for complaint in complaints]

    # Students can see all general complaint reports, but not other
    # students' personal contact/identity details.
    if not is_central_complaints_admin:
        for complaint in serialized:
            if complaint.get("anonymous"):
                complaint["name"] = None
                complaint["roll"] = None
                complaint["phone"] = None
                complaint["email"] = None
            else:
                complaint["name"] = None
                complaint["roll"] = None
                complaint["phone"] = None
                complaint["email"] = None

    return jsonify({
        "success": True,
        "complaints": serialized
    })


# ==================================================
# SUBMIT A NEW COMPLAINT
# POST /complaints/submit
# ==================================================

@complaints_bp.route("/submit", methods=["POST"])
def submit_complaint():
    title = request.form.get("title", "").strip()
    category = request.form.get("category", "").strip()
    priority = request.form.get("priority", "Medium").strip() or "Medium"
    description = request.form.get("description", "").strip()

    anonymous = request.form.get("anonymous", "false").lower() == "true"

    name = request.form.get("name", "").strip()
    roll = request.form.get("roll", "").strip()
    phone = request.form.get("phone", "").strip()
    email = request.form.get("email", "").strip()
    branch = request.form.get("branch", "").strip()
    year = request.form.get("year", "").strip()
    semester = request.form.get("current_sem", request.form.get("semester", "")).strip()
    organization_slug = request.form.get("organization_slug", "").strip().lower()
    organization = get_organization_by_slug(organization_slug) if organization_slug else None
    if organization_slug and not organization:
        return jsonify({"success": False, "message": "Invalid organization selected."}), 400
    organization_id = organization["id"] if organization else None

    # ----------------------------------------------
    # REQUIRED FIELD VALIDATION
    # ----------------------------------------------

    if not title:
        return jsonify({
            "success": False,
            "message": "Complaint title is required."
        }), 400

    if not category:
        return jsonify({
            "success": False,
            "message": "Please select a category."
        }), 400

    if not description:
        return jsonify({
            "success": False,
            "message": "Please describe the complaint."
        }), 400

    if not anonymous and not name:
        return jsonify({
            "success": False,
            "message": "Please enter your full name."
        }), 400

    # ----------------------------------------------
    # UPLOAD ATTACHMENTS (OPTIONAL, MULTIPLE)
    # ----------------------------------------------

    uploaded_attachments = []

    files = request.files.getlist("attachments")

    for file in files:

        if not file or not file.filename:
            continue

        try:
            attachment = upload_attachment(file)

            if attachment:
                uploaded_attachments.append(attachment)

        except Exception as error:
            print("Cloudinary attachment upload error:", error)

            return jsonify({
                "success": False,
                "message": "Failed to upload one of the attachments."
            }), 500

    # ----------------------------------------------
    # GENERATE UNIQUE REFERENCE ID
    # ----------------------------------------------

    reference_id = f"CMP-{uuid.uuid4().hex[:8].upper()}"

    # ----------------------------------------------
    # SAVE TO DATABASE
    # ----------------------------------------------

    complaint_id = create_complaint(
        reference_id=reference_id,
        organization_id=organization_id,
        title=title,
        category=category,
        priority=priority,
        description=description,
        anonymous=anonymous,
        name=None if anonymous else (name or None),
        roll=None if anonymous else (roll or None),
        phone=None if anonymous else (phone or None),
        email=None if anonymous else (email or None),
        branch=None if anonymous else (branch or None),
        year=None if anonymous else (year or None),
        semester=None if anonymous else (semester or None),
        attachments=(
            json.dumps(uploaded_attachments)
            if uploaded_attachments else None
        )
    )

    if not complaint_id:
        return jsonify({
            "success": False,
            "message": "Could not submit complaint. Please try again."
        }), 500

    return jsonify({
        "success": True,
        "message": "Complaint submitted successfully.",
        "reference_id": reference_id
    }), 201


# ==================================================
# UPDATE COMPLAINT STATUS (ADMIN ONLY)
# POST /complaints/api/<reference_id>/status
# ==================================================

@complaints_bp.route(
    "/api/<reference_id>/status",
    methods=["POST", "PATCH"]
)
def set_complaint_status(reference_id):

    # ----------------------------------------------
    # ONLY ADMINS CAN CHANGE A COMPLAINT'S STATUS
    # ----------------------------------------------

    is_central_complaints_admin = (
        session.get("role") == "admin"
        and (session.get("email") or "").strip().lower() == "complaints-admin@gmail.com"
        and not session.get("organization_id")
    )
    if not is_central_complaints_admin:
        return jsonify({
            "success": False,
            "message": "Only the central complaints administrator can update complaint statuses."
        }), 403

    data = request.get_json(silent=True) or {}
    status = str(data.get("status", "")).strip().lower()

    if status not in ALLOWED_STATUSES:
        return jsonify({
            "success": False,
            "message": (
                "Status must be one of: "
                + ", ".join(sorted(ALLOWED_STATUSES))
            )
        }), 400

    complaint = get_complaint_by_reference(reference_id)

    if not complaint:
        return jsonify({
            "success": False,
            "message": "Complaint not found."
        }), 404

    # Main/general complaints are managed centrally, including rows whose
    # organization_id is NULL. Category complaints use a separate system.
    updated = update_complaint_status(reference_id, status, None)

    if not updated:
        return jsonify({
            "success": False,
            "message": "Could not update complaint status."
        }), 500

    complaint = get_complaint_by_reference(reference_id)

    return jsonify({
        "success": True,
        "message": "Complaint status updated.",
        "complaint": serialize_complaint(complaint)
    })