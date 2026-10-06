import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { fill, STRINGS } from './strings.js';
import { BADGES_AS, PRODUCTS_AS } from './asProducts.js';

const LANG_KEY = 'f8h_lang';
const LanguageContext = createContext(null);

function readLang() {
  const saved = localStorage.getItem(LANG_KEY);
  if (saved === 'as' || saved === 'en') return saved;
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(readLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
  }, [lang]);

  const value = useMemo(() => {
    const dict = STRINGS[lang];
    function t(key, vars) {
      const raw = dict[key] ?? STRINGS.en[key] ?? key;
      return vars ? fill(raw, vars) : raw;
    }
    function toggleLang() {
      setLang((current) => (current === 'en' ? 'as' : 'en'));
    }
    function localize(product) {
      if (lang !== 'as' || !product) return product;
      const extra = product.as || PRODUCTS_AS[product.id] || {};
      return {
        ...product,
        name: extra.name || product.name,
        desc: extra.desc || product.desc,
        badge: BADGES_AS[product.badge] || product.badge,
      };
    }
    return { lang, t, toggleLang, localize };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLang() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLang must be used within LanguageProvider');
  return value;
}
