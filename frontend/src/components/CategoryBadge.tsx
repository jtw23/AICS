const CATEGORY_COLORS: Record<string, { badge: string; dot: string }> = {
  계약:    { badge: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-500' },
  견적:    { badge: 'bg-cyan-100 text-cyan-800',     dot: 'bg-cyan-500' },
  개발:    { badge: 'bg-violet-100 text-violet-800', dot: 'bg-violet-500' },
  유지보수: { badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  장애:    { badge: 'bg-red-100 text-red-800',       dot: 'bg-red-500' },
  기술지원: { badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  기타:    { badge: 'bg-slate-100 text-slate-600',   dot: 'bg-slate-400' },
};

export default function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? { badge: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-semibold ${color.badge}`}
      style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
      {category}
    </span>
  );
}
