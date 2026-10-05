from flask import Blueprint, render_template, session, abort

emergency_bp = Blueprint(
    "emergency",
    __name__,
    url_prefix="/emergency"
)

@emergency_bp.route("/")
def emergency_homepage():
    return render_template("emergency/emergency.html")

@emergency_bp.route("/admin/")
def emergency_admin():
    # Main Admin and Emergency Admin may access Emergency management.
    if session.get("role") not in {"admin", "emergency_admin"}:
        abort(403)

    return render_template("admin/emergency/emergency_admin.html")