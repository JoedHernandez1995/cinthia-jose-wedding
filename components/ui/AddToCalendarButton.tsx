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
 * link from. Safari also increasingly blocks script-triggered top-level navigation to `data:`
 * URIs outright (anti-phishing hardening), so even navigating directly to one isn't reliable
 * anymore. A `Blob` object URL avoids both problems: Safari fetches it like a real file, still
 * sees its `text/calendar` MIME type, and prompts to add the event to Calendar. Everywhere else,
 * the same object URL is used to trigger a real file download via a temporary `<a download>`.
 */
export function AddToCalendarButton({ event, fileName, children }: AddToCalendarButtonProps) {
  function handleClick() {
    const icsContent = buildCalendarIcsContent(event);
    const blobUrl = URL.createObjectURL(new Blob([icsContent], { type: "text/calendar;charset=utf-8" }));

    if (isIos()) {
      // Don't revoke here — navigation is async, and Safari needs the URL to still be valid by
      // the time it fetches it. Let it get garbage-collected on page unload instead.
      window.location.href = blobUrl;
      return;
    }

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
