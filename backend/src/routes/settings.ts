import { Router, Response } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import { getDb } from '../db/client';
import { DEFAULT_MODELS } from '../services/openrouter';

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

// ── OpenRouter 모델 설정 ──────────────────────────────────────────────────────

router.get('/openrouter', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const row = db
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get('openrouter_models') as { value: string } | undefined;
  const models: unknown = row?.value ? JSON.parse(row.value) : null;
  res.json({ models: Array.isArray(models) && models.length > 0 ? models : DEFAULT_MODELS });
});

router.put('/openrouter', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { models } = req.body as { models: string[] };
  if (!Array.isArray(models) || models.length === 0) {
    res.status(400).json({ error: '모델 목록이 비어있습니다.' });
    return;
  }
  const db = getDb();
  db.prepare(
    'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)'
  ).run('openrouter_models', JSON.stringify(models));
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

  const clients = db
    .prepare('SELECT id, client_code, name, created_at FROM clients ORDER BY client_code')
    .all() as { id: number; client_code: string; name: string; created_at: number }[];

  const assignments = db
    .prepare(
      `SELECT ca.client_id, ca.department, ca.employee_id, e.name as employee_name
       FROM client_assignments ca JOIN employees e ON e.id = ca.employee_id`
    )
    .all() as { client_id: number; department: string; employee_id: number; employee_name: string }[];

  const items = clients.map((c) => ({
    ...c,
    assignments: assignments.filter((a) => a.client_id === c.id),
  }));

  res.json({ items });
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

// ── 담당 배정 (고객사 ↔ 팀별 직원) ──────────────────────────────────────────

router.put('/clients/:id/assignment', requireRole('admin'), (req: AuthRequest, res: Response) => {
  const { employee_id, department } = req.body as { employee_id: number | null; department: string };

  const validDepts = ['개발팀', '기획팀', '디자인팀'];
  if (!validDepts.includes(department)) {
    res.status(400).json({ error: '유효하지 않은 부서입니다.' });
    return;
  }

  const db = getDb();
  if (!employee_id) {
    db.prepare('DELETE FROM client_assignments WHERE client_id = ? AND department = ?').run(req.params.id, department);
  } else {
    db.prepare(
      `INSERT INTO client_assignments (client_id, employee_id, department) VALUES (?, ?, ?)
       ON CONFLICT(client_id, department) DO UPDATE SET employee_id = excluded.employee_id`
    ).run(req.params.id, employee_id, department);
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
