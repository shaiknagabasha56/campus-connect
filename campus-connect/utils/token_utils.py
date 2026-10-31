# EMAIL VERIFICATION TOKEN UTILITIES

from itsdangerous import URLSafeTimedSerializer


# CREATE SERIALIZER
def get_serializer():
    # Import Flask current_app inside the function
    # so the application's SECRET_KEY is available.

    from flask import current_app

    return URLSafeTimedSerializer(
        current_app.config["SECRET_KEY"]
    )


# GENERATE EMAIL VERIFICATION TOKEN
def generate_verification_token(email):
    serializer = get_serializer()
    # Create a signed token containing the email.
    # The salt separates this token's purpose from other tokens such as password reset tokens.
    token = serializer.dumps(
        email,
        salt="email-verification"
    )
    return token



# VERIFY EMAIL VERIFICATION TOKEN
def verify_verification_token(token, max_age=3600):
    serializer = get_serializer()
    try:
        # Load and verify the token.
        # max_age = 3600 seconds = 1 hour
        email = serializer.loads(
            token,
            salt="email-verification",
            max_age=max_age
        )
        return email
    except Exception:
        # Invalid or expired token
        return None
    


# ==================================================
# PASSWORD RESET TOKEN
# ==================================================

def generate_password_reset_token(email):
    serializer = get_serializer()

    token = serializer.dumps(
        email,
        salt="password-reset"
    )

    return token


def verify_password_reset_token(token, max_age=3600):
    serializer = get_serializer()

    try:
        email = serializer.loads(
            token,
            salt="password-reset",
            max_age=max_age
        )

        return email

    except Exception:
        return None