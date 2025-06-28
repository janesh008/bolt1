import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translations
import enTranslation from './locales/en.json';
import hiTranslation from './locales/hi.json';
import guTranslation from './locales/gu.json';
import taTranslation from './locales/ta.json';
import teTranslation from './locales/te.json';
import mrTranslation from './locales/mr.json';
import bnTranslation from './locales/bn.json';
import esTranslation from './locales/es.json';
import frTranslation from './locales/fr.json';
import arTranslation from './locales/ar.json';

const resources = {
  en: { translation: enTranslation },
  hi: { translation: hiTranslation },
  gu: { translation: guTranslation },
  ta: { translation: taTranslation },
  te: { translation: teTranslation },
  mr: { translation: mrTranslation },
  bn: { translation: bnTranslation },
  es: { translation: esTranslation },
  fr: { translation: frTranslation },
  ar: { translation: arTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;