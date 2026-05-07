import { Router, Response } from 'express';
import { MessageModel } from '../models/Message';
import { AuthRequest } from '../middleware/auth';

const router = Router();

router.get('/messages', (req: AuthRequest, res: Response) => {
  try {
    const messages = MessageModel.getLast(60);
    res.json({ messages });
  } catch (e) {
    console.error('Chat fetch error:', e);
    res.status(500).json({ message: 'Failed to load messages' });
  }
});

router.post('/messages', (req: AuthRequest, res: Response) => {
  const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
  if (!content) {
    res.status(400).json({ message: 'Message content is required' });
    return;
  }
  try {
    const msg = MessageModel.create({ user_id: req.user!.id, content: content.substring(0, 1000) });
    res.status(201).json({ message: msg });
  } catch (e) {
    console.error('Chat send error:', e);
    res.status(500).json({ message: 'Failed to send message' });
  }
});

export default router;
