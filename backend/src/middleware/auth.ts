import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel, User } from '../models/User';

export interface AuthRequest extends Request {
  user?: User;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const decoded = jwt.verify(token, secret) as { userId: string };
    const user = UserModel.findById(decoded.userId);

    if (!user) {
      res.status(403).json({ message: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
}
