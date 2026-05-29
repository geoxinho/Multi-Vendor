"use client";

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
}

export default function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  const nums = Array.from({ length: pages }, (_, i) => i + 1);
  const visible = nums.filter((n) => n === 1 || n === pages || Math.abs(n - page) <= 1);

  const rendered: (number | "...")[] = [];
  visible.forEach((n, i) => {
    if (i > 0 && n - visible[i - 1] > 1) rendered.push("...");
    rendered.push(n);
  });

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>

      {rendered.map((n, i) =>
        n === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
        ) : (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
              n === page
                ? "bg-green-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
