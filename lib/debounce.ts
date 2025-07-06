import { useState, useCallback } from 'react';

export const useLeadingEdgeDebounce = (func: Function, delay: number = 300) => {
  const [debounceTimeout, setDebounceTimeout] = useState<string | number | NodeJS.Timeout | null>(null);
  const debounce = useCallback(
    (...args: unknown[]) => {
      if (debounceTimeout) return;
      func(...args);
      setDebounceTimeout(
        setTimeout(() => {
          setDebounceTimeout(null);
        }, delay)
      );
    },
    [debounceTimeout, func, delay]
  );
  return debounce;
}

export const useTrailingEdgeDebounce = (func: Function, delay: number = 300) => {
  const [debounceTimeout, setDebounceTimeout] = useState<string | number | NodeJS.Timeout | null>(null);
  const debounce = useCallback(
    (...args:unknown[]) => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      setDebounceTimeout(
        setTimeout(() => {
          func(...args);
          setDebounceTimeout(null);
        }, delay)
      );
    },
    [debounceTimeout, func, delay]
  )
  return debounce;
}

