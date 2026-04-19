import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getDb } from '../db/client';

const router = Router();
router.use(authenticate);

// GET /api/settings/assignees
router.get('/assignees', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT a.*, u.name as user_name, u.email as user_email
       FROM assignees a
       LEFT JOIN users u ON u.id = a.user_id`
    )
    .all();
  res.json({ items: rows });
});

// PUT /api/settings/assignees/:category  (admin only)
router.put('/assignees/:category', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { category } = req.params;
  const { user_id, notion_database_id } = req.body as {
    user_id?: number | null;
    notion_database_id?: string | null;
  };

  const db = getDb();
  db.prepare(
    'UPDATE assignees SET user_id = ?, notion_database_id = ? WHERE category = ?'
  ).run(user_id ?? null, notion_database_id ?? null, category);

  res.json({ ok: true });
});

// GET /api/settings/users  (admin only)
router.get('/users', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json({ items: rows });
});

export default router;
