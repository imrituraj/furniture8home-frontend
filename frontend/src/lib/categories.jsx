import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import bundledCategories from '../data/categories.json';
import { API_URL } from './catalog.js';
import { useLang } from '../i18n/LanguageContext.jsx';

const CategoriesContext = createContext(null);

async function fetchCategories() {
  const res = await fetch(`${API_URL}/api/categories`);
  if (!res.ok) throw new Error(`Categories request failed (${res.status})`);
  return res.json();
}

/**
 * Categories managed from the admin dashboard. Starts with the copy bundled in the build
 * and swaps in the live list once the API answers.
 */
export function CategoriesProvider({ children }) {
  const [list, setList] = useState(bundledCategories);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((live) => {
        if (!cancelled && Array.isArray(live)) setList(live);
      })
      .catch((err) => console.warn('Using bundled categories:', err.message));
    return () => {
      cancelled = true;
    };
  }, []);

  return <CategoriesContext.Provider value={list}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const list = useContext(CategoriesContext);
  const { lang } = useLang();
  if (!list) throw new Error('useCategories must be used within CategoriesProvider');

  return useMemo(() => {
    const byId = new Map(list.map((c) => [c.id, c]));
    return {
      list,
      // Falls back to the raw id for products whose category was removed from the list
      label(id) {
        const c = byId.get(id);
        if (!c) return id;
        return lang === 'as' && c.nameAs ? c.nameAs : c.name;
      },
      offersChaise: (id) => byId.get(id)?.chaise === true,
    };
  }, [list, lang]);
}
