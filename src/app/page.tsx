import Link from "next/link";

const features = [
  {
    title: "Hobby-first matching",
    description: "Rank the interests that matter most and we prioritize people who share them.",
    meta: "Signal fit quickly",
  },
  {
    title: "Local-first intros",
    description: "PostGIS-backed distance filters keep recommendations within your preferred radius.",
    meta: "Stay close to home",
  },
  {
    title: "Quality over quantity",
    description: "Two curated intros each Monday keeps the experience calm, intentional, and exciting.",
    meta: "Reduce swipe fatigue",
  },
];

const rituals = [
  { title: "Weekly drops", detail: "New matches arrive every Monday morning." },
  { title: "Context-rich cards", detail: "Photos, top hobbies, and short bios at a glance." },
  { title: "Thoughtful follow-up", detail: "Track when each person views or accepts an intro." },
];

const faq = [
  {
    question: "How do matches work?",
    answer: "We score similarity using your ranked hobbies plus proximity. You get two intros per week—no infinite queues.",
  },
  {
    question: "Is the product free?",
    answer: "Yes for the MVP. We may add premium perks (more matches, deeper insights) after validating delight.",
  },
  {
    question: "What do I need to sign up?",
    answer: "Just your email. Supabase Auth sends a secure magic link—no passwords, no friction.",
  },
  {
    question: "Can I edit my profile later?",
    answer: "You can rearrange hobbies, tweak preferences, and refresh photos at any time from settings.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex max-w-6xl flex-col gap-20 px-4 pb-24 pt-16">
      <section className="glass-panel grid gap-12 p-10 md:grid-cols-2">
        <div className="space-y-6">
          <span className="eyebrow-pill border border-brand-300 bg-brand-100 text-brand-600">Weekly friend drops</span>
          <h1 className="font-heading text-4xl leading-tight text-ink-900 sm:text-5xl">
            Make real friends through hobbies, not endless swiping.
          </h1>
          <p className="text-lg text-ink-600">
            Community Friends introduces you to two thoughtful matches every week—people nearby who actually share your
            favorite ways to spend time.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_25px_60px_-25px_rgba(255,82,50,0.50)] transition hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Start free profile
            </Link>
            <Link
              href="#features"
              className="inline-flex items-center justify-center rounded-full border border-teal-300 bg-teal-50/80 px-6 py-3 text-sm font-semibold text-teal-700 transition hover:-translate-y-0.5 hover:bg-teal-100 hover:text-teal-800"
            >
              Explore the product
            </Link>
          </div>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_15px_35px_rgba(17,20,35,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Matches Weekly</p>
              <p className="text-2xl font-semibold text-ink-900">2 curated</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_15px_35px_rgba(17,20,35,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Setup Time</p>
              <p className="text-2xl font-semibold text-ink-900">&lt;10 min</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white/70 p-4 shadow-[0_15px_35px_rgba(17,20,35,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">Local Radius</p>
              <p className="text-2xl font-semibold text-ink-900">Up to 50 mi</p>
            </div>
          </div>
        </div>
        <div className="rounded-[32px] border border-teal-200/50 bg-gradient-to-br from-brand-50 via-white to-teal-50 p-8 shadow-[0_30px_80px_-45px_rgba(45,36,24,0.35)]">
          <h2 className="mb-6 font-heading text-xl text-ink-900">Your weekly flow</h2>
          <div className="space-y-5 text-sm text-ink-600">
            <div className="rounded-2xl border border-brand-200 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-500">Monday</p>
              <p className="mt-2 text-base text-ink-900">Matches drop with bios, hobbies, and recommended prompts.</p>
            </div>
            <div className="rounded-2xl border border-peach-200 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-peach-500">Midweek</p>
              <p className="mt-2 text-base text-ink-900">Review profiles, mark interest, and unlock contact details.</p>
            </div>
            <div className="rounded-2xl border border-teal-200 bg-white/90 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-600">Weekend</p>
              <p className="mt-2 text-base text-ink-900">Meet up, record feedback, and refine future preferences.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="rounded-[36px] border border-white/60 bg-white/85 px-8 py-12 shadow-[0_45px_120px_-60px_rgba(17,20,35,0.45)]">
        <div className="space-y-8">
          <div className="space-y-3">
            <span className="eyebrow-pill border border-teal-300 bg-teal-100 text-teal-700">Product pillars</span>
            <h2 className="font-heading text-3xl text-ink-900">Designed to feel calm, intentional, and on-theme.</h2>
            <p className="max-w-2xl text-base text-ink-600">
              Every surface follows the same palette, spacing scale, and typography so new features stay consistent.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="flex h-full flex-col rounded-3xl border border-white/60 bg-sand-50/70 p-6 shadow-[0_30px_70px_-55px_rgba(17,20,35,0.65)]"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-500">{feature.meta}</p>
                <h3 className="mt-3 text-xl font-semibold text-ink-900">{feature.title}</h3>
                <p className="mt-3 text-sm text-ink-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-10 grid gap-4 border-t border-white/60 pt-8 sm:grid-cols-3">
          {rituals.map((ritual) => (
            <div key={ritual.title} className="rounded-2xl border border-white/60 bg-white/80 p-4">
              <p className="text-sm font-semibold text-ink-900">{ritual.title}</p>
              <p className="text-sm text-ink-600">{ritual.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="testimonials" className="rounded-[36px] border border-teal-200/60 bg-gradient-to-br from-peach-50 via-white to-teal-50 px-8 py-12 shadow-[0_45px_120px_-60px_rgba(45,36,24,0.40)]">
        <div className="space-y-4">
          <span className="eyebrow-pill border border-peach-300 bg-peach-100 text-peach-600">Stories soon</span>
          <h2 className="font-heading text-3xl text-ink-900">Social proof arrives with our first beta cohort.</h2>
          <p className="max-w-3xl text-base text-ink-600">
            We&apos;re collecting the first wave of community stories now. Expect tangible testimonials—photos, hobbies,
            and outcomes—once pilots wrap. Until then, we keep the placeholder honest.
          </p>
          <div className="rounded-3xl border border-white/70 bg-white/80 p-6 text-sm text-ink-600">
            Want to be featured? Share feedback after your first match cycle and we&apos;ll reach out.
          </div>
        </div>
      </section>

      <section id="faq" className="rounded-[36px] border border-white/60 bg-white/85 px-8 py-12 shadow-[0_45px_120px_-60px_rgba(17,20,35,0.45)]">
        <div className="space-y-3">
          <span className="eyebrow-pill border border-sand-200 bg-sand-50/70 text-ink-600">FAQ</span>
          <h2 className="font-heading text-3xl text-ink-900">Everything you need to know before joining.</h2>
        </div>
        <div className="mt-8 space-y-6">
          {faq.map((item) => (
            <div key={item.question} className="rounded-3xl border border-white/70 bg-white/80 p-5">
              <p className="text-sm font-semibold text-ink-900">{item.question}</p>
              <p className="mt-2 text-sm text-ink-600">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[36px] border border-brand-200/60 bg-gradient-to-br from-brand-100/80 via-white to-teal-50/70 px-8 py-12 text-center shadow-[0_45px_120px_-60px_rgba(255,82,50,0.25)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-600">Ready when you are</p>
        <h2 className="mt-4 font-heading text-3xl text-ink-900">Your next friend is one profile away.</h2>
        <p className="mt-3 text-base text-ink-700">
          Set up your profile now—it takes less than 10 minutes—and start getting curated matches every Monday.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_25px_60px_-25px_rgba(255,82,50,0.50)] transition hover:-translate-y-0.5 hover:bg-brand-600"
          >
            Build my profile
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-teal-300 bg-teal-50/80 px-6 py-3 text-sm font-semibold text-teal-700 transition hover:-translate-y-0.5 hover:bg-teal-100"
          >
            I already have access
          </Link>
        </div>
      </section>
    </main>
  );
}
