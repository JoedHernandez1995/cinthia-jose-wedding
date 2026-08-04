"use client";

import { useEffect, useState } from "react";
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

/** Fixed top navigation linking to the invitation's main sections; collapses into a hamburger menu on mobile. */
export function NavBar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Closing on Escape and on route-less anchor navigation (link click) keeps the mobile menu
  // from staying open over the section the user just jumped to.
  useEffect(() => {
    if (!isMenuOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMenuOpen]);

  return (
    <nav className={styles.nav}>
      <div className={styles.navLinks}>
        {navLinks.map((link) => (
          <a key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
          </a>
        ))}
      </div>
      <button
        type="button"
        className={styles.menuButton}
        aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={isMenuOpen}
        aria-controls="mobile-nav-menu"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span className={`${styles.menuIcon} ${isMenuOpen ? styles.menuIconOpen : ""}`} />
      </button>
      {isMenuOpen && (
        <div id="mobile-nav-menu" className={styles.mobileMenu}>
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={styles.mobileNavLink}
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </nav>
  );
}
