# Installation Guide

## Prerequisites
- **Node.js**: v18 or higher (tested with v24.14.1)
- **npm**: Comes with Node.js (v10+)
- **Web Browser**: Chrome, Firefox, Edge, or Safari (latest)
- **OS**: Windows, macOS, or Linux

---

## Quick Setup (Recommended)

From the project root:

### 1. Install Root Dependencies
```bash
npm install
```

### 2. Install All Project Dependencies
```bash
npm run install:all
```

### 3. Inject Default Users
```bash
npm run inject:user
```
Auto-creates `backend/.env` with default settings and seeds 3 test accounts (support, manager, member). A reference file `backend/.env.example` is also created for customization.

### 4. Build the Project
```bash
npm run build
```

### 5. Run Tests
```bash
npm test
```
Executes 50 automated unit tests using Jest + ts-jest against an in-memory SQLite database. No configuration needed. See `doc/test.md` for full results.

### 6. Start Development Server
```bash
npm run dev
```
- **Backend** (Express, port 3000)
- **Frontend** (Vite, port 5173)

Open `http://localhost:5173` in your browser.

---

## Manual Backend Setup

```bash
cd backend
npm install
npm run build
npm start
```

Dependencies: express, sql.js, jsonwebtoken, bcryptjs, cors, dotenv, uuid, doT, TypeScript.

## Manual Frontend Setup

```bash
cd frontend
npm install
npm run build
```

6 Vite entry points: login, dashboard, projects, tasks, settings, team.

---

## Customizing Environment Variables

To change the default credentials or JWT secret, edit `backend/.env` before running `npm run inject:user`:

```env
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development

# Default accounts
SUPPORT_NAME=Support Admin
SUPPORT_EMAIL=support@test.com
SUPPORT_PASSWORD=support123
MANAGER_NAME=Manager User
MANAGER_EMAIL=manager@test.com
MANAGER_PASSWORD=manager123
USER_NAME=Member User
USER_EMAIL=member@test.com
USER_PASSWORD=member123
```

Or copy the reference file and modify it:
```bash
cp backend/.env.example backend/.env
```

Run `npm run inject:user` again to apply changes (it upserts users by email).

---

## Production

```bash
npm run build
NODE_ENV=production npm start
```

## Troubleshooting

### Port in Use
```bash
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Database Issues
Delete `backend/data/spmp.db` and restart — auto-created with schema.

### Module Not Found
```bash
rm -rf node_modules backend/node_modules frontend/node_modules
npm run install:all
```

## Verification

```bash
curl http://localhost:3000/api/health
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@test.com","password":"manager123"}'
```
