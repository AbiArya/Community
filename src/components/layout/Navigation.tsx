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
		const base = "hover:underline";
		const isActiveRoute = href === pathname;
		const isActiveHome = href === "/" && pathname === "/" && !hash;
		const isActiveHash = pathname === "/" && href.startsWith("/#") && hash === href.slice(1);
		const isActiveProfile = href === "/profile" && pathname.startsWith("/profile");
		const isActiveSettings = href === "/settings" && pathname.startsWith("/settings");
		const active = isActiveRoute || isActiveHome || isActiveHash || isActiveProfile || isActiveSettings;
		return active ? `${base} underline` : base;
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

	return (
		<header className="w-full border-b">
			<div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
				<Link href="/" className="font-semibold">Community Friends</Link>
				<nav className="hidden sm:flex gap-4 text-sm">
					<Link href="/" className={linkClass("/")}>Home</Link>
					<Link href="/#features" className={linkClass("/#features")}>Features</Link>
					<Link href="/#faq" className={linkClass("/#faq")}>FAQ</Link>
					{isLoading ? null : session ? (
						<>
							<Link href="/profile" className={linkClass("/profile")}>Profile</Link>
							<Link href="/settings" className={linkClass("/settings")}>Settings</Link>
							<button onClick={handleLogout} className="hover:underline" aria-label="Log out">
								Logout
							</button>
						</>
					) : (
						<>
							<Link href="/login" className="hover:underline">Login</Link>
							<Link href="/signup" className="hover:underline">Signup</Link>
						</>
					)}
				</nav>

				<button
					ref={menuButtonRef}
					className="sm:hidden text-sm underline"
					aria-expanded={menuOpen}
					aria-controls="mobile-menu"
					onClick={() => setMenuOpen((v) => !v)}
				>
					Menu
				</button>
			</div>
			{menuOpen && (
				<div id="mobile-menu" className="sm:hidden border-t">
					<div className="px-4 py-4 flex flex-col gap-3 text-sm">
						<Link ref={firstLinkRef} href="/" className={linkClass("/")} onClick={() => setMenuOpen(false)}>Home</Link>
						<Link href="/#features" className={linkClass("/#features")} onClick={() => setMenuOpen(false)}>Features</Link>
						<Link href="/#faq" className={linkClass("/#faq")} onClick={() => setMenuOpen(false)}>FAQ</Link>
						{isLoading ? null : session ? (
							<>
								<Link href="/profile" className={linkClass("/profile")} onClick={() => setMenuOpen(false)}>Profile</Link>
								<Link href="/settings" className={linkClass("/settings")} onClick={() => setMenuOpen(false)}>Settings</Link>
								<button onClick={() => { setMenuOpen(false); handleLogout(); }} className="text-left hover:underline" aria-label="Log out">
									Logout
								</button>
							</>
						) : (
							<>
								<Link href="/login" className="hover:underline" onClick={() => setMenuOpen(false)}>Login</Link>
								<Link href="/signup" className="hover:underline" onClick={() => setMenuOpen(false)}>Signup</Link>
							</>
						)}
					</div>
				</div>
			)}
		</header>
	);
}


