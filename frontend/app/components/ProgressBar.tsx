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
    <div className="w-full">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white/55">
          Progreso
        </span>
        <span className="font-mono text-sm font-bold tabular-nums text-amarillo">
          {pct.toFixed(1)}%
        </span>
      </div>

      <div className="relative h-8 sm:h-10 w-full overflow-hidden rounded-2xl border border-white/10 bg-navy-700/60 backdrop-blur">
        <div className="absolute inset-0 stripe-bg opacity-50" aria-hidden />
        <div
          className={`relative h-full ${fillClass} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 to-transparent mix-blend-overlay" />
        </div>
      </div>

      <div className="mt-1.5 flex justify-between font-mono text-[0.6rem] uppercase tracking-widest text-white/40">
        <span>0%</span>
        <span>25%</span>
        <span>50%</span>
        <span>75%</span>
        <span>100%</span>
      </div>
    </div>
  );
}
