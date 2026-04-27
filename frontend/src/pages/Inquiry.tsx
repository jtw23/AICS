import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';
import DraftCard from '../components/DraftCard';

type ToneType = '공식' | '친근' | '간결';

interface Draft { variant: 1 | 2 | 3; content: string; }
interface ProcessResult {
  inquiryId: number; category: string; confidence: number;
  summary: string; drafts: Draft[];
  similar: { content: string; score: number }[];
}
interface ClientOption { id: number; client_code: string; name: string; }

const TONES: { value: ToneType; icon: string; label: string }[] = [
  { value: '공식', icon: 'work',       label: '공식' },
  { value: '친근', icon: 'mood',       label: '친근' },
  { value: '간결', icon: 'short_text', label: '간결' },
];

const card = "bg-surface-container-lowest rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

export default function InquiryPage() {
  const [content, setContent] = useState('');
  const [tone, setTone] = useState<ToneType>('공식');
  const [clientId, setClientId] = useState<number | ''>('');
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ items: ClientOption[] }>('/settings/clients').then((r) => setClients(r.data.items));
  }, []);

  const handleProcess = async () => {
    if (!content.trim()) return;
    setLoading(true); setError(''); setResult(null); setSelectedVariant(null);
    try {
      const res = await api.post<ProcessResult>('/inquiry/process', { content, tone, client_id: clientId || null });
      setResult(res.data);
    } catch (err) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error ?? 'AI 처리 중 오류가 발생했습니다.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* 페이지 헤더 */}
      <div style={{ marginBottom: '1rem' }}>
        <h1 className="text-h1 font-h1 text-on-surface mb-2">문의 처리</h1>
        <p className="text-body-lg text-on-surface-variant">고객 문의를 붙여넣으면 AI가 자동 분류하고 답변 초안을 생성합니다.</p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12" style={{ gap: '1.5rem' }}>

        {/* 좌측 컬럼: 컨트롤 */}
        <div className="lg:col-span-4" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 고객사 선택 */}
          <div className={card} style={{ padding: '1.5rem' }}>
            <label className="block font-label-md text-label-md text-on-surface" htmlFor="client-select" style={{ marginBottom: '0.75rem', display: 'block' }}>고객사 선택</label>
            <div className="relative">
              <select
                id="client-select"
                value={clientId}
                onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : '')}
                className="w-full appearance-none bg-surface-container-lowest border border-outline-variant text-on-surface rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-body-md text-body-md"
                style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '1rem' }}
              >
                <option value="">고객사를 선택하세요...</option>
                {clients.map((c) => <option key={c.id} value={c.id}>[{c.client_code}] {c.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-on-surface-variant">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          {/* 답변 톤 */}
          <div className={card} style={{ padding: '1.5rem' }}>
            <label className="block font-label-md text-label-md text-on-surface" style={{ marginBottom: '0.75rem', display: 'block' }}>답변 톤</label>
            <div className="grid grid-cols-3" style={{ gap: '0.75rem' }}>
              {TONES.map(({ value, icon, label }) => (
                <label key={value} className="cursor-pointer relative">
                  <input
                    type="radio"
                    name="tone"
                    value={value}
                    checked={tone === value}
                    onChange={() => setTone(value)}
                    className="peer sr-only"
                  />
                  <div className="flex flex-col items-center justify-center border border-outline-variant rounded-lg hover:bg-surface-container-low transition-all peer-checked:border-primary peer-checked:bg-primary-fixed peer-checked:text-on-primary-fixed" style={{ paddingTop: '0.875rem', paddingBottom: '0.875rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 24, marginBottom: '0.375rem' }}>{icon}</span>
                    <span className="font-label-sm text-label-sm">{label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* AI 안내 카드 */}
          <div className="relative bg-surface-container rounded-xl overflow-hidden hidden lg:block group" style={{ padding: '1.75rem', minHeight: '12rem' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-container to-tertiary-container opacity-10 group-hover:opacity-20 transition-opacity" />
            <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="w-11 h-11 rounded-full bg-primary-fixed flex items-center justify-center text-on-primary-fixed">
                <span className="material-symbols-outlined ms-fill" style={{ fontSize: 24 }}>auto_awesome</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface">AI 기반 분류</h3>
              <p className="text-body-md text-on-surface-variant">감정과 맥락을 분석하여 최적의 답변 초안을 생성합니다.</p>
            </div>
            <span className="material-symbols-outlined ms-fill absolute -bottom-6 -right-6 text-primary opacity-5" style={{ fontSize: '9rem' }}>smart_toy</span>
          </div>
        </div>

        {/* 우측 컬럼: 텍스트에어리어 */}
        <div className="lg:col-span-8 flex flex-col">
          <div className={`${card} flex flex-col h-full`}>
            {/* 헤더 */}
            <div className="border-b border-slate-200 flex justify-between items-center bg-surface-container-lowest rounded-t-xl" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '1rem', paddingBottom: '1rem' }}>
              <label className="font-label-md text-label-md text-on-surface" htmlFor="inquiry-content">문의 내용</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setContent('')}
                  className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded"
                  title="지우기"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>clear_all</span>
                </button>
                <button
                  onClick={() => navigator.clipboard.readText().then(setContent)}
                  className="p-1.5 text-on-surface-variant hover:text-primary transition-colors rounded"
                  title="붙여넣기"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_paste</span>
                </button>
              </div>
            </div>

            {/* 텍스트에어리어 */}
            <div className="flex-1" style={{ padding: '1.5rem' }}>
              <textarea
                id="inquiry-content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="고객 문의 내용을 여기에 붙여넣으세요..."
                className="w-full h-full resize-none border-none bg-transparent text-on-surface font-body-md text-body-md focus:ring-0 outline-none placeholder:text-outline p-0"
                style={{ minHeight: '400px' }}
              />
            </div>

            {/* 푸터 */}
            <div className="border-t border-slate-200 bg-surface-container-lowest rounded-b-xl flex items-center gap-2" style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingTop: '0.75rem', paddingBottom: '0.75rem' }}>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 16 }}>security</span>
              <span className="font-caption text-caption text-outline">개인정보(전화번호, 이메일 등)는 자동으로 마스킹됩니다.</span>
            </div>
          </div>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-error-container border border-error/20 rounded-lg text-on-error-container text-sm">
          <span className="material-symbols-outlined text-error" style={{ fontSize: 16 }}>error</span>
          {error}
        </div>
      )}

      {/* 실행 버튼 — 그리드 아래 전체 너비 가운데 */}
      <div className="flex justify-center">
        <button
          onClick={handleProcess}
          disabled={loading || !content.trim()}
          className="w-full lg:w-auto bg-primary text-on-primary font-semibold rounded-full shadow-md hover:bg-primary-container transition-colors duration-200 inline-flex items-center justify-center gap-3 disabled:opacity-50 group"
          style={{ paddingTop: '1rem', paddingBottom: '1rem', paddingLeft: '3rem', paddingRight: '3rem', fontSize: '1rem' }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
              </svg>
              AI 처리 중...
            </>
          ) : (
            <>
              <span className="material-symbols-outlined ms-fill group-hover:rotate-12 transition-transform duration-300" style={{ fontSize: 22 }}>auto_awesome</span>
              AI 분류 + 답변 초안 생성
            </>
          )}
        </button>
      </div>

      {/* 결과 */}
      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 분류 결과 */}
          <div className={card} style={{ padding: '1.5rem' }}>
            <h3 className="font-label-md text-label-md text-on-surface mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined ms-fill text-emerald-500" style={{ fontSize: 18 }}>check_circle</span>
              분류 결과
            </h3>
            <div className="flex flex-wrap items-start gap-6">
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">카테고리</p>
                <CategoryBadge category={result.category} />
              </div>
              <div>
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">신뢰도</p>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full bg-primary-container rounded-full" style={{ width: `${(result.confidence * 100).toFixed(0)}%` }} />
                  </div>
                  <span className="text-sm font-bold text-on-surface">{(result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-48">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-1.5">AI 요약</p>
                <p className="text-body-md text-on-surface">{result.summary}</p>
              </div>
            </div>
          </div>

          {/* 유사 문의 */}
          {result.similar.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined ms-fill text-amber-500" style={{ fontSize: 18 }}>warning</span>
                유사 문의 {result.similar.length}건 발견
              </h3>
              <ul className="space-y-2">
                {result.similar.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-amber-700">
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-mono text-xs font-bold flex-shrink-0">
                      {(s.score * 100).toFixed(0)}%
                    </span>
                    <span className="truncate">{s.content}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 초안 */}
          <div>
            <h3 className="text-base font-semibold text-on-surface mb-4">
              답변 초안 <span className="text-on-surface-variant font-normal text-sm">({tone} 톤 · 3가지)</span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
