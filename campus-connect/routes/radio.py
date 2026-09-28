"""
Campus Connect - College-wide Radio routes.

STEP 1:
- Student/homepage state API
- Admin radio API foundation
- Database-backed channels and radio items

The Radio is intentionally college-wide, so radio records do NOT use
organization_id. Admin authorization is based on the existing session
role='admin'.
"""

from flask import Blueprint, jsonify, request, session, abort, render_template, current_app
import cloudinary
import cloudinary.uploader
import uuid
import os
from livekit import api as livekit_api
from datetime import timedelta
from database.db import get_db_connection


radio_bp = Blueprint(
    "radio",
    __name__,
    url_prefix="/radio"
)

CHANNEL_ORDER = [
    "college",
    "commentary",
    "meetings",
    "songs",
]


def require_admin():
    """Require a logged-in admin for Radio management endpoints."""
    if not session.get("user_id"):
        abort(401)

    if session.get("role") != "admin":
        abort(403)

    return session.get("user_id")


def get_channel_by_key(cursor, channel_key):
    cursor.execute(
        """
        SELECT
            id,
            channel_key,
            name,
            description,
            stream_url,
            is_enabled,
            is_live
        FROM radio_channels
        WHERE channel_key = %s
        LIMIT 1
        """,
        (channel_key,),
    )

    return cursor.fetchone()


