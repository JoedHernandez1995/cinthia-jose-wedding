import type { AnchorHTMLAttributes, ReactNode } from "react";
import styles from "./OutlineButtonLink.module.css";

interface OutlineButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode;
}

/** The gold-outlined secondary link used for "Ver Ejemplos" style actions. */
export function OutlineButtonLink({ children, ...anchorProps }: OutlineButtonLinkProps) {
  return (
    <a {...anchorProps} className={styles.button}>
      {children}
    </a>
  );
}
