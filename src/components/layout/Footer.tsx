"use client";

import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-white/60 bg-white/75 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 text-sm text-ink-500 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-base font-semibold text-ink-900">Community Friends</p>
          <p className="text-xs text-ink-500">
            &copy; {new Date().getFullYear()} Weekly, high-intent friend introductions.
          </p>
        </div>
        <nav className="flex flex-wrap items-center gap-4">
          <Link href="/#features" className="text-sm font-medium text-ink-500 transition hover:text-brand-600">
            Features
          </Link>
          <Link href="/#faq" className="text-sm font-medium text-ink-500 transition hover:text-brand-600">
            FAQ
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full border border-brand-200 bg-brand-50/70 px-4 py-2 text-sm font-semibold text-brand-700 shadow-[0_10px_30px_rgba(212,85,0,0.10)] transition hover:-translate-y-0.5 hover:bg-brand-100"
          >
            Get started
          </Link>
        </nav>
      </div>
    </footer>
  );
}


