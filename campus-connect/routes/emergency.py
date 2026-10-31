from flask import Blueprint, render_template, session, abort, request, jsonify, redirect, url_for, flash
from database.db import get_db_connection

emergency_bp = Blueprint("emergency", __name__, url_prefix="/emergency")

VALID_CATEGORIES = {"Weather", "Medical", "Security", "Fire", "Electrical", "Water", "General"}
VALID_PRIORITIES = {"critical", "warning", "info"}


def _fetch_active_emergencies():
    connection = get_db_connection()
    if connection is None:
        return []
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, title, message, category, priority, is_important,
                   status, created_by, created_at
            FROM emergencies
            WHERE status IN ('pending', 'approved')
            ORDER BY created_at DESC, id DESC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()
        connection.close()


def _is_emergency_admin():
    return session.get("role") in {"admin", "emergency_admin"}


@emergency_bp.route("/")
def emergency_homepage():
    return render_template("emergency/emergency.html", emergencies=_fetch_active_emergencies())


@emergency_bp.route("/api/active", methods=["GET"])
def active_emergencies_api():
    emergencies = _fetch_active_emergencies()
    for item in emergencies:
        created_at = item.get("created_at")
        item["created_at"] = created_at.isoformat() if created_at else None
    return jsonify({"success": True, "emergencies": emergencies})


@emergency_bp.route("/api", methods=["POST"])
def create_emergency_api():
    if not session.get("user_id"):
        return jsonify({"success": False, "message": "Please log in to publish an emergency."}), 401

    data = request.get_json(silent=True) or request.form
    title = str(data.get("title", "")).strip()
    message = str(data.get("message", "")).strip()
    category = str(data.get("category", "")).strip().title()
    priority = str(data.get("priority", "")).strip().lower()
    is_important = str(data.get("is_important", "false")).lower() in {"1", "true", "yes", "on"}

    if not title or not message or category not in VALID_CATEGORIES or priority not in VALID_PRIORITIES:
        return jsonify({"success": False, "message": "Please provide a valid title, message, category and priority."}), 400

    connection = get_db_connection()
    if connection is None:
        return jsonify({"success": False, "message": "Database connection is unavailable. Please try again."}), 503
    cursor = connection.cursor()
    try:
        cursor.execute("""
            INSERT INTO emergencies
                (title, message, category, priority, is_important, status, created_by)
            VALUES (%s, %s, %s, %s, %s, 'pending', %s)
        """, (title, message, category, priority, is_important, session["user_id"]))
        connection.commit()
        emergency_id = cursor.lastrowid
        return jsonify({
            "success": True,
            "message": "Emergency published and is now visible. It is awaiting admin review.",
            "emergency": {"id": emergency_id, "title": title, "message": message,
                          "category": category, "priority": priority,
                          "is_important": is_important, "status": "pending"}
        }), 201
    except Exception as error:
        connection.rollback()
        print("Create emergency error:", error)
        return jsonify({"success": False, "message": "Could not save the emergency. Please try again."}), 500
    finally:
        cursor.close()
        connection.close()


@emergency_bp.route("/admin/")
def emergency_admin():
    if not _is_emergency_admin():
        abort(403)
    connection = get_db_connection()
    if connection is None:
        emergencies = []
        flash("Database connection is unavailable.", "error")
    else:
        cursor = connection.cursor(dictionary=True)
        try:
            cursor.execute("""
                SELECT id, title, message, category, priority, is_important,
                       status, created_by, created_at
                FROM emergencies
                ORDER BY created_at DESC, id DESC
            """)
            emergencies = cursor.fetchall()
        finally:
            cursor.close()
            connection.close()
    return render_template("admin/emergency_admin.html", emergencies=emergencies)


@emergency_bp.route("/admin/<int:emergency_id>/keep", methods=["POST"])
def approve_emergency_route(emergency_id):
    if not _is_emergency_admin():
        abort(403)
    connection = get_db_connection()
    if connection is None:
        abort(503)
    cursor = connection.cursor()
    try:
        cursor.execute("UPDATE emergencies SET status = 'approved' WHERE id = %s AND status = 'pending'", (emergency_id,))
        connection.commit()
        if cursor.rowcount == 0:
            flash("Emergency was not found or has already been reviewed.", "warning")
        else:
            flash("Emergency kept and marked as approved.", "success")
    except Exception as error:
        connection.rollback()
        print("Keep emergency error:", error)
        flash("Could not update this emergency.", "error")
    finally:
        cursor.close()
        connection.close()
    return redirect(url_for("emergency.emergency_admin"))


@emergency_bp.route("/admin/<int:emergency_id>/delete", methods=["POST"])
def delete_emergency_route(emergency_id):
    if not _is_emergency_admin():
        abort(403)
    connection = get_db_connection()
    if connection is None:
        abort(503)
    cursor = connection.cursor()
    try:
        cursor.execute("DELETE FROM emergencies WHERE id = %s", (emergency_id,))
        connection.commit()
        flash("Emergency deleted and removed from public displays.", "success" if cursor.rowcount else "warning")
    except Exception as error:
        connection.rollback()
        print("Delete emergency error:", error)
        flash("Could not delete this emergency.", "error")
    finally:
        cursor.close()
        connection.close()
    return redirect(url_for("emergency.emergency_admin"))
