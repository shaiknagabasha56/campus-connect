import requests
from flask import current_app


BREVO_API_URL = "https://api.brevo.com/v3/smtp/email"


def send_email(to_email, subject, content):
    """
    Send a transactional email using Brevo HTTPS API.
    """

    api_key = current_app.config["BREVO_API_KEY"]
    sender_email = current_app.config["MAIL_USERNAME"]

    headers = {
        "accept": "application/json",
        "api-key": api_key,
        "content-type": "application/json"
    }

    payload = {
        "sender": {
            "name": "Campus Connect",
            "email": sender_email
        },
        "to": [
            {
                "email": to_email
            }
        ],
        "subject": subject,
        "textContent": content
    }

    try:
        response = requests.post(
            BREVO_API_URL,
            headers=headers,
            json=payload,
            timeout=15
        )

        if response.status_code in (200, 201):
            print("Email sent successfully.")
            return True

        print("Brevo email error:")
        print("Status:", response.status_code)
        print("Response:", response.text)

        return False

    except requests.RequestException as error:
        print("Brevo connection error:", error)
        return False


# ==================================================
# SEND EMAIL VERIFICATION LINK
# ==================================================

def send_verification_email(email, verification_url):

    content = f"""
Hello,

Thank you for creating an account on Campus Connect.

Please verify your email address by clicking the link below:

{verification_url}

This verification link will expire in 1 hour.

If you did not create this account, you can ignore this email.

Regards,
Team Campus Connect
"""

    return send_email(
        email,
        "Verify your Campus Connect account",
        content
    )


# ==================================================
# SEND PASSWORD RESET EMAIL
# ==================================================

def send_password_reset_email(email, reset_url):

    content = f"""
Hello,

We received a request to reset your Campus Connect password.

Click the link below to reset your password:

{reset_url}

This link will expire in 1 hour.

If you did not request a password reset, you can safely ignore this email.

Regards,
Team Campus Connect
"""

    return send_email(
        email,
        "Reset your Campus Connect password",
        content
    )