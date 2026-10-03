"""Flask application: pages + REST API for the Student Data Management System."""
import os

from flask import Flask, jsonify, render_template, request, send_file
from werkzeug.exceptions import HTTPException

import database as db

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY") or os.urandom(24).hex()
app.config["MAX_CONTENT_LENGTH"] = 2 * 1024 * 1024  # 2 MB request limit
db.init_db()


@app.context_processor
def inject_options():
    return {
        "courses": db.COURSES,
        "course_dept": db.COURSE_DEPT,
        "genders": list(db.GENDERS),
        "years": [(y, f"Year {y}") for y in range(1, 5)],
        "statuses": list(db.STATUS_SQL),
    }


def api_error(message, status=400, **extra):
    return jsonify({"error": message, **extra}), status


# ---------------------------------------------------------------------- pages
@app.get("/")
def dashboard():
    return render_template("index.html", page="dashboard")


@app.get("/students")
def students_page():
    return render_template("students.html", page="students", mode="students")


@app.get("/records")
def records_page():
    return render_template("students.html", page="records", mode="records")


@app.get("/add-student")
def add_student_page():
    return render_template("add_student.html", page="add")


@app.get("/students/<sid>")
def profile_page(sid):
    return render_template("profile.html", page="students", student_id=sid)


@app.get("/analytics")
def analytics_page():
    return render_template("analytics.html", page="analytics")


@app.get("/settings")
def settings_page():
    return render_template("settings.html", page="settings")


# ------------------------------------------------------------------------ API
@app.get("/api/students")
def api_list():
    return jsonify(db.list_students(request.args))


@app.get("/api/students/search")
def api_search():
    args = {"q": request.args.get("q", ""), "per_page": request.args.get("limit", 8), "sort": "name", "order": "asc"}
    if not args["q"].strip():
        return jsonify({"items": [], "total": 0})
    result = db.list_students(args)
    return jsonify({"items": result["items"], "total": result["total"]})


@app.post("/api/students")
def api_create():
    clean, errors = db.validate_student(request.get_json(silent=True))
    if errors:
        return api_error("Invalid input!", 400, errors=errors)
    try:
        student = db.insert_student(clean)
    except db.DuplicateStudentError:
        return api_error("Student ID already exists!", 409, errors={"id": "This Student ID is already in use."})
    return jsonify(student), 201


@app.get("/api/students/<sid>")
def api_get(sid):
    student = db.get_student(sid)
    if not student:
        return api_error("Student not found.", 404)
    return jsonify(student)


@app.put("/api/students/<sid>")
def api_update(sid):
    clean, errors = db.validate_student(request.get_json(silent=True), require_id=False)
    if errors:
        return api_error("Invalid input!", 400, errors=errors)
    if not db.update_student(sid, clean):
        return api_error("Student not found.", 404)
    return jsonify(db.get_student(sid))


@app.delete("/api/students/<sid>")
def api_delete(sid):
    if not db.delete_student(sid):
        return api_error("Student not found.", 404)
    return jsonify({"message": "Student deleted successfully!", "id": sid})


@app.get("/api/analytics")
def api_analytics():
    return jsonify(db.compute_analytics())


@app.get("/api/notifications")
def api_notifications():
    items = [{"icon": "user-plus", "text": f"{s['name']} was added to {s['course']}", "time": s["created_at"]}
             for s in db.list_students({"per_page": 3})["items"]]
    an = db.compute_analytics()
    low = db.list_students({"status": "Needs Improvement", "per_page": 1})["total"]
    if low:
        items.append({"icon": "triangle-exclamation", "text": f"{low} student(s) need academic support", "time": "Performance alert"})
    if an["top_students"]:
        t = an["top_students"][0]
        items.append({"icon": "trophy", "text": f"Top score: {t['name']} with {t['marks']}%", "time": "Leaderboard"})
    return jsonify({"items": items})


@app.get("/api/export/csv")
def export_csv():
    db.write_exports()  # CSV is generated with Pandas
    return send_file(os.path.join(db.DATA_DIR, "students.csv"), mimetype="text/csv",
                     as_attachment=True, download_name="students.csv")


@app.get("/api/export/json")
def export_json():
    db.write_exports()
    return send_file(os.path.join(db.DATA_DIR, "students.json"), mimetype="application/json",
                     as_attachment=True, download_name="students.json")


@app.post("/api/import/json")
def import_json():
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or not isinstance(body.get("records"), list):
        return api_error("Body must be JSON containing a 'records' list.", 400)
    records, overwrite = body["records"], body.get("overwrite") is True
    if not records:
        return api_error("The file contains no records.", 400)
    if len(records) > 5000:
        return api_error("Too many records (maximum 5000 per import).", 400)

    valid, problems, seen = [], [], set()
    for i, rec in enumerate(records):
        clean, errors = db.validate_student(rec)
        if not errors and clean["id"] in seen:
            errors = {"id": "Duplicate Student ID inside the file."}
        if errors:
            problems.append({"index": i, "id": clean.get("id"), "errors": errors})
        else:
            seen.add(clean["id"])
            valid.append(clean)
    if problems:
        return api_error(f"{len(problems)} record(s) failed validation.", 400, details=problems[:10])

    result = db.bulk_import(valid, overwrite)
    if "duplicates" in result:
        return api_error("Some Student IDs already exist.", 409, duplicates=result["duplicates"])
    return jsonify(result)


# ------------------------------------------------------------- error handling
MESSAGES = {404: "Resource not found.", 405: "Method not allowed.", 413: "Uploaded data is too large."}


@app.errorhandler(Exception)
def handle_exception(exc):
    is_api = request.path.startswith("/api/")
    if isinstance(exc, HTTPException):
        return api_error(MESSAGES.get(exc.code, exc.name), exc.code) if is_api else exc
    app.logger.exception("Unhandled error")  # details go to the server log only
    if is_api:
        return api_error("Something went wrong on the server.", 500)
    return "Something went wrong on the server.", 500


if __name__ == "__main__":
    host = os.environ.get("FLASK_HOST", "0.0.0.0")
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG") == "1"
    print(f"\n=======================================================")
    print(f"  Student Data Management & Live Analytics Dashboard")
    print(f"=======================================================")
    print(f"-> Local URL:       http://localhost:{port}")
    print(f"-> Network URL:     http://127.0.0.1:{port}")
    print(f"=======================================================\n")
    app.run(host=host, port=port, debug=debug)
