
'use client';

import { useState, useEffect, useCallback } from 'react';

const CURRENCY_STORAGE_KEY = 'finroute-currency';

export function useCurrency() {
  const [currency, setCurrency] = useState('ZAR');

  useEffect(() => {
    try {
      const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (storedCurrency) {
        setCurrency(storedCurrency);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key “${CURRENCY_STORAGE_KEY}”:`, error);
    }
  }, []);

  const handleSetCurrency = useCallback((newCurrency: string) => {
    try {
        window.localStorage.setItem(CURRENCY_STORAGE_KEY, newCurrency);
        setCurrency(newCurrency);
        // Dispatch a storage event to notify other tabs
        window.dispatchEvent(new Event('storage'));
    } catch (error) {
      console.warn(`Error setting localStorage key “${CURRENCY_STORAGE_KEY}”:`, error);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent | Event) => {
        // The event from dispatchEvent doesn't have key/newValue, so we check the type.
        if ('key' in event && event.key !== CURRENCY_STORAGE_KEY) return;
        
        const storedCurrency = window.localStorage.getItem(CURRENCY_STORAGE_KEY);
        if (storedCurrency) {
            setCurrency(storedCurrency);
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);


  return { currency, setCurrency: handleSetCurrency };
}
