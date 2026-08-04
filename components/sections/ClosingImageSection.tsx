import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";
import styles from "./ClosingImageSection.module.css";

/** Full-bleed closing photo shown right before the footer — the one deliberate break from the site's inset-frame photo treatment. */
export function ClosingImageSection() {
  return (
    <section className={styles.section}>
      <Reveal>
        <Photo id="closing-skyline" alt="José y Cinthia viendo el horizonte de Nueva York" className={styles.image} />
      </Reveal>
    </section>
  );
}
