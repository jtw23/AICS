import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { addSseClient, removeSseClient } from '../services/notifier';
import { getDb } from '../db/client';

const router = Router();
router.use(authenticate);

// GET /api/notify/stream  — SSE
router.get('/stream', (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // 초기 ping
  res.write('data: {"type":"connected"}\n\n');

  const client = { userId: req.user!.userId, res };
  addSseClient(client);

  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    removeSseClient(res);
  });
});

// GET /api/notify — 미읽음 목록
router.get('/', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const items = db
    .prepare(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
    )
    .all(req.user!.userId);
  res.json({ items });
});

// PATCH /api/notify/:id/read
router.patch('/:id/read', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare(
    'UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?'
  ).run(req.params.id, req.user!.userId);
  res.json({ ok: true });
});

// PATCH /api/notify/read-all
router.patch('/read-all', (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(req.user!.userId);
  res.json({ ok: true });
});

export default router;
