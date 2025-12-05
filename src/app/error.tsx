"use client";

import { ErrorFallback } from "@/components/ui/ErrorFallback";

export default function Error({
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
        title="Something went wrong"
        message="We encountered an unexpected error. Please try again or return home."
      />
    </main>
  );
}

