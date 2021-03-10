import { Network, ConnectionStatus } from '@capacitor/network'

import { useStatus } from './use-network'
import { renderHook, act } from '@testing-library/react-hooks'

jest.mock('@capacitor/network', () => {
  let listener: any
  const status = {
    connected: true,
    connectionType: 'wifi'
  }
  return {
    Network: {
      __updateStatus: () => {
        status.connected = false
        listener(status)
      },
      addListener: (eventName: string, cb: (status: ConnectionStatus) => void) => {
        listener = cb
        return { remove: () => {} }
      },
      getStatus: async () => {
        return status
      }
    }
  }
})

describe('useStatus', () => {
  test('Gets current network status', async () => {
    const networkMock = Network as any

    const { result, waitForNextUpdate } = renderHook(() => useStatus())

    await waitForNextUpdate()

    expect(result.current).toMatchObject({
      networkStatus: {
        connected: true,
        connectionType: 'wifi'
      }
    })

    act(() => networkMock.__updateStatus())

    expect(result.current).toMatchObject({
      networkStatus: {
        connected: false,
        connectionType: 'wifi'
      }
    })
  })
})
