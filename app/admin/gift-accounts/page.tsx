import { getGiftAccounts } from "@/lib/content";
import { GiftAccountSection } from "./GiftAccountSection";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function AdminGiftAccountsPage() {
  const [local, abroad] = await Promise.all([getGiftAccounts("local"), getGiftAccounts("abroad")]);

  return (
    <div>
      <h1 className={styles.heading}>Cuentas de regalo</h1>
      <GiftAccountSection title="Cuentas locales" audience="local" accounts={local} />
      <GiftAccountSection title="Cuentas en el extranjero" audience="abroad" accounts={abroad} />
    </div>
  );
}
