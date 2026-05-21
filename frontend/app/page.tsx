"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WalletProvider, useWallet } from "./components/WalletProvider";
import { WalletButton } from "./components/WalletButton";
import { ProgressBar } from "./components/ProgressBar";
import { Countdown } from "./components/Countdown";
import { ContributeForm } from "./components/ContributeForm";
import { ContributorsList } from "./components/ContributorsList";
import { InstanceSelector } from "./components/InstanceSelector";
import { StatusBadge } from "./components/StatusBadge";
import { Confetti } from "./components/Confetti";
import { RefundButton } from "./components/RefundButton";
import {
  INSTANCES,
  defaultInstance,
  type CrowdfundingInstance,
} from "@/lib/instances";
import { useCrowdfunding } from "@/lib/useCrowdfunding";
import { Status } from "@/lib/crowdfunding";
import { formatXlm } from "@/lib/format";

export default function Page() {
  return (
    <WalletProvider>
      <Main />
    </WalletProvider>
  );
}

function Main() {
  const fallback = useMemo(() => defaultInstance(), []);
  const [instance, setInstance] = useState<CrowdfundingInstance | null>(fallback);
  const { publicKey } = useWallet();
  const { snapshot, loading, error, refresh, refreshCount } = useCrowdfunding(
    instance?.contractId ?? null
  );

  const [prevStatus, setPrevStatus] = useState<Status | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  useEffect(() => {
    if (!snapshot) return;
    if (
      prevStatus !== null &&
      prevStatus !== Status.Completed &&
      snapshot.status.status === Status.Completed
    ) {
      setCelebrate(true);
      setTimeout(() => setCelebrate(false), 6000);
    }
    setPrevStatus(snapshot.status.status);
  }, [snapshot, prevStatus]);

  if (!instance) {
    return <NoInstance />;
  }

  const isAdmin =
    publicKey !== null &&
    snapshot !== null &&
    publicKey === snapshot.admin;

  const status = snapshot?.status;
  const goalStroops = status ? BigInt(status.goal.toString()) : 0n;
  const raisedStroops = status ? BigInt(status.total_raised.toString()) : 0n;
  const deadline = status ? Number(status.deadline) : 0;
  const percentBps = status?.percent_bps ?? 0;
  const contributors = status?.contributors ?? 0;
  const stat = status?.status ?? Status.Active;
  const isCompleted = stat === Status.Completed || stat === Status.Withdrawn;
  const isFailed = stat === Status.Failed;

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-10 px-6 py-8 sm:px-10 lg:px-14">
      <Confetti active={celebrate} />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Brand />
          <InstanceSelector current={instance} onChange={setInstance} />
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full border border-amarillo/60 bg-amarillo/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.2em] text-amarillo transition hover:bg-amarillo hover:text-navy-900"
            >
              Panel admin →
            </Link>
          )}
          <WalletButton />
        </div>
      </header>

      {loading && !snapshot && <Skeleton />}
      {error && (
        <div className="hard-card border-rojo/40 bg-rojo/10 p-6 text-rojo">
          <p className="text-sm uppercase tracking-[0.2em]">No se pudo leer el contrato</p>
          <p className="mt-2 font-mono text-xs text-rojo/80">{error}</p>
          <p className="mt-3 text-xs text-white/60">
            Verifica que <code className="rounded bg-black/30 px-1.5 py-0.5">
              NEXT_PUBLIC_CONTRACT_ID
            </code>{" "}
            esté seteado y el contrato esté inicializado en testnet.
          </p>
        </div>
      )}

      {snapshot && (
        <>
          <section className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="hard-card p-8 sm:p-12">
              <div className="flex items-center justify-between gap-4">
                <span className="tag-chip">
                  <span className="size-1.5 rounded-full bg-amarillo animate-pulse-strong" />
                  Testnet · Soroban
                </span>
                <StatusBadge status={stat} />
              </div>

              <h1 className="mt-6 font-sans text-hero font-black uppercase text-balance leading-[0.92] text-white">
                <span className="shine-text">{snapshot.name}</span>
              </h1>

              <p className="mt-4 max-w-xl text-base sm:text-lg text-white/70 text-balance">
                Una vaca comunitaria con las reglas grabadas en código. Conecta
                Freighter, aporta lo que quieras, y mira en vivo cómo se llena
                la meta on-chain.
              </p>

              <div className="mt-10 grid gap-8 sm:grid-cols-[1.3fr_1fr] sm:items-end">
                <div>
                  <div className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-white/55">
                    Recaudado
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-amount text-amount text-amarillo">
                      {formatXlm(raisedStroops)}
                    </span>
                    <span className="text-xl font-bold uppercase tracking-[0.2em] text-white/55">
                      XLM
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-sm text-white/45">
                    meta · {formatXlm(goalStroops)} XLM ·{" "}
                    <span className="text-amarillo">
                      {(percentBps / 100).toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="flex justify-start sm:justify-end">
                  <Countdown deadline={deadline} />
                </div>
              </div>

              <div className="mt-8">
                <ProgressBar percentBps={percentBps} status={stat} />
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                <Stat label="Contribuyentes" value={contributors.toString()} />
                <Stat
                  label="Promedio"
                  value={
                    contributors > 0
                      ? formatXlm(raisedStroops / BigInt(contributors))
                      : "0"
                  }
                  unit="XLM"
                />
                <Stat
                  label="Refresh"
                  value="5s"
                  unit="RPC"
                />
              </div>
            </div>

            <aside className="flex flex-col gap-6">
              <div className="hard-card p-6 sm:p-8">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">
                  {isCompleted
                    ? "Meta alcanzada"
                    : isFailed
                    ? "Vaca expirada"
                    : "Aportar"}
                </h3>
                <p className="mt-2 text-sm text-white/65">
                  {isCompleted
                    ? "El admin puede retirar los fondos. ¡Gracias por aportar!"
                    : isFailed
                    ? "El deadline pasó sin alcanzar la meta. Si aportaste, puedes recuperarlo."
                    : "Contribuye en XLM. Tu Freighter firmará y la transacción se publicará en testnet."}
                </p>
                <div className="mt-5">
                  {isFailed ? (
                    <RefundButton
                      contractId={instance.contractId}
                      refreshKey={refreshCount}
                      onSuccess={refresh}
                    />
                  ) : (
                    <ContributeForm
                      contractId={instance.contractId}
                      disabled={isCompleted}
                      disabledReason={
                        isCompleted ? "Aportes cerrados · meta alcanzada" : undefined
                      }
                      onSuccess={refresh}
                    />
                  )}
                </div>
              </div>

              <div className="hard-card stripe-bg p-6">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-white/60">
                  Contrato
                </h3>
                <p className="mt-2 font-mono text-xs text-white/70 break-all">
                  {instance.contractId}
                </p>
                <a
                  href={`https://stellar.expert/explorer/testnet/contract/${instance.contractId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-amarillo hover:underline"
                >
                  Ver en Stellar Expert →
                </a>
              </div>
            </aside>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <ContributorsList
              contractId={instance.contractId}
              refreshKey={refreshCount}
            />
            <HowItWorks />
          </section>
        </>
      )}

      <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-6 text-xs text-white/40">
        <span className="font-mono">QuillaBlocks · Stellar Campus · Uninorte</span>
        <span className="font-mono">soroban-sdk 26 · stellar-cli 26</span>
      </footer>
    </main>
  );
}

function Brand() {
  return (
    <Link href="/" className="group flex items-center gap-3">
      <div className="relative size-10 overflow-hidden rounded-xl bg-gradient-to-br from-rojo via-naranja to-amarillo p-[2px]">
        <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-navy-900 font-black text-amarillo">
          V
        </div>
      </div>
      <div className="flex flex-col leading-tight">
        <span className="text-xs uppercase tracking-[0.3em] text-white/60">QuillaBlocks</span>
        <span className="font-black uppercase text-white">Vaca · Crowdfunding</span>
      </div>
    </Link>
  );
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-navy-700/40 p-4 backdrop-blur">
      <div className="text-[0.6rem] font-bold uppercase tracking-[0.3em] text-white/45">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-amount text-2xl font-bold text-white">{value}</span>
        {unit && (
          <span className="text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/40">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Conecta tu Freighter",
      body: "Funciona en testnet. Si necesitas fondos, usa Friendbot.",
    },
    {
      n: "02",
      title: "Aporta cualquier monto",
      body: "Tu wallet firma una invocación al contrato, no a una cuenta del speaker.",
    },
    {
      n: "03",
      title: "El contrato decide",
      body: "Si llega a la meta, el admin retira. Si expira sin meta, los aportes vuelven solos.",
    },
  ];
  return (
    <div className="hard-card p-6 sm:p-8">
      <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-white/70">
        Cómo funciona
      </h3>
      <ol className="mt-5 space-y-5">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-4">
            <span className="text-amount text-3xl font-black text-amarillo">{s.n}</span>
            <div>
              <div className="text-base font-bold text-white">{s.title}</div>
              <div className="text-sm text-white/60">{s.body}</div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="hard-card animate-pulse p-12">
      <div className="h-8 w-40 rounded bg-white/10" />
      <div className="mt-6 h-16 w-3/4 rounded bg-white/10" />
      <div className="mt-4 h-4 w-full rounded bg-white/5" />
      <div className="mt-8 h-12 w-full rounded bg-white/10" />
    </div>
  );
}

function NoInstance() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
      <div className="hard-card p-10">
        <h1 className="font-sans text-3xl font-black uppercase text-amarillo">
          Falta configurar el contract ID
        </h1>
        <p className="mt-4 text-white/70">
          Despliega el contrato con <code className="rounded bg-black/30 px-1.5 py-0.5">scripts/deploy.sh</code>{" "}
          y pega el resultado en{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5">frontend/.env.local</code>:
        </p>
        <pre className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-navy-900/80 p-4 text-left font-mono text-xs text-white/80">
{`NEXT_PUBLIC_CONTRACT_ID=C...
NEXT_PUBLIC_CONTRACT_ID_EXPIRED=C...   # opcional, instancia pre-expirada
NEXT_PUBLIC_RPC_URL=https://soroban-testnet.stellar.org`}
        </pre>
        <p className="mt-4 text-xs text-white/40">
          Luego corre <code>npm run dev</code> de nuevo.
        </p>
      </div>
    </main>
  );
}
