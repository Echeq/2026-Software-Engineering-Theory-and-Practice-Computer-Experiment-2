import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { closeDatabase, getDatabase } from './database';
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import { authenticateToken } from './middleware/auth';
import userRoutes from './routes/users';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigin = process.env.FRONTEND_ORIGIN || `http://localhost:${PORT}`;

app.use(cors({ origin: allowedOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log every API request with method, path, status, and duration
app.use('/api', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const s = res.statusCode;
    const color = s >= 500 ? '\x1b[31m' : s >= 400 ? '\x1b[33m' : '\x1b[32m';
    console.log(`${color}${s}\x1b[0m ${req.method.padEnd(6)} ${req.originalUrl} \x1b[90m${ms}ms\x1b[0m`);
  });
  next();
});

const publicPath = path.join(__dirname, '../../frontend');
app.use(express.static(publicPath));

app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/tasks', authenticateToken, taskRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('\x1b[31mUnhandled error:\x1b[0m', err);
  res.status(500).json({ message: 'Internal server error' });
});

process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  closeDatabase();
  process.exit(0);
});

async function startServer(): Promise<void> {
  try {
    await getDatabase();
    console.log('\x1b[32m✓\x1b[0m Database ready');
    app.listen(PORT, () => {
      console.log(`\x1b[32m✓\x1b[0m Server running on http://localhost:${PORT}`);
      console.log(`\x1b[36m→\x1b[0m API at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('\x1b[31mFailed to start:\x1b[0m', error);
    process.exit(1);
  }
}

startServer();

export default app;
