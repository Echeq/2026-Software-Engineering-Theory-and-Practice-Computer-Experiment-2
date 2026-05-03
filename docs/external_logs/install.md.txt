# Installation Guide

## Prerequisites
- **Node.js**: v18 or higher (tested with v24.14.1)
- **npm**: Comes with Node.js (v10+)
- **Web Browser**: Chrome, Firefox, Edge, or Safari (latest version recommended)
- **Operating System**: Windows, macOS, or Linux

## Backend Setup

### 1. Clone the Repository
```bash
git clone [repo-url]
cd 2026-Software-Engineering-Theory-and-Practice-Computer-Experiment-2
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

This installs:
- express (web framework)
- sql.js (SQLite database)
- jsonwebtoken (authentication)
- bcryptjs (password hashing)
- cors (cross-origin resource sharing)
- dotenv (environment variables)
- uuid (unique ID generation)
- TypeScript and type definitions

### 3. Configure Environment Variables
Create a `.env` file in the `backend/` directory:
```env
PORT=8080
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

**Important:** Change `JWT_SECRET` to a strong random string in production!

### 4. Build Backend TypeScript
```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `dist/`.

### 5. Start the Backend Server
```bash
npm start
```

The server will start on `http://localhost:8080` (or the port you specified).

You should see:
```
Database initialized successfully
Database initialized
Server running on http://localhost:8080
API available at http://localhost:8080/api
```

## Frontend Setup

### 1. Install Frontend Dependencies
```bash
cd ../public
npm install
```

This installs TypeScript compiler for the frontend.

### 2. Build Frontend TypeScript
```bash
npm run build
```

This compiles TypeScript files from `src/` to JavaScript in `js/`:
- `login.ts` → `login.js`
- `signup.ts` → `signup.js`
- `dashboard.ts` → `dashboard.js`

### 3. Verify Static Files
Ensure these files exist in the `public/` directory:
- `index.html` (login page)
- `signup.html` (registration page)
- `dashboard/index.html` (dashboard page)
- `css/` folder with stylesheets
- `js/` folder with compiled JavaScript

## Quick Start (All-in-One)

From the project root directory:
```bash
# Install all dependencies
npm run install:all

# Build frontend
npm run build:frontend

# Start server
npm start
```

## Development Mode

For automatic reloading during development:
```bash
cd backend
npm run dev
```

This uses `ts-node-dev` to watch for changes and restart automatically.

## Accessing the Application

1. Open your web browser
2. Navigate to: `http://localhost:8080`
3. You should see the SPMP login page

## Troubleshooting

### Port Already in Use
If you see "EADDRINUSE" error:
```bash
# Windows - Find process using port 8080
netstat -ano | findstr :8080

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or change PORT in .env file to a different number
```

### TypeScript Compilation Errors
```bash
# Clean and rebuild
cd public
rm -rf js/*.js js/*.js.map
npm run build
```

### Database Issues
The SQLite database is automatically created at `backend/data/spmp.db` on first run. If you want to reset:
```bash
# Delete the database file (WARNING: This deletes all data!)
rm backend/data/spmp.db

# Restart the server to recreate it
cd backend
npm start
```

### Module Not Found Errors
```bash
# Reinstall dependencies
cd backend
rm -rf node_modules
npm install
npm run build
```

## Verifying Installation

Test the API with curl:
```bash
# Health check
curl http://localhost:8080/api/health

# Expected response: {"status":"ok","timestamp":"..."}

# Register a test user
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Expected response: {"message":"User created successfully","user":{...}}
```

## Production Deployment

For production:
1. Set `NODE_ENV=production` in `.env`
2. Use a strong `JWT_SECRET` (32+ characters)
3. Consider using a reverse proxy (nginx)
4. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start backend/dist/server.js --name spmp
   ```
5. Enable HTTPS with Let's Encrypt or similar

## Support

If you encounter issues:
1. Check the server console for error messages
2. Verify Node.js version: `node --version`
3. Ensure all dependencies are installed: `npm list`
4. Review the README.md for additional information
