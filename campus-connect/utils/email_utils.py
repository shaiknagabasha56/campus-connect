import requests
from flask import current_app


RESEND_API_URL = "https://api.resend.com/emails"


def send_email(to_email, subject, content):
    """
    Send a transactional email using the Resend HTTPS API.
    Returns True on success, False on failure.
    The real reason for a failure is printed to the server logs.
    """

    api_key = (current_app.config.get("RESEND_API_KEY") or "").strip()
    # Testing: onboarding@resend.dev  |  Production: an address on your verified domain
    mail_from = (current_app.config.get("MAIL_FROM") or "onboarding@resend.dev").strip()

    if not api_key:
        print("EMAIL ERROR: RESEND_API_KEY is missing. "
              "Add it to .env (local) and Render -> Environment.")
        return False

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "from": f"Campus Connect <{mail_from}>",
        "to": [to_email],
        "subject": subject,
        "text": content
    }

    try:
        response = requests.post(
            RESEND_API_URL,
            headers=headers,
            json=payload,
            timeout=15
        )

        if response.status_code in (200, 201, 202):
            print("Email sent successfully to", to_email)
            return True

        print("RESEND EMAIL ERROR")
        print("Status  :", response.status_code)
        print("Response:", response.text)

        if response.status_code in (401, 403) and "api" in response.text.lower():
            print("HINT: RESEND_API_KEY is invalid or restricted.")
        elif response.status_code == 403:
            print("HINT: With onboarding@resend.dev you can only send to "
                  "your own Resend signup email. Verify a domain to send to others.")
        elif response.status_code == 422:
            print("HINT: Check MAIL_FROM - it must be on your verified domain.")

        return False

    except requests.RequestException as error:
        print("Resend connection error:", error)
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