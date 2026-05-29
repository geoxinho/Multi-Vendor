interface BadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "gold";
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  danger:  "bg-red-100 text-red-700",
  info:    "bg-blue-100 text-blue-700",
  neutral: "bg-gray-100 text-gray-700",
  gold:    "bg-yellow-50 text-yellow-700 border border-yellow-200",
};

export default function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span className={`badge ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
