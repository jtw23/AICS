import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';
import DraftCard from '../components/DraftCard';

type ToneType = '공식' | '친근' | '간결';

interface Draft {
  variant: 1 | 2 | 3;
  content: string;
}

interface ProcessResult {
  inquiryId: number;
  category: string;
  confidence: number;
  summary: string;
  drafts: Draft[];
  similar: { content: string; score: number }[];
}

interface ClientOption {
  id: number;
  client_code: string;
  name: string;
}

export default function InquiryPage() {
  const [content, setContent] = useState('');
  const [tone, setTone] = useState<ToneType>('공식');
  const [clientId, setClientId] = useState<number | ''>('');
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [error, setError] = useState('');

  const TONES: ToneType[] = ['공식', '친근', '간결'];

  useEffect(() => {
    api.get<{ items: ClientOption[] }>('/settings/clients').then((r) => setClients(r.data.items));
  }, []);

  const handleProcess = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    setSelectedVariant(null);

    try {
      const res = await api.post<ProcessResult>('/inquiry/process', {
        content,
        tone,
        client_id: clientId || null,
      });
      setResult(res.data);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'AI 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">문의 처리</h2>
        <p className="text-sm text-gray-500 mt-1">고객 문의를 붙여넣으면 AI가 자동 분류하고 답변 초안을 생성합니다.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        {/* 고객사 선택 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">고객사</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="">고객사 선택 (선택사항)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>[{c.client_code}] {c.name}</option>
            ))}
          </select>
        </div>

        {/* 답변 톤 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">답변 톤</label>
          <div className="flex gap-2">
            {TONES.map((t) => (
              <button
                key={t}
                onClick={() => setTone(t)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  tone === t
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 문의 내용 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">고객 문의 내용</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="고객 문의 내용을 여기에 붙여넣으세요..."
            rows={7}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <p className="text-xs text-gray-400 mt-1">* 개인정보(전화번호, 이메일 등)는 자동으로 마스킹됩니다.</p>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleProcess}
          disabled={loading || !content.trim()}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
              </svg>
              AI 처리 중...
            </>
          ) : 'AI 분류 + 답변 초안 생성'}
        </button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">분류 결과</h3>
            <div className="flex flex-wrap items-center gap-3">
              <CategoryBadge category={result.category} />
              <span className="text-sm text-gray-500">
                신뢰도 {(result.confidence * 100).toFixed(0)}%
              </span>
              <span className="text-sm text-gray-600 flex-1">{result.summary}</span>
            </div>
          </div>

          {result.similar.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                유사 문의 {result.similar.length}건 발견
              </h3>
              <ul className="space-y-2">
                {result.similar.map((s, i) => (
                  <li key={i} className="text-sm text-amber-700 flex gap-2">
                    <span className="font-mono text-xs bg-amber-100 px-1.5 py-0.5 rounded">
                      {(s.score * 100).toFixed(0)}%
                    </span>
                    <span className="truncate">{s.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">답변 초안 3가지 ({tone} 톤)</h3>
            <div className="grid gap-3">
              {result.drafts.map((d) => (
                <DraftCard
                  key={d.variant}
                  inquiryId={result.inquiryId}
                  variant={d.variant}
                  content={d.content}
                  selected={selectedVariant === d.variant}
                  onSelect={setSelectedVariant}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
