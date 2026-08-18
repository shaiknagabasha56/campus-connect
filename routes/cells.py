from flask import Blueprint,url_for,render_template
#from services.cells_services import get_cells

cells_bp=Blueprint(
    "cells",
    __name__,
    url_prefix="/cells"
)

@cells_bp.route("/")
def cells_homepage():
    return render_template("cells/cells.html")

@cells_bp.route("/ecell")
def ecell_homepage():
    return render_template("cells-pages/ecell.html")

@cells_bp.route("/cdpc")
def cdpc_homepage():
    return render_template("cells-pages/cdpc.html")

@cells_bp.route("/hec")
def hec_homepage():
    return render_template("cells-pages/hec.html")

