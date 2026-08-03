import { useEffect, useState } from "react";
import type { CountdownUnit } from "@/types/invitation";

const MS_PER_SECOND = 1_000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;

function padToTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

/** Ticks every second and returns days/hours/minutes/seconds remaining until `targetDate`. */
export function useLiveCountdown(targetDate: Date): CountdownUnit[] {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), MS_PER_SECOND);
    return () => clearInterval(intervalId);
  }, []);

  const remainingMs = Math.max(0, targetDate.getTime() - now);

  return [
    { label: "DÍAS", value: padToTwoDigits(Math.floor(remainingMs / MS_PER_DAY)) },
    { label: "HORAS", value: padToTwoDigits(Math.floor((remainingMs % MS_PER_DAY) / MS_PER_HOUR)) },
    { label: "MIN", value: padToTwoDigits(Math.floor((remainingMs % MS_PER_HOUR) / MS_PER_MINUTE)) },
    { label: "SEG", value: padToTwoDigits(Math.floor((remainingMs % MS_PER_MINUTE) / MS_PER_SECOND)) },
  ];
}
