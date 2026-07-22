import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from '../i18n/translations';

type Theme = 'light' | 'dark';

interface ThemeLanguageContextType {
  theme: Theme;
  language: Language;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const ThemeLanguageContext = createContext<ThemeLanguageContextType | undefined>(undefined);

export const ThemeLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('recroot_theme') as Theme) || 'light';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('recroot_lang') as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('recroot_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const setLanguage = (lang: Language) => {
    localStorage.setItem('recroot_lang', lang);
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    const dict = translations[language];
    return dict[key] || translations['en'][key] || key;
  };

  return (
    <ThemeLanguageContext.Provider value={{ theme, language, toggleTheme, setLanguage, t }}>
      <div className={language === 'bn' ? 'bn-font' : ''}>
        {children}
      </div>
    </ThemeLanguageContext.Provider>
  );
};

export const useThemeLanguage = () => {
  const context = useContext(ThemeLanguageContext);
  if (!context) {
    throw new Error('useThemeLanguage must be used within a ThemeLanguageProvider');
  }
  return context;
};
