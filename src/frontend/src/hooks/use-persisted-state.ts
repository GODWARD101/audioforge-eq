import { useEffect, useState } from "react";

/**
 * Generic localStorage-backed state hook.
 * Reads the initial value from localStorage and persists on every change.
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch {
      // storage unavailable or malformed
    }
    return initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage unavailable
    }
  }, [key, value]);

  return [value, setValue];
}
