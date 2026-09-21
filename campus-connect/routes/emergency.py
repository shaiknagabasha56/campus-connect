
from flask import (
    Blueprint,
    render_template,
    request,
    redirect,
    url_for,
    session,
    abort
)

from database.queries import (
    create_emergency,
    get_approved_emergencies,
    get_important_emergencies,
    get_all_emergencies,
    approve_emergency,
    delete_emergency
)


emergency_bp = Blueprint(
    "emergency",
    __name__,
    url_prefix="/emergency"
)


# ==================================================
# STUDENT EMERGENCY PAGE
# ==================================================

@emergency_bp.route("/")
def emergency_homepage():

    organization_id = session.get("organization_id")

    emergencies = get_approved_emergencies(
        organization_id
    )

    important_emergencies = get_important_emergencies(
        organization_id
    )

    return render_template(
        "emergency/emergency.html",
        emergencies=emergencies,
        important_emergencies=important_emergencies
    )


# ==================================================
# SUBMIT NEW EMERGENCY
# ==================================================

@emergency_bp.route(
    "/submit",
    methods=["POST"]
)
def submit_emergency():

    # User must be logged in
    if "user_id" not in session:
        return redirect(
            url_for("auth.login")
        )

    title = request.form.get(
        "title",
        ""
    ).strip()

    message = request.form.get(
        "message",
        ""
    ).strip()

    category = request.form.get(
        "category",
        ""
    ).strip()

    priority = request.form.get(
        "priority",
        "info"
    ).strip()

    important = request.form.get(
        "important"
    ) == "1"

    # ------------------------------------------
    # VALIDATION
    # ------------------------------------------

    if not title or not message:

        return redirect(
            url_for("emergency.emergency_homepage")
        )

    allowed_categories = [
        "Hostel",
        "Weather",
        "Electrical",
        "Medical",
        "Security",
        "Fire",
        "Other"
    ]

    allowed_priorities = [
        "critical",
        "warning",
        "info"
    ]

    if category not in allowed_categories:

        category = "Other"

    if priority not in allowed_priorities:

        priority = "info"

    # ------------------------------------------
    # DATABASE
    # ------------------------------------------

    create_emergency(
        organization_id=session.get(
            "organization_id"
        ),

        created_by=session.get(
            "user_id"
        ),

        title=title,

        message=message,

        category=category,

        priority=priority,

        important=important
    )

    return redirect(
        url_for(
            "emergency.emergency_homepage"
        )
    )


# ==================================================
# ADMIN EMERGENCY PAGE
# ==================================================

@emergency_bp.route("/admin/")
def emergency_admin():

    # ------------------------------------------
    # ADMIN CHECK
    # ------------------------------------------

    if session.get("role") != "admin":
        abort(403)

    organization_id = session.get(
        "organization_id"
    )

    emergencies = get_all_emergencies(
        organization_id
    )

    return render_template(
        "emergency/emergency_admin.html",
        emergencies=emergencies
    )


# ==================================================
# APPROVE EMERGENCY
# ==================================================

@emergency_bp.route(
    "/admin/approve/<int:emergency_id>",
    methods=["POST"]
)
def approve_emergency_route(emergency_id):

    if session.get("role") != "admin":
        abort(403)

    organization_id = session.get(
        "organization_id"
    )

    approve_emergency(
        emergency_id,
        organization_id
    )

    return redirect(
        url_for(
            "emergency.emergency_admin"
        )
    )


# ==================================================
# DELETE EMERGENCY
# ==================================================

@emergency_bp.route(
    "/admin/delete/<int:emergency_id>",
    methods=["POST"]
)
def delete_emergency_route(emergency_id):

    if session.get("role") != "admin":
        abort(403)

    organization_id = session.get(
        "organization_id"
    )

    delete_emergency(
        emergency_id,
        organization_id
    )

    return redirect(
        url_for(
            "emergency.emergency_admin"
        )
    )
