import { Storage } from '@capacitor/storage'
import * as Sentry from '@sentry/browser'
import { UserSpaces, Space, SpaceFetcherProps } from '../components/SpacesProvider'

const currentSpaceIdKey = 'currentSpaceId'

export const spacesFetcher = async ({ apiHost, authToken }: SpaceFetcherProps): Promise<UserSpaces> => {
  const fetchSpaces = async ({ apiHost, authToken }: SpaceFetcherProps) => {
    const spacesResponse: Pick<UserSpaces, 'defaultSpaceId' | 'spaces'> = {
      spaces: []
    }

    try {
      const response = await fetch(`${apiHost}/v1/userspaces`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      if (!response.ok) throw new Error('Unable to fetch users spaces')

      const responseData = await response.json()

      if (responseData.data?.length) {
        spacesResponse.defaultSpaceId =
          responseData.data.find((space: Space & { default: boolean }) => space.default)?.id ?? undefined
        spacesResponse.spaces = responseData.data
      }
    } catch (e) {
      Sentry.captureException(e)

      // No need to throw here because the user will be able to retry if they don't have any spaces
    }

    return spacesResponse
  }

  const currentSpaceFetcher = async () => {
    const { value } = await Storage.get({ key: currentSpaceIdKey })

    return value ? value : undefined
  }

  const [spacesData, currentSpaceId] = await Promise.all([fetchSpaces({ apiHost, authToken }), currentSpaceFetcher()])

  return {
    ...spacesData,
    // Reset the current space if the user is no longer in the space
    currentSpaceId: spacesData.spaces.find(space => space.id === currentSpaceId) ? currentSpaceId : undefined
  }
}

export const onSpaceChange = async (spaceId: string): Promise<void> => {
  await Storage.set({
    key: currentSpaceIdKey,
    value: spaceId
  })
}
