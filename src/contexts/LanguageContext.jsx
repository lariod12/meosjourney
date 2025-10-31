import { createContext, useContext, useMemo, useState } from 'react';
import { homeLocales } from '../locales/home';

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({ initialLang = 'VI', children }) => {
  const [lang, setLang] = useState(initialLang);

  const t = useMemo(() => {
    const dict = homeLocales[lang] || {};
    return (key) => {
      const value = dict[key];
      return typeof value === 'string' ? value : key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
