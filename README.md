# 🎓 Student Data Management System

**Smart Student Analytics & Management Platform** — a full-stack Flask + SQLite web app with a modern SaaS-style analytics dashboard.

## Features
- Full CRUD for students (add, view profile, edit, delete with confirmation modal), persisted in SQLite
- Animated dashboard: live stat counters, performance trend, course doughnut, marks distribution, top-5 leaderboard, recent students
- Analytics page with 6 Chart.js charts, all calculated from the database with Pandas
- Records table with live search, sorting, filters (course, year, status, marks range) and pagination
- Global search (ID, name, course, email) with dropdown results
- CSV export (Pandas), JSON export, validated JSON import with overwrite confirmation
- Dark / light mode (saved in `localStorage`), collapsible sidebar, mobile hamburger menu, toasts, skeleton loaders
- Server-side validation, parameterised SQL, escaped output, JSON error responses
- 18 realistic sample students created automatically on first launch

## Technology stack
| Layer | Tools |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript, Chart.js, Font Awesome, Google Fonts |
| Backend | Python, Flask (REST API, JSON) |
| Database | SQLite (`students.db`) |
| Data processing | Pandas |

## Screenshots
Add screenshots to `static/images/` and link them here:

| Dashboard | Analytics |
|---|---|
| `static/images/dashboard.png` | `static/images/analytics.png` |

## Installation
```bash
# 1. Create a virtual environment
python -m venv venv

# 2. Activate it
venv\Scripts\activate          # Windows (PowerShell / CMD)
source venv/bin/activate       # macOS / Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run
python app.py
```
Open **http://127.0.0.1:5000** in your browser. The database and sample data are created automatically.
(An internet connection is needed for the Chart.js, Font Awesome and Google Fonts CDNs.)

Optional environment variables: `SECRET_KEY` (session secret), `FLASK_DEBUG=1` (auto-reload during development).

## API endpoints
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | List students. Params: `q, course, year, status, min, max, sort, order, page, per_page` |
| POST | `/api/students` | Create a student (201, or 400 / 409) |
| GET | `/api/students/<id>` | Get one student |
| PUT | `/api/students/<id>` | Update a student |
| DELETE | `/api/students/<id>` | Delete a student |
| GET | `/api/students/search?q=` | Search by ID, name, course or email |
| GET | `/api/analytics` | Summary + chart data (Pandas) |
| GET | `/api/export/csv` · `/api/export/json` | Download `students.csv` / `students.json` |
| POST | `/api/import/json` | Import `{"records": [...], "overwrite": false}` — returns 409 with duplicate IDs unless `overwrite` is true |

## Database
SQLite file `students.db`, table `students`: `id` (unique, primary key), `name`, `email`, `phone`, `age`, `gender`, `course`, `department`, `year`, `marks`, `address`, `created_at`.
Status is derived from marks: **Excellent** ≥ 90, **Good** 70–89, **Average** 60–69, **Needs Improvement** < 60. Pass mark is 40 (`PASS_MARK` in `database.py`).

## Project structure
```
StudentDataManagement/
├── app.py              # Flask routes, REST API, error handling
├── database.py         # SQLite layer, validation, Pandas analytics, seed data
├── requirements.txt
├── templates/          # base, index, students, add_student, analytics, profile, settings
├── static/css/style.css
├── static/js/          # common.js, dashboard.js, students.js, analytics.js
└── data/               # students.json / students.csv (generated exports)
```

## Notes
- Admin / Logout are UI elements only; no authentication is implemented. Add Flask-Login before any public deployment.
- Student rows are stored in one table, so there is no separate "courses" table; course totals are computed from student records.

## Future enhancements
Authentication and roles, attendance and subject-wise marks, PDF report cards, email notifications, PostgreSQL support, unit tests and CI.

## Author
**Your Name** — [GitHub](https://github.com/your-username) · [LinkedIn](https://linkedin.com/in/your-profile)
