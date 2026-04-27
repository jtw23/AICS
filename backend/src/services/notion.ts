const NOTION_API_VERSION = '2022-06-28';
const NOTION_BASE_URL = 'https://api.notion.com/v1';

// 매핑 대상 속성: 작업 이름(title), 업체명, 분류, 부서, 담당자(people), 설명
// DB 스키마를 런타임에 조회하여 실제 타입에 맞게 동적 매핑

export interface NotionTaskParams {
  inquiryId: number;
  category: string;
  summary: string;
  contentMasked: string;
  confidence: number;
  drafts: { variant: number; content: string }[];
  databaseId: string;
  clientName?: string | null;
  dueDate?: string | null;
  notionUserId?: string | null;  // Notion people 속성용 UUID (있을 때만)
  department?: string | null;    // 담당 부서명
  employeeName?: string | null;  // 담당자 이름
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

/** Notion DB 속성 타입 맵을 조회 (실패 시 빈 객체 반환) */
async function fetchDbPropertyTypes(databaseId: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${NOTION_BASE_URL}/databases/${databaseId}`, { headers: notionHeaders() });
    if (!res.ok) return {};
    const data = await res.json() as { properties: Record<string, { type: string }> };
    return Object.fromEntries(
      Object.entries(data.properties ?? {}).map(([k, v]) => [k, v.type])
    );
  } catch { return {}; }
}

/** 속성 타입에 맞는 Notion property 값 생성 */
function buildProp(type: string, textValue: string, userId?: string | null): unknown {
  switch (type) {
    case 'rich_text':    return { rich_text: richText(textValue) };
    case 'select':       return { select: { name: textValue } };
    case 'multi_select': return { multi_select: [{ name: textValue }] };
    case 'people':       return userId ? { people: [{ object: 'user', id: userId }] } : null;
    case 'email':        return { email: textValue };
    case 'url':          return { url: textValue };
    case 'phone_number': return { phone_number: textValue };
    case 'number':       { const n = Number(textValue); return isNaN(n) ? null : { number: n }; }
    default:             return { rich_text: richText(textValue) };
  }
}

function setProp(
  properties: Record<string, unknown>,
  propTypes: Record<string, string>,
  name: string,
  textValue: string | null | undefined,
  userId?: string | null,
) {
  const type = propTypes[name];
  if (!type) return;
  if (type === 'people') {
    const v = buildProp(type, '', userId);
    if (v) properties[name] = v;
    return;
  }
  if (!textValue) return;
  const v = buildProp(type, textValue, userId);
  if (v) properties[name] = v;
}

function parseDatabaseId(raw: string): string {
  const s = raw.trim();
  // 이미 UUID 형식 (8-4-4-4-12)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return s;
  // 32자 hex (대시 없음)
  if (/^[0-9a-f]{32}$/i.test(s)) {
    return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`;
  }
  // Notion URL에서 32자 hex 추출
  const m = s.match(/([0-9a-f]{32})(?:[?&]|$)/i)
          ?? s.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i);
  if (m) {
    const hex = m[1].replace(/-/g, '');
    return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
  }
  throw new Error(`유효하지 않은 Notion Database ID입니다. Notion에서 데이터베이스를 열고 "링크 복사" 후 URL의 32자리 ID를 입력하세요. (입력값: ${s.slice(0, 40)}...)`);
}

export async function createNotionTask(params: NotionTaskParams): Promise<void> {
  const {
    inquiryId, category, summary, contentMasked, confidence, drafts,
    databaseId, clientName, dueDate, notionUserId, department, employeeName,
  } = params;

  const parsedDatabaseId = parseDatabaseId(databaseId);

  // 제목: [분류] 접두어 제거, 요약만 사용
  const title = summary.slice(0, 100) || `#${inquiryId}`;
  const priority = PRIORITY_MAP[category] ?? '낮음';
  const confidencePct = `${(confidence * 100).toFixed(1)}%`;

  // DB 스키마 조회 → 실제 속성 타입에 맞게 매핑
  const propTypes = await fetchDbPropertyTypes(parsedDatabaseId);

  const properties: Record<string, unknown> = {
    '작업 이름': { title: richText(title) },
  };

  setProp(properties, propTypes, '업체명',    clientName);
  setProp(properties, propTypes, '분류',      category);
  setProp(properties, propTypes, '부서',      department);
  setProp(properties, propTypes, '업무담당자', employeeName);

  // 설명: 분류·신뢰도 + 고객 문의 원문 — 작업 이름(AI 요약)과 구분
  const descriptionText = [
    `[${category}] 신뢰도 ${confidencePct}`,
    clientName ? `업체: ${clientName}` : '',
    '',
    contentMasked,
  ].filter((v) => v !== undefined).join('\n').trim();
  setProp(properties, propTypes, '설명', descriptionText);

  const children = [
    callout(
      [
        `분류: ${category}`,
        `신뢰도: ${confidencePct}`,
        `우선순위: ${priority}`,
        `문의 ID: #${inquiryId}`,
        clientName ? `업체: ${clientName}` : '',
        department  ? `담당팀: ${department}` : '',
        employeeName ? `담당자: ${employeeName}` : '',
        dueDate     ? `마감일: ${dueDate}` : '',
      ].filter(Boolean).join('  |  '),
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
    parent: { type: 'database_id', database_id: parsedDatabaseId },
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
