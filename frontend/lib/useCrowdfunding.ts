"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchAdmin, fetchName, fetchStatus, type StatusInfo } from "./crowdfunding";

type Snapshot = {
  status: StatusInfo;
  admin: string;
  name: string;
};

export function useCrowdfunding(contractId: string | null, intervalMs = 5000) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const cancelled = useRef(false);

  const load = useCallback(
    async (showLoading: boolean) => {
      if (!contractId) return;
      if (showLoading) setLoading(true);
      try {
        const [status, admin, name] = await Promise.all([
          fetchStatus(contractId),
          fetchAdmin(contractId),
          fetchName(contractId),
        ]);
        if (cancelled.current) return;
        setSnapshot({ status, admin, name });
        setError(null);
      } catch (err) {
        if (cancelled.current) return;
        setError(err instanceof Error ? err.message : "No se pudo leer el contrato");
      } finally {
        if (!cancelled.current && showLoading) setLoading(false);
      }
    },
    [contractId]
  );

  useEffect(() => {
    cancelled.current = false;
    if (!contractId) return;
    setSnapshot(null);
    setLoading(true);
    load(true);
    const id = setInterval(() => load(false), intervalMs);
    return () => {
      cancelled.current = true;
      clearInterval(id);
    };
  }, [contractId, intervalMs, load]);

  const refresh = useCallback(() => {
    setRefreshCount((c) => c + 1);
    load(false);
  }, [load]);

  return { snapshot, loading, error, refresh, refreshCount };
}
