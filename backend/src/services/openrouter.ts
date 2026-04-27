import 'dotenv/config';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  choices: { message: { content: string } }[];
}

const FREE_MODELS = [
  'google/gemini-2.5-flash:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'deepseek/deepseek-chat-v3-0324:free',
  'mistralai/mistral-7b-instruct:free',
];

const DELAY_MS = 1000;

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

export async function chatCompletion(
  messages: ChatMessage[],
  temperature = 0.7,
  maxTokens = 1500
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY 환경변수가 없습니다.');

  let lastError: Error | null = null;

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:4000',
          'X-Title': 'AICS',
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (res.status === 429 || res.status === 503 || res.status === 502 || res.status === 404) {
        console.warn(`[OpenRouter] ${model} 제한/오류 (${res.status}), 다음 모델로 전환`);
        await sleep(DELAY_MS);
        continue;
      }

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`OpenRouter 오류 ${res.status}: ${body}`);
      }

      const data = (await res.json()) as OpenRouterResponse;
      return data.choices[0].message.content.trim();
    } catch (err) {
      if (err instanceof Error && err.message.includes('OpenRouter 오류')) {
        throw err;
      }
      lastError = err as Error;
      console.warn(`[OpenRouter] ${model} 실패: ${lastError.message}`);
      await sleep(DELAY_MS);
    }
  }

  throw lastError ?? new Error('모든 무료 모델 호출에 실패했습니다.');
}
