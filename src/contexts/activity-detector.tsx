import { createContext, useState, useEffect, useContext } from 'react';
import type {  Dispatch, SetStateAction } from 'react';

interface ActivityContextType {
  active: boolean;
  inactivityTimeout: number;
  setInactivityTimeout: Dispatch<SetStateAction<number>>;
}

const ActivityContext = createContext<ActivityContextType>({
  active: true,
  inactivityTimeout: 60000, // default 60s
  setInactivityTimeout: () => {},
});

export const useActivity = () => useContext(ActivityContext);

export const ActivityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [active, setActive] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState(10000);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      setActive(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setActive(false), inactivityTimeout);
    };

    const events = ['mousemove', 'keydown', 'scroll', 'click'] as const;
    events.forEach((e) => window.addEventListener(e, resetTimer));

    timeout = setTimeout(() => setActive(false), inactivityTimeout);

    return () => {
      events.forEach((e) => window.removeEventListener(e, resetTimer));
      clearTimeout(timeout);
    };
  }, [inactivityTimeout]); // <-- reset effect if timeout changes

  return (
    <ActivityContext.Provider value={{ active, inactivityTimeout, setInactivityTimeout }}>
      {children}
    </ActivityContext.Provider>
  );
};
