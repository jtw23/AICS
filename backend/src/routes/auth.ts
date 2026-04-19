import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../db/client';
import { User, JwtPayload } from '../types';

const router = Router();
const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body as {
    email: string;
    name: string;
    password: string;
    role?: string;
  };

  if (!email || !name || !password) {
    res.status(400).json({ error: '이메일, 이름, 비밀번호를 모두 입력하세요.' });
    return;
  }

  const db = getDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    res.status(409).json({ error: '이미 사용 중인 이메일입니다.' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const userRole = role === 'admin' ? 'admin' : 'agent';

  const result = db
    .prepare('INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(email, name, passwordHash, userRole);

  const token = jwt.sign(
    { userId: result.lastInsertRowid, email, role: userRole } as JwtPayload,
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.status(201).json({ token, user: { id: result.lastInsertRowid, email, name, role: userRole } });
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email: string; password: string };

  if (!email || !password) {
    res.status(400).json({ error: '이메일과 비밀번호를 입력하세요.' });
    return;
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as User & { password_hash: string } | undefined;

  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role } as JwtPayload,
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
});

export default router;
