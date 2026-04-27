import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';

interface InquiryRow {
  id: number; content_masked: string; category: string;
  category_confidence: number; tone: string; summary: string; created_at: number;
}

const CATEGORIES = ['전체', '계약', '견적', '개발', '유지보수', '장애', '기술지원', '기타'];
const LIMIT = 20;

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InquiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('전체');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: LIMIT };
      if (debouncedQuery) params.q = debouncedQuery;
      if (category !== '전체') params.category = category;
      const res = await api.get<{ items: InquiryRow[]; total: number }>('/history', { params });
      setItems(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } finally { setLoading(false); }
  }, [page, debouncedQuery, category]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm(`문의 #${id}를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    setDeletingId(id);
    try {
      await api.delete(`/inquiry/${id}`);
      fetchHistory();
    } finally { setDeletingId(null); }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const getPageNums = (): (number | '...')[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 4) return [1, 2, 3, 4, 5, '...', totalPages];
    if (page >= totalPages - 3) return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [1, '...', page - 1, page, page + 1, '...', totalPages];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 페이지 헤더 */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '0.375rem' }}>
            <h1 className="text-h1 font-h1 text-on-surface">히스토리</h1>
            <span className="bg-primary/10 text-primary rounded-full font-label-sm text-label-sm" style={{ padding: '0.25rem 0.75rem' }}>
              {total.toLocaleString()} 건
            </span>
          </div>
          <p className="text-body-md text-on-surface-variant">처리된 문의 내역을 검색하고 확인합니다.</p>
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-primary text-on-primary rounded-lg flex items-center shadow-sm transition-all hover:bg-primary-container active:scale-95"
          style={{ paddingLeft: '1rem', paddingRight: '1rem', paddingTop: '0.5rem', paddingBottom: '0.5rem', gap: '0.375rem', fontSize: '0.875rem', fontWeight: 500 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          새 문의
        </button>
      </div>

      {/* Quick Filters + 검색 */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ position: 'relative' }}>
            <span className="material-symbols-outlined text-outline" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', fontSize: 18 }}>search</span>
            <input
              type="text"
              placeholder="문의 내용 또는 요약으로 검색..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1); }}
              className="w-full border border-slate-200 rounded-lg bg-white text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem', paddingLeft: '2.25rem', paddingRight: '1rem', fontSize: '0.875rem' }}
            />
          </div>
          <div className="flex items-center overflow-x-auto" style={{ gap: '0.5rem' }}>
            <span className="text-on-surface-variant flex items-center flex-shrink-0" style={{ fontSize: '0.75rem', fontWeight: 600, gap: '0.25rem', marginRight: '0.25rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>filter_list</span>
              빠른 필터:
            </span>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => { setCategory(c); setPage(1); }}
                className={`flex-shrink-0 rounded-full font-label-md text-label-md transition-colors ${
                  category === c
                    ? 'bg-primary text-on-primary shadow-sm'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                }`}
                style={{ paddingLeft: '1.25rem', paddingRight: '1.25rem', paddingTop: '0.375rem', paddingBottom: '0.375rem' }}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 데이터 테이블 */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3 text-outline">
            <svg className="animate-spin w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
            </svg>
            <span className="text-body-md">불러오는 중...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: '#c7c4d8' }}>inbox</span>
            <span className="font-label-md text-label-md text-outline">문의 내역이 없습니다.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container-low border-b border-outline-variant">
                <tr>
                  {['문의 ID', '분류', '요약 / 내용', '등록일시', '신뢰도', ''].map((h, i) => (
                    <th key={i} className="text-on-surface-variant uppercase tracking-wider"
                      style={{ padding: '0.875rem 1.5rem', fontSize: '0.6875rem', fontWeight: 600 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {items.map((item) => (
                  <tr key={item.id}
                    className="hover:bg-surface-container-low transition-colors group cursor-pointer"
                    onClick={() => navigate(`/history/${item.id}`)}>
                    <td style={{ padding: '1rem 1.5rem', whiteSpace: 'nowrap' }}>
                      <span className="font-mono text-primary font-semibold" style={{ fontSize: '0.875rem' }}>#{item.id}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <CategoryBadge category={item.category} />
                    </td>
                    <td style={{ padding: '1rem 1.5rem', maxWidth: '28rem' }}>
                      <p className="font-label-md text-label-md text-on-surface group-hover:text-primary transition-colors"
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.summary || item.content_masked}
                      </p>
                      <p className="text-caption text-on-surface-variant"
                        style={{ marginTop: '0.125rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.content_masked}
                      </p>
                    </td>
                    <td className="text-on-surface-variant" style={{ padding: '1rem 1.5rem', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                      {new Date(item.created_at * 1000).toLocaleString('ko-KR', {
                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <ConfidenceBadge value={item.category_confidence} />
                    </td>
                    <td style={{ padding: '1rem 1rem', textAlign: 'right', width: '3rem' }}>
                      <button
                        onClick={(e) => handleDelete(e, item.id)}
                        disabled={deletingId === item.id}
                        className="p-1.5 rounded-lg text-outline-variant hover:text-error hover:bg-error-container opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                        title="삭제"
                      >
                        {deletingId === item.id
                          ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/></svg>
                          : <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                        }
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 페이지네이션 푸터 */}
        {!loading && total > 0 && (
          <div className="bg-surface-container-low border-t border-outline-variant flex items-center justify-between"
            style={{ padding: '0.875rem 1.5rem' }}>
            <p className="text-on-surface-variant" style={{ fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 700, color: '#191c1e' }}>
                {(page - 1) * LIMIT + 1} – {Math.min(page * LIMIT, total)}
              </span>
              {' '}/ 전체{' '}
              <span style={{ fontWeight: 700, color: '#191c1e' }}>{total.toLocaleString()}</span>건
            </p>
            {totalPages > 1 && (
              <div className="flex items-center" style={{ gap: '0.25rem' }}>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded disabled:opacity-40 transition-all"
                  style={{ width: '2rem', height: '2rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_left</span>
                </button>
                {getPageNums().map((p, i) =>
                  p === '...' ? (
                    <span key={`dots-${i}`} className="text-on-surface-variant" style={{ padding: '0 0.25rem', fontSize: '0.875rem' }}>...</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`flex items-center justify-center rounded transition-all ${
                        p === page
                          ? 'bg-primary text-on-primary'
                          : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                      }`}
                      style={{ width: '2rem', height: '2rem', fontSize: '0.75rem', fontWeight: 500 }}
                    >
                      {p}
                    </button>
                  )
                )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="flex items-center justify-center border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded disabled:opacity-40 transition-all"
                  style={{ width: '2rem', height: '2rem' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}

function ConfidenceBadge({ value }: { value: number | null | undefined }) {
  if (value == null) return <span className="text-on-surface-variant" style={{ fontSize: '0.8125rem' }}>—</span>;
  const pct = Math.round(value * 100);
  if (pct >= 80) return (
    <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 rounded-full w-fit"
      style={{ fontSize: '0.8125rem', fontWeight: 500, padding: '0.125rem 0.625rem' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
      {pct}%
    </span>
  );
  if (pct >= 60) return (
    <span className="flex items-center gap-1 text-amber-600 bg-amber-50 rounded-full w-fit"
      style={{ fontSize: '0.8125rem', fontWeight: 500, padding: '0.125rem 0.625rem' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
      {pct}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-slate-500 bg-slate-100 rounded-full w-fit"
      style={{ fontSize: '0.8125rem', fontWeight: 500, padding: '0.125rem 0.625rem' }}>
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 flex-shrink-0" />
      {pct}%
    </span>
  );
}
