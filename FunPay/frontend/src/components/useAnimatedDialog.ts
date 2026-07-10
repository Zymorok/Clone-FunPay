import { useCallback, useEffect, useRef, useState } from "react";

const dialogExitDurationMs = 180;

export function useAnimatedDialog(onClose: () => void) {
  const [isClosing, setIsClosing] = useState(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isClosing) {
      return;
    }

    const timerId = window.setTimeout(() => onCloseRef.current(), dialogExitDurationMs);
    return () => window.clearTimeout(timerId);
  }, [isClosing]);

  const requestClose = useCallback(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      onCloseRef.current();
      return;
    }

    setIsClosing(true);
  }, []);

  return { isClosing, requestClose };
}
