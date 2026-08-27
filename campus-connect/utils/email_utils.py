import smtplib
import ssl
from email.message import EmailMessage
from flask import current_app


# SEND EMAIL VERIFICATION LINK
def send_verification_email(email, verification_url):
    # GET EMAIL CONFIGURATION
    sender_email = current_app.config["MAIL_USERNAME"]
    sender_password = current_app.config["MAIL_PASSWORD"]
    # CREATE EMAIL MESSAGE
    message = EmailMessage()
    message["Subject"] = "Verify your Campus Connect account"
    message["From"] = sender_email
    message["To"] = email
    # EMAIL CONTENT
    message.set_content(f"""
Hello,

Thank you for creating an account on Campus Connect.

Please verify your email address by clicking the link below:

{verification_url}

This verification link will expire in 1 hour.

If you did not create this account, you can ignore this email.

Regards,
Team Campus Connect
""")


    # CREATE SECURE SSL CONTEXT
    context = ssl.create_default_context()
    try:
        # CONNECT TO GMAIL SMTP SERVER
        with smtplib.SMTP_SSL(
            "smtp.gmail.com",
            465,
            context=context
        ) as server:
            # LOGIN USING APP PASSWORD
            server.login(
                sender_email,
                sender_password
            )
            # SEND EMAIL
            server.send_message(message)

        # EMAIL SENT SUCCESSFULLY
        return True


    except Exception as error:
        # Print the actual error in the Flask terminal
        # This helps us debug email problems.
        print("Email sending error:", error)
        return False



# ==================================================
# SEND PASSWORD RESET EMAIL
# ==================================================
def send_password_reset_email(email, reset_url):
    sender_email = current_app.config["MAIL_USERNAME"]
    sender_password = current_app.config["MAIL_PASSWORD"]
    message = EmailMessage()
    message["Subject"] = "Reset your Campus Connect password"
    message["From"] = sender_email
    message["To"] = email
    message.set_content(f"""
Hello,

We received a request to reset your Campus Connect password.

Click the link below to reset your password:

{reset_url}

This link will expire in 1 hour.

If you did not request a password reset, you can safely ignore this email.

Regards,
Team Campus Connect
""")

    context = ssl.create_default_context()

    try:

        with smtplib.SMTP_SSL(
            "smtp.gmail.com",
            465,
            context=context
        ) as server:

            server.login(
                sender_email,
                sender_password
            )

            server.send_message(message)

        return True

    except Exception as error:

        print("Password reset email error:", error)

        return False