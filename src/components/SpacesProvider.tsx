import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { IonLoading } from '@ionic/react'
import { useTranslation } from 'react-i18next'
import { useAuth } from './AuthenticationProvider'
import { Spaces } from '@workgrid/ui'
import { SpacesProps } from '@workgrid/ui/dist/components/Spaces'
import { useTheme } from './ThemeProvider'

interface SpacesContextInterface {
  currentSpaceId: string
  defaultSpaceId?: string
  spaces: Space[]
  onSpaceChange: SpacesProps['onSpaceSubmit']
}

export const SpacesContext = createContext<SpacesContextInterface | undefined>(undefined)

export type Space = {
  id: string
  name: string
}

export type UserSpaces = {
  /**
   * Space the user is currently in
   */
  currentSpaceId?: string

  /**
   * Default space for the user
   */
  defaultSpaceId?: string

  /**
   * List of spaces the user has access to
   */
  spaces: Space[]
}

export type SpaceFetcherProps = {
  /**
   * FQDN to use as the base URL to fetch spaces
   */
  apiHost: string

  /**
   * User's authentication token to use to make the request
   */
  authToken: string
}

export interface SpacesProviderProps {
  spacesFetcher: ({ apiHost, authToken }: SpaceFetcherProps) => Promise<UserSpaces>
  onSpaceChange: (spaceId: string) => Promise<void>
  children: React.ReactNode
}

export const SpacesProvider = ({ spacesFetcher, onSpaceChange, children }: SpacesProviderProps) => {
  const { apiHost, getAccessToken } = useAuth()

  const [authToken, setAuthToken] = useState<string>()
  const [spacesData, setSpacesData] = useState<UserSpaces>()
  const [currentSpaceId, setCurrentSpaceId] = useState<string>()
  const { t } = useTranslation('spaces')

  useEffect(() => {
    let current = true

    const getAuthToken = async () => {
      if (current) {
        const authToken = await getAccessToken()

        setAuthToken(authToken)
      }
    }

    getAuthToken()

    return () => {
      current = false
    }
  }, [getAccessToken])

  const getSpaces = useCallback(async () => {
    if (apiHost && authToken) {
      const spacesData = await spacesFetcher({ apiHost, authToken })
      setSpacesData(spacesData)
      setCurrentSpaceId(spacesData.currentSpaceId)
    }
  }, [apiHost, authToken, spacesFetcher])

  useEffect(() => {
    let current = true

    if (current) {
      getSpaces()
    }

    return () => {
      current = false
    }
  }, [getSpaces])

  const { setSpaceId } = useTheme()

  useEffect(() => {
    setSpaceId(currentSpaceId)
  }, [currentSpaceId, setSpaceId])

  if (!spacesData) return <IonLoading isOpen={true} data-testid="loading" />

  const spaceSubmit: SpacesProps['onSpaceSubmit'] = async (spaceId: string) => {
    await onSpaceChange(spaceId)
    setCurrentSpaceId(spaceId)
  }

  const noCurrentSpaceAndMoreThanOneSpaceToChooseFrom = !currentSpaceId && spacesData.spaces.length > 1

  if (noCurrentSpaceAndMoreThanOneSpaceToChooseFrom) {
    return (
      <Spaces
        defaultSpaceId={spacesData?.defaultSpaceId}
        currentSpaceId={spacesData?.currentSpaceId}
        spaces={spacesData?.spaces ?? []}
        onSpaceSubmit={spaceSubmit}
        onRefresh={getSpaces}
        translations={{
          selectASpaceLabel: t('selectASpaceLabel'),
          spacesTitle: t('spacesTitle'),
          selectSpace: t('selectSpace'),
          defaultCaption: t('defaultCaption'),
          spacesCaption: t('spacesCaption'),
          noSpacesText: t('noSpacesText'),
          refreshText: t('refreshText')
        }}
      />
    )
  }

  return (
    <SpacesContext.Provider
      value={{
        currentSpaceId: currentSpaceId ?? spacesData.spaces[0].id,
        defaultSpaceId: spacesData.defaultSpaceId,
        spaces: spacesData.spaces,
        onSpaceChange: spaceSubmit
      }}
    >
      {children}
    </SpacesContext.Provider>
  )
}

export const useSpaces = () => {
  const context = useContext(SpacesContext)

  if (context === undefined) {
    throw new Error('useSpaces must be used inside a SpaceProvider')
  }

  return context
}
