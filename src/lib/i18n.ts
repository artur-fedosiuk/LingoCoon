// i18n.ts
// This file sets up the translation system (i18next).
// It loads language files directly to avoid network issues.
'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../../public/locales/en/translation.json';
import itTranslation from '../../public/locales/it/translation.json';
import frTranslation from '../../public/locales/fr/translation.json';
import ukTranslation from '../../public/locales/uk/translation.json';

const resources = {
  en: { translation: enTranslation },
  it: { translation: itTranslation },
  fr: { translation: frTranslation },
  uk: { translation: ukTranslation },
};

if (!i18n.isInitialized) {
  i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources,
      fallbackLng: 'en',
      supportedLngs: ['en', 'it', 'fr', 'uk'],
      nonExplicitSupportedLngs: true,
      load: 'languageOnly',
      debug: process.env.NODE_ENV === 'development',
      defaultNS: 'translation',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      detection: {
        order: ['localStorage', 'navigator'],
        caches: ['localStorage'],
      },
    });
}

export default i18n;