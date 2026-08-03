"use client";

import type { ReactNode } from "react";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import styles from "./Reveal.module.css";

interface RevealProps {
  children: ReactNode;
}

/** Fades and slides its children in the first time they scroll into view. */
export function Reveal({ children }: RevealProps) {
  const { ref, isRevealed } = useRevealOnScroll<HTMLDivElement>();

  return (
    <div ref={ref} className={`${styles.reveal} ${isRevealed ? styles.revealed : ""}`}>
      {children}
    </div>
  );
}
