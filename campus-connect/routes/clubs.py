from flask import Blueprint, url_for, render_template, jsonify, request, session, abort

from database.queries import (
    get_organization_by_slug,
    get_organization_profile,
    upsert_organization_leader,
    upsert_organization_profile
)
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
    organization = get_organization_by_slug("pixelro")
    profile = get_organization_profile(organization["id"]) if organization else None
    return render_template(
        "clubs-pages/pixelro.html",
        organization=organization,
        profile=profile or {},
        leaders=(profile or {}).get("leaders", [])
    )


@clubs_bp.route("/api/admin/profile", methods=["PUT"])
def update_admin_organization_profile():
    if session.get("role") != "admin":
        abort(403)

    organization_id = session.get("organization_id")
    if not organization_id:
        abort(403)

    data = request.get_json(silent=True) or {}
    if not upsert_organization_profile(organization_id, data):
        return jsonify({"success": False, "message": "Could not save organization profile."}), 500

    return jsonify({"success": True})


@clubs_bp.route("/api/admin/leaders/<int:display_order>", methods=["PUT"])
def update_admin_organization_leader(display_order):
    if session.get("role") != "admin":
        abort(403)

    organization_id = session.get("organization_id")
    if not organization_id:
        abort(403)

    data = request.get_json(silent=True) or {}
    if not upsert_organization_leader(organization_id, display_order, data):
        return jsonify({"success": False, "message": "Could not save organization leader."}), 500

    return jsonify({"success": True})


@clubs_bp.route("/api/public/<string:organization_slug>", methods=["GET"])
def public_organization_profile(organization_slug):
    organization = get_organization_by_slug(organization_slug)
    if not organization:
        return jsonify({"success": False, "message": "Organization not found."}), 404

    profile = get_organization_profile(organization["id"]) or {}
    return jsonify({
        "success": True,
        "organization": organization,
        "profile": profile,
        "leaders": profile.get("leaders", [])
    })


#admin routes for clubs:-
@clubs_bp.route("/artix/admin")
def artix_admin():
    return render_template("admin/clubs/artix_admin.html")

@clubs_bp.route("/techxcel/admin")
def techxcel_admin():   
    return render_template("admin/clubs/techxcel_admin.html")

@clubs_bp.route("/aws/admin")
def aws_admin():
    return render_template("admin/clubs/aws_admin.html")

@clubs_bp.route("/icro/admin")
def icro_admin():
    return render_template("admin/clubs/icro_admin.html")

@clubs_bp.route("/khelsaathi/admin")
def khelsaathi_admin():
    return render_template("admin/clubs/khelsaathi_admin.html")

@clubs_bp.route("/kaladharani/admin")
def kaladharani_admin():
    return render_template("admin/clubs/kaladharani_admin.html")

@clubs_bp.route("/sarvasrijana/admin")
def sarvasrijana_admin():
    return render_template("admin/clubs/sarvasrijana_admin.html")

@clubs_bp.route("/pixelro/admin")
def pixelro_admin():
    organization = get_organization_by_slug("pixelro")
    profile = get_organization_profile(organization["id"]) if organization else None
    return render_template(
        "admin/clubs/pixelro_admin.html",
        organization=organization,
        profile=profile or {},
        leaders=(profile or {}).get("leaders", [])
    )


