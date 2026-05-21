"use client";

import { useEffect, useState } from "react";
import { fetchRecentContributions } from "@/lib/events";
import type { ContributorEntry } from "@/lib/crowdfunding";
import { formatXlm, truncateAddress } from "@/lib/format";

type Props = {
  contractId: string;
  refreshKey: number;
};

function relTime(ts: number): string {
  if (!ts) return "—";
  const diff = Math.max(0, Math.floor(Date.now() / 1000 - ts));
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return `hace ${Math.floor(diff / 86400)}d`;
}

export function ContributorsList({ contractId, refreshKey }: Props) {
  const [entries, setEntries] = useState<ContributorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchRecentContributions(contractId, 10)
      .then((data) => {
        if (!cancelled) {
          setEntries(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "No se pudo leer eventos");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contractId, refreshKey]);

  return (
    <div className="hard-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">
          Últimos aportes
        </h3>
        <span className="tag-chip">
          <span className="size-1.5 rounded-full bg-verde animate-pulse-strong" />
          en vivo
        </span>
      </div>

      {error && <p className="text-xs text-rojo">{error}</p>}

      {!error && (
        <ul className="divide-y divide-white/5">
          {loading && entries.length === 0 ? (
            Array.from({ length: 4 }).map((_, i) => (
              <li
                key={i}
                className="flex animate-pulse items-center justify-between py-3"
              >
                <span className="h-3 w-32 rounded bg-white/10" />
                <span className="h-3 w-16 rounded bg-white/10" />
              </li>
            ))
          ) : entries.length === 0 ? (
            <li className="py-8 text-center text-sm text-white/40">
              Aún no hay aportes. Sé el primero.
            </li>
          ) : (
            entries.map((c, idx) => (
              <li
                key={`${c.txHash}-${idx}`}
                className="flex items-center justify-between gap-4 py-3 animate-fade-up"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-rojo via-naranja to-amarillo text-xs font-bold text-navy-900">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-mono text-sm text-white">
                      {truncateAddress(c.address, 6, 6)}
                    </div>
                    <div className="text-[0.7rem] uppercase tracking-widest text-white/40">
                      {relTime(c.timestamp)}
                    </div>
                  </div>
                </div>
                <div className="font-mono text-right">
                  <div className="text-base font-bold text-amarillo">
                    +{formatXlm(c.amount)}
                  </div>
                  <div className="text-[0.65rem] uppercase tracking-[0.25em] text-white/40">
                    XLM
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
