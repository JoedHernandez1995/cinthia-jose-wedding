"use client";

import { useState } from "react";
import styles from "./Photo.module.css";

interface PhotoProps {
  id: string;
  /** Positioning/sizing class supplied by the section that places this photo. */
  className: string;
  alt: string;
}

/** Renders `/photos/{id}.webp`, falling back to a labeled placeholder if the file is missing. */
export function Photo({ id, className, alt }: PhotoProps) {
  const [errored, setErrored] = useState(false);

  if (errored) {
    return <div className={`${styles.placeholder} ${className}`}>{alt}</div>;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/photos/${id}.webp`} alt={alt} className={className} onError={() => setErrored(true)} />;
}
