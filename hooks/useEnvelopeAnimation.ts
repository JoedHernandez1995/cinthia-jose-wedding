import { useState } from "react";

const ENVELOPE_CLOSE_ANIMATION_MS = 700;

/** Manages the intro envelope's open/close transition timing. */
export function useEnvelopeAnimation() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const open = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(true);
      setIsClosing(false);
    }, ENVELOPE_CLOSE_ANIMATION_MS);
  };

  return { isOpen, isClosing, open };
}
