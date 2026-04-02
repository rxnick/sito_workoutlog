'use client';

import { createContext, useState, useEffect } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('system'); // 'light', 'dark', o 'system'

  // 1. Al primo caricamento, recuperiamo la scelta salvata (se esiste)
  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') || 'system';
    setTheme(savedTheme);
  }, []);

  // 2. Ogni volta che il tema cambia, aggiorniamo il browser
  useEffect(() => {
    const root = document.documentElement; // Prende il tag <html>

    if (theme === 'system') {
      localStorage.removeItem('app-theme');
      // Controlla cosa preferisce il sistema
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.setAttribute('data-theme', 'dark');
      } else {
        root.removeAttribute('data-theme');
      }
    } else {
      // Forza il tema scelto e salvalo
      localStorage.setItem('app-theme', theme);
      root.setAttribute('data-theme', theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};