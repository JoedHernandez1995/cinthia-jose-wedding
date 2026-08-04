"use client";

import type { ReactNode } from "react";
import { buildCalendarIcsContent, type CalendarEventInput } from "@/lib/calendar";
import styles from "./AddToCalendarButton.module.css";

interface AddToCalendarButtonProps {
  event: CalendarEventInput;
  fileName: string;
  children: ReactNode;
}

function isIos(): boolean {
  return typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
}

/**
 * A plain `<a href="data:...">` with a `download` attribute silently does nothing on iOS Safari
 * and most in-app browsers (WhatsApp/Instagram/Facebook), which is where guests actually tap this
 * link from. iOS instead recognizes a `text/calendar` data URI when navigated to directly (no
 * `download` attribute), prompting to add the event to Calendar; everywhere else, a Blob object
 * URL triggers a real file download.
 */
export function AddToCalendarButton({ event, fileName, children }: AddToCalendarButtonProps) {
  function handleClick() {
    const icsContent = buildCalendarIcsContent(event);

    if (isIos()) {
      window.location.href = `data:text/calendar;charset=utf-8,${encodeURIComponent(icsContent)}`;
      return;
    }

    const blobUrl = URL.createObjectURL(new Blob([icsContent], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(blobUrl);
  }

  return (
    <button type="button" onClick={handleClick} className={styles.button}>
      {children}
    </button>
  );
}
