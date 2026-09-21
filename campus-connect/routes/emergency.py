from flask import Blueprint, render_template, url_for, session, abort
#services

emergency_bp=Blueprint(
    "emergency",
    __name__,
    url_prefix="/emergency"
)
@emergency_bp.route("/")
def emergency_homepage():
    return render_template("emergency/emergency.html")
    
@emergency_bp.route("/admin/")
def emergency_admin():
    # app.py only guards paths ending in "/admin" (no trailing slash),
    # so this route checks the role itself.
    if session.get("role") != "admin":
        abort(403)
    return render_template("admin/emergency/emergency_admin.html")
