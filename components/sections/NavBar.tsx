import { sectionIds } from "@/config/site";
import styles from "./NavBar.module.css";

const navLinks = [
  { href: `#${sectionIds.historia}`, label: "HISTORIA" },
  { href: `#${sectionIds.detalles}`, label: "DETALLES" },
  { href: `#${sectionIds.rsvp}`, label: "RSVP" },
  { href: `#${sectionIds.vestimenta}`, label: "VESTIMENTA" },
  { href: `#${sectionIds.recomendaciones}`, label: "RECOMENDACIONES" },
  { href: `#${sectionIds.faq}`, label: "PREGUNTAS" },
];

/** Fixed top navigation linking to the invitation's main sections. */
export function NavBar() {
  return (
    <nav className={styles.nav}>
      {navLinks.map((link) => (
        <a key={link.href} href={link.href} className={styles.navLink}>
          {link.label}
        </a>
      ))}
    </nav>
  );
}
