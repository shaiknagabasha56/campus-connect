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


# Test database connection
if __name__ == "__main__":
    connection = get_db_connection()

    if connection:
        print("✅ MySQL database connected successfully!")
        connection.close()
    else:
        print("❌ MySQL database connection failed.")
    