def build_radio_state():
    """
    Return the complete state required by homepage.js.

    Shape:
    {
      "success": true,
      "channels": {
        "college": {
          ...,
          "stations": [...]
        },
        "commentary": {...},
        "meetings": {...},
        "songs": {...}
      }
    }
    """

    connection = get_db_connection()

    if not connection:
        raise RuntimeError("Database connection unavailable.")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                id,
                channel_key,
                name,
                description,
                stream_url,
                is_enabled,
                is_live
            FROM radio_channels
            WHERE is_enabled = 1
            ORDER BY id ASC
            """
        )

        channels = cursor.fetchall()

        cursor.execute(
            """
            SELECT
                id,
                channel_id,
                title,
                artist,
                description,
                frequency,
                media_url,
                is_active,
                display_order
            FROM radio_items
            WHERE is_active = 1
            ORDER BY channel_id ASC, display_order ASC, id ASC
            """
        )

        items = cursor.fetchall()

        items_by_channel = {}

        for item in items:
            items_by_channel.setdefault(
                item["channel_id"],
                []
            ).append(item)

        result = {}

        for channel in channels:
            channel_id = channel["id"]
            key = channel["channel_key"]

            channel_items = items_by_channel.get(
                channel_id,
                []
            )

            if key == "college":
                stations = []

                for item in channel_items:
                    if item["frequency"] is None:
                        continue

                    stations.append(
                        {
                            "id": item["id"],
                            "frequency": float(item["frequency"]),
                            "freq": float(item["frequency"]),
                            "title": item["title"],
                            "name": item["title"],
                            "artist": item["artist"],
                            "description": item["description"],
                            "stream_url": item["media_url"],
                            "audio_url": item["media_url"],
                            "url": item["media_url"],
                        }
                    )

                result[key] = {
                    "id": channel_id,
                    "name": channel["name"],
                    "title": channel["name"],
                    "description": channel["description"],
                    "stream_url": channel["stream_url"],
                    "audio_url": channel["stream_url"],
                    "url": channel["stream_url"],
                    "live": bool(channel["is_live"]),
                    "active": bool(channel["is_live"]),
                    "stations": stations,
                }

            else:
                # For Meetings/Special Songs we expose all active
                # recordings/tracks as items. For Commentary the
                # first active item is used as the current stream.
                first_item = channel_items[0] if channel_items else None

                stream_url = (
                    channel["stream_url"]
                    or (
                        first_item["media_url"]
                        if first_item
                        else None
                    )
                )

                result[key] = {
                    "id": channel_id,
                    "name": channel["name"],
                    "title": (
                        first_item["title"]
                        if first_item
                        else channel["name"]
                    ),
                    "description": channel["description"],
                    "stream_url": stream_url,
                    "audio_url": stream_url,
                    "url": stream_url,
                    "live": bool(channel["is_live"]),
                    "active": bool(channel["is_live"]),
                    "stations": [
                        {
                            "id": item["id"],
                            "title": item["title"],
                            "name": item["title"],
                            "artist": item["artist"],
                            "description": item["description"],
                            "stream_url": item["media_url"],
                            "audio_url": item["media_url"],
                            "url": item["media_url"],
                        }
                        for item in channel_items
                    ],
                }

        # Keep the four categories present even if an admin has
        # disabled one in the database.
        for key in CHANNEL_ORDER:
            if key not in result:
                result[key] = {
                    "id": None,
                    "name": {
                        "college": "College Radio",
                        "commentary": "Live Commentary",
                        "meetings": "Meetings",
                        "songs": "Special Songs",
                    }[key],
                    "title": {
                        "college": "College Radio",
                        "commentary": "Live Commentary",
                        "meetings": "Meetings",
                        "songs": "Special Songs",
                    }[key],
                    "description": "",
                    "stream_url": None,
                    "audio_url": None,
                    "url": None,
                    "live": False,
                    "active": False,
                    "stations": [],
                }

        return {
            "success": True,
            "channels": result,
            "channel_order": CHANNEL_ORDER,
        }

    finally:
        cursor.close()
        connection.close()


@radio_bp.route("/api/state", methods=["GET"])
def radio_state():
    """Homepage/student Radio state endpoint."""

    try:
        state = build_radio_state()

        return jsonify(state)

    except Exception as error:
        print("Radio state error:", error)

        return jsonify(
            {
                "success": False,
                "message": "Radio state is temporarily unavailable.",
                "channels": {},
                "channel_order": CHANNEL_ORDER,
            }
        ), 503



# ============================================================
# ADMIN PAGE
# ============================================================

@radio_bp.route("/admin", methods=["GET"])
def radio_admin_page():
    """
    College-wide Radio management page.

    This is deliberately /radio/admin rather than an organization
    admin URL because Radio is college-wide.
    """
    require_admin()
    return render_template("admin/radio_admin.html")


# ============================================================
# ADMIN API
# ============================================================

@radio_bp.route("/admin/api/channels", methods=["GET"])
def admin_get_channels():
    require_admin()

    connection = get_db_connection()

    if not connection:
        return jsonify(
            {
                "success": False,
                "message": "Database connection unavailable.",
            }
        ), 503

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute(
            """
            SELECT
                id,
                channel_key,
                name,
                description,
                stream_url,
                is_enabled,
                is_live,
                updated_by,
                created_at,
                updated_at
            FROM radio_channels
            ORDER BY id ASC
            """
        )

        return jsonify(
            {
                "success": True,
                "channels": cursor.fetchall(),
            }
        )

    finally:
        cursor.close()
        connection.close()


@radio_bp.route(
    "/admin/api/channels/<channel_key>",
    methods=["PUT"],
)
def admin_update_channel(channel_key):
    admin_id = require_admin()

    if channel_key not in CHANNEL_ORDER:
        return jsonify(
            {
                "success": False,
                "message": "Invalid Radio channel.",
            }
        ), 400

    data = request.get_json(silent=True) or {}

    allowed_fields = {
        "name",
        "description",
        "stream_url",
        "is_enabled",
        "is_live",
    }

    updates = []

    values = []

    for field in allowed_fields:
        if field not in data:
            continue

        updates.append(f"{field} = %s")

        if field in {"is_enabled", "is_live"}:
            values.append(
                1 if bool(data[field]) else 0
            )
        else:
            value = data[field]

            if isinstance(value, str):
                value = value.strip()

            values.append(value or None)

    if not updates:
        return jsonify(
            {
                "success": False,
                "message": "No fields supplied.",
            }
        ), 400

    updates.append("updated_by = %s")
    values.append(admin_id)
    values.append(channel_key)

    connection = get_db_connection()

    if not connection:
        return jsonify(
            {
                "success": False,
                "message": "Database connection unavailable.",
            }
        ), 503

    cursor = connection.cursor()

    try:
        cursor.execute(
            f"""
            UPDATE radio_channels
            SET {", ".join(updates)}
            WHERE channel_key = %s
            """,
            tuple(values),
        )

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify(
                {
                    "success": False,
                    "message": "Radio channel not found.",
                }
            ), 404

        return jsonify(
            {
                "success": True,
                "message": "Radio channel updated.",
            }
        )

    except Exception as error:
        connection.rollback()
        print("Radio channel update error:", error)

        return jsonify(
            {
                "success": False,
                "message": "Could not update Radio channel.",
            }
        ), 500

    finally:
        cursor.close()
        connection.close()



@radio_bp.route("/admin/api/upload", methods=["POST"])
def admin_upload_audio():
    require_admin()

    file = request.files.get("audio")

    if not file or not file.filename:
        return jsonify({
            "success": False,
            "message": "Choose an audio file."
        }), 400

    if not allowed_audio_file(file.filename):
        return jsonify({
            "success": False,
            "message": (
                "Allowed audio formats: MP3, WAV, M4A, AAC, OGG and WEBM."
            )
        }), 400

    try:
        secure_url, public_id = upload_radio_audio(file)

        if not secure_url:
            raise RuntimeError("Cloudinary did not return an audio URL.")

        return jsonify({
            "success": True,
            "url": secure_url,
            "public_id": public_id
        })

    except Exception as error:
        print("Radio Cloudinary upload error:", error)
        return jsonify({
            "success": False,
            "message": "Audio upload failed. Check Cloudinary configuration."
        }), 500




# ============================================================
# LIVEKIT LIVE RADIO
# ============================================================

LIVE_ROOM_NAME = "campus-connect-live-commentary"


def create_livekit_token(identity, can_publish=False, can_subscribe=True):
    """Create a short-lived LiveKit access token."""
    api_key = os.getenv("LIVEKIT_API_KEY")
    api_secret = os.getenv("LIVEKIT_API_SECRET")

    if not api_key or not api_secret:
        raise RuntimeError("LIVEKIT_API_KEY / LIVEKIT_API_SECRET are not configured.")

    token = (
        livekit_api.AccessToken(api_key, api_secret)
        .with_identity(str(identity))
        .with_name(str(identity))
        .with_ttl(timedelta(hours=1))
        .with_grants(
            livekit_api.VideoGrants(
                room_join=True,
                room=LIVE_ROOM_NAME,
                can_publish=can_publish,
                can_subscribe=can_subscribe,
            )
        )
    )

    return token.to_jwt()


@radio_bp.route("/admin/api/live/token", methods=["GET"])
def admin_live_token():
    """Issue a publisher token to the logged-in Radio admin."""
    admin_id = require_admin()

    try:
        token = create_livekit_token(
            identity=f"admin-{admin_id}",
            can_publish=True,
            can_subscribe=True,
        )

        return jsonify({
            "success": True,
            "token": token,
            "room": LIVE_ROOM_NAME,
            "livekit_url": os.getenv("LIVEKIT_URL"),
        })

    except Exception as error:
        print("LiveKit admin token error:", error)
        return jsonify({
            "success": False,
            "message": "Could not create the live broadcast token.",
        }), 500


@radio_bp.route("/api/live/token", methods=["GET"])
def student_live_token():
    """Issue a listener-only token to a logged-in student."""
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Login required.",
        }), 401

    try:
        token = create_livekit_token(
            identity=f"listener-{user_id}",
            can_publish=False,
            can_subscribe=True,
        )

        return jsonify({
            "success": True,
            "token": token,
            "room": LIVE_ROOM_NAME,
            "livekit_url": os.getenv("LIVEKIT_URL"),
        })

    except Exception as error:
        print("LiveKit student token error:", error)
        return jsonify({
            "success": False,
            "message": "Could not create the live listener token.",
        }), 500


@radio_bp.route("/admin/api/items", methods=["POST"])
def admin_create_item():
    admin_id = require_admin()

    data = request.get_json(silent=True) or {}

    channel_key = str(
        data.get("channel_key", "")
    ).strip()

    title = str(
        data.get("title", "")
    ).strip()

    if channel_key not in CHANNEL_ORDER:
        return jsonify(
            {
                "success": False,
                "message": "Invalid Radio channel.",
            }
        ), 400

    if not title:
        return jsonify(
            {
                "success": False,
                "message": "Title is required.",
            }
        ), 400

    frequency = data.get("frequency")

    if frequency in ("", None):
        frequency = None
    else:
        try:
            frequency = float(frequency)
        except (TypeError, ValueError):
            return jsonify(
                {
                    "success": False,
                    "message": "Frequency must be a number.",
                }
            ), 400

        if channel_key == "college":
            if not (
                FREQ_MIN <= frequency <= FREQ_MAX
            ):
                return jsonify(
                    {
                        "success": False,
                        "message": "College Radio frequency must be between 88.0 and 108.0 MHz.",
                    }
                ), 400

    media_url = data.get("media_url")

    if isinstance(media_url, str):
        media_url = media_url.strip() or None

    connection = get_db_connection()

    if not connection:
        return jsonify(
            {
                "success": False,
                "message": "Database connection unavailable.",
            }
        ), 503

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT id
            FROM radio_channels
            WHERE channel_key = %s
            LIMIT 1
            """,
            (channel_key,),
        )

        channel = cursor.fetchone()

        if not channel:
            return jsonify(
                {
                    "success": False,
                    "message": "Radio channel not found.",
                }
            ), 404

        cursor.execute(
            """
            INSERT INTO radio_items (
                channel_id,
                title,
                artist,
                description,
                frequency,
                media_url,
                is_active,
                display_order,
                created_by
            )
            VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
            """,
            (
                channel[0],
                title,
                data.get("artist"),
                data.get("description"),
                frequency,
                media_url,
                1 if data.get("is_active", True) else 0,
                int(data.get("display_order", 0) or 0),
                admin_id,
            ),
        )

        item_id = cursor.lastrowid

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Radio item created.",
                "item_id": item_id,
            }
        ), 201

    except Exception as error:
        connection.rollback()
        print("Radio item create error:", error)

        return jsonify(
            {
                "success": False,
                "message": "Could not create Radio item.",
            }
        ), 500

    finally:
        cursor.close()
        connection.close()


