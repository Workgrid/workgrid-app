import { AppInfo } from '@capacitor/app'

import { useAppInfo } from './use-app'
import { renderHook } from '@testing-library/react-hooks'

jest.mock('@capacitor/app', () => {
  return {
    App: {
      getInfo: async (): Promise<AppInfo> => {
        return {
          name: 'App Name',
          id: 'bundle-id',
          build: 'bundle-version',
          version: 'app-version'
        }
      }
    }
  }
})

describe('useAppInfo', () => {
  test('Returns app info', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useAppInfo())

    await waitForNextUpdate()

    expect(result.current).toMatchObject({
      appInfo: {
        name: 'App Name',
        id: 'bundle-id',
        build: 'bundle-version',
        version: 'app-version'
      }
    })
  })
})
