"use client";

interface StatItem {
  label: string;
  value: number;
  color?: string;
}

export function QuickStats({ stats }: { stats: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white border border-border rounded-lg p-4">
          <div className={`text-2xl font-semibold ${stat.color || "text-text-primary"}`}>{stat.value}</div>
          <div className="text-xs text-text-secondary mt-1">{stat.label}</div>
        </div>
      ))}
    </div>
  );
}
