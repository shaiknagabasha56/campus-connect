from flask import Blueprint,url_for,render_template
#from services.non_academic_services import get_non_academic

non_academic_bp=Blueprint(
    "non_academic",
    __name__,
    url_prefix="/non_academic"
)

@non_academic_bp.route("/")
def non_academic_homepage():
    return render_template("non-academic/non-academic.html")

    
@non_academic_bp.route("/mess")
def mess_homepage():
    return render_template("non-academic-pages/mess.html")

@non_academic_bp.route("/canteen")
def canteen_homepage():
    return render_template("non-academic-pages/canteen.html")

@non_academic_bp.route("/store")
def store_homepage():
    return render_template("non-academic-pages/store.html")

@non_academic_bp.route("/hostel")
def hostel_homepage():
    return render_template("non-academic-pages/hostel.html")

@non_academic_bp.route("/it-infra")
def it_infra_homepage():
    return render_template("non-academic-pages/it-infra.html")

@non_academic_bp.route("/hospital")
def hospital_homepage():
    return render_template("non-academic-pages/hospital.html")

@non_academic_bp.route("/scholorship-office")
def scholorship_homepage():
    return render_template("non-academic-pages/scholarship.html")

@non_academic_bp.route("/financial-office")
def financial_homepage():
    return render_template("non-academic-pages/financial.html")