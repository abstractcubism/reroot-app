import type { CSSProperties } from "react";

type ThreeDMarqueeProps = {
  cards: MarqueeCard[];
  className?: string;
  tilt?: "left" | "right";
  durationBase?: number;
  durationStep?: number;
  columns?: number;
  minimumCards?: number;
};

export interface MarqueeCard {
  id: string;
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  tag: string;
  meta: string;
}

const mergeClasses = (...items: Array<string | undefined>) => items.filter(Boolean).join(" ");

const rowGuides = [18, 34, 50, 66, 82];
const columnGuides = [14, 32, 50, 68, 86];

const ensureEnoughCards = (cards: MarqueeCard[], minimumCards: number) => {
  if (cards.length === 0) return [];
  const minimum = Math.max(minimumCards, cards.length * 2);
  return Array.from({ length: minimum }, (_, index) => cards[index % cards.length]);
};

export function ThreeDMarquee({
  cards,
  className,
  tilt = "left",
  durationBase = 22,
  durationStep = 2.8,
  columns = 4,
  minimumCards = 16,
}: ThreeDMarqueeProps) {
  const columnCount = Math.max(2, Math.min(4, columns));
  const seeded = ensureEnoughCards(cards, minimumCards);
  const chunkSize = Math.ceil(seeded.length / columnCount);
  const renderedColumns = Array.from({ length: columnCount }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    const group = seeded.slice(start, start + chunkSize);
    return group.length > 0 ? [...group, ...group] : [];
  });

  return (
    <div className={mergeClasses("relative h-[46rem] w-full overflow-hidden", className)}>
      <style>
        {`
          @keyframes reroot-marquee-up {
            from { transform: translateY(0); }
            to { transform: translateY(-50%); }
          }
          @keyframes reroot-marquee-down {
            from { transform: translateY(-50%); }
            to { transform: translateY(0); }
          }
          .reroot-3d-grid[data-tilt="left"] {
            transform: rotateX(30deg) rotateY(-12deg) rotateZ(-24deg) scale(1.2);
          }
          .reroot-3d-grid[data-tilt="right"] {
            transform: rotateX(30deg) rotateY(12deg) rotateZ(24deg) scale(1.2);
          }
          .reroot-3d-grid {
            transform-style: preserve-3d;
            transform-origin: center center;
          }
          .reroot-marquee-col[data-direction="up"] {
            animation: reroot-marquee-up var(--marquee-duration, 20s) linear infinite;
            will-change: transform;
          }
          .reroot-marquee-col[data-direction="down"] {
            animation: reroot-marquee-down var(--marquee-duration, 20s) linear infinite;
            will-change: transform;
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_42%_14%,rgba(16,185,129,0.14),transparent_55%),radial-gradient(circle_at_64%_84%,rgba(52,211,153,0.12),transparent_52%)]" />

      <div className="pointer-events-none absolute inset-0">
        {rowGuides.map((top, index) => (
          <span
            key={`row-${top}`}
            className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-300/35 to-transparent"
            style={{ top: `${top}%`, opacity: 0.5 - index * 0.05 }}
          />
        ))}
        {columnGuides.map((left, index) => (
          <span
            key={`col-${left}`}
            className="absolute bottom-0 top-0 w-px bg-gradient-to-b from-transparent via-lime-200/30 to-transparent"
            style={{ left: `${left}%`, opacity: 0.5 - index * 0.05 }}
          />
        ))}
      </div>

      <div className="absolute inset-0 [perspective:1200px]">
        <div
          className={`reroot-3d-grid absolute -inset-20 grid gap-4 px-8 py-8 ${
            columnCount === 2 ? "grid-cols-2" : columnCount === 3 ? "grid-cols-3" : "grid-cols-4"
          }`}
          data-tilt={tilt}
        >
          {renderedColumns.map((column, columnIndex) => {
            const duration = durationBase + columnIndex * durationStep;
            const direction = columnIndex % 2 === 0 ? "up" : "down";
            return (
              <div key={`col-${columnIndex}`} className="relative overflow-hidden rounded-2xl">
                <div
                  className="reroot-marquee-col flex flex-col gap-3"
                  data-direction={direction}
                  style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
                >
                  {column.map((card, cardIndex) => (
                    <div
                      key={`${columnIndex}-${card.id}-${cardIndex}`}
                      className="rounded-2xl border border-white/45 bg-white/90 p-2 shadow-xl shadow-emerald-900/25 backdrop-blur-sm"
                    >
                      <img src={card.image} alt={card.title} className="h-28 w-full rounded-xl object-cover" loading="lazy" />
                      <div className="px-1 pb-1 pt-2">
                        <p className="line-clamp-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">{card.eyebrow}</p>
                        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{card.title}</p>
                        <p className="line-clamp-1 text-xs text-gray-600">{card.subtitle}</p>
                        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                          <span className="line-clamp-1 rounded-full bg-emerald-50 px-2 py-1 font-medium text-emerald-700">{card.tag}</span>
                          <span className="line-clamp-1 font-semibold text-gray-900">{card.meta}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-white via-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-white via-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-gradient-to-r from-white via-white/90 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-gradient-to-l from-white via-white/90 to-transparent" />
    </div>
  );
}
