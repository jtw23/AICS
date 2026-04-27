import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { maskPii } from '../services/pii';
import { classifyInquiry } from '../services/classifier';
import { generateDraft } from '../services/drafter';
import { embed, cosineSimilarity, float32ToBuffer, bufferToFloat32 } from '../services/embedder';
import { notifyAssignees } from '../services/notifier';
import { getDb } from '../db/client';
import { ToneType, Inquiry, Draft } from '../types';

const router = Router();
router.use(authenticate);

// POST /api/inquiry/process
router.post('/process', async (req: AuthRequest, res: Response) => {
  const { content, tone = '공식', client_id } = req.body as { content: string; tone?: ToneType; client_id?: number | null };

  if (!content?.trim()) {
    res.status(400).json({ error: '문의 내용을 입력하세요.' });
    return;
  }

  const validTones: ToneType[] = ['공식', '친근', '간결'];
  if (!validTones.includes(tone)) {
    res.status(400).json({ error: '유효하지 않은 톤입니다.' });
    return;
  }

  try {
    const masked = maskPii(content.trim());

    // 분류
    const { category, confidence, summary } = await classifyInquiry(masked);

    // 임베딩
    const embeddingArr = await embed(masked);
    const embeddingBuf = float32ToBuffer(embeddingArr);

    // 유사 문의 검색
    const db = getDb();
    const prevInquiries = db
      .prepare('SELECT i.id, i.content_masked, i.embedding, d.content as draft FROM inquiries i LEFT JOIN drafts d ON d.inquiry_id = i.id AND d.selected = 1 WHERE i.embedding IS NOT NULL ORDER BY i.created_at DESC LIMIT 50')
      .all() as (Inquiry & { draft: string })[];

    const similar = prevInquiries
      .map((row) => ({
        content: row.content_masked,
        draft: row.draft ?? '',
        score: cosineSimilarity(embeddingArr, bufferToFloat32(row.embedding as Buffer)),
      }))
      .filter((r) => r.score > 0.75)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2);

    // 초안 생성 (1개)
    const draft = await generateDraft(masked, category, tone, similar);

    // DB 저장
    const insertResult = db
      .prepare(
        `INSERT INTO inquiries (user_id, client_id, content_masked, category, category_confidence, tone, summary, embedding)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(req.user!.userId, client_id ?? null, masked, category, confidence, tone, summary, embeddingBuf);

    const inquiryId = insertResult.lastInsertRowid as number;

    db.prepare('INSERT INTO drafts (inquiry_id, variant, content) VALUES (?, ?, ?)').run(inquiryId, 1, draft);

    // 알림
    await notifyAssignees(inquiryId, category, summary);

    res.json({
      inquiryId,
      category,
      confidence,
      summary,
      drafts: [{ variant: 1, content: draft }],
      similar: similar.map((s) => ({ content: s.content, score: s.score })),
    });
  } catch (err) {
    console.error('[처리 오류]', err);
    res.status(500).json({ error: err instanceof Error ? err.message : '서버 오류' });
  }
});

// PATCH /api/inquiry/:id/select-draft
router.patch('/:id/select-draft', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { variant } = req.body as { variant: 1 | 2 | 3 };

  const db = getDb();
  db.prepare('UPDATE drafts SET selected = 0 WHERE inquiry_id = ?').run(id);
  db.prepare('UPDATE drafts SET selected = 1 WHERE inquiry_id = ? AND variant = ?').run(id, variant);

  res.json({ ok: true });
});

// DELETE /api/inquiry/:id
router.delete('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const inquiry = db
    .prepare('SELECT id FROM inquiries WHERE id = ?')
    .get(req.params.id) as { id: number } | undefined;

  if (!inquiry) {
    res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
    return;
  }

  db.prepare('DELETE FROM inquiries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// GET /api/inquiry/:id
router.get('/:id', (req: AuthRequest, res: Response) => {
  const db = getDb();
  const inquiry = db
    .prepare('SELECT * FROM inquiries WHERE id = ?')
    .get(req.params.id) as Inquiry | undefined;

  if (!inquiry) {
    res.status(404).json({ error: '문의를 찾을 수 없습니다.' });
    return;
  }

  const drafts = db
    .prepare('SELECT id, variant, content, selected FROM drafts WHERE inquiry_id = ? ORDER BY variant')
    .all(req.params.id) as Draft[];

  res.json({ ...inquiry, embedding: undefined, drafts });
});

export default router;
