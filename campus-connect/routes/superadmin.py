from flask import Blueprint, render_template, request, jsonify, session, abort
from database.queries import (
    get_all_users,
    update_user_role_and_org,
    get_all_organizations,
    get_all_complaints,
    get_all_applications
)

superadmin_bp = Blueprint(
    "superadmin",
    __name__,
    url_prefix="/superadmin"
)


@superadmin_bp.before_request
def verify_superadmin():
    if session.get("role") != "super_admin":
        abort(403)


@superadmin_bp.route("/")
def superadmin_dashboard():
    return render_template("admin/superadmin.html")


@superadmin_bp.route("/users", methods=["GET"])
def get_users_list():
    users = get_all_users()
    orgs = get_all_organizations()
    
    result_users = []
    for u in users:
        date_str = u["created_at"].strftime("%d %b %Y") if u.get("created_at") else ""
        result_users.append({
            "id": u["id"],
            "username": u["username"],
            "email": u["email"],
            "phone": u.get("phone") or "",
            "role": u["role"],
            "organization_id": u.get("organization_id"),
            "organization_name": u.get("organization_name") or "None",
            "is_verified": bool(u.get("is_verified")),
            "created_at": date_str
        })

    return jsonify({
        "success": True,
        "users": result_users,
        "organizations": orgs
    })


@superadmin_bp.route("/users/update-role", methods=["POST"])
def update_user_role_route():
    data = request.get_json() or request.form
    user_id = data.get("user_id")
    role = data.get("role", "").strip()
    org_id = data.get("organization_id")

    if not user_id or role not in ["user", "admin", "super_admin"]:
        return jsonify({"success": False, "message": "Invalid user ID or role."}), 400

    if org_id in ["", "none", "null", None]:
        org_id = None
    else:
        try:
            org_id = int(org_id)
        except ValueError:
            org_id = None

    updated = update_user_role_and_org(user_id, role, org_id)
    if updated:
        return jsonify({"success": True, "message": "User role and organization updated successfully."})
    return jsonify({"success": False, "message": "Failed to update user role."}), 500


@superadmin_bp.route("/stats", methods=["GET"])
def get_system_stats():
    users = get_all_users()
    complaints = get_all_complaints()
    apps = get_all_applications()
    orgs = get_all_organizations()

    return jsonify({
        "success": True,
        "stats": {
            "total_users": len(users),
            "total_organizations": len(orgs),
            "total_complaints": len(complaints),
            "total_applications": len(apps)
        }
    })
