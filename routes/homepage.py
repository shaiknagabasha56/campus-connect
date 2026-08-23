from flask import Blueprint,url_for,render_template,redirect,session

homepage_bp=Blueprint(
    "homepage",
    __name__,
    url_prefix="/homepage"
)


@homepage_bp.route("/home")
def homepage():
    return render_template("home/homepage.html")
    