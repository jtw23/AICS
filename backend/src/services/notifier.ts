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

  const assignee = db
    .prepare('SELECT * FROM assignees WHERE category = ?')
    .get(category) as {
      user_id: number | null;
      notion_database_id: string | null;
      notion_user_id: string | null;
    } | undefined;

  if (!assignee) return;

  const message = `[${category}] 새 문의 접수 (#${inquiryId}): ${summary}`;

  // 인앱 알림 + SSE
  if (assignee.user_id) {
    db.prepare(
      `INSERT INTO notifications (inquiry_id, user_id, channel, message)
       VALUES (?, ?, 'in-app', ?)`
    ).run(inquiryId, assignee.user_id, message);

    pushSseEvent(assignee.user_id, { type: 'new_inquiry', inquiryId, category, summary, message });
  }

  // Notion 작업 생성
  if (assignee.notion_database_id) {
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
        databaseId: assignee.notion_database_id,
        clientName: inquiry?.client_name ?? null,
        dueDate: null,
        notionUserId: assignee.notion_user_id ?? null,
      });
    } catch (err) {
      console.error('[Notion 연동 오류]', err);
    }
  }
}
