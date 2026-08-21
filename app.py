from flask import Flask,render_template

#importing blueprints from different routes
from routes.auth import auth_bp
from routes.homepage import homepage_bp
from routes.clubs import clubs_bp
from routes.cells import cells_bp
from routes.academic import academic_bp
from routes.non_academic import non_academic_bp
from routes.complaints import complaints_bp
from routes.emergency import emergency_bp


def createApp():
    app=Flask(__name__)

    #registering blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(homepage_bp)
    app.register_blueprint(clubs_bp)
    app.register_blueprint(cells_bp)
    app.register_blueprint(academic_bp)
    app.register_blueprint(non_academic_bp)
    app.register_blueprint(complaints_bp)
    app.register_blueprint(emergency_bp)

    @app.route("/")
    def landing_page():
        return render_template("landing.html")
    
    return app
    
app=createApp()

if __name__ == "__main__":
    app.run(debug=True)

