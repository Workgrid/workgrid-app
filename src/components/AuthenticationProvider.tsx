import React, { createContext, useContext, useEffect } from 'react'
import { useAuthState, AuthenticationServiceFactory } from './use-auth-state'
import { GlobalConfig } from '../workgrid-app'
import { IonLoading, IonAlert } from '@ionic/react'
import { NetworkSplash, SignIn } from '@workgrid/ui'
import { useStatus } from './use-network'
import { useTranslation } from 'react-i18next'
import { useAppInfo } from './use-app'
import * as Sentry from '@sentry/browser'
import { useTheme } from './ThemeProvider'

interface AuthenticationContextInterface {
  getAccessToken: () => Promise<string | undefined>
  signOut: () => void
  apiHost: string | undefined
}

export const AuthenticationContext = createContext<AuthenticationContextInterface | undefined>(undefined)

export interface AuthenticationProviderProps {
  globalConfigFetcher: (companyCode: string) => Promise<GlobalConfig | undefined>
  companyCodeFetcher: () => Promise<string | undefined>
  onCompanyCodeChange: (companyCode: string) => Promise<void>
  onReset: () => Promise<void>
  authenticationServiceFactory: AuthenticationServiceFactory
  children: React.ReactNode
}

export const AuthenticationProvider = ({
  globalConfigFetcher,
  companyCodeFetcher,
  onCompanyCodeChange,
  onReset,
  authenticationServiceFactory,
  children
}: AuthenticationProviderProps) => {
  const {
    authenticated,
    loading,
    showSignIn,
    companyCode,
    defaultCompanyCode,
    onCompanyCodeChange: companyCodeChange,
    onSignIn,
    onSignOut,
    getAccessToken,
    apiHost,
    companyCodeIsValid,
    onReset: reset
  } = useAuthState({
    globalConfigFetcher,
    companyCodeFetcher,
    onCompanyCodeChange,
    onReset,
    authenticationServiceFactory
  })

  const { networkStatus } = useStatus()
  const { appInfo } = useAppInfo()
  const { t } = useTranslation('authentication')
  const { setApiHost } = useTheme()

  useEffect(() => {
    setApiHost(apiHost)
  }, [apiHost, setApiHost])

  if (loading) return <IonLoading isOpen={true} data-testid="loading" />

  if (authenticated) {
    return (
      <AuthenticationContext.Provider value={{ getAccessToken, apiHost, signOut: onSignOut }}>
        {children}
      </AuthenticationContext.Provider>
    )
  }

  if (showSignIn) {
    return (
      <NetworkSplash
        isNetworkAvailable={networkStatus?.connected ?? true}
        translations={{
          cantConnectToNetwork: t('cantConnectToNetwork'),
          pleaseCheckInternetConnection: t('pleaseCheckInternetConnection')
        }}
      >
        <SignIn
          initialCompanyCode={companyCode}
          initialCompanyCodeIsValid={companyCodeIsValid}
          onSignIn={onSignIn}
          onCompanyCodeSubmit={companyCodeChange}
          defaultCompanyCode={defaultCompanyCode}
          translations={{
            companyCodeLabel: t('companyCodeLabel'),
            companyCodePlaceholder: t('companyCodePlaceholder'),
            changeCompanyCodeText: t('changeCompanyCodeText'),
            checkCompanyCodeText: t('checkCompanyCodeText'),
            resetDefaultCompanyCodeText: t('resetDefaultCompanyCodeText'),
            invalidCompanyCodeText: t('invalidCompanyCodeText'),
            pleaseEnterCompanyCodeText: t('pleaseEnterCompanyCodeText'),
            signInText: t('signInText'),
            workgridText: t('workgridText'),
            versionText: appInfo?.version ? t('versionText', { version: appInfo.version }) : undefined
          }}
        />
      </NetworkSplash>
    )
  }

  Sentry.addBreadcrumb({
    message: 'auth state',
    data: { loading, authenticated, showSignIn, apiHost, companyCode, defaultCompanyCode, companyCodeIsValid }
  })
  Sentry.captureException(new Error('Unknown authentication state'))

  return (
    <IonAlert
      isOpen={true}
      backdropDismiss={false}
      header={t('unknownAuthenticationHeader')}
      message={t('unknownAuthenticationMessage')}
      buttons={[
        {
          text: t('unknownAuthenticationReset'),
          handler: async () => {
            await reset()
            return true
          }
        }
      ]}
    />
  )
}

export const useAuth = () => {
  const context = useContext(AuthenticationContext)

  if (context === undefined) {
    throw new Error('useAuth must be used inside a AuthenticationProvider')
  }

  return context
}
