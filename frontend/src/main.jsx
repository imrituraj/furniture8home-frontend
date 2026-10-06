import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { LanguageProvider } from './i18n/LanguageContext.jsx';
import { CategoriesProvider } from './lib/categories.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LanguageProvider>
      <CategoriesProvider>
        <App />
      </CategoriesProvider>
    </LanguageProvider>
  </StrictMode>,
);
