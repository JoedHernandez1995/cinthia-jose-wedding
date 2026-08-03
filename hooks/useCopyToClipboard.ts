import { useState } from "react";

const COPY_LABEL_RESET_DELAY_MS = 1_800;

/** Tracks which item was most recently copied, for a transient "COPIADO" label. */
export function useCopyToClipboard() {
  const [copiedIndex, setCopiedIndex] = useState(-1);

  const copy = (index: number, text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => {
      setCopiedIndex((current) => (current === index ? -1 : current));
    }, COPY_LABEL_RESET_DELAY_MS);
  };

  return { copiedIndex, copy };
}
