// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom/extend-expect'
import { mockIonicReact } from '@ionic/react-test-utils'
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

mockIonicReact()

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',

  interpolation: {
    escapeValue: false // not needed for react as it escapes by default
  }
})
