// 로컬 임베딩: @xenova/transformers 사용 (오프라인, 무료)
// 첫 실행 시 모델 다운로드 (~30MB)

let pipeline: ((texts: string[]) => Promise<{ data: Float32Array }[]>) | null = null;

async function getPipeline() {
  if (!pipeline) {
    // Dynamic import (ESM)
    const { pipeline: createPipeline } = await import('@xenova/transformers' as any);
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
      quantized: true,
    });
  }
  return pipeline!;
}

export async function embed(text: string): Promise<Float32Array> {
  const pipe = await getPipeline();
  const output = await pipe([text]);
  // mean pooling
  return output[0].data as Float32Array;
}

export function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function float32ToBuffer(arr: Float32Array): Buffer {
  return Buffer.from(arr.buffer);
}

export function bufferToFloat32(buf: Buffer): Float32Array {
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
