import React from 'react'
import { SpacesProvider, SpacesProviderProps, SpacesContext, useSpaces } from './SpacesProvider'
import { renderHook, act as hookAct } from '@testing-library/react-hooks'
import { render, screen, waitFor, act } from '@testing-library/react'
import { AuthenticationContext } from './AuthenticationProvider'
import { ThemeProvider } from './ThemeProvider'

describe('SpacesProvider', () => {
  const spacesFetcher = jest.fn()
  const onSpaceChange = jest.fn()
  const getAccessToken = jest.fn()
  const apiHost = 'https://acme-company.workgrid.com'

  const spaces = [
    { id: 'space-1', name: 'Space 1' },
    { id: 'space-2', name: 'Space 2' }
  ]
  const currentSpaceId = 'space-1'

  describe('use-spaces', () => {
    /* We can't use the SpacesProvider directly as a wrapper because it conditionally renders children and the
    renderHook() method is dependent on children always rendering.
     */
    const wrapper = ({ children }: SpacesProviderProps) => (
      <SpacesContext.Provider value={{ onSpaceChange, spaces, currentSpaceId }}>{children}</SpacesContext.Provider>
    )

    test('onSpaceChange calls provider onSpaceChange', async () => {
      const { result } = renderHook(() => useSpaces(), { wrapper })

      onSpaceChange.mockResolvedValueOnce(undefined)

      await hookAct(() => expect(result.current.onSpaceChange(spaces[1].id)).resolves.toBeUndefined())

      expect(onSpaceChange).toHaveBeenCalledWith(spaces[1].id)
    })

    test('can get spaces', async () => {
      const { result } = renderHook(() => useSpaces(), { wrapper })

      hookAct(() => expect(result.current.spaces).toEqual(spaces))
    })

    test('can get currentSpaceId', async () => {
      const { result } = renderHook(() => useSpaces(), { wrapper })

      hookAct(() => expect(result.current.currentSpaceId).toEqual(currentSpaceId))
    })
  })

  describe('SpacesProvider', () => {
    const childText = 'A child'
    const Child = () => {
      const { currentSpaceId } = useSpaces()
      return (
        <>
          <p>{currentSpaceId}</p>
          <p>{childText}</p>
        </>
      )
    }

    const authToken = 'access-token'

    beforeEach(() => {
      getAccessToken.mockResolvedValueOnce(authToken)
    })

    test('It should render loading when in loading state while requests are resolving and show space selection if there is no current space', async () => {
      let deferredResolve: Function
      spacesFetcher.mockResolvedValueOnce(
        new Promise(resolve => {
          deferredResolve = resolve
        })
      )

      render(
        <ThemeProvider>
          <AuthenticationContext.Provider value={{ getAccessToken, apiHost, signOut: jest.fn() }}>
            <SpacesProvider spacesFetcher={spacesFetcher} onSpaceChange={onSpaceChange}>
              <Child />
            </SpacesProvider>
          </AuthenticationContext.Provider>
        </ThemeProvider>
      )

      // Wait for first render to flush
      await act(async () => {})

      await waitFor(() => expect(screen.getByTestId('loading')).toBeVisible())

      deferredResolve!({ spaces })

      await waitFor(() => expect(screen.getByText('selectSpace')).toBeVisible())
      expect(screen.queryByText(childText)).not.toBeInTheDocument()
      expect(spacesFetcher).toHaveBeenCalledWith({ apiHost, authToken })
    })

    test('It should render children when there is no current space but only one is available', async () => {
      spacesFetcher.mockResolvedValueOnce({ spaces: [spaces[0]] })

      render(
        <ThemeProvider>
          <AuthenticationContext.Provider value={{ getAccessToken, apiHost, signOut: jest.fn() }}>
            <SpacesProvider spacesFetcher={spacesFetcher} onSpaceChange={onSpaceChange}>
              <Child />
            </SpacesProvider>
          </AuthenticationContext.Provider>
        </ThemeProvider>
      )

      await waitFor(() => expect(screen.getByText(childText)).toBeVisible())

      // Ensuring the currentSpaceId of the useSpaces hook is correct
      expect(screen.getByText(spaces[0].id)).toBeVisible()
      expect(spacesFetcher).toHaveBeenCalledWith({ apiHost, authToken })
    })

    test('It should render children when there is current space regardless of how many spaces there are', async () => {
      const currentSpaceId = 'space-1'
      spacesFetcher.mockResolvedValueOnce({ spaces: [spaces[0]], currentSpaceId })

      render(
        <ThemeProvider>
          <AuthenticationContext.Provider value={{ getAccessToken, apiHost, signOut: jest.fn() }}>
            <SpacesProvider spacesFetcher={spacesFetcher} onSpaceChange={onSpaceChange}>
              <Child />
            </SpacesProvider>
          </AuthenticationContext.Provider>
        </ThemeProvider>
      )

      await waitFor(() => expect(screen.getByText(childText)).toBeVisible())

      // Ensuring the currentSpaceId of the useSpaces hook is correct
      expect(screen.getByText(currentSpaceId)).toBeVisible()
      expect(spacesFetcher).toHaveBeenCalledWith({ apiHost, authToken })
    })
  })
})
