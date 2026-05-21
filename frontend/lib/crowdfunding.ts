import { Client, Status, type StatusInfo } from "crowdfunding-client";
import {
  isConnected,
  getAddress,
  signTransaction as freighterSignTransaction,
  requestAccess,
} from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE, RPC_URL } from "./instances";

export { Status };
export type { StatusInfo };

export type ContributorEntry = {
  address: string;
  amount: bigint;
  timestamp: number;
  txHash: string;
};

function readOnlyClient(contractId: string) {
  return new Client({
    contractId,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
  });
}

function writeClient(contractId: string, publicKey: string) {
  return new Client({
    contractId,
    networkPassphrase: NETWORK_PASSPHRASE,
    rpcUrl: RPC_URL,
    publicKey,
    async signTransaction(tx: string) {
      const res = await freighterSignTransaction(tx, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: publicKey,
      });
      if ("error" in res && res.error) {
        throw new Error(typeof res.error === "string" ? res.error : "Firma cancelada");
      }
      const signedTxXdr = (res as { signedTxXdr: string }).signedTxXdr;
      const signerAddress = (res as { signerAddress?: string }).signerAddress || publicKey;
      return { signedTxXdr, signerAddress };
    },
  });
}

function unwrapResult<T>(value: unknown): T {
  if (value && typeof value === "object" && "isOk" in value) {
    const r = value as { isOk: () => boolean; unwrap: () => T; unwrapErr: () => unknown };
    if (!r.isOk()) {
      throw r.unwrapErr();
    }
    return r.unwrap();
  }
  return value as T;
}

export async function fetchStatus(contractId: string): Promise<StatusInfo> {
  const client = readOnlyClient(contractId);
  const tx = await client.get_status();
  return unwrapResult<StatusInfo>(tx.result);
}

export async function fetchAdmin(contractId: string): Promise<string> {
  const client = readOnlyClient(contractId);
  const tx = await client.admin();
  return unwrapResult<string>(tx.result);
}

export async function fetchName(contractId: string): Promise<string> {
  const client = readOnlyClient(contractId);
  const tx = await client.name();
  return unwrapResult<string>(tx.result);
}

export async function fetchContribution(
  contractId: string,
  address: string
): Promise<bigint> {
  const client = readOnlyClient(contractId);
  const tx = await client.get_contribution({ addr: address });
  return BigInt(tx.result as unknown as string | number | bigint);
}

export async function contribute(
  contractId: string,
  publicKey: string,
  amountStroops: bigint
): Promise<{ hash: string }> {
  const client = writeClient(contractId, publicKey);
  const assembled = await client.contribute({
    from: publicKey,
    amount: amountStroops,
  });
  const sent = await assembled.signAndSend();
  unwrapResult<void>(sent.result);
  return {
    hash:
      (sent as { sendTransactionResponse?: { hash?: string } })
        .sendTransactionResponse?.hash ?? "",
  };
}

export async function withdraw(
  contractId: string,
  publicKey: string
): Promise<{ hash: string; amount: bigint }> {
  const client = writeClient(contractId, publicKey);
  const assembled = await client.withdraw();
  const sent = await assembled.signAndSend();
  const amount = unwrapResult<bigint>(sent.result);
  return {
    hash:
      (sent as { sendTransactionResponse?: { hash?: string } })
        .sendTransactionResponse?.hash ?? "",
    amount,
  };
}

export async function refund(
  contractId: string,
  publicKey: string
): Promise<{ hash: string; amount: bigint }> {
  const client = writeClient(contractId, publicKey);
  const assembled = await client.refund({ from: publicKey });
  const sent = await assembled.signAndSend();
  const amount = unwrapResult<bigint>(sent.result);
  return {
    hash:
      (sent as { sendTransactionResponse?: { hash?: string } })
        .sendTransactionResponse?.hash ?? "",
    amount,
  };
}

export async function checkExpiration(
  contractId: string,
  publicKey: string
): Promise<Status> {
  const client = writeClient(contractId, publicKey);
  const assembled = await client.check_expiration();
  const sent = await assembled.signAndSend();
  return unwrapResult<Status>(sent.result);
}

export async function detectFreighter(): Promise<boolean> {
  try {
    const res = await isConnected();
    return Boolean(res?.isConnected);
  } catch {
    return false;
  }
}

export async function connectFreighter(): Promise<string> {
  const access = await requestAccess();
  if ("error" in access && access.error) {
    throw new Error(
      typeof access.error === "string" ? access.error : "Acceso a Freighter denegado"
    );
  }
  const addr = (access as { address?: string }).address;
  if (addr) return addr;
  const fallback = await getAddress();
  if ("error" in fallback && fallback.error) {
    throw new Error("No se pudo obtener la dirección de Freighter");
  }
  return (fallback as { address: string }).address;
}
