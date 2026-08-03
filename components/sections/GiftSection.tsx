"use client";

import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { giftAccounts } from "@/config/site";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import styles from "./GiftSection.module.css";

const giftIntroCopy =
  "Lo único que realmente necesitamos ese día es tenerlos cerca, celebrando con nosotros el inicio de esta nueva etapa. " +
  "Su cariño y su presencia ya son suficiente. Si desean tener un gesto con nosotros, una contribución en efectivo " +
  "para nuestra nueva etapa sería recibida con todo nuestro cariño.";

/** "Más Que Un Regalo" section: gift-registry accounts with copy-to-clipboard buttons. */
export function GiftSection() {
  const { copiedIndex, copy } = useCopyToClipboard();

  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.heading}>Más Que Un Regalo</div>
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
