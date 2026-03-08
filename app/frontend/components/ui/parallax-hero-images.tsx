import { useEffect, useMemo, useRef } from "react";
import type { MarqueeCard } from "./three-d-marquee";

type ParallaxHeroImagesProps = {
  cards: MarqueeCard[];
  className?: string;
};

const mergeClasses = (...items: Array<string | undefined>) => items.filter(Boolean).join(" ");

const ensureCards = (cards: MarqueeCard[]) => {
  if (cards.length === 0) return [];
  const minimum = Math.max(24, cards.length);
  return Array.from({ length: minimum }, (_, index) => cards[index % cards.length]);
};

export function ParallaxHeroImages({ cards, className }: ParallaxHeroImagesProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const layerRefs = useRef<Array<HTMLDivElement | null>>([]);

  const prepared = useMemo(() => ensureCards(cards).slice(0, 24), [cards]);
  const columns = useMemo(() => {
    const chunkSize = Math.ceil(prepared.length / 3);
    return Array.from({ length: 3 }, (_, index) => prepared.slice(index * chunkSize, (index + 1) * chunkSize));
  }, [prepared]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Similar speeds per lane, but different base offsets so columns stay visually unaligned.
    const ySpeeds = [-189, -150, -178];
    const baseOffsets = [-56, 20, 78];
    let frame = 0;

    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const viewportCenter = viewportHeight * 0.5;
      const sectionCenter = rect.top + rect.height * 0.5;
      const relative = (viewportCenter - sectionCenter) / viewportHeight;
      const clamped = Math.max(-1, Math.min(1, relative * 2.35));

      layerRefs.current.forEach((layer, index) => {
        if (!layer) return;
        const y = baseOffsets[index % baseOffsets.length] + clamped * ySpeeds[index % ySpeeds.length];
        layer.style.transform = `translate3d(0, ${y}px, 0)`;
      });
    };

    const schedule = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={rootRef} className={mergeClasses("relative h-[46rem] w-full overflow-hidden rounded-3xl", className)}>
      <style>
        {`
          @keyframes reroot-parallax-track-up {
            from { transform: translate3d(0, 0, 0); }
            to { transform: translate3d(0, -50%, 0); }
          }

          @keyframes reroot-parallax-track-down {
            from { transform: translate3d(0, -50%, 0); }
            to { transform: translate3d(0, 0, 0); }
          }
        `}
      </style>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-emerald-50/50 to-emerald-100/45" />

      <div className="relative hidden h-full grid-cols-3 gap-4 px-4 py-6 md:grid">
        {columns.map((column, columnIndex) => (
          <div
            key={`parallax-col-${columnIndex}`}
            ref={(node) => {
              layerRefs.current[columnIndex] = node;
            }}
            className="h-full will-change-transform"
          >
            <div
              className="h-full overflow-hidden"
            >
              <div
                className="space-y-4 will-change-transform"
                style={{
                  marginTop: `${[-18, -148, -264][columnIndex] ?? 0}px`,
                  animationName: columnIndex === 1 ? "reroot-parallax-track-down" : "reroot-parallax-track-up",
                  animationDuration: `${[22.8, 24.3, 23.5][columnIndex] ?? 23}s`,
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite",
                  animationDelay: `${[-6.3, -11.8, -8.9][columnIndex] ?? 0}s`,
                }}
              >
                {[...column, ...column].map((card, cardIndex) => (
                  <article
                    key={`${card.id}-${cardIndex}`}
                    className="overflow-hidden rounded-2xl border border-white/70 bg-white/90 p-2 shadow-lg shadow-emerald-900/10"
                  >
                    <img src={card.image} alt={card.title} className="h-40 w-full rounded-xl object-cover" loading="lazy" />
                    <div className="px-1 pb-1 pt-2">
                      <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{card.eyebrow}</p>
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900">{card.title}</p>
                      <p className="line-clamp-1 text-xs text-gray-600">{card.subtitle}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                        <span className="line-clamp-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">{card.tag}</span>
                        <span className="line-clamp-1 font-semibold text-gray-900">{card.meta}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="relative grid h-full grid-cols-2 gap-3 p-4 md:hidden">
        {prepared.slice(0, 6).map((card, index) => (
          <article key={`mobile-${card.id}-${index}`} className="overflow-hidden rounded-xl border border-white/70 bg-white/90 p-1.5 shadow-md">
            <img src={card.image} alt={card.title} className="h-full max-h-44 w-full rounded-lg object-cover" loading="lazy" />
          </article>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white via-white/85 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white via-white/85 to-transparent" />
    </div>
  );
}
