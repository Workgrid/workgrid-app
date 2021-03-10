import { Storage } from '@capacitor/storage'
import { GlobalConfig } from '../workgrid-app'
import * as Sentry from '@sentry/browser'
const globalConfigKey = 'globalConfig'

export const globalConfigFetcher = async (companyCode: string): Promise<GlobalConfig | undefined> => {
  const { value } = await Storage.get({ key: globalConfigKey })

  let parsedConfig

  if (value) {
    try {
      parsedConfig = JSON.parse(value)

      const config = parsedConfig[companyCode] as GlobalConfig

      if (config) return config
    } catch (e) {
      Sentry.captureException(e)
    }
  }

  try {
    const response = await fetch(`https://${companyCode}.workgrid.com/config/config.json`)

    if (!response.ok) throw new Error('Network request failed')

    const globalConfig = (await response.json()) as GlobalConfig

    const globalConfigToSave = parsedConfig ?? {}

    globalConfigToSave[companyCode] = globalConfig

    try {
      await Storage.set({ key: globalConfigKey, value: JSON.stringify(globalConfigToSave) })
    } catch (e) {
      Sentry.captureException(e)
    }

    return globalConfig
  } catch (e) {
    throw e
    // No need to capture a Sentry error here because it may be an invalid company code and we don't need to see all these errors
  }
}

export const resetGlobalConfig = async () => {
  await Storage.remove({ key: globalConfigKey })
}
