import { useState, useEffect } from 'react'
import { App, AppInfo as CAppInfo } from '@capacitor/app'

export interface AppInfo {
  appInfo?: CAppInfo
}
export const useAppInfo = (): AppInfo => {
  const [appInfo, setAppInfo] = useState<CAppInfo | undefined>()

  useEffect(() => {
    let current = true

    const fetchAppInfo = async () => {
      if (current) {
        try {
          const appInfo = await App.getInfo()

          setAppInfo(appInfo)
        } catch (e) {
          // Swallow exception. This is not a critical failure
        }
      }
    }

    fetchAppInfo()

    return () => {
      current = false
    }
  }, [])

  return { appInfo }
}
