from flask import Blueprint,render_template,url_for
#services

complaints_bp=Blueprint(
    "complaints",
    __name__,
    url_prefix="/complaints"
)

@complaints_bp.route("/")
def complaints_homepage():
    return render_template("complaints/complaint.html")