from flask import Blueprint,url_for,render_template
#from services.academic_services import get_academic

academic_bp=Blueprint(
    "academic",
    __name__,
    url_prefix="/academic"
)

@academic_bp.route("/")
def academic_homepage():
    return render_template("academic/academic.html")

@academic_bp.route("/cse")
def cse_homepage():
    return render_template("academic-pages/cse.html")

@academic_bp.route("/ece")
def ece_homepage():
    return render_template("academic-pages/ece.html")

@academic_bp.route("/civil")
def civil_homepage():
    return render_template("academic-pages/civil.html")

@academic_bp.route("/eee")
def eee_homepage():
    return render_template("academic-pages/eee.html")

@academic_bp.route("/mech")
def mech_homepage():
    return render_template("academic-pages/mech.html")

@academic_bp.route("/metallurgy")
def metallurgy_homepage():
    return render_template("academic-pages/metallurgy.html")

@academic_bp.route("/chemical")
def chemical_homepage():
    return render_template("academic-pages/chemical.html")

@academic_bp.route("/ai-ml")
def ai_ml_homepage():
    return render_template("academic-pages/ai-ml.html")