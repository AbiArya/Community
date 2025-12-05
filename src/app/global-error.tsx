"use client";

/**
 * Global error boundary for root layout errors.
 * This catches errors that happen in the root layout itself.
 * Must include its own <html> and <body> tags since it replaces the root layout.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fdf7f0]">
        <div className="flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-md text-center">
            {/* Error icon */}
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100">
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h1 className="mb-2 text-xl font-semibold text-gray-900">
              Application Error
            </h1>

            {/* Message */}
            <p className="mb-6 text-sm text-gray-600">
              A critical error occurred. Please refresh the page or try again later.
            </p>

            {/* Error digest for debugging */}
            {error?.digest && process.env.NODE_ENV === "development" && (
              <p className="mb-4 rounded-lg bg-gray-100 p-2 font-mono text-xs text-gray-500">
                Error ID: {error.digest}
              </p>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center rounded-full bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-purple-500"
              >
                Try Again
              </button>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- global-error replaces root layout, Link won't work */}
              <a
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Go Home
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

