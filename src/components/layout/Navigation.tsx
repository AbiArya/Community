"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthSession } from "@/hooks/useAuthSession";
import { clearAuthSession } from "@/lib/supabase/client";

export function Navigation() {
  const router = useRouter();
  const { session, isLoading } = useAuthSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const firstLinkRef = useRef<HTMLAnchorElement | null>(null);

  const pathname = usePathname();
  const [hash, setHash] = useState<string>("");

  useEffect(() => {
    setHash(typeof window !== "undefined" ? window.location.hash : "");
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  function linkClass(href: string) {
    const base =
      "text-sm font-medium text-ink-500 transition hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";
    const isActiveRoute = href === pathname;
    const isActiveHome = href === "/" && pathname === "/" && !hash;
    const isActiveHash = pathname === "/" && href.startsWith("/#") && hash === href.slice(1);
    const isActiveProfile = href === "/profile" && pathname.startsWith("/profile");
    const isActiveSettings = href === "/settings" && pathname.startsWith("/settings");
    const active = isActiveRoute || isActiveHome || isActiveHash || isActiveProfile || isActiveSettings;
    return active ? `${base} text-ink-900` : base;
  }

  async function handleLogout() {
    await clearAuthSession();
    router.push("/");
  }

  useEffect(() => {
    if (menuOpen) {
      firstLinkRef.current?.focus();
    } else {
      menuButtonRef.current?.focus();
    }
  }, [menuOpen]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!menuOpen) return;
      if (e.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const authLinks = isLoading ? null : session ? (
    <>
      <Link href="/profile" className={linkClass("/profile")}>
        Profile
      </Link>
      <Link href="/settings" className={linkClass("/settings")}>
        Settings
      </Link>
      <button
        onClick={handleLogout}
        className="text-sm font-medium text-ink-500 transition hover:text-brand-600"
        aria-label="Log out"
      >
        Logout
      </button>
    </>
  ) : (
    <>
      <Link href="/login" className={linkClass("/login")}>
        Login
      </Link>
      <Link
        href="/signup"
        className="inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_25px_45px_-20px_rgba(124,58,237,0.65)] transition hover:-translate-y-0.5 hover:bg-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-200 focus-visible:ring-offset-2"
      >
        Get started
      </Link>
    </>
  );

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/50 bg-white/75 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-base font-semibold tracking-tight text-ink-900 transition hover:text-brand-600"
        >
          Community Friends
        </Link>
        <nav className="hidden items-center gap-5 sm:flex">
          <Link href="/" className={linkClass("/")}>
            Home
          </Link>
          <Link href="/#features" className={linkClass("/#features")}>
            Features
          </Link>
          <Link href="/#faq" className={linkClass("/#faq")}>
            FAQ
          </Link>
          {authLinks}
        </nav>

        <button
          ref={menuButtonRef}
          className="inline-flex items-center rounded-full border border-white/70 bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-ink-600 shadow-[0_10px_30px_rgba(17,20,35,0.08)] transition hover:text-brand-600 sm:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
        >
          Menu
        </button>
      </div>
      {menuOpen && (
        <div
          id="mobile-menu"
          className="sm:hidden border-t border-white/50 bg-white/90 px-4 pb-6 pt-2 shadow-[0_25px_55px_rgba(17,20,35,0.12)]"
        >
          <div className="flex flex-col gap-3 text-sm">
            <Link ref={firstLinkRef} href="/" className={linkClass("/")} onClick={() => setMenuOpen(false)}>
              Home
            </Link>
            <Link href="/#features" className={linkClass("/#features")} onClick={() => setMenuOpen(false)}>
              Features
            </Link>
            <Link href="/#faq" className={linkClass("/#faq")} onClick={() => setMenuOpen(false)}>
              FAQ
            </Link>
            {isLoading ? null : session ? (
              <>
                <Link href="/profile" className={linkClass("/profile")} onClick={() => setMenuOpen(false)}>
                  Profile
                </Link>
                <Link href="/settings" className={linkClass("/settings")} onClick={() => setMenuOpen(false)}>
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="text-left text-sm font-medium text-ink-500 transition hover:text-brand-600"
                  aria-label="Log out"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className={linkClass("/login")} onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_25px_45px_-20px_rgba(124,58,237,0.65)] transition hover:-translate-y-0.5 hover:bg-brand-500"
                  onClick={() => setMenuOpen(false)}
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


