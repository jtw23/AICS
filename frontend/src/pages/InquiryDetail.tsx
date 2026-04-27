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

const card = "bg-surface-container-lowest rounded-xl border border-slate-200 shadow-[0_1px_2px_rgba(0,0,0,0.04)]";

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InquiryDetail | null>(null);
  useEffect(() => {
    api.get<InquiryDetail>(`/inquiry/${id}`).then((res) => {
      setData(res.data);
    });
  }, [id]);

  if (!data) return (
    <div className="py-20 flex items-center justify-center gap-3 text-outline">
      <svg className="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"/>
      </svg>
      <span className="text-sm text-outline">불러오는 중...</span>
    </div>
  );

  const firstDraft = data.drafts[0] ?? null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* 헤더 */}
      <div>
        <Link to="/history"
          className="inline-flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors"
          style={{ fontSize: '0.875rem', marginBottom: '0.75rem', display: 'inline-flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
          히스토리로 돌아가기
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center" style={{ gap: '0.75rem', marginBottom: '0.375rem' }}>
              <h1 className="font-bold text-on-surface" style={{ fontSize: '1.875rem' }}>문의 #{data.id}</h1>
              <CategoryBadge category={data.category} />
            </div>
            <p className="text-on-surface-variant" style={{ fontSize: '0.875rem' }}>
              {new Date(data.created_at * 1000).toLocaleString('ko-KR')}
            </p>
          </div>
        </div>
      </div>

      {/* 분류 결과 */}
      <div className={card} style={{ padding: '1.5rem' }}>
        <h3 className="font-semibold text-on-surface flex items-center gap-2" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
          <span className="material-symbols-outlined ms-fill text-emerald-500" style={{ fontSize: 18 }}>check_circle</span>
          분류 결과
        </h3>
        <div className="flex flex-wrap items-start" style={{ gap: '1.5rem' }}>
          <div>
            <p className="text-on-surface-variant uppercase tracking-wide font-semibold" style={{ fontSize: '0.6875rem', marginBottom: '0.375rem' }}>분류</p>
            <CategoryBadge category={data.category} />
          </div>
          <div>
            <p className="text-on-surface-variant uppercase tracking-wide font-semibold" style={{ fontSize: '0.6875rem', marginBottom: '0.375rem' }}>신뢰도</p>
            <div className="flex items-center gap-2">
              <div className="rounded-full overflow-hidden bg-surface-container" style={{ width: '6rem', height: '0.375rem' }}>
                <div className="h-full bg-primary rounded-full" style={{ width: `${(data.category_confidence * 100).toFixed(0)}%` }} />
              </div>
              <span className="font-bold text-on-surface" style={{ fontSize: '0.875rem' }}>{(data.category_confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
          <div>
            <p className="text-on-surface-variant uppercase tracking-wide font-semibold" style={{ fontSize: '0.6875rem', marginBottom: '0.375rem' }}>답변 톤</p>
            <span className="bg-surface-container text-on-surface-variant rounded-full font-medium" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}>{data.tone}</span>
          </div>
          <div className="flex-1" style={{ minWidth: '12rem' }}>
            <p className="text-on-surface-variant uppercase tracking-wide font-semibold" style={{ fontSize: '0.6875rem', marginBottom: '0.375rem' }}>AI 요약</p>
            <p className="text-on-surface" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>{data.summary}</p>
          </div>
        </div>
      </div>

      {/* 원문 */}
      <div className={card}>
        <div className="border-b border-slate-100 flex items-center justify-between rounded-t-xl bg-surface-container-low" style={{ padding: '0.875rem 1.25rem' }}>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline" style={{ fontSize: 16 }}>security</span>
            <span className="font-semibold text-on-surface" style={{ fontSize: '0.875rem' }}>원문 (마스킹됨)</span>
          </div>
          <span className="text-on-surface-variant" style={{ fontSize: '0.75rem' }}>개인정보 자동 마스킹 적용</span>
        </div>
        <div style={{ padding: '1.25rem' }}>
          <p className="text-on-surface whitespace-pre-wrap leading-relaxed" style={{ fontSize: '0.875rem' }}>{data.content_masked}</p>
        </div>
      </div>

      {/* 답변 초안 */}
      <div>
        <h3 className="font-semibold text-on-surface" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
          답변 초안
          {data.drafts.length > 1 && (
            <span className="text-on-surface-variant font-normal" style={{ fontSize: '0.875rem', marginLeft: '0.5rem' }}>({data.drafts.length}개)</span>
          )}
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {data.drafts.map((d) => (
            <DraftCard
              key={d.variant}
              inquiryId={data.id}
              variant={d.variant}
              content={d.content}
              selected={!!d.selected}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
