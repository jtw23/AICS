import { useState, useEffect, useRef } from 'react';
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
  const [clientSearch, setClientSearch] = useState('');
  const [clientOpen, setClientOpen] = useState(false);
  const clientRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ items: ClientOption[] }>('/settings/clients').then((r) => setClients(r.data.items));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(e.target as Node)) {
        setClientOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedClient = clients.find((c) => c.id === clientId) ?? null;
  const filteredClients = clients.filter((c) =>
    `${c.client_code} ${c.name}`.toLowerCase().includes(clientSearch.toLowerCase())
  );

  const handleProcess = async () => {
    if (!content.trim()) return;
    setLoading(true); setError(''); setResult(null);
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
            <label className="block font-label-md text-label-md text-on-surface" style={{ marginBottom: '0.75rem', display: 'block' }}>고객사 선택</label>
            <div ref={clientRef} style={{ position: 'relative' }}>
              {/* 트리거 */}
              <button
                type="button"
                onClick={() => { setClientOpen((o) => !o); setClientSearch(''); }}
                className="w-full flex items-center justify-between border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                style={{ padding: '0.625rem 0.875rem', fontSize: '0.875rem', textAlign: 'left' }}
              >
                <span className={selectedClient ? 'text-on-surface' : 'text-outline'}>
                  {selectedClient ? `[${selectedClient.client_code}] ${selectedClient.name}` : '고객사를 선택하세요...'}
                </span>
                <div className="flex items-center" style={{ gap: '0.25rem', flexShrink: 0 }}>
                  {selectedClient && (
                    <span
                      className="material-symbols-outlined text-outline hover:text-error transition-colors"
                      style={{ fontSize: 16 }}
                      onClick={(e) => { e.stopPropagation(); setClientId(''); setClientOpen(false); }}
                    >close</span>
                  )}
                  <span className="material-symbols-outlined text-outline-variant" style={{ fontSize: 20 }}>
                    {clientOpen ? 'expand_less' : 'expand_more'}
                  </span>
                </div>
              </button>

              {/* 드롭다운 */}
              {clientOpen && (
                <div className="absolute z-50 w-full bg-surface-container-lowest border border-outline-variant rounded-lg shadow-lg overflow-hidden"
                  style={{ top: 'calc(100% + 0.25rem)', maxHeight: '16rem' }}>
                  {/* 검색창 */}
                  <div className="border-b border-outline-variant" style={{ padding: '0.5rem' }}>
                    <div style={{ position: 'relative' }}>
                      <span className="material-symbols-outlined text-outline" style={{ position: 'absolute', left: '0.5rem', top: '50%', transform: 'translateY(-50%)', fontSize: 16 }}>search</span>
                      <input
                        autoFocus
                        type="text"
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        placeholder="코드 또는 업체명 검색..."
                        className="w-full bg-surface-container rounded text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        style={{ padding: '0.375rem 0.5rem 0.375rem 1.75rem', fontSize: '0.8125rem' }}
                      />
                    </div>
                  </div>
                  {/* 목록 */}
                  <div style={{ overflowY: 'auto', maxHeight: '12rem' }}>
                    <div
                      className="hover:bg-surface-container-low cursor-pointer text-outline transition-colors"
                      style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                      onClick={() => { setClientId(''); setClientOpen(false); }}
                    >
                      선택 안 함
                    </div>
                    {filteredClients.length === 0 ? (
                      <div className="text-outline text-center" style={{ padding: '1rem', fontSize: '0.8125rem' }}>검색 결과 없음</div>
                    ) : filteredClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => { setClientId(c.id); setClientOpen(false); }}
                        className={`cursor-pointer transition-colors flex items-center justify-between ${
                          clientId === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'
                        }`}
                        style={{ padding: '0.5rem 0.875rem', fontSize: '0.8125rem' }}
                      >
                        <span>{c.name}</span>
                        <span className="font-mono text-outline-variant" style={{ fontSize: '0.75rem' }}>{c.client_code}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
          <div className="relative bg-surface-container rounded-xl overflow-hidden hidden lg:block flex-1 group" style={{ padding: '1.75rem' }}>
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
        <div className="lg:col-span-8 flex flex-col h-full">
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
          <div className={card} style={{ padding: '1.25rem 1.5rem' }}>
            <h3 className="font-semibold text-on-surface flex items-center gap-2" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
              <span className="material-symbols-outlined ms-fill text-emerald-500" style={{ fontSize: 18 }}>check_circle</span>
              분류 결과
            </h3>
            <div className="flex flex-wrap items-start" style={{ gap: '1.5rem' }}>
              <div>
                <p className="text-on-surface-variant uppercase tracking-wide font-semibold" style={{ fontSize: '0.6875rem', marginBottom: '0.5rem' }}>분류</p>
                <CategoryBadge category={result.category} />
              </div>
              <div>
                <p className="text-on-surface-variant uppercase tracking-wide font-semibold" style={{ fontSize: '0.6875rem', marginBottom: '0.5rem' }}>신뢰도</p>
                <div className="flex items-center gap-2">
                  <div className="rounded-full overflow-hidden bg-surface-container" style={{ width: '6rem', height: '0.375rem' }}>
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(result.confidence * 100).toFixed(0)}%` }} />
                  </div>
                  <span className="font-bold text-on-surface" style={{ fontSize: '0.875rem' }}>{(result.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
              <div className="flex-1" style={{ minWidth: '12rem' }}>
                <p className="text-on-surface-variant uppercase tracking-wide font-semibold" style={{ fontSize: '0.6875rem', marginBottom: '0.5rem' }}>AI 요약</p>
                <p className="text-on-surface" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>{result.summary}</p>
              </div>
            </div>
          </div>

          {/* 유사 문의 */}
          {result.similar.length > 0 && (
            <div className={card} style={{ overflow: 'hidden' }}>
              {/* 헤더 */}
              <div className="flex items-center gap-2 bg-amber-50 border-b border-amber-100"
                style={{ padding: '0.75rem 1.25rem' }}>
                <span className="material-symbols-outlined ms-fill text-amber-500" style={{ fontSize: 18 }}>history</span>
                <span className="font-semibold text-amber-800" style={{ fontSize: '0.875rem' }}>
                  유사 문의 {result.similar.length}건 발견
                </span>
                <span className="text-amber-600" style={{ fontSize: '0.75rem', marginLeft: 'auto' }}>
                  이전 처리 이력을 참고하세요
                </span>
              </div>
              {/* 목록 */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {result.similar.map((s, i) => (
                  <div key={i}
                    className={`flex items-start gap-3 ${i < result.similar.length - 1 ? 'border-b border-slate-100' : ''}`}
                    style={{ padding: '0.875rem 1.25rem' }}>
                    <span className="flex-shrink-0 font-mono font-bold rounded-md bg-amber-100 text-amber-700"
                      style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', marginTop: '0.125rem' }}>
                      {(s.score * 100).toFixed(0)}%
                    </span>
                    <p className="text-on-surface-variant leading-relaxed"
                      style={{ fontSize: '0.8125rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {s.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 초안 */}
          <div>
            <h3 className="font-semibold text-on-surface" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
              답변 초안 <span className="text-on-surface-variant font-normal" style={{ fontSize: '0.875rem' }}>({tone} 톤)</span>
            </h3>
            {result.drafts[0] && (
              <DraftCard
                inquiryId={result.inquiryId}
                variant={result.drafts[0].variant}
                content={result.drafts[0].content}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
