export type CrowdfundingInstance = {
  id: "active" | "expired";
  label: string;
  description: string;
  contractId: string;
};

export const NETWORK_PASSPHRASE = "Test SDF Network ; September 2015";
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL || "https://soroban-testnet.stellar.org";

const ACTIVE = (process.env.NEXT_PUBLIC_CONTRACT_ID || "").trim();
const EXPIRED = (process.env.NEXT_PUBLIC_CONTRACT_ID_EXPIRED || "").trim();

export const INSTANCES: CrowdfundingInstance[] = [
  {
    id: "active",
    label: "Vaca en vivo",
    description: "Instancia activa de la charla",
    contractId: ACTIVE,
  },
  {
    id: "expired",
    label: "Vaca expirada",
    description: "Demo de refund (deadline ya pasó)",
    contractId: EXPIRED,
  },
].filter((i) => i.contractId.length > 0) as CrowdfundingInstance[];

export function defaultInstance(): CrowdfundingInstance | null {
  return INSTANCES[0] ?? null;
}
