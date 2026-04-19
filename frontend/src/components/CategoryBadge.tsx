const CATEGORY_COLORS: Record<string, string> = {
  결제: 'bg-yellow-100 text-yellow-800',
  배송: 'bg-blue-100 text-blue-800',
  환불: 'bg-red-100 text-red-800',
  기술지원: 'bg-purple-100 text-purple-800',
  계정: 'bg-green-100 text-green-800',
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
