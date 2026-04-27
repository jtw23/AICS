const CATEGORY_COLORS: Record<string, string> = {
  계약:   'bg-blue-50 text-blue-700 border-blue-200',
  견적:   'bg-cyan-50 text-cyan-700 border-cyan-200',
  개발:   'bg-violet-50 text-violet-700 border-violet-200',
  유지보수:'bg-emerald-50 text-emerald-700 border-emerald-200',
  장애:   'bg-red-50 text-red-700 border-red-200',
  기술지원:'bg-purple-50 text-purple-700 border-purple-200',
  기타:   'bg-slate-50 text-slate-600 border-slate-200',
};

export default function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'bg-slate-50 text-slate-600 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${color}`}>
      {category}
    </span>
  );
}
