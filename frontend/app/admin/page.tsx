"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { WalletProvider, useWallet } from "../components/WalletProvider";
import { WalletButton } from "../components/WalletButton";
import { ProgressBar } from "../components/ProgressBar";
import { Countdown } from "../components/Countdown";
import { StatusBadge } from "../components/StatusBadge";
import { InstanceSelector } from "../components/InstanceSelector";
import {
  INSTANCES,
  defaultInstance,
  type CrowdfundingInstance,
} from "@/lib/instances";
import { useCrowdfunding } from "@/lib/useCrowdfunding";
import { Status, withdraw, checkExpiration } from "@/lib/crowdfunding";
import { formatXlm, truncateAddress } from "@/lib/format";

export default function AdminPage() {
  return (
    <WalletProvider>
      <Admin />
    </WalletProvider>
  );
}

function Admin() {
  const fallback = useMemo(() => defaultInstance(), []);
  const [instance, setInstance] = useState<CrowdfundingInstance | null>(fallback);
  const { publicKey } = useWallet();
  const { snapshot, error, refresh } = useCrowdfunding(instance?.contractId ?? null);

  const [busy, setBusy] = useState<"withdraw" | "check" | null>(null);
  const [opError, setOpError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const isAdmin =
    publicKey !== null &&
    snapshot !== null &&
    publicKey === snapshot.admin;

  const status = snapshot?.status;
  const stat = status?.status ?? Status.Active;
  const canWithdraw = stat === Status.Completed;
  const canCheckExpiration =
    status !== null &&
    status !== undefined &&
    stat === Status.Active &&
    Number(status.now) >= Number(status.deadline);

  const onWithdraw = async () => {
    if (!instance || !publicKey) return;
    setOpError(null);
    setTxHash(null);
    setBusy("withdraw");
    try {
      const res = await withdraw(instance.contractId, publicKey);
      setTxHash(res.hash);
      refresh();
    } catch (err) {
      setOpError(err instanceof Error ? err.message : "Error al retirar");
    } finally {
      setBusy(null);
    }
  };

  const onCheckExpiration = async () => {
    if (!instance || !publicKey) return;
    setOpError(null);
    setTxHash(null);
    setBusy("check");
    try {
      await checkExpiration(instance.contractId, publicKey);
      refresh();
    } catch (err) {
      setOpError(err instanceof Error ? err.message : "Error al marcar como expirada");
    } finally {
      setBusy(null);
    }
  };

  if (!instance) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-8">
        <div className="hard-card p-8 text-center text-white/70">
          No hay contract ID configurado.
          <Link href="/" className="mt-3 inline-block text-amarillo hover:underline">
            ← Volver
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-8 sm:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.2em] text-white/60 hover:border-amarillo/60 hover:text-amarillo"
          >
            ← Pantalla principal
          </Link>
          <InstanceSelector current={instance} onChange={setInstance} />
        </div>
        <WalletButton />
      </header>

      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-amarillo">Panel admin</p>
        <h1 className="mt-2 text-4xl sm:text-5xl font-black uppercase text-white text-balance">
          Control del crowdfunding
        </h1>
      </div>

      {error && (
        <div className="hard-card border-rojo/40 bg-rojo/10 p-5 text-rojo">{error}</div>
      )}

      {snapshot && (
        <section className="hard-card p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">{snapshot.name}</h2>
              <p className="mt-1 font-mono text-xs text-white/55">
                admin · {truncateAddress(snapshot.admin, 7, 7)}
              </p>
            </div>
            <StatusBadge status={stat} />
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] sm:items-end">
            <div>
              <div className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-white/50">
                Recaudado
              </div>
              <div className="text-amount text-amarillo">
                {formatXlm(BigInt(status!.total_raised.toString()))}
              </div>
              <div className="mt-1 font-mono text-xs text-white/45">
                meta · {formatXlm(BigInt(status!.goal.toString()))} XLM ·{" "}
                {status!.contributors.toString()} contribuyentes
              </div>
            </div>
            <Countdown deadline={Number(status!.deadline)} />
          </div>

          <div className="mt-6">
            <ProgressBar percentBps={status!.percent_bps} status={stat} />
          </div>
        </section>
      )}

      {!isAdmin && publicKey && (
        <div className="hard-card border-rojo/40 bg-rojo/5 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-rojo">
            Wallet conectada no es el admin
          </p>
          <p className="mt-2 text-sm text-white/65">
            Para operar como admin, conecta la wallet usada al inicializar este
            crowdfunding.
          </p>
          {snapshot && (
            <p className="mt-3 font-mono text-xs text-white/45">
              admin · {snapshot.admin}
            </p>
          )}
        </div>
      )}

      {!publicKey && (
        <div className="hard-card p-6">
          <p className="text-white/70">Conecta la wallet del admin para continuar.</p>
        </div>
      )}

      {isAdmin && (
        <section className="grid gap-6 lg:grid-cols-2">
          <ActionCard
            title="Retirar fondos"
            description="Solo disponible cuando el estado es Completed. Transfiere todo lo recaudado a la wallet del admin y cierra la vaca como Withdrawn."
            cta={busy === "withdraw" ? "Firmando…" : "Retirar"}
            tone="amarillo"
            disabled={!canWithdraw || busy !== null}
            disabledReason={
              !canWithdraw
                ? `Habilitado solo cuando la meta esté alcanzada. Estado actual: ${Status[stat]}.`
                : undefined
            }
            onClick={onWithdraw}
          />
          <ActionCard
            title="Marcar como expirada"
            description="Llama check_expiration() para mover el contrato a Failed cuando el deadline pasó sin meta. Habilita refunds para los contribuyentes."
            cta={busy === "check" ? "Firmando…" : "Marcar Failed"}
            tone="rojo"
            disabled={!canCheckExpiration || busy !== null}
            disabledReason={
              !canCheckExpiration
                ? "Disponible solo después del deadline si el estado sigue Active."
                : undefined
            }
            onClick={onCheckExpiration}
          />
        </section>
      )}

      {opError && (
        <div className="hard-card border-rojo/40 bg-rojo/10 p-5 text-rojo">{opError}</div>
      )}
      {txHash && (
        <div className="hard-card border-verde/40 bg-verde/5 p-5">
          <p className="text-sm text-verde">
            Transacción enviada.{" "}
            <a
              className="underline decoration-dotted underline-offset-4 hover:text-amarillo"
              href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
              target="_blank"
              rel="noreferrer"
            >
              ver en Stellar Expert
            </a>
          </p>
        </div>
      )}
    </main>
  );
}

function ActionCard({
  title,
  description,
  cta,
  tone,
  disabled,
  disabledReason,
  onClick,
}: {
  title: string;
  description: string;
  cta: string;
  tone: "amarillo" | "rojo";
  disabled?: boolean;
  disabledReason?: string;
  onClick: () => void;
}) {
  const colors =
    tone === "amarillo"
      ? "bg-amarillo text-navy-900 hover:bg-naranja hover:text-white"
      : "bg-rojo text-white hover:bg-naranja";
  return (
    <div className="hard-card p-7">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <p className="mt-2 text-sm text-white/65">{description}</p>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`mt-5 inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold uppercase tracking-[0.2em] transition disabled:cursor-not-allowed disabled:opacity-40 ${colors}`}
      >
        {cta}
      </button>
      {disabledReason && (
        <p className="mt-3 text-xs uppercase tracking-[0.2em] text-white/40">
          {disabledReason}
        </p>
      )}
    </div>
  );
}