@radio_bp.route(
    "/admin/api/items/<int:item_id>",
    methods=["PUT"],
)
def admin_update_item(item_id):
    admin_id = require_admin()

    data = request.get_json(silent=True) or {}

    fields = {
        "title": data.get("title"),
        "artist": data.get("artist"),
        "description": data.get("description"),
        "media_url": data.get("media_url"),
        "display_order": data.get("display_order"),
        "is_active": data.get("is_active"),
    }

    if "frequency" in data:
        fields["frequency"] = data.get("frequency")

    connection = get_db_connection()

    if not connection:
        return jsonify(
            {
                "success": False,
                "message": "Database connection unavailable.",
            }
        ), 503

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            SELECT
                ri.id,
                rc.channel_key
            FROM radio_items ri
            JOIN radio_channels rc
                ON rc.id = ri.channel_id
            WHERE ri.id = %s
            LIMIT 1
            """,
            (item_id,),
        )

        existing = cursor.fetchone()

        if not existing:
            return jsonify(
                {
                    "success": False,
                    "message": "Radio item not found.",
                }
            ), 404

        channel_key = existing[1]

        assignments = []
        values = []

        for field, value in fields.items():
            if field not in data:
                continue

            if field == "is_active":
                value = 1 if bool(value) else 0

            elif field == "display_order":
                value = int(value or 0)

            elif field == "frequency":
                if value in ("", None):
                    value = None
                else:
                    try:
                        value = float(value)
                    except (TypeError, ValueError):
                        return jsonify(
                            {
                                "success": False,
                                "message": "Frequency must be a number.",
                            }
                        ), 400

                    if channel_key == "college":
                        if not (
                            FREQ_MIN <= value <= FREQ_MAX
                        ):
                            return jsonify(
                                {
                                    "success": False,
                                    "message": "College Radio frequency must be between 88.0 and 108.0 MHz.",
                                }
                            ), 400

            elif isinstance(value, str):
                value = value.strip() or None

            assignments.append(
                f"{field} = %s"
            )
            values.append(value)

        if not assignments:
            return jsonify(
                {
                    "success": False,
                    "message": "No fields supplied.",
                }
            ), 400

        values.append(item_id)

        cursor.execute(
            f"""
            UPDATE radio_items
            SET {", ".join(assignments)}
            WHERE id = %s
            """,
            tuple(values),
        )

        connection.commit()

        return jsonify(
            {
                "success": True,
                "message": "Radio item updated.",
                "updated_by": admin_id,
            }
        )

    except Exception as error:
        connection.rollback()
        print("Radio item update error:", error)

        return jsonify(
            {
                "success": False,
                "message": "Could not update Radio item.",
            }
        ), 500

    finally:
        cursor.close()
        connection.close()


@radio_bp.route(
    "/admin/api/items/<int:item_id>",
    methods=["DELETE"],
)
def admin_delete_item(item_id):
    require_admin()

    connection = get_db_connection()

    if not connection:
        return jsonify(
            {
                "success": False,
                "message": "Database connection unavailable.",
            }
        ), 503

    cursor = connection.cursor()

    try:
        cursor.execute(
            """
            DELETE FROM radio_items
            WHERE id = %s
            """,
            (item_id,),
        )

        connection.commit()

        if cursor.rowcount == 0:
            return jsonify(
                {
                    "success": False,
                    "message": "Radio item not found.",
                }
            ), 404

        return jsonify(
            {
                "success": True,
                "message": "Radio item deleted.",
            }
        )

    except Exception as error:
        connection.rollback()
        print("Radio item delete error:", error)

        return jsonify(
            {
                "success": False,
                "message": "Could not delete Radio item.",
            }
        ), 500

    finally:
        cursor.close()
        connection.close()


# Frequency constants used by the admin item endpoint.
FREQ_MIN = 88.0
FREQ_MAX = 108.0

AUDIO_EXTENSIONS = {
    "mp3", "wav", "m4a", "aac", "ogg", "oga", "webm"
}


def configure_cloudinary():
    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"]
    )


def allowed_audio_file(filename):
    return (
        bool(filename)
        and "." in filename
        and filename.rsplit(".", 1)[1].lower() in AUDIO_EXTENSIONS
    )


def upload_radio_audio(file):
    configure_cloudinary()

    public_id = f"campus_connect/radio/{uuid.uuid4().hex}"

    result = cloudinary.uploader.upload(
        file,
        public_id=public_id,
        resource_type="video",
        overwrite=False
    )

    return result.get("secure_url"), result.get("public_id")
