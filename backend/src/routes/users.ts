import { Router, Response } from 'express';
import { UserModel } from '../models/User';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/', (req: AuthRequest, res: Response) => {
  try {
    const users = UserModel.listAll();
    res.json({ users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
