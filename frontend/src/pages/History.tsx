import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';

interface InquiryRow {
  id: number;
  content_masked: string;
  category: string;
  category_confidence: number;
  tone: string;
  summary: string;
  created_at: number;
}

const CATEGORIES = ['전체', '계약', '견적', '개발', '유지보수', '장애', '기술지원', '기타'];

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<InquiryRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('전체');
  const [loading, setLoading] = useState(false);
  const LIMIT = 20;

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
    } finally {
      setLoading(false);
    }
  }, [page, debouncedQuery, category]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">히스토리</h2>

      {/* 검색 + 필터 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="문의 내용 검색..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
        />
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                category === c
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">문의 내역이 없습니다.</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/history/${item.id}`)}
              className="px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <CategoryBadge category={item.category} />
                <span className="text-xs text-gray-400">
                  {new Date(item.created_at * 1000).toLocaleString('ko-KR')}
                </span>
                <span className="text-xs text-gray-400">신뢰도 {(item.category_confidence * 100).toFixed(0)}%</span>
                <span className="ml-auto text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{item.tone}</span>
              </div>
              <p className="text-sm text-gray-800 line-clamp-1">{item.summary || item.content_masked}</p>
            </div>
          ))
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            이전
          </button>
          <span className="px-3 py-1.5 text-sm text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}
