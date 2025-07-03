import { useState, useCallback } from 'react';

export const useLeadingEdgeDebounce = (func, delay = 300) => {
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const debounce = useCallback(
    (...args) => {
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

export const useTrailingEdgeDebounce = (func, delay = 300) => {
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const debounce = useCallback(
    (...args) => {
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

