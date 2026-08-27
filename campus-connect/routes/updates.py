from flask import (
    Blueprint,
    jsonify,
    request,
    session,
    abort,
    current_app
)

from werkzeug.utils import secure_filename
from datetime import date, datetime, time, timedelta
import os
import uuid

from database.queries import (
    create_update,
    get_updates_by_organization,
    get_published_updates_by_organization,
    get_update_by_id,
    update_update,
    delete_update,
    get_organization_by_slug
)


# ==================================================
# UPDATES BLUEPRINT
# ==================================================

updates_bp = Blueprint(
    "updates",
    __name__,
    url_prefix="/updates"
)


# ==================================================
# FILE UPLOAD SETTINGS
# ==================================================
#
# IMPORTANT: this must resolve to an ABSOLUTE path built from
# current_app.static_folder (the folder Flask actually serves at
# /static/...), not a bare relative string. A relative path here
# gets resolved against the server process's current working
# directory at request time, which is not guaranteed to be the
# project root — if the app is ever launched from a different cwd
# (an IDE run config, a task runner, a different start command),
# uploads silently get written to a "static" folder Flask never
# serves from. The database still stores a correct-looking path,
# but the image 404s everywhere. get_upload_folder() avoids that
# by always asking Flask directly where its static folder is.
# ==================================================

def get_upload_folder():
    return os.path.join(
        current_app.static_folder,
        "uploads",
        "updates"
    )

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp"
}


# ==================================================
# HELPER: CHECK FILE TYPE
# ==================================================

