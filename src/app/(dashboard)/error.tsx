"use client";

import { ErrorFallback } from "@/components/ui/ErrorFallback";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <ErrorFallback
        error={error}
        reset={reset}
        title="Unable to load this page"
        message="Something went wrong loading this section. Please try again."
      />
    </main>
  );
}

