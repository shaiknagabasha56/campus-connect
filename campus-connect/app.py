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
from routes.emergency import emergency_bp
from routes.admin import admin_bp
from routes.updates import updates_bp


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
    app.register_blueprint(emergency_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(updates_bp)

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
        # ADMIN ROUTE CHECK
    
        if request.path.endswith("/admin"):
            # User must be an admin
            if session.get("role") != "admin":
                abort(403)
                # Get organization slug from URL
            path_parts = request.path.strip("/").split("/")
            if len(path_parts) >= 3:
                organization_slug = path_parts[-2]
                # Get organization from database
                organization = get_organization_by_slug(
                    organization_slug
            )
                # Organization does not exist
                if not organization:
                    abort(404)


                # Check organization ownership
                if session.get("organization_id") != organization["id"]:
                    abort(403)


    # LANDING PAGE
    @app.route("/")
    def landing_page():
        return render_template("landing.html")


    return app


app = createApp()


if __name__ == "__main__":
    app.run(debug=True, port=5050)