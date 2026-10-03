# 🎓 Student Data Management & Live Analytics Platform

> ### 🌐 [👉 Click Here to Open Live Interactive Web Analytics Dashboard](https://pallapuankammarao-c.github.io/StudentDatamManagement/)
> **Instant 24/7 web access directly in your browser — no installation or login required!**

[![Live Demo](https://img.shields.io/badge/Demo-Live%20Dashboard-6366f1?style=for-the-badge&logo=google-chrome&logoColor=white)](https://pallapuankammarao-c.github.io/StudentDatamManagement/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0+-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Pandas](https://img.shields.io/badge/Pandas-Analytics-150458?style=for-the-badge&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Database-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![Chart.js](https://img.shields.io/badge/Chart.js-Interactive-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)](https://chartjs.org/)

---

## 🌟 Overview

**EduPulse Student Data Management & Analytics Platform** is a full-stack academic performance intelligence platform built with Python, Flask, SQLite, and Pandas. It delivers a modern SaaS-style analytics interface with interactive charts, real-time KPI counters, cohort tracking, leaderboard rankings, and complete student records management.

---

## ✨ Key Features

- **📊 Live Executive Dashboard**:
  - 5 Animated Metric Counters: Total Enrolled, Class Average %, Pass Percentage (&ge; 40%), Peak Score, and Active Academic Tracks.
  - Interactive Chart.js charts: Cohort Score Progression over time, Course Distribution doughnut, Grade Tier breakdown, and Department Averages comparison.
  - Top 5 Student Valedictorian Leaderboard with trophies and performance badges.
  - Recent Student Admissions activity feed with score progress tracks.

- **👥 Student Directory & Records**:
  - Dual view toggle: **Responsive Data Table View** and **Interactive Card Grid View**.
  - Multi-parameter live search: ID, Full Name, Course, Email, Department.
  - Multi-filters: Filter by Academic Track (CSE, ECE, EEE, MECH, CIVIL, IT, AIML, DS), Academic Year (1–4), and Grade Tier.
  - Instant sorting: Marks (High to Low / Low to High), Name (A-Z), and Date Enrolled.

- **📈 Deep Academic Analytics**:
  - 6 full-size data visualizations powered by Pandas statistical aggregation:
    1. Score Progression Time-Series Line Chart
    2. Department Enrollment Doughnut Chart
    3. Grade Tier Distribution (Excellent, Good, Average, Needs Improvement)
    4. Department Mean Score Comparison Bar Chart
    5. Gender Representation Pie Chart
    6. Year-wise Enrollment Distribution Bar Chart

- **🎓 Student Profile & Report Cards**:
  - Individual student report cards with performance evaluation, score progress circle, personal information, and print-ready layout.

- **➕ Student Enrollment & Validation**:
  - Form validation with course-to-department auto-linking.
  - Real-time interactive marks range slider with live grade tier preview.

- **📥 Data Import & Export**:
  - One-click CSV and JSON exports for reporting and data pipelines.
  - JSON bulk upload with duplicate ID validation and overwrite controls.

- **🌓 Design System & UX**:
  - Premium Dark & Light mode switcher with `localStorage` memory.
  - Responsive mobile drawer navigation, toast notifications, and global search autocomplete dropdown.

---

## 🛠️ Technology Stack

| Layer | Tools / Libraries |
|---|---|
| **Frontend** | HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ES6+), Chart.js 4, Font Awesome 6, Google Fonts |
| **Backend** | Python 3.10+, Flask (REST API, JSON Endpoints) |
| **Database** | SQLite 3 (`students.db`) |
| **Analytics Engine** | Pandas (Aggregation, GroupBy, Monthly Trends) |
| **Deployment** | GitHub Pages (Live Interactive Web App), Cloudflare Tunnel / WSGI |

---

## 🚀 Quick Start (Running Locally)

### 1. Clone the Repository
```bash
git clone https://github.com/pallapuankammarao-c/StudentDatamManagement.git
cd StudentDatamManagement
```

### 2. Create and Activate Virtual Environment
```bash
# Windows (PowerShell / CMD):
python -m venv venv
venv\Scripts\activate

# macOS / Linux:
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python app.py


---

## 🌐 Public Live Web App (GitHub Pages)

You can also run the full interactive dashboard directly in any browser without installing Python:

👉 **[https://pallapuankammarao-c.github.io/StudentDatamManagement/](https://pallapuankammarao-c.github.io/StudentDatamManagement/)**

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/students` | List, filter, sort, and paginate students (`q, course, year, status, min, max, sort, order, page, per_page`) |
| `POST` | `/api/students` | Create new student record with validation (201 Created / 400 Bad Request / 409 Conflict) |
| `GET` | `/api/students/<id>` | Fetch student record by ID |
| `PUT` | `/api/students/<id>` | Update student profile and academic marks |
| `DELETE` | `/api/students/<id>` | Delete student record |
| `GET` | `/api/students/search?q=` | Fast global search across ID, name, course, and email |
| `GET` | `/api/analytics` | Statistical summaries, grade distributions, and trend data calculated via Pandas |
| `GET` | `/api/notifications` | Real-time activity notifications and performance alerts |
| `GET` | `/api/export/csv` | Download complete dataset as `students.csv` |
| `GET` | `/api/export/json` | Download complete dataset as `students.json` |
| `POST` | `/api/import/json` | Bulk import records with overwrite confirmation |

---

## 🗄️ Database Schema

SQLite table `students`:

| Field | Type | Description |
|---|---|---|
| `id` | `TEXT` | Unique Student ID (Primary Key, e.g. `S1001`) |
| `name` | `TEXT` | Full Name |
| `email` | `TEXT` | Email Address |
| `phone` | `TEXT` | Phone Number |
| `age` | `INTEGER` | Age (15–60) |
| `gender` | `TEXT` | Gender (`Male`, `Female`, `Other`) |
| `course` | `TEXT` | Academic Program Track (e.g. `CSE`, `ECE`, `AIML`, `DS`) |
| `department` | `TEXT` | Department Name |
| `year` | `INTEGER` | Academic Year (1–4) |
| `marks` | `REAL` | Score (0.00 – 100.00%) |
| `address` | `TEXT` | City / Residential Address |
| `created_at` | `TEXT` | Timestamp of enrollment (`YYYY-MM-DD HH:MM:SS`) |

> **Grade Tier Classification**:
> - **Excellent**: &ge; 90%
> - **Good**: 70% – 89%
> - **Average**: 60% – 69%
> - **Needs Improvement**: < 60%
> - **Passing Mark**: &ge; 40%

---

## 📁 Project Structure

```
StudentDatamManagement/
├── .github/
│   └── workflows/
│       └── pages.yml        # Automated GitHub Pages CI/CD workflow
├── data/
│   ├── students.csv         # Generated CSV export dataset
│   └── students.json        # Generated JSON export dataset
├── static/
│   ├── css/
│   │   └── style.css        # Responsive CSS design system (Dark & Light)
│   └── js/
│       ├── common.js        # Global search, theme switcher, notifications, toasts
│       ├── dashboard.js     # Live metric counters, Chart.js visualizations
│       ├── students.js      # Filtering, search, modals, pagination
│       └── analytics.js     # Deep cohort analytics charts
├── templates/
│   ├── base.html            # Core layout with responsive navigation & sidebar
│   ├── index.html           # Live Executive Dashboard
│   ├── students.html        # Student Directory & Records table
│   ├── analytics.html       # Deep Academic Analytics page
│   ├── profile.html         # Individual Student Profile & Report Card
│   ├── add_student.html     # Student Registration form
│   └── settings.html        # Public sharing hub & export settings
├── app.py                   # Flask REST API, routing, error handling
├── database.py              # SQLite data access layer, validation, Pandas analytics
├── index.html               # Standalone interactive dashboard for GitHub Pages
├── requirements.txt         # Project dependencies
└── README.md                # Project documentation
```

---

## 👨‍💻 Author

**Pallapu Ankamma Rao**
- **GitHub**: [@pallapuankammarao-c](https://github.com/pallapuankammarao-c) · [@pallapuankammarao](https://github.com/pallapuankammarao)
- **Email**: [pallapuankamma035@gmail.com](mailto:pallapuankammarao035@gmail.com)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
