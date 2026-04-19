import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';
import DraftCard from '../components/DraftCard';

interface Draft {
  id: number;
  variant: 1 | 2 | 3;
  content: string;
  selected: number;
}

interface InquiryDetail {
  id: number;
  content_masked: string;
  category: string;
  category_confidence: number;
  tone: string;
  summary: string;
  created_at: number;
  drafts: Draft[];
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InquiryDetail | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);

  useEffect(() => {
    api.get<InquiryDetail>(`/inquiry/${id}`).then((res) => {
      setData(res.data);
      const sel = res.data.drafts.find((d) => d.selected);
      if (sel) setSelectedVariant(sel.variant);
    });
  }, [id]);

  if (!data) return <div className="py-12 text-center text-gray-400">불러오는 중...</div>;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/history" className="text-sm text-indigo-600 hover:underline">← 히스토리</Link>
        <h2 className="text-xl font-bold text-gray-900">문의 #{data.id}</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={data.category} />
          <span className="text-xs text-gray-400">신뢰도 {(data.category_confidence * 100).toFixed(0)}%</span>
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{data.tone} 톤</span>
          <span className="text-xs text-gray-400 ml-auto">
            {new Date(data.created_at * 1000).toLocaleString('ko-KR')}
          </span>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">요약</p>
          <p className="text-sm text-gray-700">{data.summary}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">원문 (마스킹됨)</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">{data.content_masked}</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">답변 초안</h3>
        <div className="grid gap-3">
          {data.drafts.map((d) => (
            <DraftCard
              key={d.variant}
              inquiryId={data.id}
              variant={d.variant}
              content={d.content}
              selected={selectedVariant === d.variant}
              onSelect={setSelectedVariant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
