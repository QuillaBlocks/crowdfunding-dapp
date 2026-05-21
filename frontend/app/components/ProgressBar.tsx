"use client";

import { Status } from "@/lib/crowdfunding";

type Props = {
  percentBps: number;
  status: Status;
};

export function ProgressBar({ percentBps, status }: Props) {
  const pct = Math.min(100, percentBps / 100);
  const completed = status === Status.Completed || status === Status.Withdrawn;
  const failed = status === Status.Failed;

  let fillClass = "bg-gradient-to-r from-rojo via-naranja to-amarillo";
  if (completed) fillClass = "bg-gradient-to-r from-verde via-amarillo to-amarillo";
  if (failed) fillClass = "bg-gradient-to-r from-navy-700 via-rojo/70 to-rojo";

  return (
    <div className="relative w-full">
      <div className="relative h-12 sm:h-16 w-full overflow-hidden rounded-2xl border border-white/10 bg-navy-700/60 backdrop-blur">
        <div className="absolute inset-0 stripe-bg opacity-50" aria-hidden />
        <div
          className={`relative h-full ${fillClass} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent mix-blend-overlay" />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:block">
            <span className="font-mono text-xs font-bold text-navy-900/90 tracking-tight">
              {pct.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <span className="text-[0.6rem] sm:text-xs font-bold uppercase tracking-[0.3em] text-white/70">
            Progreso
          </span>
        </div>
      </div>
      <div className="mt-1 flex justify-between font-mono text-[0.65rem] uppercase tracking-widest text-white/40">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
