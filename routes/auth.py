from flask import Blueprint,render_template,redirect,url_for
#from services.auth_services import login_user

auth_bp=Blueprint(
    "auth",
    __name__,
    url_prefix="/auth"
)

#Login:
@auth_bp.route("/login",methods=["GET","POST"])
def login():
    #validation function is written in auth_services 
    #So we call that function here
    return render_template("auth/login.html")

#Reset Password:
@auth_bp.route("/reset-password",methods=["GET","POST"])
def reset_password():
    return render_template("auth/reset-password.html")

