import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'starry-fantasy' | 'white';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'wangfeng-color-theme';

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('starry-fantasy');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (savedTheme === 'starry-fantasy' || savedTheme === 'white') {
      setTheme(savedTheme);
    } else {
      document.documentElement.classList.add('starry-fantasy');
      document.body.classList.add('starry-fantasy');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, theme);
    document.documentElement.classList.remove('starry-fantasy', 'white');
    document.body.classList.remove('starry-fantasy', 'white');
    document.documentElement.classList.add(theme);
    document.body.classList.add(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'starry-fantasy' ? 'white' : 'starry-fantasy'));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
