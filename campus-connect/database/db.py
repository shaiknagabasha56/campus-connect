import mysql.connector
from mysql.connector import Error

from config import Config


def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )

        if connection.is_connected():
            return connection

    except Error as error:
        print(f"Database connection error: {error}")

    return None

