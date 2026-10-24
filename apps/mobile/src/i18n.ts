import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import vi from './locales/vi.json';

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  lng: getLocales()[0]?.languageCode === 'vi' ? 'vi' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

// The language picked in Cài đặt wins over the device language once chosen.
export const LANGUAGE_KEY = 'language';
AsyncStorage.getItem(LANGUAGE_KEY)
  .then((saved) => {
    if (saved) void i18n.changeLanguage(saved);
  })
  .catch(() => {});

export default i18n;
