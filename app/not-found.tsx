import { GoldDivider } from "@/components/ui/GoldDivider";
import { GoldButtonLink } from "@/components/ui/GoldButtonLink";
import { coupleNames } from "@/config/site";
import styles from "./not-found.module.css";

/** Site-wide 404, styled to match the invitation itself — the fallback for any URL that doesn't match a real route. */
export default function NotFound() {
  return (
    <div className={styles.wrap}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/monogram.png" alt={`Monograma ${coupleNames.full}`} className={styles.monogram} />
      <div className={styles.eyebrow}>404</div>
      <h1 className={styles.heading}>Página no encontrada</h1>
      <p className={styles.note}>Este enlace no existe o ya no está disponible. Revisa que lo hayas copiado correctamente.</p>
      <GoldDivider width={28} margin="0 auto 32px" />
      <GoldButtonLink href="/">Volver al inicio</GoldButtonLink>
    </div>
  );
}
