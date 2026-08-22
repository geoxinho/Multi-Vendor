interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: "green" | "gold" | "blue" | "red";
  subtitle?: string;
}

const colorMap = {
  green: { bg: "bg-[#fdf8e8]", icon: "text-[#A4860E]", border: "border-[#e8d48a]" },
  gold:  { bg: "bg-[#fdf8e8]", icon: "text-[#A4860E]", border: "border-[#e8d48a]" },
  blue:  { bg: "bg-[#fdf8e8]", icon: "text-[#A4860E]", border: "border-[#e8d48a]" },
  red:   { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
};

export default function StatCard({ label, value, icon, trend, trendUp, color = "green", subtitle }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 flex items-start justify-between`}>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && (
          <p className="text-[11px] text-gray-400 mt-0.5">{subtitle}</p>
        )}
        {trend && (
          <p className={`text-xs font-medium mt-1 ${trendUp ? "text-green-600" : "text-red-500"}`}>
            {trendUp ? "↑" : "↓"} {trend}
          </p>
        )}
      </div>
      <div className={`${c.bg} ${c.icon} p-3 rounded-xl`}>{icon}</div>
    </div>
  );
}
