import React from "react";

export default function StatCard({ icon: Icon, label, value, sublabel, color = "emerald", loading }) {
  const colorMap = {
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/25",
    amber: "from-amber-500 to-orange-600 shadow-amber-500/25",
    rose: "from-rose-500 to-pink-600 shadow-rose-500/25",
    violet: "from-violet-500 to-purple-600 shadow-violet-500/25",
  };

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          {loading ? (
            <div className="mt-2 h-7 w-24 animate-pulse rounded-lg bg-muted" />
          ) : (
            <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-foreground">{value}</p>
          )}
          {sublabel && <p className="mt-1 text-xs text-muted-foreground">{sublabel}</p>}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[color]} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}