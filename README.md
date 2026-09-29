# Nayab English Grammar High School — School Management System

**GitHub:** [github.com/danishaliarain666/NayabSchool](https://github.com/danishaliarain666/NayabSchool)

**GitHub Pages (public UI demo):** [danishaliarain666.github.io/NayabSchool](https://danishaliarain666.github.io/NayabSchool/) — static frontend only; **admin/portal data** needs MySQL + backend (run locally with `RUN-WEBSITE.bat` or host the API separately).

A full-stack School Management System for **Nayab English Grammar High School, Mirwah Gorchani**.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Recharts
- **Backend:** Node.js, Express.js, JWT, bcrypt
- **Database:** MySQL 8

## Features

### Public Website
- Home, About, Admissions, Gallery, Contact
- Announcements, news, gallery, Google Map
- Admission form + **PDF prospectus download**
- **Student/Parent Portal** (no login — Class + Roll Number)

### Admin Panel
- Dashboard with **fee charts, class distribution, attendance trends**
- **Students** — Add, Edit, Delete, Search, **Excel export**
- **Teachers** — Add, Edit, Delete (+ optional login creation)
- **Classes** — Add, Edit, Delete
- **Results** — Add marks, view, **PDF export**
- **Fees** — Add, Edit, payment tracking, reports
- **Attendance** — Reports with date/class filters
- **Announcements** — Full CRUD
- **Website CMS** — Edit content + manage gallery
- **Submissions Inbox** — Contact messages + admission applications
- **Global Search** — Search students by name, class, roll number
- **Notifications** bell in header

### Teacher Portal
- Mark **absent-only** attendance
- Add marks, view class students
- Scoped to **assigned classes only**

### Technical
- JWT authentication, bcrypt passwords, express-validator
- Dark/Light mode, responsive design, loading states
- 50 demo students with Pakistani names
- **Nayab School Assistant** — AI help chatbot (English/Urdu) on every page
- School logo & photos from official Instagram @nayab.h.s.mirwah
- **Bulk result card PDF** generation (class-wide)

## Prerequisites

- Node.js 18+
- MySQL 8.0+

## Installation

### 1. Clone / open project

```bash
git clone https://github.com/danishaliarain666/NayabSchool.git
cd NayabSchool
```

### 2. Backend setup

```bash
cd backend
npm install
copy .env.example .env
```

Edit `.env` and set your MySQL password (empty for local dev setup):

```env
DB_PASSWORD=
DB_PORT=3307
```

### 3. Apply school branding from Instagram/Facebook

```bash
npm run update-branding
```

This loads logo, photos, and social links from official **@nayab.h.s.mirwah** Instagram.

### 4. Seed database (creates DB + 50 students)

**First time only** — start MySQL (see Quick Start below), then:

```bash
npm run seed
```

### 5. Quick Start (Windows — easiest)

Double-click **`START.bat`** in the project root. It opens 3 windows:

1. MySQL (port 3307)
2. Backend API (port 5000)
3. Frontend (port 5173)

Then open: **http://localhost:5173**

### 6. Manual Start

**Terminal 1 — MySQL:**
```bash
start-mysql.bat
```

**Terminal 2 — Backend:**
```bash
cd backend
npm run dev
```

**Terminal 3 — Frontend:**
```bash
cd frontend
npm run dev
```

## Default Login

| Role    | Email                          | Password    |
|---------|--------------------------------|-------------|
| Admin   | admin@nayabgrammar.edu.pk      | Admin@123   |
| Teacher | teacher@nayabgrammar.edu.pk    | Teacher@123 |

## Student Portal

Go to `/portal` → select **Class** + enter **Roll Number** (no login needed).

## Project Structure

```
sms/
├── backend/
│   ├── database/schema.sql
│   ├── scripts/seed.js
│   └── src/
├── frontend/
│   └── src/
├── docs/API.md
└── README.md
```

## Placeholder Data

School contact info is marked `[PLACEHOLDER]` until confirmed by the school administration.

## Production Notes

- Change `JWT_SECRET` in `.env`
- Use HTTPS
- Set strong admin password
- Configure MySQL connection pooling for scale

## License

Final Year Project — Educational Use
