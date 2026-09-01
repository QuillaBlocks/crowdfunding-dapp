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
    label: "Pool Comunitario",
    description: "La vaca de la sesión — contribuye aquí",
    contractId: ACTIVE,
  },
  {
    id: "expired",
    label: "Demo del speaker",
    description: "Meta baja, para demostrar withdraw en vivo",
    contractId: EXPIRED,
  },
].filter((i) => i.contractId.length > 0) as CrowdfundingInstance[];

export function defaultInstance(): CrowdfundingInstance | null {
  return INSTANCES[0] ?? null;
}
