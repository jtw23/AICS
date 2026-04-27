import { chatCompletion } from './openrouter';
import { ToneType, InquiryCategory } from '../types';

const TONE_SYSTEM_PROMPTS: Record<ToneType, string> = {
  공식: `당신은 기업 고객 서비스 담당자입니다. 공식적이고 전문적인 어조로 답변을 작성하세요.
경어체를 사용하고, 정중하며 체계적인 문장 구조를 유지하세요.`,

  친근: `당신은 친절하고 따뜻한 고객 서비스 담당자입니다. 고객이 편안함을 느낄 수 있도록 친근하고 공감적인 어조로 답변하세요.
딱딱하지 않게, 하지만 예의 바르게 작성하세요.`,

  간결: `당신은 효율적인 고객 서비스 담당자입니다. 핵심만 간결하게 전달하세요.
불필요한 수식어 없이 명확하고 짧게 답변하세요.`,
};

export async function generateDraft(
  maskedContent: string,
  category: InquiryCategory,
  tone: ToneType,
  similarExamples: { content: string; draft: string }[] = []
): Promise<string> {
  const systemPrompt = TONE_SYSTEM_PROMPTS[tone];

  let contextBlock = '';
  if (similarExamples.length > 0) {
    contextBlock =
      '\n\n[참고 유사 사례]\n' +
      similarExamples
        .slice(0, 2)
        .map((ex, i) => `사례${i + 1} 문의: ${ex.content}\n사례${i + 1} 답변: ${ex.draft}`)
        .join('\n\n');
  }

  const userPrompt = `[카테고리: ${category}] 다음 고객 문의에 대한 답변 초안을 작성하세요.${contextBlock}

[고객 문의]
${maskedContent}

답변만 작성하세요 (도입부 설명 없이):`;

  return chatCompletion(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    0.7,
    800
  );
}
