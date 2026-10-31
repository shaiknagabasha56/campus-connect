from flask import (
    Blueprint,
    jsonify,
    request,
    session,
    abort,
    current_app
)

from datetime import date, datetime, time, timedelta
import os
import uuid
from urllib.parse import urlparse

import cloudinary
import cloudinary.uploader

from database.queries import (
    create_update,
    get_updates_by_organization,
    get_published_updates_by_organization,
    get_update_by_id,
    update_update,
    delete_update,
    get_organization_by_slug,
    get_published_updates_by_slugs,
    get_public_organization_updates_by_slug
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
# CLOUDINARY IMAGE UPLOAD SETTINGS
# ==================================================
#
# Dynamic announcement images are stored in Cloudinary instead of
# Flask's local static/uploads directory. This is important for
# production because the local filesystem of a free Render service
# is ephemeral.
#
# MySQL continues to store the image URL in the existing
# `cover_image` column.
# ==================================================

ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp"
}


ALLOWED_ATTACHMENT_EXTENSIONS = {
    "pdf", "doc", "docx", "xls", "xlsx", "csv", "ppt", "pptx",
    "txt", "rtf", "odt", "ods", "odp", "mp4", "webm", "mov",
    "m4v", "avi", "mp3", "wav", "zip"
}
MAX_ATTACHMENT_SIZE = 100 * 1024 * 1024  # 100 MB; also configure Cloudinary limits


def upload_update_attachment(file):
    """Upload a document/video attachment using Cloudinary's auto resource type."""
    configure_cloudinary()
    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in ALLOWED_ATTACHMENT_EXTENSIONS:
        raise ValueError("Unsupported attachment type. Upload PDF, Office documents, sheets, videos, audio, text or ZIP files.")
    file.stream.seek(0, os.SEEK_END)
    size = file.stream.tell()
    file.stream.seek(0)
    if size > MAX_ATTACHMENT_SIZE:
        raise ValueError("Attachment must be 100 MB or smaller.")
    result = cloudinary.uploader.upload(
        file,
        public_id=f"campus_connect/updates/files/{uuid.uuid4().hex}",
        resource_type="auto",
        overwrite=False,
        use_filename=True,
        unique_filename=True
    )
    return result.get("secure_url"), result.get("public_id"), result.get("resource_type"), file.filename, file.mimetype or "application/octet-stream"


def delete_update_attachment(url, resource_type="raw"):
    if not url or "res.cloudinary.com" not in url:
        return
    try:
        configure_cloudinary()
        parsed = urlparse(url)
        path = parsed.path
        match = __import__("re").search(r"/(raw|video|image)/upload/", path)
        if not match:
            return
        kind = match.group(1)
        public_id = path.split(f"/{kind}/upload/", 1)[1]
        parts = public_id.split("/")
        if parts and parts[0].startswith("v") and parts[0][1:].isdigit():
            parts = parts[1:]
        public_id = "/".join(parts)
        if kind == "image":
            public_id = os.path.splitext(public_id)[0]
        cloudinary.uploader.destroy(public_id, resource_type=kind, invalidate=True)
    except Exception as error:
        print("Cloudinary attachment delete error:", error)


def configure_cloudinary():
    """Configure Cloudinary using values loaded from Flask config."""

    cloudinary.config(
        cloud_name=current_app.config["CLOUDINARY_CLOUD_NAME"],
        api_key=current_app.config["CLOUDINARY_API_KEY"],
        api_secret=current_app.config["CLOUDINARY_API_SECRET"]
    )


def upload_to_cloudinary(file):
    """
    Upload an announcement image to Cloudinary.

    Returns:
        (secure_url, public_id) on success
        (None, None) on failure
    """

    configure_cloudinary()

    # Generate a unique public ID so two uploaded files can never
    # accidentally overwrite each other. Cloudinary public IDs for
    # images should not contain a file extension.
    public_id = (
        f"campus_connect/updates/{uuid.uuid4().hex}"
    )

    result = cloudinary.uploader.upload(
        file,
        public_id=public_id,
        resource_type="image",
        overwrite=False
    )

    return result.get("secure_url"), result.get("public_id")


def delete_from_cloudinary(image_url):
    """
    Delete a Cloudinary image using its stored secure URL.

    Older local image paths are ignored, so existing database records
    from the old local-upload system will not cause Cloudinary errors.
    """

    if not image_url:
        return

    # Only attempt Cloudinary deletion for Cloudinary URLs.
    if not image_url.startswith("https://res.cloudinary.com/"):
        return

    try:
        configure_cloudinary()

        parsed_url = urlparse(image_url)
        path = parsed_url.path
        marker = "/image/upload/"

        if marker not in path:
            return

        public_id_path = path.split(marker, 1)[1]
        public_id_parts = public_id_path.split("/")

        # A version segment such as v123456789 may appear between
        # /upload/ and the actual public ID. Remove it before calling
        # Cloudinary destroy().
        if (
            public_id_parts
            and public_id_parts[0].startswith("v")
            and public_id_parts[0][1:].isdigit()
        ):
            public_id_parts = public_id_parts[1:]

        public_id = "/".join(public_id_parts)

        # Our uploaded images are delivered with an extension, while
        # Cloudinary's image public ID does not include that extension.
        public_id = os.path.splitext(public_id)[0]

        if not public_id:
            return

        result = cloudinary.uploader.destroy(
            public_id,
            resource_type="image",
            invalidate=True
        )

        if result.get("result") not in ("ok", "not found"):
            print("Cloudinary image delete result:", result)

    except Exception as error:
        # Image deletion should not crash the request after the
        # database operation has already completed.
        print("Cloudinary image delete error:", error)


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

