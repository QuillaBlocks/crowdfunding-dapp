"use client";

import { useEffect, useState } from "react";

const COLORS = ["#E63946", "#F77F00", "#FFD23F", "#3FAE94", "#ffffff"];

type Piece = {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  shape: "square" | "circle" | "triangle";
};

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 2 + Math.random() * 2.5,
    size: 6 + Math.random() * 12,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: (["square", "circle", "triangle"] as const)[
      Math.floor(Math.random() * 3)
    ],
  }));
}

type Props = {
  active: boolean;
};

export function Confetti({ active }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setPieces(makePieces(80));
    setVisible(true);
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, [active]);

  if (!visible) return null;
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute -top-10 animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.shape === "triangle" ? "transparent" : p.color,
            borderRadius: p.shape === "circle" ? "50%" : 0,
            clipPath:
              p.shape === "triangle"
                ? "polygon(50% 0%, 0% 100%, 100% 100%)"
                : undefined,
            ...(p.shape === "triangle"
              ? { borderBottom: `${p.size}px solid ${p.color}` }
              : {}),
            boxShadow: `0 0 12px ${p.color}40`,
          }}
        />
      ))}
    </div>
  );
}
