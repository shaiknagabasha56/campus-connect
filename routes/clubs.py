from flask import Blueprint,url_for,render_template
#from services.club_services import get_clubs

clubs_bp=Blueprint(
    "clubs",
    __name__,
    url_prefix="/clubs"
)

@clubs_bp.route("/")
def clubs_homepage():
    return render_template("clubs/clubs.html")

@clubs_bp.route("/artix")
def artix_homepage():
    return render_template("clubs-pages/artix.html")

@clubs_bp.route("/techxcel")
def techxcel_homepage():
    return render_template("clubs-pages/techxcel.html")

@clubs_bp.route("/aws")
def aws_homepage():
    return render_template("clubs-pages/aws.html")

@clubs_bp.route("/icro")
def icro_homepage():
    return render_template("clubs-pages/icro.html")

@clubs_bp.route("/khelsaathi")
def khelsaathi_homepage():
    return render_template("clubs-pages/khelsaathi.html")

@clubs_bp.route("/kaladharani")
def kaladharani_homepage():
    return render_template("clubs-pages/kaladharani.html")

@clubs_bp.route("/sarvasrijana")
def sarvasrijana_homepage():
    return render_template("clubs-pages/sarvasrijana.html")

@clubs_bp.route("/pixelro")
def pixelro_homepage():
    return render_template("clubs-pages/pixelro.html")