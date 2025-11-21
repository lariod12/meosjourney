import { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { homeLocales } from '../locales/home';

const LanguageContext = createContext(null);

const normalizeToString = (value) => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({ initialLang = 'vi', children }) => {
  const [lang, setLang] = useState(initialLang);

  const getLocalized = useCallback((translations, fallback = '') => {
    const normalizedFallback = normalizeToString(fallback);

    if (!translations) {
      return normalizedFallback;
    }

    if (typeof translations === 'string') {
      const normalized = normalizeToString(translations);
      return normalized || normalizedFallback;
    }

    if (typeof translations !== 'object') {
      return normalizedFallback;
    }

    // Handle array format from NocoDB: [{"en":"..."}, {"vi":"..."}]
    let translationsObj = translations;
    if (Array.isArray(translations)) {
      translationsObj = {};
      translations.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.assign(translationsObj, item);
        }
      });
    }

    const currentKey = (typeof lang === 'string' ? lang : 'en').toLowerCase();
    const primary = normalizeToString(translationsObj[currentKey]);
    if (primary) {
      return primary;
    }

    const fallbackKey = currentKey === 'vi' ? 'en' : 'vi';
    const alternate = normalizeToString(translationsObj[fallbackKey]);
    if (alternate) {
      return alternate;
    }

    const enValue = normalizeToString(translationsObj.en);
    if (enValue) {
      return enValue;
    }

    const viValue = normalizeToString(translationsObj.vi);
    if (viValue) {
      return viValue;
    }

    return normalizedFallback;
  }, [lang]);

  const t = useMemo(() => {
    const dict = homeLocales[lang] || {};
    return (key) => {
      const value = dict[key];
      return typeof value === 'string' ? value : key;
    };
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t, getLocalized }), [lang, t, getLocalized]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
