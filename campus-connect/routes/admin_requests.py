from flask import Blueprint, render_template, request, session, redirect, flash
from database.queries import create_admin_request, get_all_organizations_list

admin_requests_bp = Blueprint(
    "admin_requests",
    __name__,
    url_prefix="/admin-requests"
)


@admin_requests_bp.route("/apply", methods=["GET", "POST"])
def apply():

    if not session.get("user_id"):
        return redirect("/auth/login")

    if request.method == "POST":
        organization_id = request.form.get("organization_id")

        if not organization_id:
            flash("Please select a club.")
            return redirect("/admin-requests/apply")

        result = create_admin_request(session["user_id"], organization_id)

        if result == "duplicate":
            flash("You already have a pending request.")
        else:
            flash("Request submitted! A super admin will review it.")

        return redirect("/admin-requests/apply")

    organizations = get_all_organizations_list()
    return render_template("admin_requests/apply.html", organizations=organizations)