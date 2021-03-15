import React, { createContext, useContext, useState, useEffect, useMemo } from 'react'

interface ThemeContextInterface {
  setApiHost: (apiHost?: string) => void
  setSpaceId: (spaceId?: string) => void
}

export const ThemeContext = createContext<ThemeContextInterface | undefined>(undefined)

export interface ThemeProviderProps {
  children: React.ReactNode
}

const upsertStylesheet = (id: string, href: string) => {
  let link = document.querySelector(`#${id}`) as HTMLLinkElement

  if (link) {
    link.href = href
    return
  }

  link = document.createElement('link') as HTMLLinkElement
  link.id = id
  link.rel = 'stylesheet'
  link.href = href
  document.head.appendChild(link)
}

const removeStylesheet = (id: string) => {
  const link = document.head.querySelector(`#${id}`)
  if (link) document.head.removeChild(link)
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [apiHost, setApiHost] = useState<string | undefined>()
  const [spaceId, setSpaceId] = useState<string | undefined>()

  const organizationIdSelector = 'workgrid-organization'
  const spaceIdSelector = 'workgrid-space'

  useEffect(() => {
    if (apiHost) {
      upsertStylesheet(organizationIdSelector, `${apiHost}/config/styles.css`)
      if (spaceId) {
        upsertStylesheet(spaceIdSelector, `${apiHost}/config/${spaceId}.css`)
      } else {
        removeStylesheet(spaceIdSelector)
      }
    } else {
      removeStylesheet(organizationIdSelector)
      removeStylesheet(spaceIdSelector)
    }
  }, [apiHost, spaceId])

  const value = useMemo(() => ({ setApiHost, setSpaceId }), [setApiHost, setSpaceId])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
  const context = useContext(ThemeContext)

  if (context === undefined) {
    throw new Error('useTheme must be used inside a ThemeProvider')
  }

  return context
}
