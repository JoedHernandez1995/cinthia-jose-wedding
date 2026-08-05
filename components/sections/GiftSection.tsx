"use client";

import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { giftAccountsAbroad, giftAccountsLocal } from "@/config/site";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import type { GuestViewModel } from "@/types/guest";
import styles from "./GiftSection.module.css";

const giftIntroCopy =
  "Lo que más deseamos es compartir este día con ustedes y celebrar a su lado el comienzo de esta nueva etapa." +
  " Su presencia y cariño son el mejor regalo que podríamos recibir. Si desean tener un detalle con nosotros, " +
  "agradeceremos de corazón una contribución para nuestros nuevos proyectos y sueños.";

interface GiftSectionProps {
  guest: GuestViewModel;
}

/** "Más Que Un Regalo" section: gift-registry accounts with copy-to-clipboard buttons — local bank accounts, or PayPal/Venmo for guests traveling from abroad. */
export function GiftSection({ guest }: GiftSectionProps) {
  const { copiedIndex, copy } = useCopyToClipboard();
  const giftAccounts = guest.guestLocation === "extranjero" ? giftAccountsAbroad : giftAccountsLocal;

  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Para Nuestros Sueños</div>
        <GoldDivider width={28} margin="0 auto" />
        <p className={styles.intro}>{giftIntroCopy}</p>
        <div className={styles.accountList}>
          {giftAccounts.map((account, index) => (
            // `account.label` isn't unique — giftAccountsLocal has two accounts labeled "CUENTA EN
            // LEMPIRAS · HONDURAS" (BAC and FICOHSA) and two "CUENTA EN DÓLARES · HONDURAS".
            // Duplicate keys made React's reconciliation misbehave across re-renders (e.g. toggling
            // guest location back and forth in the debug panel), showing stale/duplicated cards.
            // `copyText` (the actual account number/handle) is always unique per account.
            <div key={`${account.label}-${account.copyText}`} className={styles.accountCard}>
              <div className={styles.accountHeader}>
                <div className={styles.accountLabel}>{account.label}</div>
                <button onClick={() => copy(index, account.copyText)} className={styles.copyButton}>
                  {copiedIndex === index ? "COPIADO" : "COPIAR"}
                </button>
              </div>
              <div className={styles.accountLine}>{account.primaryLine}</div>
              {account.secondaryLine && <div className={styles.accountLine}>{account.secondaryLine}</div>}
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
