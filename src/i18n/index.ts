import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from '../locales/en/translation.json';
import koTranslation from '../locales/ko/translation.json';

const locales = Localization.getLocales();
const deviceLanguage = locales?.[0]?.languageCode || 'ko';
const defaultLang = deviceLanguage === 'ko' ? 'ko' : 'en';

i18n.use(initReactI18next).init({
  resources: {
    ko: { translation: koTranslation },
    en: { translation: enTranslation },
  },
  // lng: 'en', // 언어 영어로 테스트 하려면 이거 사용
  lng: defaultLang, // 기기 언어에 따라 자동 설정 (기본값)
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