def optimized_cloudinary_url(image_url):
    """Return an auto-format/auto-quality delivery URL without changing the stored original."""
    if not image_url or not image_url.startswith("https://res.cloudinary.com/"):
        return image_url
    marker = "/image/upload/"
    if marker not in image_url:
        return image_url
    prefix, remainder = image_url.split(marker, 1)
    first_segment = remainder.split("/", 1)[0]
    if first_segment.startswith(("f_auto", "q_auto", "w_auto", "c_")):
        return image_url
    return prefix + marker + "f_auto,q_auto/" + remainder


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

        elif key == "cover_image":

            serialized[key] = optimized_cloudinary_url(value)

        else:

            serialized[key] = value

    return serialized
# ==================================================
# GET PUBLISHED UPDATES FOR A PUBLIC HUB CATEGORY
# ==================================================
@updates_bp.route("/public/category/<string:category>", methods=["GET"])
def get_public_category_updates(category):
    category_organizations = {
        "academic": {
            "cse": "CSE", "ece": "ECE", "civil": "Civil", "eee": "EEE",
            "mech": "Mechanical", "metallurgy": "Metallurgy",
            "chemical": "Chemical", "ai-ml": "AI & ML"
        },
        "non-academic": {
            "mess": "Mess", "canteen": "Canteen", "store": "Store",
            "hostel": "Hostel", "it-infra": "IT Infrastructure",
            "hospital": "Hospital", "scholorship-office": "Scholarship Office",
            "financial-office": "Financial Office"
        },
        "clubs": {
            "artix": "Artix", "techxcel": "TechXcel", "aws": "AWS",
            "icro": "ICRO", "khelsaathi": "KhelSaathi",
            "kaladharani": "Kaladharani", "sarvasrijana": "Sarvasrijana",
            "pixelro": "PixelRO"
        },
        "cells": {"ecell": "E-Cell", "cdpc": "CDPC", "hec": "HEC"}
    }
    organizations = category_organizations.get(category)
    if organizations is None:
        return jsonify({"success": False, "message": "Unknown category."}), 404

    # Fetch every published update for this category in one SQL query.
    # Previously this performed two sequential queries per organization.
    updates = get_published_updates_by_slugs(list(organizations.keys()))

    combined_updates = []
    for update in updates:
        item = serialize_update(update)
        item["organization_name"] = organizations.get(
            item.pop("organization_slug", ""), item.get("organization_name", "Update")
        )
        combined_updates.append(item)

    return jsonify({"success": True, "updates": combined_updates})


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
def get_public_organization_updates(organization_slug):
    # Fetch organization metadata and its published updates together.
    # This removes one complete DB connection/query from every page load.
    organization, updates = get_public_organization_updates_by_slug(
        organization_slug
    )

    if not organization:
        return jsonify({
            "success": False,
            "message": "Organization not found."
        }), 404

    serialized_updates = [serialize_update(update) for update in updates]

    response = jsonify({
        "success": True,
        "organization": {
            "id": organization["id"],
            "name": organization["name"],
            "slug": organization["slug"]
        },
        "updates": serialized_updates
    })
    # Public announcement data changes infrequently; allow short browser/CDN caching.
    response.headers["Cache-Control"] = "public, max-age=15, stale-while-revalidate=45"
    return response


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

        "updates": [serialize_update(update) for update in updates]

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
    # COVER IMAGE
    # ----------------------------------------------
    #
    # Upload the image directly to Cloudinary. The database will
    # store the returned HTTPS URL instead of a local file path.
    # ----------------------------------------------

    cover_image_path = None
    uploaded_public_id = None

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

        try:
            cover_image_path, uploaded_public_id = (
                upload_to_cloudinary(file)
            )

            if not cover_image_path:
                raise RuntimeError(
                    "Cloudinary did not return an image URL."
                )

        except Exception as error:
            print("Cloudinary upload error:", error)

            return jsonify({
                "success": False,
                "message": "Failed to upload image."
            }), 500


    # ----------------------------------------------
    # OPTIONAL DOCUMENT / VIDEO / OTHER ATTACHMENT
    # ----------------------------------------------
    attachment_url = attachment_name = attachment_mime = None
    attachment_public_id = None
    attachment_resource_type = None
    attachment_file = request.files.get("attachment")
    if attachment_file and attachment_file.filename:
        try:
            (attachment_url, attachment_public_id, attachment_resource_type,
             attachment_name, attachment_mime) = upload_update_attachment(attachment_file)
            if not attachment_url:
                raise RuntimeError("Cloudinary did not return an attachment URL.")
        except ValueError as error:
            return jsonify({"success": False, "message": str(error)}), 400
        except Exception as error:
            print("Cloudinary attachment upload error:", error)
            return jsonify({"success": False, "message": "Failed to upload attachment."}), 500

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
        status="published",
        attachment_url=attachment_url,
        attachment_name=attachment_name,
        attachment_mime=attachment_mime
    )


    # ----------------------------------------------
    # DATABASE FAILED
    # ----------------------------------------------

    if not update_id:

        # The image has already been uploaded to Cloudinary, so clean
        # it up if the database insert fails. This prevents orphaned
        # images from accumulating in Cloudinary.
        if uploaded_public_id:
            try:
                configure_cloudinary()
                cloudinary.uploader.destroy(
                    uploaded_public_id,
                    resource_type="image",
                    invalidate=True
                )
            except Exception as error:
                print(
                    "Cloudinary cleanup error:",
                    error
                )
        if attachment_public_id:
            try:
                cloudinary.uploader.destroy(attachment_public_id, resource_type=attachment_resource_type or "raw", invalidate=True)
            except Exception as error:
                print("Cloudinary attachment cleanup error:", error)

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
    # KEEP OLD IMAGE BY DEFAULT
    # ----------------------------------------------
    # If the admin does not select a new image, the existing
    # Cloudinary URL remains unchanged.
    # ----------------------------------------------

    cover_image_path = (
        existing_update["cover_image"]
    )

    old_cloudinary_image = cover_image_path
    new_uploaded_public_id = None

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

        try:
            (
                cover_image_path,
                new_uploaded_public_id
            ) = upload_to_cloudinary(file)

            if not cover_image_path:
                raise RuntimeError(
                    "Cloudinary did not return an image URL."
                )

        except Exception as error:
            print("Cloudinary upload error:", error)

            return jsonify({
                "success": False,
                "message": "Failed to upload image."
            }), 500


    # ----------------------------------------------
    # KEEP OR REPLACE THE EXISTING ATTACHMENT
    # ----------------------------------------------
    attachment_url = existing_update.get("attachment_url")
    attachment_name = existing_update.get("attachment_name")
    attachment_mime = existing_update.get("attachment_mime")
    new_attachment_public_id = None
    new_attachment_resource_type = None
    attachment_file = request.files.get("attachment")
    if attachment_file and attachment_file.filename:
        try:
            (attachment_url, new_attachment_public_id, new_attachment_resource_type,
             attachment_name, attachment_mime) = upload_update_attachment(attachment_file)
            if not attachment_url:
                raise RuntimeError("Cloudinary did not return an attachment URL.")
        except ValueError as error:
            return jsonify({"success": False, "message": str(error)}), 400
        except Exception as error:
            print("Cloudinary attachment upload error:", error)
            return jsonify({"success": False, "message": "Failed to upload attachment."}), 500

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
        status="published",
        attachment_url=attachment_url,
        attachment_name=attachment_name,
        attachment_mime=attachment_mime
    )


    if not success:

        # The new image was uploaded before the database update.
        # If the database update fails, remove the new Cloudinary
        # asset so it does not become an orphan.
        if new_uploaded_public_id:
            try:
                configure_cloudinary()
                cloudinary.uploader.destroy(
                    new_uploaded_public_id,
                    resource_type="image",
                    invalidate=True
                )
            except Exception as error:
                print(
                    "Cloudinary cleanup error:",
                    error
                )
        if new_attachment_public_id:
            try:
                cloudinary.uploader.destroy(new_attachment_public_id, resource_type=new_attachment_resource_type or "raw", invalidate=True)
            except Exception as error:
                print("Cloudinary attachment cleanup error:", error)

        return jsonify({
            "success": False,
            "message": (
                "Failed to update the update."
            )
        }), 500


    # If a new image replaced the old one, delete the old
    # Cloudinary asset only AFTER the database update succeeds.
    if new_uploaded_public_id and old_cloudinary_image:
        delete_from_cloudinary(old_cloudinary_image)
    if new_attachment_public_id and existing_update.get("attachment_url"):
        delete_update_attachment(existing_update.get("attachment_url"))

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
    # DELETE IMAGE FROM CLOUDINARY
    # ----------------------------------------------
    #
    # The database row has already been deleted above. If the stored
    # image is a Cloudinary URL, remove the corresponding Cloudinary
    # asset as well. Older local paths are simply ignored.
    # ----------------------------------------------

    image_url = existing_update.get(
        "cover_image"
    )

    if image_url:
        delete_from_cloudinary(image_url)
    delete_update_attachment(existing_update.get("attachment_url"))


    return jsonify({
        "success": True,
        "message": (
            "Update deleted successfully."
        )
    })
