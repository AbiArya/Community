"use client";

import type { MatchStats as MatchStatsType } from "@/hooks/useMatches";

interface MatchStatsProps {
  stats: MatchStatsType;
}

export function MatchStats({ stats }: MatchStatsProps) {
  const weeklyData = Object.entries(stats.weeklyBreakdown)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8);

  const maxWeeklyMatches = Math.max(...weeklyData.map(([, count]) => count), 1);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total matches */}
      <StatCard
        icon={
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
        iconBg="from-brand-400 to-brand-600"
        label="Total Matches"
        value={stats.totalMatches}
        trend={stats.thisWeekMatches > 0 ? `+${stats.thisWeekMatches} this week` : undefined}
      />

      {/* This week matches */}
      <StatCard
        icon={
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        iconBg="from-peach-400 to-peach-500"
        label="This Week"
        value={stats.thisWeekMatches}
        subtext="New connections"
      />

      {/* Average compatibility */}
      <StatCard
        icon={
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        }
        iconBg="from-pink-400 to-rose-500"
        label="Avg. Compatibility"
        value={`${stats.averageScore}%`}
        subtext={getCompatibilityLabel(stats.averageScore)}
      />

      {/* Weekly activity chart */}
      {weeklyData.length > 1 && (
        <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-white/60 bg-white p-6 shadow-[0_10px_40px_-15px_rgba(17,20,35,0.1)]">
          <h3 className="mb-4 font-heading text-lg font-semibold text-ink-900">
            Weekly Matches
          </h3>
          <div className="flex items-end gap-2 h-32">
            {weeklyData.map(([week, count]) => {
              const height = (count / maxWeeklyMatches) * 100;
              const isCurrentWeek = week === getCurrentWeekString();
              return (
                <div key={week} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs font-semibold text-ink-700">{count}</span>
                  <div 
                    className={`w-full rounded-t-lg transition-all ${
                      isCurrentWeek 
                        ? 'bg-gradient-to-t from-brand-500 to-brand-400' 
                        : 'bg-gradient-to-t from-ink-200 to-ink-100'
                    }`}
                    style={{ height: `${Math.max(height, 8)}%` }}
                  />
                  <span className="text-[10px] text-ink-400 truncate max-w-full">
                    {formatWeekShort(week)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string | number;
  trend?: string;
  subtext?: string;
  highlight?: boolean;
}

function StatCard({ icon, iconBg, label, value, trend, subtext, highlight }: StatCardProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-[0_10px_40px_-15px_rgba(17,20,35,0.1)] transition-all hover:shadow-[0_15px_50px_-15px_rgba(17,20,35,0.15)] ${
      highlight ? 'border-brand-200 ring-2 ring-brand-100' : 'border-white/60'
    }`}>
      {/* Background decoration */}
      <div className={`absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br ${iconBg} opacity-10`} />
      
      <div className="relative">
        <div className={`mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${iconBg} text-white shadow-lg`}>
          {icon}
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-medium text-ink-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="font-heading text-3xl font-bold text-ink-900">{value}</p>
            {trend && (
              <span className="text-xs font-semibold text-success-600">{trend}</span>
            )}
          </div>
          {subtext && (
            <p className="text-xs text-ink-400">{subtext}</p>
          )}
        </div>
      </div>

      {/* Highlight indicator */}
      {highlight && (
        <div className="absolute right-3 top-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75"></span>
            <span className="relative inline-flex h-3 w-3 rounded-full bg-brand-500"></span>
          </span>
        </div>
      )}
    </div>
  );
}

function getCompatibilityLabel(score: number): string {
  if (score >= 80) return "Excellent match quality!";
  if (score >= 60) return "Great matches";
  if (score >= 40) return "Good compatibility";
  if (score >= 20) return "Some common interests";
  return "Building your network";
}

function formatWeekShort(weekString: string): string {
  const match = weekString.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekString;
  
  const [, , week] = match;
  return `W${parseInt(week, 10)}`;
}

function getCurrentWeekString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

