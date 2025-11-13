import { useEffect, useRef } from "react";

export function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef<() => void>();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return undefined;
    const tick = () => savedCallback.current?.();
    const id = window.setInterval(tick, delay);
    return () => window.clearInterval(id);
  }, [delay]);
}

