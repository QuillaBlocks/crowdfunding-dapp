"use client";

import { useState } from "react";
import { contribute } from "@/lib/crowdfunding";
import { xlmToStroops } from "@/lib/format";
import { useWallet } from "./WalletProvider";

type Props = {
  contractId: string;
  disabled?: boolean;
  disabledReason?: string;
  onSuccess?: () => void;
};

const PRESETS = ["1", "5", "10", "25"] as const;

// Tope por aporte. En una sesión, una sola persona escribiendo un número grande
// alcanza la meta, el contrato pasa a Completed y TODOS los demás reciben
// NotActive: se quedan sin poder participar. Pasó en Uninorte con un aporte de
// 500 XLM en el quinto turno.
const MAX_XLM = 25;

export function ContributeForm({
  contractId,
  disabled = false,
  disabledReason,
  onSuccess,
}: Props) {
  const { publicKey, connect, connecting } = useWallet();
  const [amount, setAmount] = useState("5");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTxHash(null);
    if (!publicKey) {
      try {
        await connect();
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudo conectar");
        return;
      }
      return;
    }
    setSubmitting(true);
    try {
      const stroops = xlmToStroops(amount);
      if (stroops <= 0n) throw new Error("El monto debe ser mayor que 0");
      if (stroops > xlmToStroops(String(MAX_XLM)))
        throw new Error(`El aporte máximo es ${MAX_XLM} XLM, para que la vaca alcance para todos`);
      const res = await contribute(contractId, publicKey, stroops);
      setTxHash(res.hash);
      onSuccess?.();
    } catch (err) {
      setError(extractError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const isDisabled = disabled || submitting || connecting;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(p)}
            className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
              amount === p
                ? "border-amarillo bg-amarillo text-navy-900"
                : "border-white/15 bg-white/5 text-white/80 hover:border-amarillo/60 hover:text-amarillo"
            }`}
          >
            {p} XLM
          </button>
        ))}
      </div>

      <div className="flex w-full min-w-0 items-stretch gap-3 rounded-2xl border border-white/10 bg-navy-700/60 p-2 backdrop-blur focus-within:border-amarillo">
        <div className="flex shrink-0 items-center pl-3 text-white/40">
          <span className="font-mono text-sm uppercase tracking-widest">XLM</span>
        </div>
        <input
          type="text"
          inputMode="decimal"
          size={1}
          value={amount}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "" || /^\d*[.,]?\d*$/.test(v)) {
              const n = parseFloat(v.replace(",", "."));
              setAmount(!isNaN(n) && n > MAX_XLM ? String(MAX_XLM) : v);
            }
          }}
          placeholder="Monto"
          className="font-mono w-0 min-w-0 flex-1 bg-transparent px-1 py-2 text-2xl font-bold tabular-nums text-white outline-none placeholder:text-white/30 sm:text-3xl"
          aria-label="Monto a contribuir"
        />
        <button
          type="submit"
          disabled={isDisabled}
          className="group relative inline-flex shrink-0 items-center gap-2 overflow-hidden rounded-xl bg-rojo px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-white transition hover:bg-naranja disabled:cursor-not-allowed disabled:opacity-50 sm:px-6 sm:text-sm"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition group-hover:translate-x-full duration-700" />
          <span className="relative z-10">
            {submitting ? "Firmando…" : !publicKey ? "Conectar y aportar" : "Contribuir"}
          </span>
        </button>
      </div>

      {disabled && disabledReason && (
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">{disabledReason}</p>
      )}
      {error && <p className="text-sm text-rojo">{error}</p>}
      {txHash && (
        <p className="text-sm text-verde">
          ¡Aporte enviado!{" "}
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
    </form>
  );
}

function extractError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null) {
    const e = err as { message?: string; toString?: () => string };
    if (e.message) return e.message;
    if (e.toString) return e.toString();
  }
  return "Error desconocido al contribuir";
}
