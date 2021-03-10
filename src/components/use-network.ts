import { useState, useEffect } from 'react'
import { Network, ConnectionStatus } from '@capacitor/network'
import { PluginListenerHandle } from '@capacitor/core/types/definitions'
interface NetworkStatusResult {
  networkStatus?: ConnectionStatus
}

/*
  Capacitor has a hooks package for react but haven't updated it to support Capacitor V3 yet. A PR has been opened for this
  work but it hasn't been merged yet. The hook was small enough that we thought it was simpler to inline in the project versus
  forking and publishing a different package.

  https://github.com/capacitor-community/react-hooks/pull/21
 */
export const useStatus = (): NetworkStatusResult => {
  const [networkStatus, setStatus] = useState<ConnectionStatus>()

  useEffect(() => {
    let current = true

    const getStatus = async () => {
      if (current) {
        const status = await Network.getStatus()
        setStatus(status)
      }
    }

    getStatus()

    return () => {
      current = false
    }
  }, [setStatus])

  useEffect(() => {
    let current = true
    let listener: PluginListenerHandle

    const addNetworkListener = async () => {
      if (current) {
        listener = await Network.addListener('networkStatusChange', (status: ConnectionStatus) => {
          setStatus(status)
        })
      }
    }

    addNetworkListener()

    return () => {
      current = false
      listener?.remove()
    }
  }, [setStatus])

  return {
    networkStatus
  }
}
