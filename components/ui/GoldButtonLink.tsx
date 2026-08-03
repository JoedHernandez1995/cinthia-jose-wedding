import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./GoldButtonLink.module.css";

interface GoldButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

/** The recurring solid-gold call-to-action link used across sections. */
export function GoldButtonLink({ children, ...anchorProps }: GoldButtonLinkProps) {
  return (
    <a {...anchorProps} className={styles.button}>
      {children}
    </a>
  );
}
