import { useState, useEffect } from 'react';

export default function useDarkMode() {
  const [darkMode, setDarkMode] = useState(() => {
    // Vérifier les préférences système
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }

    // Mettre à jour les variables CSS
    if (darkMode) {
      root.style.setProperty('--bg-primary', '#111827');
      root.style.setProperty('--bg-secondary', '#1F2937');
      root.style.setProperty('--text-primary', '#F9FAFB');
      root.style.setProperty('--text-secondary', '#D1D5DB');
      root.style.setProperty('--border-color', '#374151');
    } else {
      root.style.setProperty('--bg-primary', '#FFFFFF');
      root.style.setProperty('--bg-secondary', '#F3F4F6');
      root.style.setProperty('--text-primary', '#111827');
      root.style.setProperty('--text-secondary', '#4B5563');
      root.style.setProperty('--border-color', '#E5E7EB');
    }
  }, [darkMode]);

  // Écouter les changements de préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const savedTheme = localStorage.getItem('theme');
      if (!savedTheme) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  return [darkMode, toggleDarkMode];
}
