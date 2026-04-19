import { chatCompletion } from './openrouter';
import { InquiryCategory } from '../types';

interface ClassifyResult {
  category: InquiryCategory;
  confidence: number;
  summary: string;
}

const CATEGORIES: InquiryCategory[] = ['결제', '배송', '환불', '기술지원', '계정', '기타'];

const SYSTEM_PROMPT = `당신은 고객 문의를 분류하는 전문가입니다.
주어진 고객 문의를 다음 카테고리 중 하나로 분류하고, 간략한 요약을 제공하세요.
카테고리: ${CATEGORIES.join(', ')}

반드시 다음 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{"category":"카테고리명","confidence":0.95,"summary":"문의 내용 1~2줄 요약"}`;

export async function classifyInquiry(maskedContent: string): Promise<ClassifyResult> {
  const response = await chatCompletion(
    [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: maskedContent },
    ],
    0.1,
    300
  );

  try {
    // JSON 블록 추출 (마크다운 코드블록 포함 대응)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('JSON 없음');

    const parsed = JSON.parse(jsonMatch[0]) as {
      category: string;
      confidence: number;
      summary: string;
    };

    const category = CATEGORIES.includes(parsed.category as InquiryCategory)
      ? (parsed.category as InquiryCategory)
      : '기타';

    return {
      category,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      summary: parsed.summary ?? '',
    };
  } catch {
    return { category: '기타', confidence: 0.5, summary: response.slice(0, 100) };
  }
}
