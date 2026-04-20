const CATEGORY_COLORS: Record<string, string> = {
  계약: 'bg-blue-100 text-blue-800',
  견적: 'bg-cyan-100 text-cyan-800',
  개발: 'bg-indigo-100 text-indigo-800',
  유지보수: 'bg-green-100 text-green-800',
  장애: 'bg-red-100 text-red-800',
  기술지원: 'bg-purple-100 text-purple-800',
  기타: 'bg-gray-100 text-gray-700',
};

export default function CategoryBadge({ category }: { category: string }) {
  const color = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {category}
    </span>
  );
}
