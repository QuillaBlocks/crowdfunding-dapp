"use client";

import { useWallet } from "./WalletProvider";
import { truncateAddress } from "@/lib/format";

export function WalletButton() {
  const { publicKey, hasFreighter, connecting, error, connect, disconnect } =
    useWallet();

  if (!hasFreighter) {
    return (
      <a
        href="https://www.freighter.app/"
        target="_blank"
        rel="noreferrer noopener"
        className="group inline-flex items-center gap-3 rounded-full border border-amarillo/60 bg-amarillo/10 px-5 py-2.5 text-sm font-semibold text-amarillo transition hover:bg-amarillo hover:text-navy-900"
      >
        <span className="inline-block size-2 rounded-full bg-amarillo animate-pulse-strong" />
        Instalar Freighter
      </a>
    );
  }

  if (publicKey) {
    return (
      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <div className="text-[0.6rem] uppercase tracking-[0.25em] text-white/50">
            Conectado
          </div>
          <div className="font-mono text-sm text-amarillo">
            {truncateAddress(publicKey, 5, 5)}
          </div>
        </div>
        <button
          type="button"
          onClick={disconnect}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/70 transition hover:border-rojo/60 hover:text-rojo"
        >
          Desconectar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        disabled={connecting}
        onClick={connect}
        className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-amarillo bg-amarillo px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] text-navy-900 transition hover:scale-[1.02] disabled:opacity-60"
      >
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition group-hover:translate-x-full duration-700" />
        <span className="relative z-10 inline-block size-2 rounded-full bg-navy-900 animate-pulse-strong" />
        <span className="relative z-10">
          {connecting ? "Conectando…" : "Conectar Freighter"}
        </span>
      </button>
      {error && <p className="mt-2 text-xs text-rojo">{error}</p>}
    </div>
  );
}
