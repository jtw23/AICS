import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getDb } from '../db/client';

const router = Router();
router.use(authenticate);

// ── Notion 공통 설정 ──────────────────────────────────────────────────────────

router.get('/notion', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const row = db
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get('notion_database_id') as { value: string } | undefined;
  res.json({ notion_database_id: row?.value ?? '' });
});

router.put('/notion', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { notion_database_id } = req.body as { notion_database_id: string };
  const db = getDb();
  db.prepare(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)'
  ).run('notion_database_id', notion_database_id?.trim() ?? '');
  res.json({ ok: true });
});

// ── 사용자(로그인 계정) ───────────────────────────────────────────────────────

router.get('/users', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC')
    .all();
  res.json({ items: rows });
});

// ── 고객사 ────────────────────────────────────────────────────────────────────

router.get('/clients', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT c.id, c.client_code, c.name, c.created_at,
              e.id as employee_id, e.name as employee_name, e.department
       FROM clients c
       LEFT JOIN client_assignments ca ON ca.client_id = c.id
       LEFT JOIN employees e ON e.id = ca.employee_id
       ORDER BY c.client_code`
    )
    .all();
  res.json({ items: rows });
});

router.post('/clients', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { client_code, name } = req.body as { client_code: string; name: string };
  if (!client_code?.trim() || !name?.trim()) {
    res.status(400).json({ error: '고객코드와 업체명을 입력하세요.' });
    return;
  }
  const db = getDb();
  try {
    const result = db
      .prepare('INSERT INTO clients (client_code, name) VALUES (?, ?)')
      .run(client_code.trim(), name.trim());
    res.json({ id: result.lastInsertRowid, client_code: client_code.trim(), name: name.trim() });
  } catch {
    res.status(409).json({ error: '이미 존재하는 고객코드입니다.' });
  }
});

router.delete('/clients/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// ── 담당 배정 (고객사 ↔ 개발팀 직원) ────────────────────────────────────────

router.put('/clients/:id/assignment', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { employee_id } = req.body as { employee_id: number | null };
  const db = getDb();
  if (employee_id === null || employee_id === undefined) {
    db.prepare('DELETE FROM client_assignments WHERE client_id = ?').run(req.params.id);
  } else {
    db.prepare(
      `INSERT INTO client_assignments (client_id, employee_id) VALUES (?, ?)
       ON CONFLICT(client_id) DO UPDATE SET employee_id = excluded.employee_id`
    ).run(req.params.id, employee_id);
  }
  res.json({ ok: true });
});

// ── 직원 ──────────────────────────────────────────────────────────────────────

router.get('/employees', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const rows = db
    .prepare('SELECT id, name, department, created_at FROM employees ORDER BY department, name')
    .all();
  res.json({ items: rows });
});

router.post('/employees', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { name, department } = req.body as { name: string; department: string };
  const valid = ['개발팀', '기획팀', '디자인팀'];
  if (!name?.trim() || !valid.includes(department)) {
    res.status(400).json({ error: '이름과 부서를 올바르게 입력하세요.' });
    return;
  }
  const db = getDb();
  const result = db
    .prepare('INSERT INTO employees (name, department) VALUES (?, ?)')
    .run(name.trim(), department);
  res.json({ id: result.lastInsertRowid, name: name.trim(), department });
});

router.delete('/employees/:id', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const db = getDb();
  db.prepare('DELETE FROM employees WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

export default router;
