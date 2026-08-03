import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";
import { GoldDivider } from "@/components/ui/GoldDivider";
import { sectionIds } from "@/config/site";
import styles from "./StorySection.module.css";

const storyParagraphs = [
  "Hace 11 años, nuestra historia comenzó en la universidad, dentro de un grupo de amigos. Con el tiempo, esas conversaciones fueron encontrando un espacio solo para nosotros dos, y desde entonces siempre nos hemos elegido el uno al otro, una y otra vez.",
  "En la primavera de 2025, viajamos juntos a Nueva York. Una tarde, en Cornelia Street —una calle con un significado muy especial para nosotros— entre risas y nervios, nos comprometimos para siempre.",
  "Ahora, rodeados de las personas que más amamos, no podemos esperar a celebrar el comienzo de nuestro próximo capítulo juntos.",
];

/** "Nuestra Historia" section: lace-framed photo alongside the couple's story copy. */
export function StorySection() {
  return (
    <section id={sectionIds.historia} className={styles.section}>
      <Reveal>
        <div className={styles.headingWrap}>
          <div className={styles.heading}>Nuestra Historia</div>
          <GoldDivider width={28} margin="0 auto" />
        </div>
        <div className={styles.grid}>
          <div>
            <div className={styles.photoFrame}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/lace-frame.png" alt="" className={styles.laceFrame} />
              <Photo id="couple-1" alt="Foto de la pareja" className={styles.storyPhoto} />
            </div>
          </div>
          <div>
            <div className={styles.paragraphs}>
              {storyParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
