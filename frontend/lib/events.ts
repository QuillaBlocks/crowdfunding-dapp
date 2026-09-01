import { rpc, Address, scValToNative, xdr } from "crowdfunding-client";
import { RPC_URL } from "./instances";
import type { ContributorEntry } from "./crowdfunding";

const TOPIC_CONTRIBUTE = "contribute";

let serverSingleton: rpc.Server | null = null;
function server(): rpc.Server {
  if (!serverSingleton) {
    serverSingleton = new rpc.Server(RPC_URL, { allowHttp: false });
  }
  return serverSingleton;
}

function topicScVal(symbol: string): xdr.ScVal {
  return xdr.ScVal.scvSymbol(symbol);
}

function topicToXdrString(scVal: xdr.ScVal): string {
  return scVal.toXDR("base64");
}

export async function fetchRecentContributions(
  contractId: string,
  limit = 10
): Promise<ContributorEntry[]> {
  const s = server();
  const latest = await s.getLatestLedger();
  // El RPC público de testnet sólo retiene eventos de una ventana reciente.
  // Si pides un startLedger fuera de esa ventana, la respuesta vuelve VACÍA
  // en silencio — sin error — y el feed parece roto aunque haya aportes.
  // 4.000 ledgers ≈ 5,5 h a 5 s por ledger: cubre una sesión completa con
  // margen y queda cómodamente dentro de la retención.
  const lookback = 4_000;
  const startLedger = Math.max(latest.sequence - lookback, 1);

  const filters = [
    {
      type: "contract" as const,
      contractIds: [contractId],
      topics: [[topicToXdrString(topicScVal(TOPIC_CONTRIBUTE)), "*"]],
    },
  ];

  let cursor: string | undefined = undefined;
  const all: ContributorEntry[] = [];
  // Paginate up to a sane bound so we don't hammer the RPC.
  for (let i = 0; i < 5; i += 1) {
    const req = cursor
      ? { cursor, filters, limit: 100 }
      : { startLedger, filters, limit: 100 };
    const res: rpc.Api.GetEventsResponse = await s.getEvents(req);
    for (const ev of res.events) {
      const topics = (ev.topic ?? []) as xdr.ScVal[];
      if (topics.length < 2) continue;
      const from = Address.fromScVal(topics[1]).toString();
      const value = ev.value as xdr.ScVal;
      const payload = scValToNative(value);
      // payload is a struct { amount, total_raised } emitted as a map
      let amount: bigint = 0n;
      if (payload && typeof payload === "object" && !Array.isArray(payload)) {
        const candidate = (payload as Record<string, unknown>).amount;
        if (typeof candidate === "bigint") amount = candidate;
        else if (typeof candidate === "string") amount = BigInt(candidate);
        else if (typeof candidate === "number") amount = BigInt(candidate);
      } else if (Array.isArray(payload) && payload.length > 0) {
        const candidate = payload[0];
        if (typeof candidate === "bigint") amount = candidate;
        else if (typeof candidate === "string") amount = BigInt(candidate);
        else if (typeof candidate === "number") amount = BigInt(candidate);
      }
      all.push({
        address: from,
        amount,
        timestamp: Number(ev.ledgerClosedAt ? Date.parse(ev.ledgerClosedAt) / 1000 : 0),
        txHash: ev.txHash ?? "",
      });
    }
    if (!res.cursor || res.events.length === 0) break;
    cursor = res.cursor;
  }

  // Most recent first; cap to limit.
  all.sort((a, b) => b.timestamp - a.timestamp);
  return all.slice(0, limit);
}
