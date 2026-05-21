"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { connectFreighter, detectFreighter } from "@/lib/crowdfunding";

type WalletState = {
  publicKey: string | null;
  hasFreighter: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const WalletContext = createContext<WalletState | undefined>(undefined);

const STORAGE_KEY = "crowdfunding:wallet";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [hasFreighter, setHasFreighter] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    detectFreighter().then(setHasFreighter);
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setPublicKey(saved);
    }
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      const addr = await connectFreighter();
      setPublicKey(addr);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, addr);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo conectar Freighter");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const value = useMemo(
    () => ({ publicKey, hasFreighter, connecting, error, connect, disconnect }),
    [publicKey, hasFreighter, connecting, error, connect, disconnect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}
