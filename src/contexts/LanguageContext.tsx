import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type AppLanguage = 'tr' | 'en';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  toggleLanguage: () => void;
  t: (trText: string, enText: string) => string;
}

const STORAGE_KEY = 'ybs_app_language';

const LanguageContext = createContext<LanguageContextType>({
  language: 'tr',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (trText) => trText,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'tr') return saved;
    } catch {
      // ignore storage errors
    }
    return 'tr';
  });

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
    document.documentElement.lang = lang;
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  }, [language, setLanguage]);

  const t = useCallback(
    (trText: string, enText: string) => {
      return language === 'en' ? enText : trText;
    },
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
