import { AuthenticationService } from '../services/authentication-service'
import { GlobalConfig } from '../workgrid-app'
import { Reducer, useReducer, useEffect, useMemo } from 'react'
import * as Sentry from '@sentry/browser'

interface AuthReducerState {
  showSignIn: boolean
  loading: boolean
  authenticated: boolean
  companyCode?: string
  defaultCompanyCode?: string
  companyCodeIsValid: boolean
  authenticationService?: AuthenticationService
  apiHost?: string
}

type AuthReducerAction =
  | {
      type:
        | 'company-code-fetching'
        | 'company-code-fetched-error'
        | 'global-config-fetching'
        | 'global-config-fetched-error'
        | 'authentication-started'
        | 'authentication-success'
        | 'authentication-user-cancelled'
        | 'authentication-failure'
        | 'login-required'
        | 'authentication-signout-started'
        | 'authentication-signout-success'
        | 'is-authenticated-starting'
        | 'reset-auth-state'
    }
  | { type: 'company-code-fetched' | 'company-code-changed'; data: { companyCode?: string } }
  | { type: 'global-config-fetched'; data: { globalConfig: GlobalConfig } }
  | { type: 'is-authenticated-finished'; data: { isAuthenticated: boolean } }

export type AuthenticationServiceFactory = (globalConfig: GlobalConfig) => AuthenticationService

type AuthStateReducer = Reducer<AuthReducerState, AuthReducerAction>

const initialState = {
  showSignIn: false,
  loading: true,
  authenticated: false,
  companyCodeIsValid: true
}

const createAuthStateReducerFn = (authenticationServiceFactory: AuthenticationServiceFactory): AuthStateReducer => {
  return (state: AuthReducerState, action: AuthReducerAction): AuthReducerState => {
    const message = `use-auth-state reducer action: ${action.type}`

    Sentry.addBreadcrumb({ message: message, data: 'data' in action ? action.data : undefined })

    switch (action.type) {
      case 'company-code-fetching': {
        return {
          ...state,
          loading: true,
          showSignIn: false
        }
      }
      case 'company-code-fetched': {
        return {
          ...state,
          companyCode: action.data?.companyCode,
          defaultCompanyCode: action.data?.companyCode,
          showSignIn: action.data?.companyCode == null,
          loading: false
        }
      }
      case 'company-code-changed': {
        return {
          ...state,
          companyCode: action.data?.companyCode,
          loading: false
        }
      }
      case 'company-code-fetched-error': {
        return {
          ...state,
          companyCode: undefined,
          showSignIn: true,
          loading: false
        }
      }
      case 'global-config-fetching': {
        return {
          ...state,
          loading: true
        }
      }
      case 'global-config-fetched': {
        return {
          ...state,
          apiHost: action.data.globalConfig.apiHost,
          companyCodeIsValid: true,
          showSignIn: true,
          loading: false,
          authenticationService: authenticationServiceFactory(action.data.globalConfig)
        }
      }
      case 'global-config-fetched-error': {
        return {
          ...state,
          showSignIn: true,
          loading: false,
          companyCodeIsValid: false
        }
      }
      case 'authentication-signout-started':
      case 'authentication-started': {
        return {
          ...state,
          loading: true
        }
      }
      case 'authentication-success': {
        return {
          ...state,
          authenticated: true,
          showSignIn: false,
          loading: false
        }
      }
      case 'authentication-user-cancelled':
      case 'authentication-failure': {
        return {
          ...state,
          authenticated: false,
          showSignIn: true,
          loading: false
        }
      }
      case 'authentication-signout-success':
      case 'login-required': {
        return {
          ...state,
          loading: false,
          authenticated: false,
          showSignIn: true
        }
      }
      case 'is-authenticated-starting': {
        return {
          ...state,
          loading: true
        }
      }
      case 'is-authenticated-finished': {
        return {
          ...state,
          loading: false,
          authenticated: action.data.isAuthenticated,
          showSignIn: !action.data.isAuthenticated
        }
      }
      case 'reset-auth-state': {
        return initialState
      }
      default: {
        return state
      }
    }
  }
}

export interface AuthStateProps {
  globalConfigFetcher: (companyCode: string) => Promise<GlobalConfig | undefined>
  companyCodeFetcher: () => Promise<string | undefined>
  onCompanyCodeChange: (companyCode: string) => Promise<void>
  onReset: () => Promise<void>
  authenticationServiceFactory: AuthenticationServiceFactory
}

export type AuthState = Pick<
  AuthReducerState,
  | 'authenticated'
  | 'loading'
  | 'showSignIn'
  | 'companyCode'
  | 'defaultCompanyCode'
  | 'apiHost'
  | 'companyCodeIsValid'
  | 'authenticationService'
