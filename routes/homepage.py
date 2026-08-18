from flask import Blueprint,url_for,render_template
#from services.academic_services import get_academic

homepage_bp=Blueprint(
    "homepage",
    __name__,
    url_prefix="/homepage"
)

@homepage_bp.route("/")
def homepage():
    return render_template("home/homepage.html")

    