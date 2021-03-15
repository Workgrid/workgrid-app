import React, { Suspense } from 'react'
import { Redirect, Route } from 'react-router-dom'
import { IonApp, IonRouterOutlet, IonSpinner } from '@ionic/react'
import { IonReactRouter } from '@ionic/react-router'
import Home from './components/Home'

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css'

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css'
import '@ionic/react/css/structure.css'
import '@ionic/react/css/typography.css'

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css'
import '@ionic/react/css/float-elements.css'
import '@ionic/react/css/text-alignment.css'
import '@ionic/react/css/text-transformation.css'
import '@ionic/react/css/flex-utils.css'
import '@ionic/react/css/display.css'

/* Theme variables */
import './theme/variables.css'
import { authenticationServiceFactory } from './services/authentication-service'
import { AuthenticationProvider } from './components/AuthenticationProvider'
import { SpacesProvider } from './components/SpacesProvider'
import { companyCodeFetcher, onCompanyCodeChange, resetCompanyCode } from './services/company-code'
import { globalConfigFetcher, resetGlobalConfig } from './services/global-config'
import { spacesFetcher, onSpaceChange } from './services/spaces'
import { ThemeProvider } from './components/ThemeProvider'

const onReset = async () => {
  await Promise.all([resetCompanyCode(), resetGlobalConfig()])
}

const App: React.FC = () => (
  <Suspense fallback={<IonSpinner />}>
    <IonApp>
      <ThemeProvider>
        <AuthenticationProvider
          globalConfigFetcher={globalConfigFetcher}
          companyCodeFetcher={companyCodeFetcher}
          onCompanyCodeChange={onCompanyCodeChange}
          authenticationServiceFactory={authenticationServiceFactory}
          onReset={onReset}
        >
          <SpacesProvider spacesFetcher={spacesFetcher} onSpaceChange={onSpaceChange}>
            <IonReactRouter>
              <IonRouterOutlet>
                <Route path="/home" component={Home} exact={true} />
                <Route exact path="/" render={() => <Redirect to="/home" />} />
              </IonRouterOutlet>
            </IonReactRouter>
          </SpacesProvider>
        </AuthenticationProvider>
      </ThemeProvider>
    </IonApp>
  </Suspense>
)

export default App
