export const STROOPS_PER_XLM = 10_000_000n;

export function stroopsToXlm(amount: bigint | string | number): string {
  const big = typeof amount === "bigint" ? amount : BigInt(amount);
  const negative = big < 0n;
  const abs = negative ? -big : big;
  const whole = abs / STROOPS_PER_XLM;
  const frac = abs % STROOPS_PER_XLM;
  const fracStr = frac.toString().padStart(7, "0").replace(/0+$/, "");
  const sign = negative ? "-" : "";
  if (!fracStr) return `${sign}${whole.toString()}`;
  return `${sign}${whole.toString()}.${fracStr}`;
}

export function xlmToStroops(xlm: string): bigint {
  const cleaned = xlm.trim();
  if (!cleaned) throw new Error("Monto vacío");
  if (!/^\d+(\.\d+)?$/.test(cleaned)) throw new Error("Monto inválido");
  const [whole, frac = ""] = cleaned.split(".");
  if (frac.length > 7) throw new Error("Máximo 7 decimales");
  const wholeBig = BigInt(whole) * STROOPS_PER_XLM;
  const fracBig = BigInt(frac.padEnd(7, "0"));
  return wholeBig + fracBig;
}

export function formatXlm(stroops: bigint | string | number, decimals = 2): string {
  const num = Number(stroopsToXlm(stroops));
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function truncateAddress(addr: string, head = 4, tail = 4): string {
  if (!addr) return "";
  if (addr.length <= head + tail + 3) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}

export function formatCountdown(secondsLeft: number): {
  days: string;
  hours: string;
  mins: string;
  secs: string;
  expired: boolean;
} {
  if (secondsLeft <= 0) {
    return { days: "0", hours: "00", mins: "00", secs: "00", expired: true };
  }
  const days = Math.floor(secondsLeft / 86400);
  const hours = Math.floor((secondsLeft % 86400) / 3600);
  const mins = Math.floor((secondsLeft % 3600) / 60);
  const secs = Math.floor(secondsLeft % 60);
  return {
    days: days.toString(),
    hours: hours.toString().padStart(2, "0"),
    mins: mins.toString().padStart(2, "0"),
    secs: secs.toString().padStart(2, "0"),
    expired: false,
  };
}
