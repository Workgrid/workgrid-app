import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import * as serviceWorker from './serviceWorker'

import * as Sentry from '@sentry/browser'

// Prevents Sentry from tracking when running locally
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://92491107ecb24fc587dc4f49622df6cf@o255249.ingest.sentry.io/5208603'
  })
}

ReactDOM.render(<App />, document.getElementById('root'))

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
