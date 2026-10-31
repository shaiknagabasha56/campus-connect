from flask import Flask, render_template, session, redirect, url_for, request,abort
from config import Config
from database.queries import get_organization_by_slug
from extensions import oauth

from routes.auth import auth_bp
from routes.homepage import homepage_bp
from routes.clubs import clubs_bp
from routes.cells import cells_bp
from routes.academic import academic_bp
from routes.non_academic import non_academic_bp
from routes.complaints import complaints_bp
from routes.category_complaints import category_complaints_bp
from routes.emergency import emergency_bp
from routes.admin import admin_bp
from routes.updates import updates_bp
from routes.radio import radio_bp
from routes.community_chat import community_chat_bp


def createApp():
    app = Flask(__name__)
    app.config.from_object(Config)
    oauth.init_app(app)
    oauth.register(
    name="google",
    client_id=app.config["GOOGLE_CLIENT_ID"],
    client_secret=app.config["GOOGLE_CLIENT_SECRET"],
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={
        "scope": "openid email profile"
    }
)
    # REGISTER BLUEPRINTS
    app.register_blueprint(auth_bp)
    app.register_blueprint(homepage_bp)
    app.register_blueprint(clubs_bp)
    app.register_blueprint(cells_bp)
    app.register_blueprint(academic_bp)
    app.register_blueprint(non_academic_bp)
    app.register_blueprint(complaints_bp)
    app.register_blueprint(category_complaints_bp)
    app.register_blueprint(emergency_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(updates_bp)
    app.register_blueprint(radio_bp)
    app.register_blueprint(community_chat_bp)

    @app.before_request
    def require_login():
        # ALLOW STATIC FILES
        if request.endpoint == "static":
            return None
        # ALLOW LANDING PAGE
        if request.endpoint == "landing_page":
            return None
        # ALLOW AUTH ROUTES
        if request.endpoint and request.endpoint.startswith("auth."):
            return None
        # LOGIN CHECK 
        if "user_id" not in session:
            return redirect(url_for("auth.login"))
        # ORGANIZATION ADMIN ROUTE CHECK
        # Radio and Emergency have their own dedicated admin roles and
        # enforce authorization inside their own routes. Do not apply the
        # organization-admin-only check to those module admin pages.
        normalized_path = request.path.rstrip("/")
        path_parts = normalized_path.strip("/").split("/")
        is_module_admin_route = (
            len(path_parts) >= 2
            and path_parts[0] in {"radio", "emergency"}
            and path_parts[-1] == "admin"
        )

        if normalized_path.endswith("/admin") and not is_module_admin_route:
            # Organization admin pages require the main admin role.
            if session.get("role") != "admin":
                abort(403)

            # Resolve and validate the organization for organization admin URLs.
            if len(path_parts) >= 3:
                organization_slug = path_parts[-2]
                organization = get_organization_by_slug(organization_slug)
                if not organization:
                    abort(404)

                if session.get("organization_id") != organization["id"]:
                    abort(403)



    # LANDING PAGE
    @app.route("/")
    def landing_page() :
        return render_template("landing.html")


    return app


app = createApp()


if __name__ == "__main__":
    app.run(debug=True, port=5050)