import { useState } from 'react';
import { api } from '../lib/api';

interface Props {
  inquiryId: number;
  variant: 1 | 2 | 3;
  content: string;
  selected?: boolean;
  onSelect?: (variant: 1 | 2 | 3) => void;
}

const VARIANT_LABELS = { 1: '초안 A', 2: '초안 B', 3: '초안 C' };

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
    <div className={`border rounded-xl p-4 flex flex-col gap-3 transition-all ${
      selected ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">{VARIANT_LABELS[variant]}</span>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            {copied ? '복사됨' : '복사'}
          </button>
          <button
            onClick={handleSelect}
            className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
              selected
                ? 'bg-indigo-600 text-white'
                : 'border border-indigo-300 text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {selected ? '선택됨' : '선택'}
          </button>
        </div>
      </div>
      <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}
