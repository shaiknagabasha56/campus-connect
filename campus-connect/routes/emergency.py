from flask import Blueprint, render_template, jsonify, request, session
from database.queries import (
    get_active_emergency_notices,
    get_all_emergency_notices,
    create_emergency_notice
)

emergency_bp = Blueprint(
    "emergency",
    __name__,
    url_prefix="/emergency"
)


@emergency_bp.route("/")
def emergency_homepage():
    return render_template("emergency/emergency.html")


@emergency_bp.route("/notices", methods=["GET"])
def get_emergency_notices():
    notices = get_active_emergency_notices()
    result = []
    for n in notices:
        date_str = n["created_at"].strftime("%d %b, %I:%M %p") if n.get("created_at") else ""
        result.append({
            "id": n["id"],
            "title": n["title"],
            "details": n.get("details") or "",
            "category": n.get("category") or "Emergency",
            "priority": n.get("priority") or "High",
            "date": date_str
        })

    # Default fallback notices if table is empty
    if not result:
        result = [
            {"id": 1, "title": "Need A+ blood for emergency surgery", "details": "Contact hospital desk immediately", "category": "Medical", "priority": "Critical", "date": "Active"},
            {"id": 2, "title": "Scheduled maintenance outage in block B", "details": "Electricity will be restored by 6 PM", "category": "Infrastructure", "priority": "Medium", "date": "Active"},
            {"id": 3, "title": "Director interactive session at 4:00 PM in SAC", "details": "All students welcome", "category": "Notice", "priority": "High", "date": "Today"}
        ]

    return jsonify({"success": True, "notices": result})


@emergency_bp.route("/create", methods=["POST"])
def create_notice():
    if session.get("role") not in ["admin", "super_admin"]:
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    data = request.get_json() or request.form
    title = data.get("title", "").strip()
    details = data.get("details", "").strip()
    category = data.get("category", "Emergency").strip()
    priority = data.get("priority", "High").strip()

    if not title:
        return jsonify({"success": False, "message": "Title is required."}), 400

    notice_id = create_emergency_notice(
        title=title,
        details=details,
        category=category,
        priority=priority,
        created_by=session.get("user_id")
    )

    if notice_id:
        return jsonify({"success": True, "message": "Emergency notice created successfully."}), 201
    return jsonify({"success": False, "message": "Failed to create emergency notice."}), 500