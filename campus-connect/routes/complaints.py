from flask import Blueprint, render_template, request, jsonify
import uuid

from database.queries import (
    create_complaint,
    get_all_complaints
)


complaints_bp = Blueprint(
    "complaints",
    __name__,
    url_prefix="/complaints"
)


# ============================================================
# COMPLAINT PAGE
# ============================================================

@complaints_bp.route("/")
def complaints_homepage():

    return render_template(
        "complaints/complaint.html"
    )


# ============================================================
# SUBMIT COMPLAINT
# ============================================================

@complaints_bp.route("/submit", methods=["POST"])
def submit_complaint():

    # ---------------------------------------------------------
    # GET COMPLAINT DATA FROM FORM
    # ---------------------------------------------------------

    title = request.form.get("title", "").strip()
    category = request.form.get("category", "").strip()
    priority = request.form.get("priority", "Medium").strip()
    description = request.form.get("description", "").strip()

    anonymous = (
        request.form.get("anonymous", "false").lower()
        == "true"
    )

    name = request.form.get("name", "").strip()
    roll = request.form.get("roll", "").strip()
    phone = request.form.get("phone", "").strip()


    # ---------------------------------------------------------
    # VALIDATION
    # ---------------------------------------------------------

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
            "message": "Complaint details are required."
        }), 400


    # ---------------------------------------------------------
    # REMOVE STUDENT DETAILS FOR ANONYMOUS COMPLAINT
    # ---------------------------------------------------------

    if anonymous:
        name = None
        roll = None
        phone = None


    # ---------------------------------------------------------
    # CREATE REFERENCE ID
    # ---------------------------------------------------------

    reference_id = (
        "CMP-" +
        uuid.uuid4().hex[:8].upper()
    )


    # ---------------------------------------------------------
    # SAVE COMPLAINT TO MYSQL
    # ---------------------------------------------------------

    saved = create_complaint(
        reference_id=reference_id,
        title=title,
        category=category,
        priority=priority,
        description=description,
        anonymous=anonymous,
        name=name,
        roll=roll,
        phone=phone
    )


    # ---------------------------------------------------------
    # CHECK DATABASE RESULT
    # ---------------------------------------------------------

    if not saved:
        return jsonify({
            "success": False,
            "message": "Could not save complaint. Please try again."
        }), 500


    # ---------------------------------------------------------
    # RECEIVE ATTACHMENTS
    # ---------------------------------------------------------

    attachments = request.files.getlist(
        "attachments"
    )

    print(
        "Number of attachments received:",
        len(attachments)
    )

    for file in attachments:

        if file and file.filename:

            print(
                "Attachment received:",
                file.filename
            )


    # ---------------------------------------------------------
    # SUCCESS RESPONSE
    # ---------------------------------------------------------

    return jsonify({
        "success": True,
        "message": "Complaint submitted successfully.",
        "reference_id": reference_id
    })


# ============================================================
# GET ALL COMPLAINTS
# ============================================================

@complaints_bp.route("/api", methods=["GET"])
def complaints_api():

    complaints = get_all_complaints()

    return jsonify({
        "success": True,
        "complaints": complaints
    })
    # ============================================================
# COMPLAINT ADMIN PAGE
# ============================================================

@complaints_bp.route("/admin")
def complaints_admin():

    return render_template(
        "admin/complaint/complaint_admin.html"
    )