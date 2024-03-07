import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import enT from './locales/en/translation.json';
import zh_cnT from './locales/zh_cn/translation.json';

i18next.use(initReactI18next).init({
  lng: 'zh_cn', // if you're using a language detector, do not define the lng option
  debug: true,
  resources: {
    en:{
      translation:enT
    },
    zh_cn:{
      translation:zh_cnT
    }
  },
  fallbackLng:'en',
  returnNull: false,
});
export default i18next
