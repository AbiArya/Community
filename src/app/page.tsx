import Link from "next/link";

export default function Home() {
  return (
    <main>
      <section className="w-full pt-16 pb-20 px-6 bg-white">
        <div className="mx-auto max-w-5xl grid md:grid-cols-2 items-center gap-8">
          <div className="space-y-5">
            <h1 className="text-4xl sm:text-6xl font-semibold tracking-tight">Make friends through shared hobbies</h1>
            <p className="text-lg text-black/70 dark:text-white/70">Get 2 curated matches every week based on the interests you care about most.</p>
            <div className="flex gap-3">
              <Link href="/signup" className="bg-black text-white rounded px-4 py-2 text-sm">Get started</Link>
              <Link href="#features" className="underline text-sm">Learn more</Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-xl border p-6">
              <p className="font-medium mb-2">Why it works</p>
              <ul className="list-disc pl-5 text-black/70 dark:text-white/70 space-y-1 text-sm">
                <li>Interest-first matching</li>
                <li>Local community focus</li>
                <li>Quality over quantity</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="w-full py-16 px-6">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Features</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <p className="font-medium">Quality matches</p>
              <p className="text-sm text-black/70 dark:text-white/70">2 curated matches weekly</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Interest-first</p>
              <p className="text-sm text-black/70 dark:text-white/70">Hobby compatibility</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="font-medium">Local focus</p>
              <p className="text-sm text-black/70 dark:text-white/70">Meet people nearby</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials placeholder per spec: display or keep lightweight placeholder until real content exists */}
      <section id="testimonials" className="w-full py-16 px-6 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">Testimonials</h2>
          <div className="rounded-lg border p-6 bg-white">
            <p className="text-sm text-black/70 dark:text-white/70">
              Social proof coming soon. We&apos;ll showcase real stories from our community here.
            </p>
          </div>
        </div>
      </section>

      <section id="faq" className="w-full py-16 px-6 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-6">FAQ</h2>
          <div className="space-y-4 text-sm">
            <div>
              <p className="font-medium">How do matches work?</p>
              <p className="text-black/70 dark:text-white/70">We recommend 2 people each week based on shared hobbies and location.</p>
            </div>
            <div>
              <p className="font-medium">Is it free?</p>
              <p className="text-black/70 dark:text-white/70">Yes for the MVP. We may introduce premium features later.</p>
            </div>
            <div>
              <p className="font-medium">How do I sign up?</p>
              <p className="text-black/70 dark:text-white/70">Use your email—no passwords. We’ll send you a magic link or OTP.</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
