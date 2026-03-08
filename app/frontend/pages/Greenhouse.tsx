import { Link } from "react-router";
import { ArrowRight, Building2, CheckCircle2, FileSignature, Sparkles, Wallet, Wrench } from "lucide-react";

const premiumFeatures = [
  {
    title: "Bill Tracker",
    description: "Split rent, utilities, and shared purchases with live status on who paid and what is due next.",
    icon: Wallet,
  },
  {
    title: "Roommate Agreement Builder",
    description: "Create a clear agreement for quiet hours, guests, cleaning, and shared expenses in a guided flow.",
    icon: FileSignature,
  },
  {
    title: "Maintenance Support",
    description: "File repair issues, attach photos, and track updates so everyone in the house sees progress.",
    icon: Wrench,
  },
  {
    title: "Landlord Contact Hub",
    description: "Keep lease contacts and communication details in one place so roommates can reach out fast.",
    icon: Building2,
  },
];

export function GreenhousePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-100/40">
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 shadow-xl shadow-emerald-100/70">
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" />
              Greenhouse Premium
            </p>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-emerald-950 sm:text-4xl">
              Keep your home running smoothly, not just matched.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-700 sm:text-base">
              Greenhouse is the premium plan for students who want less roommate stress after move-in. Track bills, lock in
              agreements, and handle maintenance and landlord communication from one dashboard.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {premiumFeatures.map((feature) => (
                <article key={feature.title} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
                      <feature.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-emerald-900">{feature.title}</h2>
                      <p className="mt-1 text-xs leading-relaxed text-emerald-800/90">{feature.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="rounded-3xl border border-emerald-300 bg-emerald-900 p-7 text-emerald-50 shadow-xl shadow-emerald-400/20">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">Student Plan</p>
            <p className="mt-3 text-4xl font-black tracking-tight">$8</p>
            <p className="text-sm text-emerald-100/90">per month, billed monthly</p>

            <ul className="mt-5 space-y-2.5 text-sm text-emerald-100">
              <li className="inline-flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                Shared bill calendar and reminders
              </li>
              <li className="inline-flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                Guided roommate agreement template
              </li>
              <li className="inline-flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                Maintenance request tracking
              </li>
              <li className="inline-flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-200" />
                Landlord contact shortcuts
              </li>
            </ul>

            <button
              type="button"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
            >
              Join Greenhouse
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              to="/greenhouse/preview"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-emerald-700 bg-emerald-800/40 px-4 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-500 hover:bg-emerald-800"
            >
              Preview Greenhouse
            </Link>

            <Link
              to="/roommates"
              className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-emerald-700 px-4 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-500 hover:bg-emerald-800"
            >
              Back to matches
            </Link>
          </aside>
        </div>
      </section>
    </div>
  );
}
