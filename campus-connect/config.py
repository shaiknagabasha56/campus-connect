import os
from dotenv import load_dotenv
from datetime import timedelta


load_dotenv()


class Config:

    SECRET_KEY = os.getenv("SECRET_KEY")
    PERMANENT_SESSION_LIFETIME = timedelta(days=7)

    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

    DB_HOST = os.getenv("DB_HOST", "localhost")
    DB_PORT = int(os.getenv("DB_PORT", 3306))
    DB_NAME = os.getenv("DB_NAME")
    DB_USER = os.getenv("DB_USER")
    DB_PASSWORD = os.getenv("DB_PASSWORD")
    # EMAIL CONFIGURATION
    MAIL_USERNAME = os.getenv("MAIL_USERNAME")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")

    BREVO_API_KEY = os.getenv("BREVO_API_KEY")

    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")

    #For Cloudinary(image uploads)
    CLOUDINARY_CLOUD_NAME = os.getenv("CLOUDINARY_CLOUD_NAME")
    CLOUDINARY_API_KEY = os.getenv("CLOUDINARY_API_KEY")
    CLOUDINARY_API_SECRET = os.getenv("CLOUDINARY_API_SECRET")

    
obj=Config()
