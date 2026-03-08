import type { ReactNode } from "react";

type BackgroundLinesProps = {
  children: ReactNode;
  className?: string;
};

export function BackgroundLines({ children, className }: BackgroundLinesProps) {
  return (
    <div className={`relative w-full overflow-hidden bg-emerald-950 ${className ?? ""}`}>
      <style>
        {`
          @keyframes reroot-sun-gradient {
            0% { background-position: 0% 45%; }
            50% { background-position: 100% 55%; }
            100% { background-position: 0% 45%; }
          }
          @keyframes reroot-sun-streaks {
            0% { transform: translate3d(-6%, -2%, 0) rotate(-10deg) scale(1.02); opacity: 0.36; }
            50% { transform: translate3d(6%, 3%, 0) rotate(-8deg) scale(1.08); opacity: 0.52; }
            100% { transform: translate3d(-6%, -2%, 0) rotate(-10deg) scale(1.02); opacity: 0.36; }
          }
          @keyframes reroot-sun-rays {
            0% { transform: translate3d(0, 0, 0) rotate(-12deg); opacity: 0.16; }
            50% { transform: translate3d(4%, 3%, 0) rotate(-8deg); opacity: 0.3; }
            100% { transform: translate3d(0, 0, 0) rotate(-12deg); opacity: 0.16; }
          }
          .reroot-hero-gradient {
            background-size: 260% 260%;
            animation: reroot-sun-gradient 20s ease-in-out infinite;
          }
          .reroot-hero-streaks {
            animation: reroot-sun-streaks 14s ease-in-out infinite;
            will-change: transform, opacity;
          }
          .reroot-hero-rays {
            animation: reroot-sun-rays 12s ease-in-out infinite;
            will-change: transform, opacity;
          }
        `}
      </style>

      <div className="pointer-events-none absolute inset-0">
        <div className="reroot-hero-gradient absolute inset-0 bg-[linear-gradient(124deg,rgba(6,78,59,0.98)_0%,rgba(6,95,70,0.92)_18%,rgba(5,150,105,0.8)_35%,rgba(16,185,129,0.68)_52%,rgba(74,222,128,0.5)_68%,rgba(190,242,100,0.42)_84%,rgba(253,224,71,0.24)_100%)]" />

        <div className="reroot-hero-streaks absolute -left-[12%] top-[-35%] h-[160%] w-[90%] bg-[repeating-linear-gradient(118deg,rgba(253,224,71,0.26)_0px,rgba(253,224,71,0.12)_26px,transparent_56px,transparent_112px)] blur-[16px]" />
        <div className="reroot-hero-rays absolute -left-[8%] top-[-28%] h-[150%] w-[72%] bg-[repeating-linear-gradient(112deg,rgba(255,255,255,0.3)_0px,rgba(255,255,255,0.12)_18px,transparent_46px,transparent_94px)] blur-[8px] [animation-delay:-3s]" />

        <div className="absolute left-[6%] top-[-22%] h-[120%] w-[72%] rounded-full bg-yellow-100/35 blur-[110px]" />
        <div className="absolute right-[-18%] top-[-14%] h-[115%] w-[58%] rounded-full bg-emerald-300/22 blur-[120px]" />
        <div className="absolute bottom-[-42%] left-[22%] h-[95%] w-[58%] rounded-full bg-lime-200/18 blur-[110px]" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_14%,rgba(255,251,235,0.55),transparent_34%),radial-gradient(circle_at_30%_20%,rgba(254,240,138,0.34),transparent_36%),radial-gradient(circle_at_78%_18%,rgba(167,243,208,0.25),transparent_44%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/24 via-transparent to-emerald-950/58" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
