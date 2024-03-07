import i18n from 'i18next';

export const getTranslation = (key: string,...any) => {
  return i18n.t(key) as any;
}