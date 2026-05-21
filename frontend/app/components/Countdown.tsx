"use client";

import { useEffect, useState } from "react";
import { formatCountdown } from "@/lib/format";

type Props = {
  deadline: number; // unix seconds
};

function Block({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative font-mono text-3xl sm:text-5xl font-bold leading-none text-amarillo tabular-nums">
        {value}
      </div>
      <div className="mt-1 text-[0.55rem] sm:text-xs uppercase tracking-[0.3em] text-white/55">
        {label}
      </div>
    </div>
  );
}

export function Countdown({ deadline }: Props) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const left = deadline - now;
  const { days, hours, mins, secs, expired } = formatCountdown(left);

  if (expired) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-rojo/60 bg-rojo/10 px-4 py-3 backdrop-blur">
        <span className="inline-block size-2.5 rounded-full bg-rojo animate-pulse-strong" />
        <span className="text-sm font-bold uppercase tracking-[0.25em] text-rojo">
          Deadline alcanzado
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 sm:gap-5">
      {Number(days) > 0 && (
        <>
          <Block value={days} label="días" />
          <span className="text-2xl sm:text-4xl text-white/30">·</span>
        </>
      )}
      <Block value={hours} label="hrs" />
      <span className="text-2xl sm:text-4xl text-white/30">:</span>
      <Block value={mins} label="min" />
      <span className="text-2xl sm:text-4xl text-white/30">:</span>
      <Block value={secs} label="seg" />
    </div>
  );
}
