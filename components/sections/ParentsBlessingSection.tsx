import { Reveal } from "@/components/ui/Reveal";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { brideParents, groomParents } from "@/config/family";
import styles from "./ParentsBlessingSection.module.css";

const blessingIntro =
  "Con la bendición de nuestros padres, celebramos el comienzo de una nueva etapa.";
const blessingOutro =
  "Acompañados por el amor de nuestras familias y llenos de gratitud por el camino que nos ha traído hasta aquí, los invitamos con todo el corazón a compartir y ser testigos del momento en que uniremos nuestras vidas en matrimonio.";

function ParentsColumn({ label, names }: { label: string; names: string[] }) {
  return (
    <div>
      <div className={styles.columnLabel}>{label}</div>
      <div className={styles.columnNames}>
        {names.map((name) => (
          <div key={name}>{name}</div>
        ))}
      </div>
    </div>
  );
}

/** Parents' blessing section, listing both families beneath a short dedication. */
export function ParentsBlessingSection() {
  return (
    <section className={styles.section}>
      <Reveal>
        <GoldDivider width={28} margin="0 auto 26px" />
        <p className={styles.dedication}>{blessingIntro}</p>
        <div className={styles.columns}>
          <ParentsColumn label={brideParents.label} names={brideParents.names} />
          <ParentsColumn label={groomParents.label} names={groomParents.names} />
        </div>
        <p className={styles.dedicationOutro}>{blessingOutro}</p>
      </Reveal>
    </section>
  );
}
