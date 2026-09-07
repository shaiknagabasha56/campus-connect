from flask import Blueprint,render_template,url_for
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
    return render_template("admin/emergency/emergency_admin.html")
