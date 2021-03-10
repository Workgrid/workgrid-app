import { useAuthState } from './use-auth-state'
import { renderHook, act } from '@testing-library/react-hooks'

import * as Sentry from '@sentry/browser'

jest.mock('@sentry/browser')

describe('useAuthState', () => {
  const companyCodeFetcher = jest.fn()
  const globalConfigFetcher = jest.fn()
  const authenticationServiceFactory = jest.fn()
  const onCompanyCodeChange = jest.fn()
  const onReset = jest.fn()
  const authenticationService = {
    isAuthenticated: jest.fn(),
    login: jest.fn(),
    getAccessToken: jest.fn(),
    logout: jest.fn(),
    clearStorage: jest.fn()
  }

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

  describe('Initialization', () => {
    test('If company code fetch results no previously stored company code show sign in', async () => {
      let deferredResolve: Function
      companyCodeFetcher.mockResolvedValueOnce(
        new Promise(resolve => {
          deferredResolve = resolve
        })
      )

      const { result, waitForNextUpdate } = renderHook(() =>
        useAuthState({
          companyCodeFetcher,
          globalConfigFetcher,
          authenticationServiceFactory,
          onCompanyCodeChange,
          onReset
        })
      )

      // Wait for the first render to flush
      await act(async () => {})

      expect(companyCodeFetcher).toHaveBeenCalledWith()
      expect(companyCodeFetcher).toHaveBeenCalledTimes(1)
      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(1, {
        message: `use-auth-state reducer action: company-code-fetching`
      })
      expect(result.current).toMatchObject({
        loading: true,
        showSignIn: false
      })

      deferredResolve!()

      await waitForNextUpdate()

      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(2, {
        message: `use-auth-state reducer action: company-code-fetched`,
        data: {
          companyCode: undefined,
          defaultCompanyCode: undefined
        }
      })
      expect(result.current).toMatchObject({
        loading: false,
        showSignIn: true
      })
    })

    test('If company code fetch results in an error', async () => {
      const error = new Error('something bad happened')

      companyCodeFetcher.mockRejectedValueOnce(error)

      const { result, waitForNextUpdate } = renderHook(() =>
        useAuthState({
          companyCodeFetcher,
          globalConfigFetcher,
          authenticationServiceFactory,
          onCompanyCodeChange,
          onReset
        })
      )

      await waitForNextUpdate()

      expect(companyCodeFetcher).toHaveBeenCalledWith()
      expect(companyCodeFetcher).toHaveBeenCalledTimes(1)
      expect(Sentry.captureException).toHaveBeenCalledWith(error)
      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(1, {
        message: `use-auth-state reducer action: company-code-fetching`
      })
      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(2, {
        message: `use-auth-state reducer action: company-code-fetched-error`
      })
      expect(result.current).toMatchObject({
        companyCode: undefined,
        defaultCompanyCode: undefined,
        showSignIn: true,
        loading: false
      })
    })

    test('If global config is fetched and not authenticated show sign in', async () => {
      companyCodeFetcher.mockResolvedValueOnce(companyCode)
      globalConfigFetcher.mockResolvedValueOnce(globalConfig)
      authenticationServiceFactory.mockReturnValueOnce(authenticationService)

      authenticationService.isAuthenticated.mockResolvedValueOnce(false)

      const { result, waitForNextUpdate } = renderHook(() =>
        useAuthState({
          companyCodeFetcher,
          globalConfigFetcher,
          authenticationServiceFactory,
          onCompanyCodeChange,
          onReset
        })
      )

      await waitForNextUpdate()

      expect(globalConfigFetcher).toHaveBeenCalledWith(companyCode)
      expect(globalConfigFetcher).toHaveBeenCalledTimes(1)
      expect(onCompanyCodeChange).toHaveBeenCalledWith(companyCode)
      expect(authenticationServiceFactory).toHaveBeenCalledTimes(1)
      expect(authenticationServiceFactory).toHaveBeenCalledWith(globalConfig)
      expect(authenticationService.isAuthenticated).toHaveBeenCalled()
      expect(authenticationService.isAuthenticated).toHaveBeenCalledTimes(1)

      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(3, {
        message: `use-auth-state reducer action: global-config-fetching`
      })
      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(4, {
        message: `use-auth-state reducer action: global-config-fetched`,
        data: {
          globalConfig
        }
      })

      expect(result.current).toMatchObject({
        showSignIn: true,
        authenticated: false,
        loading: false,
        apiHost: globalConfig.apiHost,
        companyCode,
        defaultCompanyCode: companyCode
      })
    })

    test('If global config is fetched and is authenticated do not show sign in', async () => {
      companyCodeFetcher.mockResolvedValueOnce(companyCode)
      globalConfigFetcher.mockResolvedValueOnce(globalConfig)
      authenticationServiceFactory.mockReturnValueOnce(authenticationService)

      authenticationService.isAuthenticated.mockResolvedValueOnce(true)

      const { result, waitForNextUpdate } = renderHook(() =>
        useAuthState({
          companyCodeFetcher,
          globalConfigFetcher,
          authenticationServiceFactory,
          onCompanyCodeChange,
          onReset
        })
      )

      await waitForNextUpdate()

      expect(globalConfigFetcher).toHaveBeenCalledWith(companyCode)
      expect(globalConfigFetcher).toHaveBeenCalledTimes(1)
      expect(onCompanyCodeChange).toHaveBeenCalledWith(companyCode)
      expect(authenticationServiceFactory).toHaveBeenCalledTimes(1)
      expect(authenticationServiceFactory).toHaveBeenCalledWith(globalConfig)
      expect(authenticationService.isAuthenticated).toHaveBeenCalled()
      expect(authenticationService.isAuthenticated).toHaveBeenCalledTimes(1)

      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(3, {
        message: `use-auth-state reducer action: global-config-fetching`
      })
      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(4, {
        message: `use-auth-state reducer action: global-config-fetched`,
        data: {
          globalConfig
        }
      })

      expect(result.current).toMatchObject({
        showSignIn: false,
        authenticated: true,
        loading: false,
        apiHost: globalConfig.apiHost,
        companyCode,
        defaultCompanyCode: companyCode
      })
    })

    test('If global config fetch returns an error show sign in', async () => {
      companyCodeFetcher.mockResolvedValueOnce(companyCode)

      const error = new Error('something bad happened')

      globalConfigFetcher.mockRejectedValueOnce(error)

      const { result, waitForNextUpdate } = renderHook(() =>
        useAuthState({
          companyCodeFetcher,
          globalConfigFetcher,
          authenticationServiceFactory,
          onCompanyCodeChange,
          onReset
        })
      )

      await waitForNextUpdate()

      expect(globalConfigFetcher).toHaveBeenCalledWith(companyCode)
      expect(globalConfigFetcher).toHaveBeenCalledTimes(1)

      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(3, {
        message: `use-auth-state reducer action: global-config-fetching`
      })
      expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(4, {
        message: `use-auth-state reducer action: global-config-fetched-error`
      })

      expect(result.current).toMatchObject({
        showSignIn: true,
        loading: false,
        apiHost: undefined,
        companyCodeIsValid: false
      })
    })
  })

  describe('Authentication', () => {
    beforeEach(() => {
      companyCodeFetcher.mockResolvedValueOnce(companyCode)
      globalConfigFetcher.mockResolvedValueOnce(globalConfig)
      authenticationServiceFactory.mockReturnValueOnce(authenticationService)
      authenticationService.isAuthenticated.mockResolvedValueOnce(false)
    })

    describe('onSignIn', () => {
      test('When onSignIn invoked call login on authentication service and on success be login and not show sign in', async () => {
        authenticationService.login.mockResolvedValueOnce(undefined)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
        })

        expect(authenticationService.login).toHaveBeenCalledWith()
        expect(authenticationService.login).toHaveBeenCalledTimes(1)

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(7, {
          message: `use-auth-state reducer action: authentication-started`
        })
        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(8, {
          message: `use-auth-state reducer action: authentication-success`
        })

        expect(result.current).toMatchObject({
          showSignIn: false,
          loading: false,
          authenticated: true
        })
      })

      test('When user cancels auth in the browser show sign in', async () => {
        const userCancelledInWebBrowser = 'not authenticated popup window closed without navigating to result url'

        authenticationService.login.mockRejectedValueOnce(userCancelledInWebBrowser)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
        })

        expect(authenticationService.login).toHaveBeenCalledWith()
        expect(authenticationService.login).toHaveBeenCalledTimes(1)

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(7, {
          message: `use-auth-state reducer action: authentication-started`
        })
        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(8, {
          message: `use-auth-state reducer action: authentication-user-cancelled`
        })

        expect(result.current).toMatchObject({
          showSignIn: true,
          loading: false,
          authenticated: false
        })
      })

      test('When user cancels auth in on iOS or Android show sign in', async () => {
        const userCancelledInWebBrowser = 'The operation couldn’t be completed'

        authenticationService.login.mockRejectedValueOnce(userCancelledInWebBrowser)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
        })

        expect(authenticationService.login).toHaveBeenCalledWith()
        expect(authenticationService.login).toHaveBeenCalledTimes(1)

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(7, {
          message: `use-auth-state reducer action: authentication-started`
        })
        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(8, {
          message: `use-auth-state reducer action: authentication-user-cancelled`
        })

        expect(result.current).toMatchObject({
          showSignIn: true,
          loading: false,
          authenticated: false
        })
      })

      test('When login fails for any other reason show sign in', async () => {
        const error = new Error('somthing bad happened')

        authenticationService.login.mockRejectedValueOnce(error)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
        })

        expect(authenticationService.login).toHaveBeenCalledWith()
        expect(authenticationService.login).toHaveBeenCalledTimes(1)

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(7, {
          message: `use-auth-state reducer action: authentication-started`
        })
        expect(Sentry.captureException).toHaveBeenCalledWith(error)
        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(8, {
          message: `use-auth-state reducer action: authentication-failure`
        })

        expect(result.current).toMatchObject({
          showSignIn: true,
          loading: false,
          authenticated: false
        })
      })
    })

    describe('getAccessToken', () => {
      beforeEach(() => {
        authenticationService.login.mockResolvedValueOnce(undefined)
      })

      test('getAccessToken returns an access token', async () => {
        const token = 'my-access-token'
        authenticationService.getAccessToken.mockResolvedValueOnce(token)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
        })

        await expect(result.current.getAccessToken()).resolves.toEqual(token)
        expect(authenticationService.getAccessToken).toHaveBeenCalledWith()
        expect(authenticationService.getAccessToken).toHaveBeenCalledTimes(1)
      })

      test('When getAccessToken rejects with an error login is required', async () => {
        const error = new Error('something-bad-happened')

        authenticationService.getAccessToken.mockRejectedValueOnce(error)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
          await result.current.getAccessToken()
        })

        expect(authenticationService.getAccessToken).toHaveBeenCalledWith()
        expect(authenticationService.getAccessToken).toHaveBeenCalledTimes(1)
        expect(Sentry.captureException).toHaveBeenCalledWith(error)
        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(9, {
          message: `use-auth-state reducer action: login-required`
        })

        expect(result.current).toMatchObject({
          authenticated: false,
          showSignIn: true,
          loading: false
        })
      })
    })

    describe('onSignOut', () => {
      test('When onSignOut invoked call logout on authentication service and on success should show sign in', async () => {
        authenticationService.login.mockResolvedValueOnce(undefined)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
          await result.current.onSignOut()
        })

        expect(authenticationService.logout).toHaveBeenCalledWith()
        expect(authenticationService.logout).toHaveBeenCalledTimes(1)

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(9, {
          message: `use-auth-state reducer action: authentication-signout-started`
        })
        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(10, {
          message: `use-auth-state reducer action: authentication-signout-success`
        })

        expect(result.current).toMatchObject({
          showSignIn: true,
          loading: false,
          authenticated: false
        })
      })

      test('When onSignOut invoked call and logout rejects should show sign in', async () => {
        const error = new Error('something bad happened')

        authenticationService.login.mockResolvedValueOnce(undefined)
        authenticationService.logout.mockRejectedValueOnce(error)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onSignIn()
          await result.current.onSignOut()
        })

        expect(authenticationService.logout).toHaveBeenCalledWith()
        expect(authenticationService.logout).toHaveBeenCalledTimes(1)

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(9, {
          message: `use-auth-state reducer action: authentication-signout-started`
        })
        expect(Sentry.captureException).toHaveBeenCalledWith(error)
        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(10, {
          message: `use-auth-state reducer action: authentication-signout-success`
        })

        expect(result.current).toMatchObject({
          showSignIn: true,
          loading: false,
          authenticated: false
        })
      })
    })

    describe('onCompanyCodeChange', () => {
      test('When a user changes company code fetch new global config', async () => {
        const newCompanyCode = 'new-acme-company'

        const newGlobalConfig = {
          apiHost: 'https://new-acme-company.workgrid.com',
          cognito: {
            userPools: [
              {
                appDomain: 'https://new-acme-company.auth.workgrid.com',
                userPoolId: 'us-east-1_someNewId',
                clients: {
                  workgridclient: {
                    clientId: 'some-new-client-id'
                  }
                }
              }
            ]
          }
        }

        globalConfigFetcher.mockResolvedValueOnce(newGlobalConfig)

        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onCompanyCodeChange(newCompanyCode)
        })

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(7, {
          message: `use-auth-state reducer action: company-code-changed`,
          data: {
            companyCode: newCompanyCode
          }
        })

        expect(result.current).toMatchObject({
          companyCode: newCompanyCode,
          defaultCompanyCode: companyCode,
          showSignIn: true,
          loading: false,
          authenticated: false
        })
      })
    })

    describe('onReset', () => {
      test('onReset should reset authentication state and call onReset handler', async () => {
        const { result, waitForNextUpdate } = renderHook(() =>
          useAuthState({
            companyCodeFetcher,
            globalConfigFetcher,
            authenticationServiceFactory,
            onCompanyCodeChange,
            onReset
          })
        )

        await waitForNextUpdate()

        await act(async () => {
          await result.current.onReset()
        })

        expect(Sentry.addBreadcrumb).toHaveBeenNthCalledWith(7, {
          message: `use-auth-state reducer action: reset-auth-state`
        })

        expect(authenticationService.clearStorage).toHaveBeenCalledWith()
        expect(authenticationService.clearStorage).toHaveBeenCalledTimes(1)
        expect(onReset).toHaveBeenCalledWith()
        expect(onReset).toHaveBeenCalledTimes(1)

        expect(result.current).toMatchObject({
          companyCode: undefined,
          defaultCompanyCode: undefined,
          showSignIn: false,
          loading: true,
          authenticated: false
        })
      })
    })
  })
})
