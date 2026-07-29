interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-[#F0FDF4] text-[#16A34A]",
  warning: "bg-[#FFFBEB] text-[#D97706]",
  danger:  "bg-[#FEF2F2] text-[#DC2626]",
  info:    "bg-[#EFF6FF] text-[#2563EB]",
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
