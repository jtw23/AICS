import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import CategoryBadge from '../components/CategoryBadge';
import DraftCard from '../components/DraftCard';

interface Draft { id: number; variant: 1 | 2 | 3; content: string; selected: number; }
interface InquiryDetail {
  id: number; content_masked: string; category: string;
  category_confidence: number; tone: string; summary: string;
  created_at: number; drafts: Draft[];
}

const card = "bg-surface-container-lowest rounded-xl border border-surface-variant shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)]";

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

  if (!data) return (
    <div className="py-20 flex items-center justify-center gap-3 text-outline">
      <svg className="animate-spin w-6 h-6 text-primary-container" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
      </svg>
      <span className="text-body-md">불러오는 중...</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 네비 */}
      <div className="mb-lg">
        <Link to="/history" className="inline-flex items-center gap-1 font-label-md text-label-md text-on-surface-variant hover:text-primary-container transition-colors mb-3">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          히스토리로 돌아가기
        </Link>
        <h1 className="text-h1 font-h1 text-on-surface">
          문의 #{data.id}
        </h1>
      </div>

      {/* 정보 카드 */}
      <div className={`${card} p-lg space-y-5`}>
        <div className="flex flex-wrap items-center gap-3 pb-4 border-b border-surface-variant">
          <CategoryBadge category={data.category} />
          <span className="px-3 py-1 bg-surface-container text-on-surface-variant rounded-full font-caption text-caption font-medium">{data.tone} 톤</span>
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-surface-container rounded-full overflow-hidden">
              <div className="h-full bg-primary-container rounded-full" style={{ width: `${(data.category_confidence * 100).toFixed(0)}%` }} />
            </div>
            <span className="text-caption text-on-surface-variant">신뢰도 <strong>{(data.category_confidence * 100).toFixed(0)}%</strong></span>
          </div>
          <span className="ml-auto text-caption text-outline">
            {new Date(data.created_at * 1000).toLocaleString('ko-KR')}
          </span>
        </div>

        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">AI 요약</p>
          <p className="text-body-md text-on-surface leading-relaxed">{data.summary}</p>
        </div>

        <div>
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wide mb-2">원문 (마스킹됨)</p>
          <div className="bg-surface-container-low rounded-lg p-4 border border-surface-variant">
            <p className="text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">{data.content_masked}</p>
          </div>
        </div>
      </div>

      {/* 초안 */}
      <div>
        <h2 className="text-h3 font-h3 text-on-surface mb-4">답변 초안</h2>
        <div className="space-y-4">
          {data.drafts.map((d) => (
            <DraftCard
              key={d.variant} inquiryId={data.id} variant={d.variant}
              content={d.content} selected={selectedVariant === d.variant}
              onSelect={setSelectedVariant}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
