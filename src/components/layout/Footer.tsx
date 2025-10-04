"use client";

import Link from "next/link";

export function Footer() {
	return (
		<footer className="w-full border-t mt-12">
			<div className="mx-auto max-w-6xl px-4 py-8 text-sm text-black/70 dark:text-white/70 flex flex-col sm:flex-row items-center justify-between gap-4">
				<p>&copy; {new Date().getFullYear()} Community Friends</p>
				<nav className="flex gap-4">
					<Link href="/#features" className="hover:underline">Features</Link>
					<Link href="/#faq" className="hover:underline">FAQ</Link>
					<Link href="/signup" className="hover:underline">Get Started</Link>
				</nav>
			</div>
		</footer>
	);
}


