import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { embed, cosineSimilarity, bufferToFloat32 } from '../services/embedder';
import { maskPii } from '../services/pii';
import { getDb } from '../db/client';
import { Inquiry } from '../types';

const router = Router();
router.use(authenticate);

// GET /api/history?q=키워드&category=결제&page=1&limit=20
router.get('/', (req: AuthRequest, res: Response) => {
  const { q, category, page = '1', limit = '20' } = req.query as Record<string, string>;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  const db = getDb();

  if (q) {
    // FTS5 키워드 검색
    const ftsArgs = [q + '*', ...(category ? [category] : [])];

    const rows = db
      .prepare(
        `SELECT i.id, i.content_masked, i.category, i.category_confidence, i.tone, i.summary, i.created_at
         FROM inquiries_fts f
         JOIN inquiries i ON i.id = f.rowid
         WHERE inquiries_fts MATCH ?
         ${category ? 'AND i.category = ?' : ''}
         ORDER BY rank
         LIMIT ? OFFSET ?`
      )
      .all(...([...ftsArgs, parseInt(limit), offset]));

    const total = (
      db
        .prepare(
          `SELECT COUNT(*) as cnt
           FROM inquiries_fts f
           JOIN inquiries i ON i.id = f.rowid
           WHERE inquiries_fts MATCH ?
           ${category ? 'AND i.category = ?' : ''}`
        )
        .get(...ftsArgs) as { cnt: number }
    ).cnt;

    res.json({ items: rows, total, page: parseInt(page) });
    return;
  }

  // 일반 목록
  const rows = db
    .prepare(
      `SELECT id, content_masked, category, category_confidence, tone, summary, created_at
       FROM inquiries
       ${category ? 'WHERE category = ?' : ''}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    )
    .all(...([...(category ? [category] : []), parseInt(limit), offset]));

  const total = (
    db
      .prepare(`SELECT COUNT(*) as cnt FROM inquiries ${category ? 'WHERE category = ?' : ''}`)
      .get(...(category ? [category] : [])) as { cnt: number }
  ).cnt;

  res.json({ items: rows, total, page: parseInt(page) });
});

// GET /api/history/similar?q=문의텍스트
router.get('/similar', async (req: AuthRequest, res: Response) => {
  const { q } = req.query as { q?: string };
  if (!q) {
    res.status(400).json({ error: 'q 파라미터가 필요합니다.' });
    return;
  }

  const masked = maskPii(q);
  const queryEmbed = await embed(masked);

  const db = getDb();
  const rows = db
    .prepare(
      'SELECT id, content_masked, category, summary, embedding FROM inquiries WHERE embedding IS NOT NULL ORDER BY created_at DESC LIMIT 100'
    )
    .all() as Inquiry[];

  const scored = rows
    .map((r) => ({
      id: r.id,
      content_masked: r.content_masked,
      category: r.category,
      summary: r.summary,
      score: cosineSimilarity(queryEmbed, bufferToFloat32(r.embedding as Buffer)),
    }))
    .filter((r) => r.score > 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  res.json({ items: scored });
});

export default router;
