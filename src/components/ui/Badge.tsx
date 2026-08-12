interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-[#F0FDF4] text-[#A4860E]",
  warning: "bg-[#FFFBEB] text-[#D97706]",
  danger:  "bg-[#FEF2F2] text-[#DC2626]",
  info:    "bg-[#fdf8e8] text-[#A4860E]",
  neutral: "bg-[#F5F5F5] text-[#6B6B6B]",
  gold:    "bg-[#FFFBEB] text-[#D97706]",
};

export default function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span className={`badge ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
