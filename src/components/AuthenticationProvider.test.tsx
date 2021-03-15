import React from 'react'
import {
  AuthenticationProvider,
  AuthenticationProviderProps,
  AuthenticationContext,
  useAuth
} from './AuthenticationProvider'
import { renderHook, act as hookAct } from '@testing-library/react-hooks'
import { render, screen, waitFor, act } from '@testing-library/react'
import { ThemeProvider } from './ThemeProvider'

describe('AuthenticationProvider', () => {
  const getAccessToken = jest.fn()

  const companyCodeFetcher = jest.fn()
  const globalConfigFetcher = jest.fn()
  const authenticationServiceFactory = jest.fn()
  const onCompanyCodeChange = jest.fn()
  const onReset = jest.fn()
  const authenticationService = {
    isAuthenticated: jest.fn(),
    login: jest.fn(),
    getAccessToken: jest.fn(),
    logout: jest.fn()
  }

  const signOut = jest.fn()
  const apiHost = 'https://acme.workgrid.com'
  const companyCode = 'acme-company'
  const globalConfig = {
    apiHost: 'https://acme-company.workgrid.com',
    cognito: {
      userPools: [
        {
          appDomain: 'https://acme-company.auth.workgrid.com',
          userPoolId: 'us-east-1_someId',
          clients: {
            workgridclient: {
              clientId: 'some-client-id'
            }
          }
        }
      ]
    }
  }
  describe('use-auth', () => {
    /* We can't use the AuthenticationProvider directly as a wrapper because it conditionally renders children and the
    renderHook() method is dependent on children always rendering.
     */
    const wrapper = ({ children }: AuthenticationProviderProps) => (
      <AuthenticationContext.Provider value={{ getAccessToken, apiHost, signOut }}>
        {children}
      </AuthenticationContext.Provider>
    )

    test('getAccessToken calls provider getAccessToken', async () => {
      const accessToken = 'access-token'

      getAccessToken.mockResolvedValueOnce(accessToken)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await hookAct(() => expect(result.current.getAccessToken()).resolves.toEqual(accessToken))

      expect(getAccessToken).toHaveBeenCalledWith()
    })

    test('signOut calls provider signOut', async () => {
      signOut.mockResolvedValueOnce(undefined)

      const { result } = renderHook(() => useAuth(), { wrapper })

      await hookAct(() => expect(result.current.signOut()).resolves.toBeUndefined())

      expect(signOut).toHaveBeenCalledWith()
    })

    test('can get apiHost', async () => {
      const { result } = renderHook(() => useAuth(), { wrapper })

      hookAct(() => expect(result.current.apiHost).toEqual(apiHost))
    })
  })

  describe('AuthenticationProvider', () => {
    beforeEach(() => {
      authenticationServiceFactory.mockReturnValueOnce(authenticationService)
    })

    const childText = 'A child'
    const Child = () => <p>{childText}</p>

    test('It should render loading when in loading state while requests are resolving and show sign in when not authenticated', async () => {
      let deferredResolve: Function
      companyCodeFetcher.mockResolvedValueOnce(
        new Promise(resolve => {
          deferredResolve = resolve
        })
      )

      globalConfigFetcher.mockResolvedValueOnce(globalConfig)
      authenticationServiceFactory.mockReturnValueOnce(authenticationService)

      authenticationService.isAuthenticated.mockResolvedValueOnce(false)

      render(
        <ThemeProvider>
          <AuthenticationProvider
            globalConfigFetcher={globalConfigFetcher}
            companyCodeFetcher={companyCodeFetcher}
            onCompanyCodeChange={onCompanyCodeChange}
            authenticationServiceFactory={authenticationServiceFactory}
            onReset={onReset}
          >
            <Child />
          </AuthenticationProvider>
        </ThemeProvider>
      )

      // Wait for first render to flush
      await act(async () => {})

      await waitFor(() => expect(screen.getByTestId('loading')).toBeVisible())

      deferredResolve!(companyCode)

      await waitFor(() => expect(screen.getByText('signInText')).toBeVisible())
      expect(screen.queryByText(childText)).not.toBeInTheDocument()
    })

    test('It should render loading when in loading state while requests are resolving and show children when authenticated', async () => {
      companyCodeFetcher.mockResolvedValueOnce(companyCode)
      globalConfigFetcher.mockResolvedValueOnce(globalConfig)
      authenticationServiceFactory.mockReturnValueOnce(authenticationService)

      authenticationService.isAuthenticated.mockResolvedValueOnce(true)

      render(
        <ThemeProvider>
          <AuthenticationProvider
            globalConfigFetcher={globalConfigFetcher}
            companyCodeFetcher={companyCodeFetcher}
            onCompanyCodeChange={onCompanyCodeChange}
            authenticationServiceFactory={authenticationServiceFactory}
            onReset={onReset}
          >
            <Child />
          </AuthenticationProvider>
        </ThemeProvider>
      )

      await waitFor(() => expect(screen.getByText(childText)).toBeVisible())

      expect(screen.queryByText('loading')).not.toBeInTheDocument()
      expect(screen.queryByText('signInText')).not.toBeInTheDocument()
    })
  })
})
