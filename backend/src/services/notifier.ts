import { getDb } from '../db/client';
import { InquiryCategory, Inquiry, Draft } from '../types';
import { createNotionTask } from './notion';

export interface SseClient {
  userId: number;
  res: import('express').Response;
}

const sseClients: SseClient[] = [];

export function addSseClient(client: SseClient) {
  sseClients.push(client);
}

export function removeSseClient(res: import('express').Response) {
  const idx = sseClients.findIndex((c) => c.res === res);
  if (idx !== -1) sseClients.splice(idx, 1);
}

export function pushSseEvent(userId: number, data: object) {
  const clients = sseClients.filter((c) => c.userId === userId);
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    client.res.write(payload);
  }
}

export async function notifyAssignees(
  inquiryId: number,
  category: InquiryCategory,
  summary: string
) {
  const db = getDb();

  // 공통 Notion DB ID 조회
  const setting = db
    .prepare('SELECT value FROM app_settings WHERE key = ?')
    .get('notion_database_id') as { value: string } | undefined;

  if (!setting?.value) return;

  try {
    const inquiry = db
      .prepare(
        `SELECT i.content_masked, i.category_confidence, i.client_id,
                c.name as client_name
         FROM inquiries i
         LEFT JOIN clients c ON c.id = i.client_id
         WHERE i.id = ?`
      )
      .get(inquiryId) as
      | (Pick<Inquiry, 'content_masked' | 'category_confidence' | 'client_id'> & {
          client_name: string | null;
        })
      | undefined;

    const drafts = db
      .prepare('SELECT variant, content FROM drafts WHERE inquiry_id = ? ORDER BY variant')
      .all(inquiryId) as Pick<Draft, 'variant' | 'content'>[];

    await createNotionTask({
      inquiryId,
      category,
      summary,
      contentMasked: inquiry?.content_masked ?? '',
      confidence: inquiry?.category_confidence ?? 0,
      drafts,
      databaseId: setting.value,
      clientName: inquiry?.client_name ?? null,
      dueDate: null,
      notionUserId: null,
      department: null,
    });
  } catch (err) {
    console.error('[Notion 연동 오류]', err);
  }
}
