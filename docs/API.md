# API Documentation — Nayab SMS

Base URL: `http://localhost:5000/api`

## Authentication

All protected routes require header:
```
Authorization: Bearer <token>
```

### POST /auth/login
```json
{ "email": "admin@nayabgrammar.edu.pk", "password": "Admin@123" }
```

### GET /auth/me
Returns current user (protected).

---

## Public Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /public/home | Homepage data |
| GET | /public/about | About page |
| GET | /public/gallery | Gallery images |
| GET | /public/announcements | Published announcements |
| GET | /public/contact-info | School contact |
| POST | /public/contact | Contact form |
| POST | /public/admissions | Admission application |
| GET | /public/portal/classes | Class list for portal |
| GET | /public/portal/lookup?classId=&rollNumber= | Student portal data |
| GET | /public/portal/result-pdf?studentId=&examId= | Download result PDF |

---

## Admin Routes (role: admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /admin/dashboard | Dashboard stats & charts |
| GET | /admin/students | List students (paginated) |
| POST | /admin/students | Add student (multipart) |
| PUT | /admin/students/:id | Update student |
| DELETE | /admin/students/:id | Soft delete student |
| GET | /admin/students/export/excel | Export Excel |
| GET | /admin/teachers | List teachers |
| POST | /admin/teachers | Add teacher |
| GET | /admin/classes | List classes |
| POST | /admin/classes | Add class |
| GET | /admin/attendance | Attendance report |
| GET | /admin/results | Results list |
| POST | /admin/results | Add result |
| GET | /admin/fees | Fee records |
| GET | /admin/fees/report | Fee summary |
| CRUD | /admin/announcements | Announcements |
| GET/PUT | /admin/website-content | CMS content |

---

## Teacher Routes (role: teacher or admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /teacher/dashboard | Teacher dashboard |
| GET | /teacher/classes | Assigned classes |
| GET | /teacher/students/:classId | Class roster |
| POST | /teacher/attendance | Mark absent students |
| GET | /teacher/attendance/:classId | View attendance |
| POST | /teacher/results | Add marks |

### POST /teacher/attendance
```json
{
  "classId": 5,
  "date": "2025-06-17",
  "absentStudentIds": [1, 5, 12]
}
```

---

## Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /search/students?q=&classId=&rollNumber= | Search students (admin) |

---

## Response Format

Success:
```json
{ "success": true, "data": {}, "message": "..." }
```

Error:
```json
{ "success": false, "message": "Error description" }
```
