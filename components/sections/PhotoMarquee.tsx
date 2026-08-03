import { Photo } from "@/components/ui/Photo";
import { marqueePhotoIds } from "@/config/site";
import styles from "./PhotoMarquee.module.css";

/** Infinitely-scrolling photo strip; the id list is duplicated once to make the CSS loop seamless. */
export function PhotoMarquee() {
  const loopedPhotoIds = [...marqueePhotoIds, ...marqueePhotoIds];

  return (
    <section className={styles.section}>
      <div className={styles.track}>
        {loopedPhotoIds.map((id, index) => (
          <Photo key={`${id}-${index}`} id={id} alt="Foto de la pareja" className={styles.photo} />
        ))}
      </div>
    </section>
  );
}
