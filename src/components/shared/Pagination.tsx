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
    <div className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-3 py-1.5 rounded-md text-sm font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-[#E5E5E5]"
      >
        ← Prev
      </button>

      {rendered.map((n, i) =>
        n === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-[#9B9B9B]">…</span>
        ) : (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-9 h-9 rounded-md text-sm font-medium transition-colors ${
              n === page
                ? "bg-[#A4860E] text-white"
                : "text-[#6B6B6B] hover:bg-[#F5F5F5] border border-[#E5E5E5]"
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="px-3 py-1.5 rounded-md text-sm font-medium text-[#6B6B6B] hover:bg-[#F5F5F5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors border border-[#E5E5E5]"
      >
        Next →
      </button>
    </div>
  );
}
