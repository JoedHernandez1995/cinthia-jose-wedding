import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";
import styles from "./SongSection.module.css";

// Placeholder — replace with the couple's actual hosted song embed before shipping.
const MUSIC_PLAYER_EMBED_URL = "https://legacy.invitarium.io/mu/451d742d570a415994";

/** "Nuestra Canción" section: spinning vinyl artwork with an embedded music player. */
export function SongSection() {
  return (
    <section className={styles.section}>
      <Reveal>
        <div className={styles.vinylWrap}>
          <div className={styles.vinylSpin}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/vinyl.png" alt="Disco de vinilo" className={styles.vinylImage} />
            <Photo id="vinyl-center-photo" alt="Foto" className={styles.vinylCenterPhoto} />
          </div>
          <iframe
            src={MUSIC_PLAYER_EMBED_URL}
            className={styles.musicPlayer}
            title="Reproductor de música"
            allow="autoplay"
          />
        </div>
        <div className={styles.heading}>Nuestra Canción</div>
        <div className={styles.description}>
          Mucho antes de que hubiera una fecha, un lugar o una boda que planear, hubo pequeños momentos que poco a
          poco se convirtieron en nuestra historia. Esta canción es un pequeño recordatorio de ese camino.
        </div>
      </Reveal>
    </section>
  );
}
