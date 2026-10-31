from flask import Blueprint, jsonify, request, session
from database.db import get_db_connection

community_chat_bp = Blueprint("community_chat", __name__, url_prefix="/api/community")


def _json_error(message, status=400):
    return jsonify({"success": False, "message": message}), status


def _current_user():
    user_id = session.get("user_id")
    username = (session.get("username") or "Campus member").strip()
    if not user_id:
        return None, None
    return int(user_id), username[:100]


@community_chat_bp.get("/messages")
def get_messages():
    user_id, _ = _current_user()
    if not user_id:
        return _json_error("Please log in to use community chat.", 401)
    connection = get_db_connection()
    if not connection:
        return _json_error("Database connection unavailable.", 503)
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id, user_id, sender_name, message, created_at
            FROM community_chat_messages
            ORDER BY id DESC LIMIT 100
        """)
        rows = cursor.fetchall()
        rows.reverse()
        return jsonify({"success": True, "messages": rows})
    finally:
        cursor.close()
        connection.close()


@community_chat_bp.post("/messages")
def send_message():
    user_id, username = _current_user()
    if not user_id:
        return _json_error("Please log in to send a message.", 401)
    data = request.get_json(silent=True) or {}
    message = str(data.get("message") or "").strip()
    if not message:
        return _json_error("Message cannot be empty.")
    if len(message) > 1000:
        return _json_error("Messages must be 1000 characters or fewer.")
    connection = get_db_connection()
    if not connection:
        return _json_error("Database connection unavailable.", 503)
    cursor = connection.cursor()
    try:
        cursor.execute("""
            INSERT INTO community_chat_messages (user_id, sender_name, message)
            VALUES (%s, %s, %s)
        """, (user_id, username, message))
        connection.commit()
        message_id = cursor.lastrowid
        return jsonify({"success": True, "message": {
            "id": message_id, "user_id": user_id, "sender_name": username,
            "message": message
        }}), 201
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


@community_chat_bp.get("/polls")
def get_polls():
    user_id, _ = _current_user()
    if not user_id:
        return _json_error("Please log in to view polls.", 401)
    connection = get_db_connection()
    if not connection:
        return _json_error("Database connection unavailable.", 503)
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT p.id, p.user_id, p.creator_name, p.question, p.created_at,
                   o.id AS option_id, o.option_text,
                   COUNT(v.id) AS vote_count,
                   MAX(CASE WHEN v.user_id = %s THEN 1 ELSE 0 END) AS user_voted
            FROM community_polls p
            JOIN community_poll_options o ON o.poll_id = p.id
            LEFT JOIN community_poll_votes v ON v.option_id = o.id
            GROUP BY p.id, p.user_id, p.creator_name, p.question, p.created_at,
                     o.id, o.option_text
            ORDER BY p.id DESC
        """, (user_id,))
        rows = cursor.fetchall()
        polls = {}
        for row in rows:
            poll = polls.setdefault(row["id"], {
                "id": row["id"], "user_id": row["user_id"],
                "creator_name": row["creator_name"], "question": row["question"],
                "created_at": row["created_at"], "options": [], "user_vote": None
            })
            poll["options"].append({
                "id": row["option_id"], "text": row["option_text"],
                "votes": int(row["vote_count"])
            })
            if row["user_voted"]:
                poll["user_vote"] = row["option_id"]
        return jsonify({"success": True, "polls": list(polls.values())})
    finally:
        cursor.close()
        connection.close()


@community_chat_bp.post("/polls")
def create_poll():
    user_id, username = _current_user()
    if not user_id:
        return _json_error("Please log in to create a poll.", 401)
    data = request.get_json(silent=True) or {}
    question = str(data.get("question") or "").strip()
    options = data.get("options") or []
    options = [str(option).strip() for option in options if str(option).strip()]
    if len(question) < 5 or len(question) > 240:
        return _json_error("Poll question must be between 5 and 240 characters.")
    if len(options) < 2 or len(options) > 6:
        return _json_error("A poll needs between 2 and 6 options.")
    if any(len(option) > 100 for option in options):
        return _json_error("Each poll option must be 100 characters or fewer.")
    if len({option.casefold() for option in options}) != len(options):
        return _json_error("Poll options must be unique.")
    connection = get_db_connection()
    if not connection:
        return _json_error("Database connection unavailable.", 503)
    cursor = connection.cursor()
    try:
        cursor.execute("INSERT INTO community_polls (user_id, creator_name, question) VALUES (%s, %s, %s)",
                       (user_id, username, question))
        poll_id = cursor.lastrowid
        cursor.executemany("INSERT INTO community_poll_options (poll_id, option_text) VALUES (%s, %s)",
                           [(poll_id, option) for option in options])
        connection.commit()
        return jsonify({"success": True, "poll_id": poll_id}), 201
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()


@community_chat_bp.post("/polls/<int:poll_id>/vote")
def vote_poll(poll_id):
    user_id, _ = _current_user()
    if not user_id:
        return _json_error("Please log in to vote.", 401)
    data = request.get_json(silent=True) or {}
    try:
        option_id = int(data.get("option_id"))
    except (TypeError, ValueError):
        return _json_error("Choose a valid poll option.")
    connection = get_db_connection()
    if not connection:
        return _json_error("Database connection unavailable.", 503)
    cursor = connection.cursor()
    try:
        cursor.execute("SELECT id FROM community_poll_options WHERE id=%s AND poll_id=%s", (option_id, poll_id))
        if not cursor.fetchone():
            return _json_error("That option does not belong to this poll.")
        cursor.execute("SELECT id FROM community_poll_votes WHERE poll_id=%s AND user_id=%s", (poll_id, user_id))
        existing = cursor.fetchone()
        if existing:
            cursor.execute("UPDATE community_poll_votes SET option_id=%s WHERE id=%s", (option_id, existing[0]))
        else:
            cursor.execute("INSERT INTO community_poll_votes (poll_id, option_id, user_id) VALUES (%s, %s, %s)",
                           (poll_id, option_id, user_id))
        connection.commit()
        return jsonify({"success": True, "message": "Your vote has been recorded."})
    except Exception:
        connection.rollback()
        raise
    finally:
        cursor.close()
        connection.close()
