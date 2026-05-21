"use client";

import { useEffect, useState } from "react";
import { fetchContribution, refund } from "@/lib/crowdfunding";
import { formatXlm } from "@/lib/format";
import { useWallet } from "./WalletProvider";

type Props = {
  contractId: string;
  refreshKey: number;
  onSuccess: () => void;
};

export function RefundButton({ contractId, refreshKey, onSuccess }: Props) {
  const { publicKey } = useWallet();
  const [contribution, setContribution] = useState<bigint | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setContribution(null);
      return;
    }
    fetchContribution(contractId, publicKey)
      .then(setContribution)
      .catch(() => setContribution(null));
  }, [contractId, publicKey, refreshKey]);

  if (!publicKey) {
    return (
      <p className="text-sm text-white/60">
        Conecta tu Freighter para revisar si tienes fondos para reclamar.
      </p>
    );
  }

  if (contribution === null) {
    return <p className="text-sm text-white/40">Cargando contribución…</p>;
  }

  if (contribution <= 0n) {
    return (
      <p className="text-sm text-white/60">
        No tienes aportes pendientes en esta vaca.
      </p>
    );
  }

  const onClick = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await refund(contractId, publicKey);
      setTxHash(res.hash);
      setContribution(0n);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo reclamar");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xs uppercase tracking-[0.25em] text-white/55">
          Tu aporte recuperable
        </span>
        <span className="text-amount text-xl font-bold text-amarillo">
          {formatXlm(contribution)} XLM
        </span>
      </div>
      <button
        type="button"
        onClick={onClick}
        disabled={submitting}
        className="group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-rojo px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white transition hover:bg-naranja disabled:opacity-60"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition group-hover:translate-x-full duration-700" />
        <span className="relative z-10">
          {submitting ? "Firmando…" : "Reclamar mi aporte"}
        </span>
      </button>
      {error && <p className="text-sm text-rojo">{error}</p>}
      {txHash && (
        <p className="text-sm text-verde">
          ¡Refund enviado!{" "}
          <a
            className="underline decoration-dotted underline-offset-4 hover:text-amarillo"
            href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
          >
            ver en Stellar Expert
          </a>
        </p>
      )}
    </div>
  );
}
