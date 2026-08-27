# 🎓 Campus Connect

> **A centralized digital platform for managing and accessing campus information.**

---

## 📌 About the Project

**Campus Connect** is a web-based campus information management platform designed to bring important college information into one centralized system.

The platform allows students to easily access announcements, clubs, cells, academic information, and non-academic information without depending on multiple sources.

The system also provides secure authentication and role-based access so that authorized coordinators and administrators can manage relevant campus content.

---

## 🎯 Problem Statement

In a college environment, important information is often distributed across different platforms, groups, notice boards, and communication channels.

This can make it difficult for students to:

* Find important announcements
* Discover clubs and cells
* Access academic information
* Find non-academic activities
* Stay updated with campus activities
* Identify the correct source of information

**Campus Connect** aims to solve this problem by providing a centralized platform for campus-related information.

---

## 🎯 Objectives

The main objectives of Campus Connect are:

* Centralize important campus information
* Provide easy access to announcements
* Organize clubs and cells
* Provide academic and non-academic information
* Implement secure user authentication
* Provide role-based access control
* Allow authorized coordinators to manage their content
* Provide administrators with platform-level management
* Improve communication between students and campus organizations

---

## ✨ Key Features

### 🔐 Authentication

* User Registration
* User Login
* Password Hashing
* Email Verification
* Email Verification Token Expiration
* Forgot Password
* Password Reset through Email
* Flask Session Management
* Role-Based Access Control

### 📢 Campus Information

* Campus Announcements
* Clubs Information
* Cells Information
* Academic Information
* Non-Academic Information

### 👥 User Roles

* Student
* Coordinator
* Main Administrator

### ⚙️ Management

* Coordinator-based content management
* Administrator-level management
* Secure access to protected pages

---

## 👥 User Roles

### 🎓 Student

Students can:

* Register and verify their email
* Login securely
* View announcements
* View clubs
* View cells
* Access academic information
* Access non-academic information

### 👨‍💼 Coordinator

Coordinators can manage the content assigned to their respective organization or section.

### 🛡️ Main Administrator

The Main Administrator has higher-level access to manage the overall platform and authorized content.

---

## 🧩 Main Modules

```text
🏠 Home
│
├── 📢 Announcements
│
├── 🎭 Clubs
│
├── 🏢 Cells
│
├── 📚 Academic
│
├── 🎯 Non-Academic
│
├── 🔐 Authentication
│   ├── Login
│   ├── Signup
│   ├── Email Verification
│   └── Password Reset
│
└── ⚙️ Administration
    ├── Main Admin
    └── Coordinators
```

---

## 🛠️ Technology Stack

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Python
* Flask

### Database

* MySQL
* SQLAlchemy

### Authentication & Security

* Flask-Bcrypt
* Flask Sessions
* Secure Token Generation
* Email Verification
* Password Reset

### Email Services

* Flask-Mail

### Configuration

* python-dotenv

### Version Control

* Git
* GitHub

---

## 🏗️ System Architecture

```text
                    ┌─────────────────┐
                    │      User       │
                    └────────┬────────┘
                             │
                             ▼
                 ┌──────────────────────┐
                 │ HTML / CSS / JS       │
                 │     Frontend          │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │       Flask          │
                 │ Routes & Logic       │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │    SQLAlchemy        │
                 │      ORM             │
                 └──────────┬───────────┘
                            │
                            ▼
                 ┌──────────────────────┐
                 │       MySQL          │
                 │      Database        │
                 └──────────────────────┘
```

---

## 🔐 Authentication Flow

```text
                    Signup
                      │
                      ▼
              Enter User Details
                      │
                      ▼
              Validate Information
                      │
                      ▼
              Hash Password
                      │
                      ▼
              Store User in DB
                      │
                      ▼
             Send Verification Email
                      │
                      ▼
             User Verifies Email
                      │
                      ▼
                 Login
                      │
                      ▼
             Validate Credentials
                      │
                      ▼
             Create Flask Session
                      │
                      ▼
              Access Dashboard
```

---

## 🔒 Security

Campus Connect follows basic security practices including:

* Passwords are never stored as plain text.
* Passwords are hashed using Bcrypt.
* Email verification is required before login.
* Verification tokens are time-limited.
* Password reset uses secure tokens.
* Sensitive configuration is stored in environment variables.
* `.env` is excluded from Git.
* Protected routes require authentication.
* Role-based authorization is used for restricted functionality.

---

## 📂 Project Structure

```text
campus-connect/
│
├── README.md
├── requirements.txt
├── .gitignore
├── .env.example
├── app.py
│
├── templates/
│   ├── login.html
│   ├── home.html
│   ├── clubs.html
│   ├── cells.html
│   ├── academic.html
│   └── non_academic.html
│
├── static/
│   ├── css/
│   ├── js/
│   └── images/
│
├── routes/
│
├── models/
│
├── utils/
│
└── instance/
```

