"use client";

import { useMemo, useState } from "react";
import type { Match } from "@/hooks/useMatches";
import { MatchCard } from "./MatchCard";

interface MatchListProps {
  matches: Match[];
}

type SortType = 'recent' | 'compatibility';

export function MatchList({ matches }: MatchListProps) {
  const [sort, setSort] = useState<SortType>('recent');

  const sortedMatches = useMemo(() => {
    const result = [...matches];

    // Apply sort
    if (sort === 'compatibility') {
      result.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));
    } else {
      result.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    }

    return result;
  }, [matches, sort]);

  // Group by week
  const matchesByWeek = useMemo(() => {
    const groups = new Map<string, Match[]>();
    
    sortedMatches.forEach(match => {
      const week = match.match_week || 'Unknown';
      if (!groups.has(week)) {
        groups.set(week, []);
      }
      groups.get(week)!.push(match);
    });

    // Sort weeks (most recent first)
    return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [sortedMatches]);

  const currentWeek = getCurrentWeekString();

  if (matches.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-8">
      {/* Sort control */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-ink-500">Sort by:</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortType)}
          className="rounded-lg border-0 bg-white py-2 pl-3 pr-8 text-sm font-medium text-ink-700 shadow-sm ring-1 ring-ink-200 focus:ring-2 focus:ring-brand-500"
        >
          <option value="recent">Most Recent</option>
          <option value="compatibility">Compatibility</option>
        </select>
      </div>

      {/* Matches by week */}
      {matchesByWeek.map(([week, weekMatches]) => (
        <WeekSection 
          key={week} 
          week={week} 
          matches={weekMatches} 
          isCurrentWeek={week === currentWeek}
        />
      ))}
    </div>
  );
}

interface WeekSectionProps {
  week: string;
  matches: Match[];
  isCurrentWeek: boolean;
}

function WeekSection({ week, matches, isCurrentWeek }: WeekSectionProps) {
  const weekLabel = formatWeekLabel(week, isCurrentWeek);

  return (
    <section className="space-y-4">
      {/* Week header */}
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          isCurrentWeek 
            ? 'bg-gradient-to-br from-brand-500 to-peach-400' 
            : 'bg-ink-100'
        }`}>
          <svg 
            className={`h-5 w-5 ${isCurrentWeek ? 'text-white' : 'text-ink-500'}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="font-heading text-lg font-semibold text-ink-900">
            {weekLabel}
          </h3>
          <p className="text-sm text-ink-500">
            {matches.length} match{matches.length !== 1 ? 'es' : ''}
          </p>
        </div>
      </div>

      {/* Match cards grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map(match => (
          <MatchCard 
            key={match.id} 
            match={match}
          />
        ))}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-100 to-peach-100">
        <svg className="h-12 w-12 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </div>
      <h3 className="font-heading text-xl font-semibold text-ink-900">
        No matches yet
      </h3>
      <p className="mt-2 max-w-sm text-ink-500">
        New matches are generated every Monday. Make sure your profile is complete to start receiving matches!
      </p>
      <div className="mt-6 flex gap-3">
        <a
          href="/profile"
          className="btn-primary"
        >
          Complete Profile
        </a>
      </div>
    </div>
  );
}

function formatWeekLabel(weekString: string, isCurrentWeek: boolean): string {
  if (isCurrentWeek) {
    return "This Week's Matches";
  }

  // Parse "2025-W49" format
  const match = weekString.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return weekString;
  
  const [, year, week] = match;
  const weekNum = parseInt(week, 10);
  
  // Get first day of the week
  const jan1 = new Date(parseInt(year, 10), 0, 1);
  const daysOffset = (weekNum - 1) * 7 - jan1.getDay() + 1;
  const weekStart = new Date(parseInt(year, 10), 0, 1 + daysOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const formatOptions: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString('en-US', formatOptions);
  const endStr = weekEnd.toLocaleDateString('en-US', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

function getCurrentWeekString(): string {
  const date = new Date();
  const year = date.getFullYear();
  const startOfYear = new Date(year, 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${year}-W${weekNumber.toString().padStart(2, '0')}`;
}

