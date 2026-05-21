"use client";

import { INSTANCES, type CrowdfundingInstance } from "@/lib/instances";

type Props = {
  current: CrowdfundingInstance;
  onChange: (i: CrowdfundingInstance) => void;
};

export function InstanceSelector({ current, onChange }: Props) {
  if (INSTANCES.length <= 1) return null;
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-navy-700/60 p-1 backdrop-blur">
      {INSTANCES.map((i) => {
        const active = current.id === i.id;
        return (
          <button
            key={i.id}
            type="button"
            onClick={() => onChange(i)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] transition ${
              active
                ? "bg-amarillo text-navy-900 shadow-[0_0_30px_rgba(255,210,63,0.35)]"
                : "text-white/60 hover:text-white"
            }`}
            title={i.description}
          >
            {i.label}
          </button>
        );
      })}
    </div>
  );
}
