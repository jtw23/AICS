import { useState } from 'react';
import { api } from '../lib/api';

interface Props {
  inquiryId: number; variant: 1 | 2 | 3; content: string;
  selected?: boolean; onSelect?: (variant: 1 | 2 | 3) => void;
}

const VARIANT_LABELS: Record<number, string> = { 1: '초안 A', 2: '초안 B', 3: '초안 C' };

export default function DraftCard({ inquiryId, variant, content, selected, onSelect }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleSelect = async () => {
    await api.patch(`/inquiry/${inquiryId}/select-draft`, { variant });
    onSelect?.(variant);
  };

  return (
    <div className={`rounded-xl border transition-all shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.02)] ${
      selected
        ? 'border-primary bg-primary-fixed'
        : 'border-surface-variant bg-surface-container-lowest hover:border-outline-variant'
    }`}>
      {/* 헤더 */}
      <div className={`px-5 py-3 border-b flex items-center justify-between ${
        selected ? 'border-primary' : 'border-surface-variant'
      }`}>
        <span className={`font-label-md text-label-md ${selected ? 'text-primary' : 'text-on-surface'}`}>
          {VARIANT_LABELS[variant]}
        </span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 font-caption text-caption px-3 py-1.5 rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all font-medium"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{copied ? 'check' : 'content_copy'}</span>
            {copied ? '복사됨' : '복사'}
          </button>
          <button
            onClick={handleSelect}
            className={`flex items-center gap-1.5 font-caption text-caption px-3 py-1.5 rounded-lg transition-all font-semibold ${
              selected
                ? 'bg-primary-container text-on-primary'
                : 'border border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{selected ? 'check_circle' : 'radio_button_unchecked'}</span>
            {selected ? '선택됨' : '선택'}
          </button>
        </div>
      </div>
      {/* 본문 */}
      <div className="px-5 py-4">
        <p className="text-body-md text-on-surface whitespace-pre-wrap leading-relaxed">{content}</p>
      </div>
    </div>
  );
}
