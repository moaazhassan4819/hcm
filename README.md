# HCM Lite 🏢

Simple Human Capital Management system built for hackathons.

**Stack:** React (Vite) + Node/Express + MongoDB + Groq AI

## Features

- **Empty first-run**: Register Admin + Company on first launch
- **Roles**: Admin, HR, Employee (JWT + RBAC)
- **Modules**:
  - Auth & Access
  - Organization (Company, Departments, Leave Types)
  - Employees (create with temp password)
  - Attendance (check-in/out, late tracking)
  - Leave Management (apply / approve / reject)
  - Payroll Lite (generate & finalize)
  - Dashboards (real numbers from DB)
  - AI Assistant (Groq + tool calling for live stats)

## Quick Start

### 1. Prerequisites
- Node.js 18+
- MongoDB running locally (or Atlas URI)

### 2. Backend
```bash
cd hcm-lite
cp .env.example .env
# Edit .env and fill:
# MONGODB_URI=mongodb://127.0.0.1:27017/hcm-lite
# JWT_SECRET=any_long_secret
# GROQ_API_KEY=your_key_from_console.groq.com

npm install
npm run dev
```

### 3. Frontend (development)
```bash
cd web
npm install
npm run dev
```
Open http://localhost:5173

### 4. Production style (single server)
```bash
cd web && npm install && npm run build
cd .. && npm start
```
Open http://localhost:8000

## First Run Flow
1. Open the app → you will see **Setup** screen
2. Create Admin account + Company name
3. Login and start adding Departments → Employees → etc.

## API Base
All APIs under `/api/...`

Health: `GET /api/health`

## Notes for Demo
- No dummy data is pre-loaded
- Temporary password is shown once when HR creates an employee
- AI needs valid `GROQ_API_KEY` (model: `llama-3.3-70b-versatile`)
- Code is kept simple and beginner-friendly

## Folder Structure
```
hcm-lite/
├── server.js
├── package.json
├── .env
├── src/
│   ├── config/db.js
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   └── utils/
└── web/                 # React frontend
    ├── src/
    └── dist/            # after build
```

Happy hacking! 🚀