> & {
  onCompanyCodeChange: AuthStateProps['onCompanyCodeChange']
  onSignIn: () => void
  onSignOut: () => void
  getAccessToken: () => Promise<string | undefined>
  onReset: () => Promise<void>
}

export const useAuthState = ({
  globalConfigFetcher,
  companyCodeFetcher,
  onCompanyCodeChange,
  onReset,
  authenticationServiceFactory
}: AuthStateProps): AuthState => {
  const memorizedAuthenticationServiceFactory = useMemo(() => createAuthStateReducerFn(authenticationServiceFactory), [
    authenticationServiceFactory
  ])

  const [state, dispatch] = useReducer(memorizedAuthenticationServiceFactory, initialState)

  useEffect(() => {
    let current = true

    const fetchCompanyCode = async () => {
      try {
        if (current) {
          dispatch({ type: 'company-code-fetching' })

          const companyCode = await companyCodeFetcher()

          if (companyCode) {
            Sentry.configureScope(scope => {
              scope.setTag('companyCode', companyCode)
            })
          }

          dispatch({ type: 'company-code-fetched', data: { companyCode } })
        }
      } catch (e) {
        if (current) {
          Sentry.captureException(e)
          dispatch({ type: 'company-code-fetched-error' })
        }
      }
    }

    fetchCompanyCode()

    return () => {
      current = false
    }
  }, [companyCodeFetcher])

  useEffect(() => {
    let current = true

    const fetchGlobalConfig = async () => {
      try {
        if (current && state.companyCode) {
          dispatch({ type: 'global-config-fetching' })

          const globalConfig = await globalConfigFetcher(state.companyCode)

          if (globalConfig) {
            // We may not have previously had a company code so we should set it again here to ensure we have it
            Sentry.configureScope(scope => {
              scope.setTag('companyCode', state.companyCode)
            })

            // Now that we know the company code is valid we can invoke the callback
            await onCompanyCodeChange(state.companyCode)

            dispatch({ type: 'global-config-fetched', data: { globalConfig } })
          } else {
            Sentry.addBreadcrumb({ message: `Invalid company code: ${state.companyCode}` })
          }
        }
      } catch (e) {
        if (current) {
          Sentry.captureException(e)
          dispatch({ type: 'global-config-fetched-error' })
        }
      }
    }

    fetchGlobalConfig()

    return () => {
      current = false
    }
  }, [globalConfigFetcher, onCompanyCodeChange, state.companyCode])

  useEffect(() => {
    let current = true

    const authenticationCheck = async () => {
      if (current && state.authenticationService != null) {
        dispatch({ type: 'is-authenticated-starting' })

        const isAuthenticated = (await state.authenticationService.isAuthenticated()) ?? false

        dispatch({ type: 'is-authenticated-finished', data: { isAuthenticated } })
      }
    }

    authenticationCheck()

    return () => {
      current = false
    }
  }, [state.authenticationService, state.companyCode])

  const companyCodeChange: AuthState['onCompanyCodeChange'] = async companyCode => {
    //  Dispatch same action as if we were fetching the company code. It's no different
    dispatch({ type: 'company-code-changed', data: { companyCode } })
  }

  const onSignIn: AuthState['onSignIn'] = async () => {
    dispatch({ type: 'authentication-started' })

    try {
      await state.authenticationService?.login()

      dispatch({ type: 'authentication-success' })
    } catch (e) {
      if (
        // When canceled on native platforms
        e === 'The operation couldn’t be completed' ||
        // When canceled from the browser
        e === 'not authenticated popup window closed without navigating to result url'
      ) {
        dispatch({ type: 'authentication-user-cancelled' })
      } else {
        Sentry.captureException(e)
        dispatch({ type: 'authentication-failure' })
      }
    }
  }

  const onSignOut: AuthState['onSignOut'] = async () => {
    dispatch({ type: 'authentication-signout-started' })

    try {
      await state.authenticationService?.logout()
    } catch (e) {
      Sentry.captureException(e)
    }

    dispatch({ type: 'authentication-signout-success' })
  }

  const getAccessToken: AuthState['getAccessToken'] = async () => {
    try {
      return await state.authenticationService?.getAccessToken()
    } catch (e) {
      Sentry.captureException(e)
      dispatch({ type: 'login-required' })
    }
  }

  const reset: AuthState['onReset'] = async () => {
    await Promise.all([state.authenticationService?.clearStorage(), onReset()])
    dispatch({ type: 'reset-auth-state' })
  }

  return {
    apiHost: state.apiHost,
    authenticated: state.authenticated,
    companyCode: state.companyCode,
    defaultCompanyCode: state.defaultCompanyCode,
    companyCodeIsValid: state.companyCodeIsValid,
    loading: state.loading,
    showSignIn: state.showSignIn,
    onCompanyCodeChange: companyCodeChange,
    onSignIn,
    onSignOut,
    getAccessToken,
    onReset: reset
  }
}
