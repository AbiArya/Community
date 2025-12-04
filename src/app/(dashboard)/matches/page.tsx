"use client";

import { Suspense } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { MatchesProvider, useMatches } from "@/hooks/useMatches";
import { MatchList } from "@/components/matches/MatchList";
import { MatchStats } from "@/components/matches/MatchStats";

export default function MatchesPage() {
  return (
    <Suspense>
      <AuthGuard>
        <MatchesProvider>
          <MatchesContent />
        </MatchesProvider>
      </AuthGuard>
    </Suspense>
  );
}

function MatchesContent() {
  const { matches, stats, isLoading, error, refresh } = useMatches();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl p-6">
        <div className="rounded-2xl border border-error-200 bg-error-50 p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-error-100">
            <svg className="h-6 w-6 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="mb-2 font-heading text-lg font-semibold text-error-900">
            Unable to load matches
          </h3>
          <p className="mb-4 text-sm text-error-700">{error}</p>
          <button onClick={refresh} className="btn-primary">
            Try Again
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-6">
      {/* Page header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-peach-400 shadow-lg shadow-brand-500/25">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold text-ink-900">
              Your Matches
            </h1>
            <p className="text-ink-500">
              Discover people who share your interests
            </p>
          </div>
        </div>

        {/* Refresh button */}
        <div className="flex justify-end">
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-700"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </header>

      {/* Stats dashboard */}
      <section aria-labelledby="stats-heading">
        <h2 id="stats-heading" className="sr-only">Match Statistics</h2>
        <MatchStats stats={stats} />
      </section>

      {/* Matches list */}
      <section aria-labelledby="matches-heading">
        <h2 id="matches-heading" className="sr-only">Your Matches</h2>
        <MatchList matches={matches} />
      </section>

      {/* Info box */}
      <aside className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-peach-50 p-6">
        <div className="flex gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand-100">
            <svg className="h-5 w-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-heading font-semibold text-ink-900">
              How matching works
            </h3>
            <p className="mt-1 text-sm text-ink-600">
              Every Monday, we try to generate at least 1 match for you based on shared hobbies, location, and activity. 
              The compatibility score shows how well your interests align. Click on a match card to view their 
              full profile and start a conversation!
            </p>
          </div>
        </div>
      </aside>
    </main>
  );
}

function LoadingSkeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl space-y-8 p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-ink-200" />
        <div className="space-y-2">
          <div className="h-6 w-40 animate-pulse rounded bg-ink-200" />
          <div className="h-4 w-60 animate-pulse rounded bg-ink-200" />
        </div>
      </div>

      {/* Stats skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/60 bg-white p-5">
            <div className="mb-3 h-12 w-12 animate-pulse rounded-xl bg-ink-200" />
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-ink-200" />
              <div className="h-8 w-16 animate-pulse rounded bg-ink-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Match cards skeleton */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 animate-pulse rounded-xl bg-ink-200" />
          <div className="space-y-1">
            <div className="h-5 w-40 animate-pulse rounded bg-ink-200" />
            <div className="h-4 w-24 animate-pulse rounded bg-ink-200" />
          </div>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-3xl border border-white/60 bg-white overflow-hidden">
              <div className="aspect-[4/5] animate-pulse bg-ink-200" />
              <div className="p-5 space-y-3">
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-6 w-16 animate-pulse rounded-full bg-ink-200" />
                  ))}
                </div>
                <div className="h-4 w-full animate-pulse rounded bg-ink-200" />
                <div className="flex gap-3 pt-2">
                  <div className="h-10 flex-1 animate-pulse rounded-xl bg-ink-200" />
                  <div className="h-10 flex-1 animate-pulse rounded-xl bg-ink-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

