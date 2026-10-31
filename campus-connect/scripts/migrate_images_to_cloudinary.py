#!/usr/bin/env python3
"""
One-time migration of Campus Connect raster images to Cloudinary.

Run from the campus-connect project root:
    python scripts/migrate_images_to_cloudinary.py

Optional (skip MySQL legacy announcement URL updates):
    python scripts/migrate_images_to_cloudinary.py --skip-db

The script is idempotent: stable Cloudinary public IDs and overwrite=True
allow safe reruns. It keeps SVG/UI icon assets local.
"""
import argparse
import hashlib
import os
import re
from pathlib import Path
from urllib.parse import urlsplit

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
load_dotenv(ROOT / ".env")

RASTER_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".bmp"}
TEXT_EXTENSIONS = {".html", ".css", ".js", ".py", ".json", ".md"}
SKIP_DIRS = {".git", "__pycache__", "node_modules", ".venv", "venv"}
REMOTE_IMAGE_HOSTS = {"images.unsplash.com"}


def configure():
    required = ("CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET")
    missing = [key for key in required if not os.getenv(key)]
    if missing:
        raise SystemExit("Missing Cloudinary settings in .env: " + ", ".join(missing))
    cloudinary.config(
        cloud_name=os.getenv("CLOUDINARY_CLOUD_NAME"),
        api_key=os.getenv("CLOUDINARY_API_KEY"),
        api_secret=os.getenv("CLOUDINARY_API_SECRET"),
        secure=True,
    )


def optimized_url(secure_url):
    marker = "/image/upload/"
    if marker not in secure_url:
        return secure_url
    prefix, remainder = secure_url.split(marker, 1)
    first = remainder.split("/", 1)[0]
    if first.startswith(("f_auto", "q_auto", "w_auto", "c_")):
        return secure_url
    return prefix + marker + "f_auto,q_auto/" + remainder


def upload_local(path):
    rel = path.relative_to(ROOT).as_posix()
    public_id = "campus_connect/" + re.sub(r"[^A-Za-z0-9/_-]", "_", str(Path(rel).with_suffix("")))
    result = cloudinary.uploader.upload(
        str(path),
        public_id=public_id,
        overwrite=True,
        invalidate=True,
        resource_type="image",
    )
    return optimized_url(result["secure_url"])


def upload_remote(url):
    digest = hashlib.sha256(url.encode("utf-8")).hexdigest()[:20]
    result = cloudinary.uploader.upload(
        url,
        public_id=f"campus_connect/external/{digest}",
        overwrite=True,
        invalidate=True,
        resource_type="image",
    )
    return optimized_url(result["secure_url"])


def walk_files():
    for folder, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for filename in files:
            yield Path(folder) / filename


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--skip-db", action="store_true", help="Do not update legacy announcement URLs in MySQL.")
    args = parser.parse_args()

    configure()
    replacements = {}
    local_files = []
    source_files = [
        p for p in walk_files()
        if p.suffix.lower() in TEXT_EXTENSIONS and p.name != Path(__file__).name
    ]
    source_text = []
    for source_path in source_files:
        try:
            source_text.append(source_path.read_text(encoding="utf-8"))
        except (UnicodeDecodeError, OSError):
            continue
    combined_source = "\\n".join(source_text)

    static_images = ROOT / "static" / "images"
    if static_images.exists():
        # Only upload raster files actually referenced by the application.
        local_files.extend(
            p for p in static_images.rglob("*")
            if p.is_file() and p.suffix.lower() in RASTER_EXTENSIONS
            and p.name in combined_source
        )

    legacy_updates = ROOT / "static" / "uploads" / "updates"
    if legacy_updates.exists():
        # Migrate legacy upload files too, because existing MySQL rows may refer to them.
        local_files.extend(
            p for p in legacy_updates.rglob("*")
            if p.is_file() and p.suffix.lower() in RASTER_EXTENSIONS
        )

    print(f"Uploading {len(local_files)} referenced/legacy local raster images...")
    for path in local_files:
        rel = path.relative_to(ROOT).as_posix()
        url = upload_local(path)
        replacements[path.name] = url
        replacements[rel] = url
        # Common relative path forms used by templates and JS.
        if rel.startswith("static/"):
            replacements[rel[len("static/"):]] = url
        print(f"  uploaded: {rel}")

    # Migrate remote Unsplash photographs into the same Cloudinary account.
    remote_urls = set()
    for path in source_files:
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        for candidate in re.findall(r"""https?://[^"'\s)<>]+""", content):
            host = urlsplit(candidate).hostname
            if host in REMOTE_IMAGE_HOSTS:
                remote_urls.add(candidate)

    for url in sorted(remote_urls):
        cloud_url = upload_remote(url)
        replacements[url] = cloud_url
        print(f"  imported remote image: {urlsplit(url).hostname}")

    # Rewrite all references in project text files. Matching basenames handles
    # the legacy relative forms such as images/sunset.png and ../rgukt.png.
    for path in source_files:
        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError):
            continue
        original = content
        for old, new in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
            if old.startswith("http"):
                content = content.replace(old, new)
            elif "/" not in old:
                # Replace complete image path tokens, including ../ and images/ prefixes.
                pattern = (
                    r'(?<=["\'(])(?:\.\.?/)*(?:static/)?'
                    r'(?:images/|uploads/updates/)?' + re.escape(old) +
                    r'(?=["\')?#])'
                )
                content = re.sub(pattern, lambda _m: new, content)
        if content != original:
            path.write_text(content, encoding="utf-8")

    manifest = ROOT / "cloudinary-image-manifest.json"
    manifest.write_text(
        __import__("json").dumps(replacements, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote URL manifest: {manifest.name}")

    if not args.skip_db:
        import mysql.connector
        db = mysql.connector.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=int(os.getenv("DB_PORT", "3306")),
            database=os.getenv("DB_NAME"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
        )
        try:
            cursor = db.cursor()
            legacy_files = [
                p for p in local_files
                if p.as_posix().replace("\\\\", "/").find("static/uploads/updates/") >= 0
            ]
            for path in legacy_files:
                old_name = path.name
                new_url = replacements[old_name]
                # Update rows whose legacy path ends with this unique uploaded filename.
                cursor.execute(
                    "UPDATE updates SET cover_image = %s "
                    "WHERE cover_image LIKE %s AND cover_image NOT LIKE 'https://res.cloudinary.com/%'",
                    (new_url, "%" + old_name),
                )
            db.commit()
            print(f"Updated {cursor.rowcount} matching legacy announcement image row(s) in MySQL.")
        finally:
            cursor.close()
            db.close()

    print("Migration completed. Original local assets are retained as rollback copies.")


if __name__ == "__main__":
    main()
