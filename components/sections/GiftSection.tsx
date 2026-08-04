"use client";

import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { giftAccounts } from "@/config/site";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import styles from "./GiftSection.module.css";

const giftIntroCopy =
  "Lo que más deseamos es compartir este día con ustedes y celebrar a su lado el comienzo de esta nueva etapa." + 
  " Su presencia y cariño son el mejor regalo que podríamos recibir. Si desean tener un detalle con nosotros, " +
  "agradeceremos de corazón una contribución para nuestros nuevos proyectos y sueños.";

/** "Más Que Un Regalo" section: gift-registry accounts with copy-to-clipboard buttons. */
export function GiftSection() {
  const { copiedIndex, copy } = useCopyToClipboard();

  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Para Nuestros Sueños</div>
        <GoldDivider width={28} margin="0 auto" />
        <p className={styles.intro}>{giftIntroCopy}</p>
        <div className={styles.accountList}>
          {giftAccounts.map((account, index) => (
            <div key={account.label} className={styles.accountCard}>
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