def allowed_file(filename):

    return (
        "." in filename
        and filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ==================================================
# HELPER: ADMIN + ORGANIZATION CHECK
# ==================================================

def get_admin_organization():

    # ----------------------------------------------
    # USER MUST BE ADMIN
    # ----------------------------------------------

    if session.get("role") != "admin":
        abort(403)

    # ----------------------------------------------
    # GET ORGANIZATION
    # ----------------------------------------------

    organization_id = session.get(
        "organization_id"
    )

    if not organization_id:
        abort(403)

    return organization_id


# ==================================================
# HELPER: GET CURRENT USER
# ==================================================

def get_current_user():

    user_id = session.get("user_id")

    if not user_id:
        abort(401)

    return user_id


# ==================================================
# HELPER: EMPTY VALUE -> NONE
# ==================================================

def empty_to_none(value):

    if value is None:
        return None

    value = value.strip()

    return value if value else None

# ==================================================
# HELPER: MAKE UPDATE DATA JSON SAFE
# ==================================================

def serialize_update(update):

    if not update:
        return update

    serialized = {}

    for key, value in update.items():

        if isinstance(value, datetime):

            serialized[key] = value.strftime(
                "%Y-%m-%d %H:%M:%S"
            )

        elif isinstance(value, date):

            serialized[key] = value.strftime(
                "%Y-%m-%d"
            )

        elif isinstance(value, time):

            serialized[key] = value.strftime(
                "%H:%M:%S"
            )

        elif isinstance(value, timedelta):

            total_seconds = int(
                value.total_seconds()
            )

            hours = total_seconds // 3600

            minutes = (
                total_seconds % 3600
            ) // 60

            seconds = total_seconds % 60

            serialized[key] = (
                f"{hours:02d}:"
                f"{minutes:02d}:"
                f"{seconds:02d}"
            )

        else:

            serialized[key] = value

    return serialized
# ==================================================
# GET ALL UPDATES
# GET /updates
# ==================================================
@updates_bp.route(
    "",
    methods=["GET"]
)
def get_updates():

    organization_id = (
        get_admin_organization()
    )

    updates = get_updates_by_organization(
        organization_id
    )

    serialized_updates = [
        serialize_update(update)
        for update in updates
    ]

    return jsonify({
        "success": True,
        "updates": serialized_updates
    })


# ==================================================
# GET PUBLISHED UPDATES FOR AN ORGANIZATION
#
# Example:
# GET /updates/organization/aws
# ==================================================

@updates_bp.route(
    "/organization/<organization_slug>",
    methods=["GET"]
)
def get_public_organization_updates(
    organization_slug
):

    # ----------------------------------------------
    # GET ORGANIZATION
    # ----------------------------------------------

    organization = get_organization_by_slug(
        organization_slug
    )

    if not organization:

        return jsonify({
            "success": False,
            "message": "Organization not found."
        }), 404


    # ----------------------------------------------
    # GET ONLY PUBLISHED UPDATES
    # ----------------------------------------------

    updates = (
        get_published_updates_by_organization(
            organization["id"]
        )
    )


    # ----------------------------------------------
    # SERIALIZE DATA
    # ----------------------------------------------

    serialized_updates = [
        serialize_update(update)
        for update in updates
    ]


    # ----------------------------------------------
    # RESPONSE
    # ----------------------------------------------

    return jsonify({
        "success": True,
        "organization": {
            "id": organization["id"],
            "name": organization["name"],
            "slug": organization["slug"]
        },
        "updates": serialized_updates
    })


# ==================================================
# GET ONE UPDATE
# GET /updates/<id>
# ==================================================

@updates_bp.route(
    "/<int:update_id>",
    methods=["GET"]
)
def get_single_update(update_id):

    organization_id = (
        get_admin_organization()
    )

    update = get_update_by_id(
        update_id,
        organization_id
    )

    if not update:

        return jsonify({
            "success": False,
            "message": "Update not found."
        }), 404

    return jsonify({
    "success": True,
    "update": serialize_update(update)
})

# ==================================================
# GET PUBLIC PUBLISHED UPDATES
#
# GET /updates/public/<organization_slug>
# ==================================================

@updates_bp.route(
    "/public/<string:organization_slug>",
    methods=["GET"]
)
def get_public_updates(
    organization_slug
):

    # ----------------------------------------------
    # GET ORGANIZATION
    # ----------------------------------------------

    organization = get_organization_by_slug(
        organization_slug
    )


    if not organization:

        return jsonify({
            "success": False,
            "message": "Organization not found."
        }), 404


    # ----------------------------------------------
    # GET ONLY PUBLISHED UPDATES
    # ----------------------------------------------

    updates = (
        get_published_updates_by_organization(
            organization["id"]
        )
    )


    # ----------------------------------------------
    # RETURN DATA
    # ----------------------------------------------

    return jsonify({

        "success": True,

        "organization": {
            "id": organization["id"],
            "name": organization["name"],
            "slug": organization["slug"]
        },

        "updates": updates

    })

# ==================================================
# CREATE UPDATE
# POST /updates
# ==================================================

@updates_bp.route(
    "",
    methods=["POST"]
)
def create_new_update():

    # ----------------------------------------------
    # SECURITY
    # ----------------------------------------------

    organization_id = (
        get_admin_organization()
    )

    created_by = get_current_user()


    # ----------------------------------------------
    # GET FORM DATA
    # ----------------------------------------------

    title = request.form.get(
        "title",
        ""
    ).strip()

    category_tag = request.form.get(
        "category_tag",
        ""
    ).strip()

    post_date = request.form.get(
        "post_date",
        ""
    ).strip()

    description = request.form.get(
        "description",
        ""
    ).strip()


    # ----------------------------------------------
    # REQUIRED FIELD VALIDATION
    # ----------------------------------------------

    if not title:

        return jsonify({
            "success": False,
            "message": "Title is required."
        }), 400


    if not category_tag:

        return jsonify({
            "success": False,
            "message": "Category is required."
        }), 400


    if not post_date:

        return jsonify({
            "success": False,
            "message": "Post date is required."
        }), 400


    if not description:

        return jsonify({
            "success": False,
            "message": "Description is required."
        }), 400


    # ----------------------------------------------
    # OPTIONAL VALUES
    # ----------------------------------------------

    post_time = empty_to_none(
        request.form.get("post_time")
    )

    event_date = empty_to_none(
        request.form.get("event_date")
    )

    deadline = empty_to_none(
        request.form.get("deadline")
    )

    contact_email = empty_to_none(
        request.form.get("contact_email")
    )

    application_url = empty_to_none(
        request.form.get("application_url")
    )


    # ----------------------------------------------
    # APPLICATION BOOLEAN
    # ----------------------------------------------

    enable_application = (
        request.form.get(
            "enable_application",
            "false"
        ).lower()
        in [
            "true",
            "1",
            "yes",
            "on"
        ]
    )


    # ----------------------------------------------
    # IF APPLICATION ENABLED
    # URL IS REQUIRED
    # ----------------------------------------------

    if (
        enable_application
        and not application_url
    ):

        return jsonify({
            "success": False,
            "message": (
                "Application URL is required "
                "when registration is enabled."
            )
        }), 400


    # ----------------------------------------------
    # COVER IMAGE
    # ----------------------------------------------

    cover_image_path = None

    file = request.files.get(
        "cover_image"
    )

    if file and file.filename:

        if not allowed_file(
            file.filename
        ):

            return jsonify({
                "success": False,
                "message": (
                    "Only PNG, JPG, JPEG and "
                    "WEBP images are allowed."
                )
            }), 400


        os.makedirs(
            get_upload_folder(),
            exist_ok=True
        )


        original_filename = secure_filename(
            file.filename
        )

        unique_filename = (
            f"{uuid.uuid4().hex}_"
            f"{original_filename}"
        )


        file_path = os.path.join(
            get_upload_folder(),
            unique_filename
        )

        file.save(
            file_path
        )


        cover_image_path = (
            f"uploads/updates/"
            f"{unique_filename}"
        )


    # ----------------------------------------------
    # CREATE DATABASE UPDATE
    # ----------------------------------------------

    update_id = create_update(

        organization_id=organization_id,

        created_by=created_by,

        cover_image=cover_image_path,

        category_tag=category_tag,

        title=title,

        description=description,

        post_date=post_date,

        post_time=post_time,

        event_date=event_date,

        deadline=deadline,

        contact_email=contact_email,

        enable_application=enable_application,

        application_url=application_url,

        status="published"
    )


    # ----------------------------------------------
    # DATABASE FAILED
    # ----------------------------------------------

    if not update_id:

        return jsonify({
            "success": False,
            "message": (
                "Failed to save update "
                "to database."
            )
        }), 500


    # ----------------------------------------------
    # GET CREATED UPDATE
    # ----------------------------------------------

    update = get_update_by_id(
        update_id,
        organization_id
    )


    return jsonify({
    "success": True,
    "message": "Update created successfully.",
    "update": serialize_update(update)
}), 201


# ==================================================
# UPDATE EXISTING UPDATE
# POST /updates/<id>
# ==================================================

@updates_bp.route(
    "/<int:update_id>",
    methods=["POST"]
)
def edit_existing_update(update_id):

    # ----------------------------------------------
    # SECURITY
    # ----------------------------------------------

    organization_id = (
        get_admin_organization()
    )


    # ----------------------------------------------
    # CHECK UPDATE EXISTS
    # ----------------------------------------------

    existing_update = (
        get_update_by_id(
            update_id,
            organization_id
        )
    )

    if not existing_update:

        return jsonify({
            "success": False,
            "message": "Update not found."
        }), 404


    # ----------------------------------------------
    # GET REQUIRED DATA
    # ----------------------------------------------

    title = request.form.get(
        "title",
        ""
    ).strip()

    category_tag = request.form.get(
        "category_tag",
        ""
    ).strip()

    post_date = request.form.get(
        "post_date",
        ""
    ).strip()

    description = request.form.get(
        "description",
        ""
    ).strip()


    # ----------------------------------------------
    # VALIDATE
    # ----------------------------------------------

    if not title:

        return jsonify({
            "success": False,
            "message": "Title is required."
        }), 400


    if not category_tag:

        return jsonify({
            "success": False,
            "message": "Category is required."
        }), 400


    if not post_date:

        return jsonify({
            "success": False,
            "message": "Post date is required."
        }), 400


    if not description:

        return jsonify({
            "success": False,
            "message": "Description is required."
        }), 400


    # ----------------------------------------------
    # OPTIONAL VALUES
    # ----------------------------------------------

    post_time = empty_to_none(
        request.form.get("post_time")
    )

    event_date = empty_to_none(
        request.form.get("event_date")
    )

    deadline = empty_to_none(
        request.form.get("deadline")
    )

    contact_email = empty_to_none(
        request.form.get("contact_email")
    )

    application_url = empty_to_none(
        request.form.get("application_url")
    )


    enable_application = (

        request.form.get(
            "enable_application",
            "false"
        ).lower()

        in [
            "true",
            "1",
            "yes",
            "on"
        ]
    )


    # ----------------------------------------------
    # APPLICATION VALIDATION
    # ----------------------------------------------

    if (
        enable_application
        and not application_url
    ):

        return jsonify({
            "success": False,
            "message": (
                "Application URL is required."
            )
        }), 400


    # ----------------------------------------------
    # KEEP OLD IMAGE BY DEFAULT
    # ----------------------------------------------

    cover_image_path = (
        existing_update["cover_image"]
    )


    # ----------------------------------------------
    # CHECK NEW IMAGE
    # ----------------------------------------------

    file = request.files.get(
        "cover_image"
    )

    if file and file.filename:

        if not allowed_file(
            file.filename
        ):

            return jsonify({
                "success": False,
                "message": (
                    "Only PNG, JPG, JPEG and "
                    "WEBP images are allowed."
                )
            }), 400


        os.makedirs(
            get_upload_folder(),
            exist_ok=True
        )


        original_filename = secure_filename(
            file.filename
        )

        unique_filename = (
            f"{uuid.uuid4().hex}_"
            f"{original_filename}"
        )


        file_path = os.path.join(
            get_upload_folder(),
            unique_filename
        )

        file.save(
            file_path
        )


        cover_image_path = (
            f"uploads/updates/"
            f"{unique_filename}"
        )


    # ----------------------------------------------
    # UPDATE DATABASE
    # ----------------------------------------------

    success = update_update(

        update_id=update_id,

        organization_id=organization_id,

        cover_image=cover_image_path,

        category_tag=category_tag,

        title=title,

        description=description,

        post_date=post_date,

        post_time=post_time,

        event_date=event_date,

        deadline=deadline,

        contact_email=contact_email,

        enable_application=enable_application,

        application_url=application_url,

        status="published"
    )


    if not success:

        return jsonify({
            "success": False,
            "message": (
                "Failed to update the update."
            )
        }), 500


    updated_update = get_update_by_id(
        update_id,
        organization_id
    )


    return jsonify({
    "success": True,
    "message": "Update saved successfully.",
    "update": serialize_update(updated_update)
})


# ==================================================
# DELETE UPDATE
# DELETE /updates/<id>
# ==================================================

@updates_bp.route(
    "/<int:update_id>",
    methods=["DELETE"]
)
def remove_update(update_id):

    organization_id = (
        get_admin_organization()
    )


    # ----------------------------------------------
    # CHECK UPDATE EXISTS
    # ----------------------------------------------

    existing_update = (
        get_update_by_id(
            update_id,
            organization_id
        )
    )


    if not existing_update:

        return jsonify({
            "success": False,
            "message": "Update not found."
        }), 404


    # ----------------------------------------------
    # DELETE DATABASE RECORD
    # ----------------------------------------------

    success = delete_update(

        update_id,
        organization_id
    )


    if not success:

        return jsonify({
            "success": False,
            "message": (
                "Failed to delete update."
            )
        }), 500


    # ----------------------------------------------
    # DELETE IMAGE FILE
    # ----------------------------------------------

    image_path = existing_update.get(
        "cover_image"
    )

    if image_path:

        full_path = os.path.join(
            current_app.static_folder,
            image_path
        )

        if os.path.exists(full_path):

            try:

                os.remove(
                    full_path
                )

            except Exception as error:

                print(
                    "Image delete error:",
                    error
                )


    return jsonify({
        "success": True,
        "message": (
            "Update deleted successfully."
        )
    })