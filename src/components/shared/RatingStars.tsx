interface RatingStarsProps {
  rating: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  showValue?: boolean;
  count?: number;
}

export default function RatingStars({
  rating,
  max = 5,
  size = "md",
  showValue = false,
  count,
}: RatingStarsProps) {
  const safeRating = typeof rating === "number" && !isNaN(rating) ? rating : 0;
  const sizeClass = { sm: "w-3 h-3", md: "w-4 h-4", lg: "w-5 h-5" }[size];
  const stars = Array.from({ length: max }, (_, i) => {
    const filled = i + 1 <= safeRating;
    const halfFilled = !filled && i + 0.5 <= safeRating;
    return { filled, halfFilled };
  });

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {stars.map((s, i) => (
          <svg key={i} className={`${sizeClass} ${s.filled ? "text-yellow-400" : s.halfFilled ? "text-yellow-300" : "text-gray-200"}`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 font-medium">
          {safeRating.toFixed(1)}
          {count !== undefined && <span className="text-gray-400 ml-1">({count})</span>}
        </span>
      )}
    </div>
  );
}
