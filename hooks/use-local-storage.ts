import { useState } from 'react';

type StorableValue = string | number | boolean | Record<string, unknown>;

const useLocalStorage = <T extends StorableValue>(key: string, initialValue: T) => {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = localStorage.getItem(key);
      if (storedValue !== null) {
        return JSON.parse(storedValue) as T;
      } else {
        localStorage.setItem(key, JSON.stringify(initialValue));
        return initialValue;
      }
    } catch (error) {
      console.error('Error reading localStorage key:', key, error);
      localStorage.setItem(key, JSON.stringify(initialValue));
      return initialValue;
    }
  });

  const saveToLocalStorage = (newValue: T) => {
    try {
      setValue(newValue);
      localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error writing to localStorage key:', key, error);
    }
  };

  return [value, saveToLocalStorage] as const;
};

export { useLocalStorage };
