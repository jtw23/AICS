import { getDb } from '../db/client';
import { InquiryCategory, Inquiry, Draft } from '../types';
import { createNotionTask } from './notion';

const DESIGN_KEYWORDS = ['디자인', '퍼블리싱', '퍼블', 'UI', 'UX', '화면', '레이아웃', '스타일', 'CSS', '시안'];

function determineTeam(category: InquiryCategory, content: string): '개발팀' | '기획팀' | '디자인팀' {
  if (['계약', '견적', '기타'].includes(category)) return '기획팀';
  if (['개발', '유지보수'].includes(category)) {
    if (DESIGN_KEYWORDS.some((kw) => content.includes(kw))) return '디자인팀';
  }
  return '개발팀'; // 개발, 유지보수(디자인X), 장애, 기술지원
}

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

    // 카테고리 + 내용 기반으로 담당 팀 결정
    const team = determineTeam(category, inquiry?.content_masked ?? '');

    // 고객사에 배정된 해당 팀 직원 조회
    const assigned = inquiry?.client_id
      ? (db
          .prepare(
            `SELECT e.name, e.department
             FROM client_assignments ca JOIN employees e ON e.id = ca.employee_id
             WHERE ca.client_id = ? AND ca.department = ?`
          )
          .get(inquiry.client_id, team) as { name: string; department: string } | undefined)
      : undefined;

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
      department: assigned?.department ?? team,
      employeeName: assigned?.name ?? null,
    });
  } catch (err) {
    console.error('[Notion 연동 오류]', err);
  }
}
