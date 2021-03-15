import React, { useEffect } from 'react'
import { ThemeProvider, ThemeProviderProps, ThemeContext, useTheme } from './ThemeProvider'
import { renderHook, act as hookAct } from '@testing-library/react-hooks'
import { render, screen, waitFor, act } from '@testing-library/react'

describe('ThemeProvider', () => {
  const setApiHost = jest.fn()
  const setSpaceId = jest.fn()
  const apiHost = 'https://acme-company.workgrid.com'

  const currentSpaceId = 'space-1'

  describe('use-theme', () => {
    /* We can't use the ThemeProvider directly as a wrapper because it conditionally renders children and the
    renderHook() method is dependent on children always rendering.
     */
    const wrapper = ({ children }: ThemeProviderProps) => (
      <ThemeContext.Provider value={{ setApiHost, setSpaceId }}>{children}</ThemeContext.Provider>
    )

    test('setSpaceId calls provider setSpaceId', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper })

      setSpaceId.mockReturnValue(undefined)

      hookAct(() => expect(result.current.setSpaceId(currentSpaceId)).toBeUndefined())

      expect(setSpaceId).toHaveBeenCalledWith(currentSpaceId)
    })

    test('setApiHost calls provider setApiHost', async () => {
      const { result } = renderHook(() => useTheme(), { wrapper })

      setApiHost.mockReturnValue(undefined)

      hookAct(() => expect(result.current.setApiHost(apiHost)).toBeUndefined())

      expect(setApiHost).toHaveBeenCalledWith(apiHost)
    })
  })

  describe('ThemeProvider', () => {
    const childText = <>A child</>

    const Child = ({
      runSetApiHost = false,
      runSetSpaceId = false,
      resetEverything
    }: {
      runSetApiHost?: boolean
      runSetSpaceId?: boolean
      resetEverything?: (callback: Function) => void
    }) => {
      const { setApiHost, setSpaceId } = useTheme()

      useEffect(() => {
        if (runSetApiHost) {
          setApiHost(apiHost)
        }

        if (runSetSpaceId) {
          setSpaceId(currentSpaceId)
        }

        if (resetEverything) {
          resetEverything(() => {
            setApiHost()
            setSpaceId()
          })
        }
      }, [resetEverything, runSetApiHost, runSetSpaceId, setApiHost, setSpaceId])
      return (
        <>
          <p>{childText}</p>
        </>
      )
    }

    test('Organization style sheet should be added when apiHost is set', async () => {
      render(
        <ThemeProvider>
          <Child runSetApiHost />
        </ThemeProvider>
      )

      await waitFor(() => expect(screen.getByText('A child')).toBeInTheDocument())

      expect(document.querySelector(`link[href^='${apiHost}/config/styles.css']`)).toMatchInlineSnapshot(`
        <link
          href="https://acme-company.workgrid.com/config/styles.css"
          id="workgrid-organization"
          rel="stylesheet"
        />
      `)
    })

    test('Space style sheet should be added when apiHost is set and be specified after the organization tag', async () => {
      render(
        <ThemeProvider>
          <Child runSetApiHost runSetSpaceId />
        </ThemeProvider>
      )

      await waitFor(() => expect(screen.getByText('A child')).toBeInTheDocument())

      const spaceStyleSheet = document.querySelector(`link[href^='${apiHost}/config/${currentSpaceId}.css']`)

      expect(spaceStyleSheet).toMatchInlineSnapshot(`
        <link
          href="https://acme-company.workgrid.com/config/space-1.css"
          id="workgrid-space"
          rel="stylesheet"
        />
      `)

      expect(document.head.childElementCount).toEqual(2)
      expect(document.head.lastElementChild).toEqual(spaceStyleSheet)
    })

    test('Stylesheets should be removed if they are unset', async () => {
      let resetFunction: Function
      render(
        <ThemeProvider>
          <Child runSetApiHost runSetSpaceId resetEverything={callback => (resetFunction = callback)} />
        </ThemeProvider>
      )

      await waitFor(() => expect(screen.getByText('A child')).toBeInTheDocument())

      expect(document.head.childElementCount).toEqual(2)

      act(() => resetFunction!())

      expect(document.head.childElementCount).toEqual(0)
    })
  })
})
