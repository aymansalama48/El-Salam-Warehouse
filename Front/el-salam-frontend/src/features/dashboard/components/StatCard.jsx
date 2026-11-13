export function StatCard({ title, value, change, changeType = "neutral", icon: Icon, color = "blue" }) {
  const colorStyles = {
    blue: {
      bg: "bg-blue-50 text-blue-600",
      accent: "border-blue-500",
    },
    emerald: {
      bg: "bg-emerald-50 text-emerald-600",
      accent: "border-emerald-500",
    },
    amber: {
      bg: "bg-amber-50 text-amber-600",
      accent: "border-amber-500",
    },
    violet: {
      bg: "bg-violet-50 text-violet-600",
      accent: "border-violet-500",
    },
    rose: {
      bg: "bg-rose-50 text-rose-600",
      accent: "border-rose-500",
    },
  };

  const selectedColor = colorStyles[color] || colorStyles.blue;

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${selectedColor.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{value}</h3>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              changeType === "positive"
                ? "bg-emerald-50 text-emerald-700"
                : changeType === "negative"
                ? "bg-rose-50 text-rose-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </div>
  );
}
