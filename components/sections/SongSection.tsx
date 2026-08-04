"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/components/ui/Reveal";
import { Photo } from "@/components/ui/Photo";
import styles from "./SongSection.module.css";

// Placeholder — replace with the couple's actual hosted song embed before shipping.
const MUSIC_PLAYER_EMBED_URL = "https://legacy.invitarium.io/mu/451d742d570a415994";

/** "Nuestra Canción" section: spinning vinyl artwork with an embedded music player. */
export function SongSection() {
  // The player is a cross-origin iframe: once the pointer is over it, the iframe's own document
  // handles the click and the event never reaches us. Clicking into it does shift window focus
  // to the iframe though, so we detect that (a window blur landing on our iframe) as a proxy for
  // "the user tapped the player" and use it to stop pulsing the tap hint.
  const [hasInteracted, setHasInteracted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleWindowBlur() {
      if (document.activeElement === iframeRef.current) {
        setHasInteracted(true);
      }
    }
    window.addEventListener("blur", handleWindowBlur);
    return () => window.removeEventListener("blur", handleWindowBlur);
  }, []);

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
            ref={iframeRef}
            src={MUSIC_PLAYER_EMBED_URL}
            className={styles.musicPlayer}
            title="Reproductor de música"
            allow="autoplay"
          />
          {!hasInteracted && (
            <>
              <span className={styles.tapPulseRing} aria-hidden="true" />
              <span className={`${styles.tapPulseRing} ${styles.tapPulseRingDelay}`} aria-hidden="true" />
            </>
          )}
        </div>
        <div className={styles.tapHint}>TOCA PARA REPRODUCIR</div>
        <div className={styles.heading}>Nuestra Canción</div>
        <div className={styles.description}>
          Mucho antes de que hubiera una fecha, un lugar o una boda que planear, hubo pequeños momentos que poco a
          poco se convirtieron en nuestra historia. Esta canción es un pequeño recordatorio de ese camino.
        </div>
      </Reveal>
    </section>
  );
}
