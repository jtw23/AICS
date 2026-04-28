import { useState, useMemo } from 'react';
import { marked } from 'marked';

marked.use({ breaks: true, gfm: true });

interface Props {
  inquiryId: number;
  variant: 1 | 2 | 3;
  content: string;
  selected?: boolean;
}

export default function DraftCard({ content, selected }: Props) {
  const [copied, setCopied] = useState(false);

  const html = useMemo(() => marked.parse(content) as string, [content]);

  const handleCopy = async () => {
    try {
      try {
        const htmlBlob = new Blob([html], { type: 'text/html' });
        const textBlob = new Blob([content], { type: 'text/plain' });
        await navigator.clipboard.write([
          new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob }),
        ]);
      } catch {
        await navigator.clipboard.writeText(content);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard 권한 없음 — 조용히 무시
    }
  };

  return (
    <div className={`bg-surface-container-lowest rounded-xl border transition-all shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
      selected ? 'border-primary' : 'border-slate-200'
    }`}>
      {/* 헤더 */}
      <div className={`flex items-center justify-between border-b rounded-t-xl ${
        selected ? 'border-primary/20 bg-primary-fixed/50' : 'border-slate-100 bg-surface-container-low'
      }`} style={{ paddingTop: '0.75rem', paddingBottom: '0.75rem', paddingLeft: '1.25rem', paddingRight: '1.25rem' }}>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined ms-fill text-primary" style={{ fontSize: 18 }}>edit_note</span>
          <span className="font-semibold text-on-surface" style={{ fontSize: '0.875rem' }}>답변 초안</span>
          {selected && (
            <span className="inline-flex items-center gap-1 bg-primary text-on-primary rounded-full font-semibold" style={{ fontSize: '0.6875rem', padding: '0.125rem 0.5rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 12 }}>check</span>
              채택됨
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 border border-outline-variant text-on-surface-variant hover:bg-surface-container rounded-lg transition-all"
          style={{ fontSize: '0.75rem', fontWeight: 500, padding: '0.375rem 0.75rem' }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{copied ? 'check' : 'content_copy'}</span>
          {copied ? '복사됨' : '복사'}
        </button>
      </div>
      {/* 본문 */}
      <div
        className="draft-body text-on-surface"
        style={{ padding: '1.25rem', fontSize: '0.875rem', lineHeight: '1.7' }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
