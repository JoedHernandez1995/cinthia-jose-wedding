import styles from "./GoldDivider.module.css";

interface GoldDividerProps {
  width: number;
  margin: string;
}

/** Thin gold rule used as a decorative separator under headings. */
export function GoldDivider({ width, margin }: GoldDividerProps) {
  return <div className={styles.divider} style={{ width, margin }} />;
}
