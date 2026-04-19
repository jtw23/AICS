const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

// DB 속성: 작업 이름(title), 상태(status), 우선순위(select), 설명(rich_text),
//          작업 유형(multi_select), 노력 수준(select), 마감일(date), 담당자(people)

interface NotionTaskParams {
  inquiryId: number;
  category: string;
  summary: string;
  contentMasked: string;
  confidence: number;
  drafts: { variant: number; content: string }[];
  databaseId: string;
}

// 카테고리 → 우선순위 매핑
const PRIORITY_MAP: Record<string, string> = {
  결제: '높음',
  환불: '높음',
  배송: '보통',
  기술지원: '보통',
  계정: '낮음',
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
  return [{ type: 'text', text: { content: text.slice(0, 2000) } }];
}

function heading2(text: string) {
  return {
    object: 'block',
    type: 'heading_2',
    heading_2: { rich_text: richText(text) },
  };
}

function heading3(text: string) {
  return {
    object: 'block',
    type: 'heading_3',
    heading_3: { rich_text: richText(text) },
  };
}

function paragraph(text: string) {
  return {
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: richText(text || '(없음)') },
  };
}

function callout(text: string, emoji: string) {
  return {
    object: 'block',
    type: 'callout',
    callout: {
      rich_text: richText(text),
      icon: { type: 'emoji', emoji },
    },
  };
}

function divider() {
  return { object: 'block', type: 'divider', divider: {} };
}

export async function createNotionTask(params: NotionTaskParams): Promise<void> {
  const { inquiryId, category, summary, contentMasked, confidence, drafts, databaseId } = params;

  const title = `[${category}] #${inquiryId} - ${summary.slice(0, 80)}`;
  const priority = PRIORITY_MAP[category] ?? '보통';
  const confidencePct = `${(confidence * 100).toFixed(1)}%`;

  const children = [
    callout(`카테고리: ${category}  |  신뢰도: ${confidencePct}  |  문의 ID: #${inquiryId}`, '📋'),
    divider(),
    heading2('고객 문의 내용'),
    paragraph(contentMasked),
    divider(),
    heading2('AI 요약'),
    paragraph(summary),
    divider(),
    heading2('AI 초안 답변'),
    ...drafts.flatMap((d) => [
      heading3(`초안 ${d.variant}`),
      paragraph(d.content),
    ]),
  ];

  const body = {
    parent: { type: 'database_id', database_id: databaseId },
    properties: {
      '작업 이름': { title: richText(title) },
      '상태': { status: { name: '시작 전' } },
      '우선순위': { select: { name: priority } },
      '설명': { rich_text: richText(summary) },
    },
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
