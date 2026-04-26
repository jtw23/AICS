const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

// DB 속성: 작업 이름(title), 업체명(rich_text), 상태(status), 담당자(people),
//          마감일(date), 우선순위(select), 작업 유형(multi_select),
//          설명(rich_text), 노력 수준(select)

export interface NotionTaskParams {
  inquiryId: number;
  category: string;
  summary: string;
  contentMasked: string;
  confidence: number;
  drafts: { variant: number; content: string }[];
  databaseId: string;
  clientName?: string | null;
  dueDate?: string | null;       // ISO date: '2026-04-20'
  notionUserId?: string | null;  // Notion user UUID
  department?: string | null;    // 다음 부서
}

// 카테고리 → 우선순위
const PRIORITY_MAP: Record<string, string> = {
  장애: '높음',
  개발: '보통',
  유지보수: '보통',
  계약: '낮음',
  견적: '낮음',
  기술지원: '낮음',
  기타: '낮음',
};

// 카테고리 → 노력 수준
const EFFORT_MAP: Record<string, string> = {
  장애: '높음',
  개발: '보통',
  유지보수: '보통',
  기술지원: '낮음',
  계약: '낮음',
  견적: '낮음',
  기타: '낮음',
};

function getApiKey(): string {
  const key = process.env.NOTION_API_KEY;
  if (!key) throw new Error('NOTION_API_KEY 환경변수가 설정되지 않았습니다.');
  return key;
}

function notionHeaders() {
  return {
    Authorization: `Bearer ${getApiKey()}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_API_VERSION,
  };
}

function richText(text: string) {
  return [{ type: 'text', text: { content: (text || '').slice(0, 2000) } }];
}

function heading2(text: string) {
  return { object: 'block', type: 'heading_2', heading_2: { rich_text: richText(text) } };
}

function heading3(text: string) {
  return { object: 'block', type: 'heading_3', heading_3: { rich_text: richText(text) } };
}

function paragraph(text: string) {
  return { object: 'block', type: 'paragraph', paragraph: { rich_text: richText(text || '(없음)') } };
}

function callout(text: string, emoji: string) {
  return {
    object: 'block',
    type: 'callout',
    callout: { rich_text: richText(text), icon: { type: 'emoji', emoji } },
  };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

export async function createNotionTask(params: NotionTaskParams): Promise<void> {
  const {
    inquiryId, category, summary, contentMasked, confidence, drafts,
    databaseId, clientName, dueDate, notionUserId, department,
  } = params;

  const title = `[${category}] #${inquiryId} - ${summary.slice(0, 80)}`;
  const priority = PRIORITY_MAP[category] ?? '낮음';
  const effort   = EFFORT_MAP[category] ?? '낮음';
  const confidencePct = `${(confidence * 100).toFixed(1)}%`;

  // 필수 속성
  const properties: Record<string, unknown> = {
    '작업 이름': { title: richText(title) },
    '업체명':   { rich_text: richText(clientName ?? '') },
    '상태':     { status: { name: '시작 전' } },
    '우선순위': { select: { name: priority } },
    '작업 유형': { multi_select: [{ name: category }] },
    '설명':     { rich_text: richText(summary) },
    '노력 수준': { select: { name: effort } },
  };

  // 마감일: 값이 있을 때만 포함
  if (dueDate) {
    properties['마감일'] = { date: { start: dueDate } };
  }

  // 담당자: Notion user UUID가 있을 때만 포함
  if (notionUserId) {
    properties['담당자'] = { people: [{ object: 'user', id: notionUserId }] };
  }

  // 다음 부서: 값이 있을 때만 포함
  if (department) {
    properties['다음 부서'] = { select: { name: department } };
  }

  const children = [
    callout(
      `카테고리: ${category}  |  신뢰도: ${confidencePct}  |  문의 ID: #${inquiryId}${clientName ? `  |  업체: ${clientName}` : ''}`,
      '📋'
    ),
    divider(),
    heading2('고객 문의 내용'),
    paragraph(contentMasked),
    divider(),
    heading2('AI 요약'),
    paragraph(summary),
    divider(),
    heading2('AI 초안 답변'),
    ...drafts.flatMap((d) => [heading3(`초안 ${d.variant}`), paragraph(d.content)]),
  ];

  const body = {
    parent: { type: 'database_id', database_id: databaseId },
    properties,
    children,
  };

  const res = await fetch(`${NOTION_BASE_URL}/pages`, {
    method: 'POST',
    headers: notionHeaders(),
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Notion API 오류 (${res.status}): ${err}`);
  }
}
