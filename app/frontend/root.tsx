import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Footer } from "./components/Footer";
import { Navbar } from "./components/Navbar";

export function Root() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <a
        href="#main-content"
        className="sr-only z-[60] rounded-md bg-white px-3 py-2 text-sm font-medium text-emerald-700 shadow focus:not-sr-only focus:absolute focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
