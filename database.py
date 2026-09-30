"""SQLite data layer, validation and Pandas analytics for the Student Data Management System."""
import json
import math
import os
import re
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timedelta

import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "students.db")
DATA_DIR = os.path.join(BASE_DIR, "data")
PASS_MARK = 40

COURSE_DEPT = {
    "CSE": "Computer Science & Engineering",
    "ECE": "Electronics & Communication",
    "EEE": "Electrical & Electronics",
    "MECH": "Mechanical Engineering",
    "CIVIL": "Civil Engineering",
    "IT": "Information Technology",
    "AIML": "Artificial Intelligence & ML",
    "DS": "Data Science",
}
COURSES = list(COURSE_DEPT)
GENDERS = ("Male", "Female", "Other")
SORTABLE = {"id", "name", "email", "age", "course", "year", "marks", "created_at"}
STATUS_SQL = {
    "Excellent": "marks >= 90",
    "Good": "marks >= 70 AND marks < 90",
    "Average": "marks >= 60 AND marks < 70",
    "Needs Improvement": "marks < 60",
}

ID_RE = re.compile(r"^[A-Za-z0-9_-]{2,20}$")
NAME_RE = re.compile(r"^[A-Za-z][A-Za-z .'-]{1,79}$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_RE = re.compile(r"^\+?[0-9 -]{7,16}$")
COURSE_RE = re.compile(r"^[A-Za-z0-9 &.\-]{2,20}$")
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$")


class DuplicateStudentError(Exception):
    """Raised when a student ID already exists."""


@contextmanager
def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def status_for(marks):
    if marks >= 90:
        return "Excellent"
    if marks >= 70:
        return "Good"
    if marks >= 60:
        return "Average"
    return "Needs Improvement"


def _row(row):
    d = dict(row)
    d["status"] = status_for(d["marks"])
    return d


# ----------------------------------------------------------------- validation
def _to_int(v):
    if isinstance(v, bool):
        raise ValueError
    f = float(str(v).strip())
    if not f.is_integer():
        raise ValueError
    return int(f)


def _to_float(v):
    if isinstance(v, bool):
        raise ValueError
    f = float(str(v).strip())
    if not math.isfinite(f):
        raise ValueError
    return f


def validate_student(data, require_id=True):
    """Return (clean_dict, errors_dict). Never trusts the frontend."""
    if not isinstance(data, dict):
        return {}, {"body": "Student data must be a JSON object."}
    errors, clean = {}, {}

    def s(key):
        v = data.get(key)
        return "" if v is None else str(v).strip()

    if require_id:
        sid = s("id")
        clean["id"] = sid
        if not ID_RE.match(sid):
            errors["id"] = "Student ID must be 2-20 characters (letters, numbers, - or _)."

    name = s("name")
    clean["name"] = name
    if not NAME_RE.match(name):
        errors["name"] = "Enter a valid full name (letters, spaces, . ' -)."

    email = s("email")
    clean["email"] = email.lower()
    if not EMAIL_RE.match(email) or len(email) > 120:
        errors["email"] = "Enter a valid email address."

    phone = s("phone")
    clean["phone"] = phone
    if not PHONE_RE.match(phone) or not 7 <= len(re.sub(r"\D", "", phone)) <= 15:
        errors["phone"] = "Enter a valid phone number (7-15 digits)."

    try:
        age = _to_int(data.get("age"))
        if not 15 <= age <= 60:
            raise ValueError
        clean["age"] = age
    except (ValueError, TypeError):
        errors["age"] = "Age must be a whole number between 15 and 60."

    gender = s("gender")
    clean["gender"] = gender
    if gender not in GENDERS:
        errors["gender"] = "Select Male, Female or Other."

    course = s("course").upper()
    clean["course"] = course
    if not COURSE_RE.match(course):
        errors["course"] = "Select a valid course."

    dept = s("department")
    clean["department"] = dept
    if not 2 <= len(dept) <= 60:
        errors["department"] = "Department must be 2-60 characters."

    try:
        year = _to_int(data.get("year"))
        if not 1 <= year <= 4:
            raise ValueError
        clean["year"] = year
    except (ValueError, TypeError):
        errors["year"] = "Year must be between 1 and 4."

    try:
        marks = _to_float(data.get("marks"))
        if not 0 <= marks <= 100:
            raise ValueError
        clean["marks"] = round(marks, 2)
    except (ValueError, TypeError):
        errors["marks"] = "Marks must be a number between 0 and 100."

    address = s("address")
    clean["address"] = address
    if len(address) > 300:
        errors["address"] = "Address must be 300 characters or fewer."

    created = s("created_at")
    if created:
        if DATE_RE.match(created):
            clean["created_at"] = created if len(created) > 10 else created + " 00:00:00"
        else:
            errors["created_at"] = "created_at must look like YYYY-MM-DD HH:MM:SS."
    return clean, errors


# ----------------------------------------------------------------------- CRUD
INSERT_SQL = (
    "INSERT INTO students (id,name,email,phone,age,gender,course,department,year,marks,address,created_at) "
    "VALUES (?,?,?,?,?,?,?,?,?,?,?,?)"
)


def _insert_params(c):
    created = c.get("created_at") or datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    return (c["id"], c["name"], c["email"], c["phone"], c["age"], c["gender"], c["course"],
            c["department"], c["year"], c["marks"], c["address"], created)


def insert_student(clean):
    with get_conn() as conn:
        try:
            conn.execute(INSERT_SQL, _insert_params(clean))
        except sqlite3.IntegrityError as exc:
            raise DuplicateStudentError(clean["id"]) from exc
    return get_student(clean["id"])


def get_student(sid):
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM students WHERE id = ?", (sid,)).fetchone()
    return _row(row) if row else None


def update_student(sid, c):
    with get_conn() as conn:
        cur = conn.execute(
            "UPDATE students SET name=?,email=?,phone=?,age=?,gender=?,course=?,department=?,"
            "year=?,marks=?,address=? WHERE id=?",
            (c["name"], c["email"], c["phone"], c["age"], c["gender"], c["course"], c["department"],
             c["year"], c["marks"], c["address"], sid),
        )
        return cur.rowcount


def delete_student(sid):
    with get_conn() as conn:
        return conn.execute("DELETE FROM students WHERE id = ?", (sid,)).rowcount


def _like(q):
    return "%" + q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%"


def _qint(v, default, lo=None, hi=None):
    try:
        n = int(v)
    except (TypeError, ValueError):
        return default
    if lo is not None:
        n = max(lo, n)
    if hi is not None:
        n = min(hi, n)
    return n


def _qfloat(v):
    try:
        f = float(v)
        return f if math.isfinite(f) else None
    except (TypeError, ValueError):
        return None


def list_students(args):
    """Filter / sort / paginate. All SQL is parameterised; sort columns are whitelisted."""
    where, params = [], []
    q = (args.get("q") or "").strip()
    if q:
        where.append("(id LIKE ? ESCAPE '\\' OR name LIKE ? ESCAPE '\\' OR course LIKE ? ESCAPE '\\' "
                     "OR email LIKE ? ESCAPE '\\')")
        params += [_like(q)] * 4
    if args.get("course"):
        where.append("course = ?")
        params.append(args["course"].upper())
    if args.get("year"):
        where.append("year = ?")
        params.append(_qint(args["year"], 0))
    if args.get("status") in STATUS_SQL:
        where.append("(" + STATUS_SQL[args["status"]] + ")")
    lo, hi = _qfloat(args.get("min")), _qfloat(args.get("max"))
    if lo is not None:
        where.append("marks >= ?")
        params.append(lo)
    if hi is not None:
        where.append("marks <= ?")
        params.append(hi)
    clause = ("WHERE " + " AND ".join(where)) if where else ""

    sort = args.get("sort") if args.get("sort") in SORTABLE else "created_at"
    order = "ASC" if str(args.get("order", "desc")).lower() == "asc" else "DESC"
    per_page = _qint(args.get("per_page"), 10, 1, 100)
    page = _qint(args.get("page"), 1, 1)

    with get_conn() as conn:
        total = conn.execute(f"SELECT COUNT(*) FROM students {clause}", params).fetchone()[0]
        pages = max(1, math.ceil(total / per_page))
        page = min(page, pages)
        rows = conn.execute(
            f"SELECT * FROM students {clause} ORDER BY {sort} {order}, rowid DESC LIMIT ? OFFSET ?",
            params + [per_page, (page - 1) * per_page],
        ).fetchall()
    return {"items": [_row(r) for r in rows], "total": total, "page": page,
            "pages": pages, "per_page": per_page}


def bulk_import(records, overwrite):
    with get_conn() as conn:
        existing = {r["id"] for r in conn.execute("SELECT id FROM students")}
        dups = [r["id"] for r in records if r["id"] in existing]
        if dups and not overwrite:
            return {"duplicates": dups}
        inserted = updated = 0
        for r in records:
            if r["id"] in existing:
                conn.execute(
                    "UPDATE students SET name=?,email=?,phone=?,age=?,gender=?,course=?,department=?,"
                    "year=?,marks=?,address=?,created_at=COALESCE(?,created_at) WHERE id=?",
                    (r["name"], r["email"], r["phone"], r["age"], r["gender"], r["course"],
                     r["department"], r["year"], r["marks"], r["address"], r.get("created_at"), r["id"]))
                updated += 1
            else:
                conn.execute(INSERT_SQL, _insert_params(r))
                inserted += 1
    return {"inserted": inserted, "updated": updated}


# ------------------------------------------------------------------ Pandas
def students_frame():
    with get_conn() as conn:
        return pd.read_sql_query("SELECT * FROM students ORDER BY created_at, id", conn)


def compute_analytics():
    df = students_frame()
    empty = {
        "summary": {"total_students": 0, "average_marks": 0, "highest_marks": 0, "lowest_marks": 0,
                    "pass_percentage": 0, "total_courses": 0, "top_score": 0},
        "course_counts": {"labels": [], "values": []}, "distribution": {"labels": [], "values": []},
        "avg_by_course": {"labels": [], "values": []}, "trend": {"labels": [], "avg": [], "count": []},
        "gender": {"labels": [], "values": []}, "year": {"labels": [], "values": []}, "top_students": [],
    }
    if df.empty:
        return empty

    bands = [("Excellent (90-100)", 90, 101), ("Very Good (80-89)", 80, 90), ("Good (70-79)", 70, 80),
             ("Average (60-69)", 60, 70), ("Needs Improvement (<60)", -1, 60)]
    dist_vals = [int(((df.marks >= lo) & (df.marks < hi)).sum()) for _, lo, hi in bands]

    cc = df.course.value_counts()
    avg_course = df.groupby("course").marks.mean().round(2).sort_index()
    df["month"] = pd.to_datetime(df.created_at).dt.to_period("M")
    trend = df.groupby("month").marks.agg(["mean", "count"]).sort_index()
    gender = df.gender.value_counts()
    year = df.year.value_counts().sort_index()
    top = df.sort_values(["marks", "name"], ascending=[False, True]).head(5)

    return {
        "summary": {
            "total_students": int(len(df)),
            "average_marks": round(float(df.marks.mean()), 1),
            "highest_marks": float(df.marks.max()),
            "lowest_marks": float(df.marks.min()),
            "pass_percentage": round(float((df.marks >= PASS_MARK).mean() * 100), 1),
            "total_courses": int(df.course.nunique()),
            "top_score": float(df.marks.max()),
        },
        "course_counts": {"labels": cc.index.tolist(), "values": [int(v) for v in cc.values]},
        "distribution": {"labels": [b[0] for b in bands], "values": dist_vals},
        "avg_by_course": {"labels": avg_course.index.tolist(), "values": [float(v) for v in avg_course.values]},
        "trend": {"labels": [p.strftime("%b %Y") for p in trend.index],
                  "avg": [round(float(v), 1) for v in trend["mean"]],
                  "count": [int(v) for v in trend["count"]]},
        "gender": {"labels": gender.index.tolist(), "values": [int(v) for v in gender.values]},
        "year": {"labels": [f"Year {int(y)}" for y in year.index], "values": [int(v) for v in year.values]},
        "top_students": [_row(r) for r in top.drop(columns=["month"]).to_dict("records")],
    }


def write_exports():
    """Write data/students.csv and data/students.json (used by the export endpoints)."""
    os.makedirs(DATA_DIR, exist_ok=True)
    df = students_frame()
    df.to_csv(os.path.join(DATA_DIR, "students.csv"), index=False)
    with open(os.path.join(DATA_DIR, "students.json"), "w", encoding="utf-8") as fh:
        json.dump(df.to_dict("records"), fh, indent=2, ensure_ascii=False)


# -------------------------------------------------------------- init / seed
SEED = [
    ("Ankamma Reddy", "Female", "CSE", 3, 20, 92.5, 12), ("Ravi Teja", "Male", "CSE", 2, 19, 85, 30),
    ("Sravani Devi", "Female", "ECE", 4, 22, 78, 45), ("Karthik Varma", "Male", "MECH", 1, 18, 66, 58),
    ("Lakshmi Prasanna", "Female", "CIVIL", 2, 19, 54, 74), ("Venkata Sai", "Male", "CSE", 4, 22, 96, 88),
    ("Harika Chowdary", "Female", "AIML", 1, 18, 88, 101), ("Mohammed Irfan", "Male", "ECE", 3, 21, 72, 118),
    ("Divya Bharathi", "Female", "EEE", 2, 19, 61, 132), ("Naveen Kumar", "Male", "MECH", 3, 21, 38, 146),
    ("Pooja Sharma", "Female", "IT", 1, 18, 81, 160), ("Aditya Rao", "Male", "DS", 4, 22, 90.5, 172),
    ("Sneha Latha", "Female", "EEE", 1, 18, 69, 186), ("Praveen Babu", "Male", "CIVIL", 4, 23, 74, 198),
    ("Anusha Reddy", "Female", "IT", 3, 20, 58, 210), ("Rahul Verma", "Male", "AIML", 2, 19, 83, 224),
    ("Meghana Rao", "Female", "CSE", 1, 18, 94, 236), ("Suresh Naidu", "Male", "ECE", 2, 20, 47, 248),
]
CITIES = ["Bapatla, Andhra Pradesh", "Guntur, Andhra Pradesh", "Vijayawada, Andhra Pradesh",
          "Hyderabad, Telangana", "Chennai, Tamil Nadu", "Visakhapatnam, Andhra Pradesh"]


def seed_if_empty():
    with get_conn() as conn:
        if conn.execute("SELECT COUNT(*) FROM students").fetchone()[0]:
            return
        now = datetime.now()
        for i, (name, gender, course, year, age, marks, days) in enumerate(SEED):
            created = (now - timedelta(days=days, hours=i)).strftime("%Y-%m-%d %H:%M:%S")
            conn.execute(INSERT_SQL, (
                f"S{1001 + i}", name, name.lower().replace(" ", ".") + "@example.edu",
                f"98765{43210 + i * 731:05d}", age, gender, course, COURSE_DEPT[course], year, marks,
                CITIES[i % len(CITIES)], created))


def init_db():
    with get_conn() as conn:
        conn.execute(
            """CREATE TABLE IF NOT EXISTS students (
                id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
                age INTEGER NOT NULL, gender TEXT NOT NULL, course TEXT NOT NULL, department TEXT NOT NULL,
                year INTEGER NOT NULL, marks REAL NOT NULL, address TEXT DEFAULT '',
                created_at TEXT NOT NULL DEFAULT (datetime('now')))""")
    seed_if_empty()
    write_exports()
