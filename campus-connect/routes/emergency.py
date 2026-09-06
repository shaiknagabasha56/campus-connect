from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    flash,
    session
)

from database.queries import (
    create_emergency,
    get_all_emergencies,
    approve_emergency,
    reject_emergency,
    delete_emergency
)


emergency_bp = Blueprint(
    "emergency",
    __name__,
    url_prefix="/emergency"
)


# -------------------------------
# USER EMERGENCY PAGE
# -------------------------------
@emergency_bp.route("/", methods=["GET"])
def emergency_homepage():

    return render_template(
        "emergency/emergency.html"
    )


# -------------------------------
# CREATE / SUBMIT EMERGENCY
# -------------------------------
@emergency_bp.route("/create", methods=["POST"])
def create_emergency_route():

    # Get logged-in user's information
    organization_id = session.get("organization_id")
    created_by = session.get("user_id")

    # Check whether user is logged in
    if not organization_id or not created_by:
        flash(
            "Please login first.",
            "error"
        )

        return redirect(
            url_for("auth.login")
        )

    # Get emergency form data
    title = request.form.get("title")
    message = request.form.get("message")
    category = request.form.get("category")
    priority = request.form.get("priority")

    # Checkbox returns value only when checked
    is_important = (
        1 if request.form.get("is_important")
        else 0
    )

    # Save emergency into database
    emergency_id = create_emergency(
        organization_id,
        created_by,
        title,
        message,
        category,
        priority,
        is_important
    )

    # Check whether emergency was saved
    if emergency_id:

        flash(
            "Emergency submitted successfully.",
            "success"
        )

    else:

        flash(
            "Failed to submit emergency.",
            "error"
        )

    return redirect(
        url_for("emergency.emergency_homepage")
    )


# -------------------------------
# ADMIN EMERGENCIES PAGE
# -------------------------------
@emergency_bp.route("/admin", methods=["GET"])
def admin_emergencies():

    # Get admin's organization
    organization_id = session.get(
        "organization_id"
    )

    # Check login
    if not organization_id:
        flash(
            "Please login first.",
            "error"
        )

        return redirect(
            url_for("auth.login")
        )

    # Get emergencies from database
    emergencies = get_all_emergencies(
        organization_id
    )

    return render_template(
        "emergency/emergency_admin.html",
        emergencies=emergencies
    )


# -------------------------------
# APPROVE EMERGENCY
# -------------------------------
@emergency_bp.route(
    "/admin/approve/<int:emergency_id>",
    methods=["POST"]
)
def approve_emergency_route(emergency_id):

    success = approve_emergency(
        emergency_id
    )

    if success:

        flash(
            "Emergency approved successfully.",
            "success"
        )

    else:

        flash(
            "Emergency approval failed.",
            "error"
        )

    return redirect(
        url_for("emergency.admin_emergencies")
    )


# -------------------------------
# REJECT EMERGENCY
# -------------------------------
@emergency_bp.route(
    "/admin/reject/<int:emergency_id>",
    methods=["POST"]
)
def reject_emergency_route(emergency_id):

    success = reject_emergency(
        emergency_id
    )

    if success:

        flash(
            "Emergency rejected.",
            "success"
        )

    else:

        flash(
            "Emergency rejection failed.",
            "error"
        )

    return redirect(
        url_for("emergency.admin_emergencies")
    )


# -------------------------------
# DELETE EMERGENCY
# -------------------------------
@emergency_bp.route(
    "/admin/delete/<int:emergency_id>",
    methods=["POST"]
)
def delete_emergency_route(emergency_id):

    success = delete_emergency(
        emergency_id
    )

    if success:

        flash(
            "Emergency deleted successfully.",
            "success"
        )

    else:

        flash(
            "Emergency deletion failed.",
            "error"
        )

    return redirect(
        url_for("emergency.admin_emergencies")
    )