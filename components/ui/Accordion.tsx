"use client";

import { useState, type ReactNode } from "react";
import styles from "./Accordion.module.css";

interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

interface AccordionProps {
  items: AccordionItem[];
  /** Ids expanded on first render. */
  defaultOpenIds?: string[];
}

/** Vertically stacked, independently-toggleable accordion items — any number can be open at once. */
export function Accordion({ items, defaultOpenIds = [] }: AccordionProps) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set(defaultOpenIds));

  function toggle(id: string) {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id} className={styles.item}>
            <button
              type="button"
              className={styles.trigger}
              aria-expanded={isOpen}
              aria-controls={`accordion-panel-${item.id}`}
              onClick={() => toggle(item.id)}
            >
              {item.title}
              <span className={`${styles.icon} ${isOpen ? styles.iconOpen : ""}`} />
            </button>
            <div
              id={`accordion-panel-${item.id}`}
              className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
            >
              <div className={styles.panelInner}>{item.content}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
