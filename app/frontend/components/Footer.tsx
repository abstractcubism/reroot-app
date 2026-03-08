import { Link } from "react-router";
import rerootLogo from "../assets/rerootlogo.svg";

const quickLinks = [
  { to: "/", label: "Home" },
  { to: "/greenhouse", label: "Greenhouse Premium" },
  { to: "/listings", label: "Find Housing" },
  { to: "/roommates", label: "Find New Roots" },
  { to: "/post-listing", label: "List Your Room" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-emerald-100 bg-gradient-to-r from-emerald-950 via-emerald-900 to-green-900 text-emerald-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="inline-flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-black/5">
              <img src={rerootLogo} alt="Reroot logo" className="h-8 w-8 object-contain" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">About Reroot</p>
              <p className="text-sm text-emerald-100/90">Start fresh. Put down new roots.</p>
            </div>
          </div>

          <p className="mt-4 max-w-xl text-sm text-emerald-100/90">
            reroot lets students match their way, whether it’s the right roommate, the right home, or both, powered by adaptive AI.
          </p>
        </div>

        <div className="grid gap-2 sm:justify-self-end">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-200">Quick Links</p>
          <div className="grid gap-1">
            {quickLinks.map((item) => (
              <Link key={item.to} to={item.to} className="text-sm text-emerald-100/90 transition-colors hover:text-white">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-emerald-800/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-emerald-100/80 sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>Created: 2026 | Stack: TypeScript, Flask, Python, OpenAI</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="rounded-md border border-emerald-700 px-2 py-1 text-emerald-100 transition-colors hover:border-emerald-500 hover:text-white"
            >
              Back to top
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