> **Note:** The structure may evolve as development continues.

---

## 🗄️ Database

Campus Connect uses **MySQL** as its primary database.

The Flask application communicates with MySQL through **SQLAlchemy**.

Basic architecture:

```text
Flask Application
        │
        ▼
   SQLAlchemy
        │
        ▼
      MySQL
```

Major database entities may include:

* Users
* Announcements
* Clubs
* Cells
* Academic Information
* Non-Academic Information

---

## 📦 Requirements

The project uses the following Python packages:

```text
Flask
Flask-SQLAlchemy
Flask-Mail
Flask-Bcrypt
PyMySQL
python-dotenv
itsdangerous
```

Install them using:

```bash
pip install -r requirements.txt
```

---

## ⚙️ Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
```

### 2. Navigate to the Project

```bash
cd campus-connect
```

### 3. Create a Virtual Environment

```bash
python -m venv venv
```

### 4. Activate the Virtual Environment

#### Windows

```bash
venv\Scripts\activate
```

#### Linux / macOS

```bash
source venv/bin/activate
```

### 5. Install Dependencies

```bash
pip install -r requirements.txt
```

---

## 🔑 Environment Variables

Create a `.env` file in the root directory.

Example:

```env
SECRET_KEY=your_secret_key

DATABASE_URL=mysql+pymysql://username:password@localhost/campus_connect

MAIL_SERVER=your_mail_server
MAIL_PORT=your_mail_port
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_email_password
```

### ⚠️ Important

**Never upload your `.env` file to GitHub.**

Use `.env.example` to show teammates which variables they need to configure.

---

## 🗃️ MySQL Setup

Create the database in MySQL:

```sql
CREATE DATABASE campus_connect;
```

Then configure your database credentials in `.env`.

Example:

```env
DATABASE_URL=mysql+pymysql://root:password@localhost/campus_connect
```

---

## ▶️ Running the Project

After completing the setup:

```bash
python app.py
```

The application will normally be available at:

```text
http://127.0.0.1:5000
```

Open the address in your browser.

---

## 🌐 Main Routes

| Route              | Description              |
| ------------------ | ------------------------ |
| `/`                | Homepage                 |
| `/login`           | User Login               |
| `/signup`          | User Registration        |
| `/verify/<token>`  | Email Verification       |
| `/forgot-password` | Password Reset           |
| `/clubs`           | Clubs                    |
| `/cells`           | Cells                    |
| `/academic`        | Academic Information     |
| `/non-academic`    | Non-Academic Information |

> Routes will be updated as the application grows.

---

## 🔄 Git & Team Workflow

The project is developed collaboratively using Git and GitHub.

Recommended workflow:

```text
main
  │
  └── development
        │
        ├── feature/authentication
        ├── feature/announcements
        ├── feature/clubs
        ├── feature/cells
        └── feature/academic
```

### Create a Feature Branch

```bash
git checkout -b feature/your-feature
```

### Add Changes

```bash
git add .
```

### Commit

```bash
git commit -m "Add your feature"
```

### Push

```bash
git push origin feature/your-feature
```

Then create a Pull Request for review.

---

## 📸 Screenshots

Screenshots of the application will be added here as development progresses.

### Homepage

```text
Coming Soon
```

### Login

```text
Coming Soon
```

### Dashboard

```text
Coming Soon
```

---

## 🚧 Development Status

### ✅ Completed

* Project initialization
* Flask backend setup
* Frontend structure
* Authentication UI
* Login/Signup interface
* Database integration planning
* GitHub repository setup

### 🚧 In Progress

* Complete authentication backend
* Email verification
* Password reset
* Role-based authorization
* Campus modules
* Admin functionality

### 📌 Planned

* Advanced search
* Notification system
* Event management
* Analytics
* Mobile-friendly improvements
* Additional campus services

---

## 🚀 Future Enhancements

Possible future improvements include:

* 📱 Mobile application
* 🔔 Push notifications
* 📅 Campus event calendar
* 🔎 Advanced search
* 📊 Admin analytics dashboard
* 💬 Student feedback system
* 📢 Real-time announcements
* 🏫 Integration with other campus services

---

## 👨‍💻 Team

### Team Catalyst

| Member      | Responsibility                   |
| ----------- | -------------------------------- |
| Team Lead   | Project Management & Development |
| Team Member | Frontend Development             |
| Team Member | Backend Development              |
| Team Member | Database Development             |

> Replace the placeholders with your actual team members and responsibilities.

---

## 📄 License

This project is developed as an academic project by **Team Catalyst**.

---

## ⭐ Project Vision

> **Campus Connect aims to make campus information accessible, organized, secure, and easy to manage through a single digital platform.**

---

<p align="center">

### 🎓 Campus Connect

**Connecting Students • Organizations • Information**

Made with ❤️ by **Team Catalyst**

</p>
