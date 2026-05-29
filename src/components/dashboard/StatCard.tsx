interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
  color?: "green" | "gold" | "blue" | "red";
}

const colorMap = {
  green: { bg: "bg-green-50", icon: "text-green-600", border: "border-green-100" },
  gold:  { bg: "bg-yellow-50", icon: "text-yellow-600", border: "border-yellow-100" },
  blue:  { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-100" },
  red:   { bg: "bg-red-50", icon: "text-red-600", border: "border-red-100" },
};

export default function StatCard({ label, value, icon, trend, trendUp, color = "green" }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 flex items-start justify-between`}>
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
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
