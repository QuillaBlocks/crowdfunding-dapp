"use client";

import { Status } from "@/lib/crowdfunding";

const META: Record<
  Status,
  { label: string; tone: string; dot: string; description: string }
> = {
  [Status.Active]: {
    label: "Activa",
    tone: "border-amarillo/60 bg-amarillo/10 text-amarillo",
    dot: "bg-amarillo",
    description: "Aportes habilitados",
  },
  [Status.Completed]: {
    label: "Meta alcanzada",
    tone: "border-verde/60 bg-verde/10 text-verde",
    dot: "bg-verde",
    description: "Lista para retiro",
  },
  [Status.Failed]: {
    label: "Expirada",
    tone: "border-rojo/60 bg-rojo/10 text-rojo",
    dot: "bg-rojo",
    description: "Refunds habilitados",
  },
  [Status.Withdrawn]: {
    label: "Retirada",
    tone: "border-white/30 bg-white/5 text-white/80",
    dot: "bg-white",
    description: "Fondos transferidos al admin",
  },
};

export function StatusBadge({ status }: { status: Status }) {
  const m = META[status];
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.25em] backdrop-blur ${m.tone}`}
    >
      <span className={`size-2 rounded-full ${m.dot} animate-pulse-strong`} />
      <span>{m.label}</span>
      <span className="opacity-60 normal-case tracking-normal">· {m.description}</span>
    </div>
  );
}
