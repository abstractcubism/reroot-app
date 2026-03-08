import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { Search, Users, PlusCircle, Menu, X, Sparkles } from "lucide-react";
import rutgersLogo from "../assets/rutgersLogo.svg";
import rerootLogo from "../assets/rerootlogo.svg";

const navLinks = [
  { to: "/listings", label: "Find Housing", icon: Search },
  { to: "/roommates", label: "Find New Roots", icon: Users },
  { to: "/post-listing", label: "List Your Room", icon: PlusCircle },
];

function RutgersBadge({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 ${
        compact ? "justify-center" : ""
      }`}
    >
      <img
        src={rutgersLogo}
        alt="Rutgers logo"
        className="h-5 w-5 object-contain"
      />
      {compact ? "Signed in to Rutgers" : "Signed in with Rutgers"}
    </span>
  );
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    const onScroll = () => {
      setIsFloating(window.scrollY > 84);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const navShellClasses = isFloating
    ? "fixed left-1/2 top-4 z-50 w-[min(95vw,66rem)] -translate-x-1/2 rounded-2xl border border-emerald-200/75 bg-white/88 shadow-xl shadow-emerald-200/45 backdrop-blur-xl supports-[backdrop-filter]:bg-white/76"
    : "sticky top-0 z-50 border-b border-emerald-100/80 bg-white/90 backdrop-blur";

  return (
    <div className="relative h-16">
      <nav className={navShellClasses} aria-label="Main navigation">
        <div className={`relative mx-auto flex w-full max-w-7xl items-center gap-4 px-4 sm:px-6 ${isFloating ? "h-14" : "h-16"}`}>
          <Link to="/" className="group inline-flex items-center gap-0.5">
            <span
              className={`grid place-items-center transition-transform group-hover:scale-105 ${
                isFloating ? "h-9 w-9 rounded-lg" : "h-10 w-10 rounded-xl"
              } drop-shadow-[0_4px_10px_rgba(5,150,105,0.35)]`}
            >
              <img
                src={rerootLogo}
                alt="Reroot logo"
                className={`${isFloating ? "h-7 w-7" : "h-8 w-8"} mx-auto block -translate-y-0.5 object-contain`}
              />
            </span>
            <span className={`${isFloating ? "text-base" : "text-lg"} font-semibold tracking-tight text-gray-900`}>
              <span className="text-gray-900">re</span>
              <span className="text-emerald-600">root</span>
            </span>
          </Link>

          <div className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-1 md:flex">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                aria-current={isActive(to) ? "page" : undefined}
                className={`inline-flex items-center rounded-full transition-all duration-300 ${
                  isFloating
                    ? isActive(to)
                      ? "gap-2 bg-emerald-600 px-3.5 py-2 text-white shadow-md shadow-emerald-300/30"
                      : "gap-2 bg-white/70 px-3 py-2 text-gray-700 hover:-translate-y-0.5 hover:bg-emerald-50 hover:text-emerald-700"
                    : isActive(to)
                      ? "gap-2 bg-emerald-100 px-4 py-2 text-emerald-800"
                      : "gap-2 px-4 py-2 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className={`${isFloating ? "text-xs" : "text-sm"}`}>{label}</span>
              </Link>
            ))}
          </div>

          <div className="ml-auto hidden items-center gap-2 md:flex">
            <Link
              to="/greenhouse"
              aria-label="Join the Greenhouse"
              title="Join the Greenhouse"
              className={`inline-flex items-center rounded-full bg-emerald-600 font-medium text-white transition-colors hover:bg-emerald-700 ${
                isFloating ? "h-8 w-8 justify-center shadow-md shadow-emerald-300/35" : "gap-1.5 px-3 py-1.5 text-xs"
              }`}
            >
              <Sparkles className={isFloating ? "h-3.5 w-3.5" : "h-3.5 w-3.5"} />
              {!isFloating ? "Join the Greenhouse" : null}
            </Link>
            {!isFloating ? <RutgersBadge /> : <RutgersBadge compact />}
          </div>

          <button
            type="button"
            className="ml-auto rounded-lg p-2 text-gray-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 md:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav-panel"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div id="mobile-nav-panel" className="border-t border-emerald-100 bg-white px-4 py-3 md:hidden">
            <div className="space-y-1">
              {navLinks.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  aria-current={isActive(to) ? "page" : undefined}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    isActive(to)
                      ? "bg-emerald-100 text-emerald-800"
                      : "text-gray-600 hover:bg-emerald-50 hover:text-emerald-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="mt-3">
              <Link
                to="/greenhouse"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <Sparkles className="h-4 w-4" />
                Join the Greenhouse
              </Link>
            </div>
            <div className="mt-3 border-t border-emerald-100 pt-3">
              <RutgersBadge compact />
            </div>
          </div>
        )}
      </nav>
    </div>
  );
}
