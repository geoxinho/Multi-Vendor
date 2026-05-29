export default function LoadingSpinner({ size = "md", className = "" }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const sizeClass = { sm: "w-4 h-4 border-2", md: "w-8 h-8 border-3", lg: "w-12 h-12 border-4" }[size];
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClass} rounded-full border-green-200 border-t-green-600 animate-spin`} />
    </div>
  );
}
