import os
import mysql.connector
from mysql.connector import Error
from config import Config


def get_db_connection():
    try:
        kwargs = {
            "host": Config.DB_HOST or "127.0.0.1",
            "port": Config.DB_PORT or 3306,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD,
            "database": Config.DB_NAME
        }

        # Check for socket fallback on Linux if host is localhost or 127.0.0.1
        socket_path = os.getenv("DB_SOCKET", "/tmp/mysql.sock")
        if os.path.exists(socket_path):
            kwargs["unix_socket"] = socket_path

        connection = mysql.connector.connect(**kwargs)

        if connection.is_connected():
            return connection

    except Error as error:
        print(f"Database connection error: {error}")

    return None


