import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import I18NextChainedBackend from 'i18next-chained-backend'
import I18NextHttpBackend from 'i18next-http-backend'
import I18NextLocalStorageBackend from 'i18next-localstorage-backend'
import { initReactI18next } from 'react-i18next'

i18n
  .use(LanguageDetector)
  .use(I18NextChainedBackend)
  .use(initReactI18next)
  .init({
    ns: ['common', 'authentication', 'spaces'],
    lng: 'en-US',
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false // not needed for react as it escapes by default
    },
    backend: {
      backends: [
        I18NextLocalStorageBackend, // primary
        I18NextHttpBackend // This will allow us to centrally host translations that can be pulled by any app
      ],
      backendOptions: [
        {},
        {
          loadPath: 'locales/{{lng}}/{{ns}}.json' // We change the default path here to remove the leading slash so Electron can work
        }
      ]
    }
  })

export default i18n
