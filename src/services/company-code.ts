import { Storage } from '@capacitor/storage'

const companyCodeKey = 'companyCode'

export const companyCodeFetcher = async (): Promise<string | undefined> => {
  // TODO Add support for EMM so company code can be fetched from AppConfig. There are no official plugins at this time.
  const { value } = await Storage.get({ key: companyCodeKey })

  return value ? value : undefined
}

export const onCompanyCodeChange = async (companyCode: string): Promise<void> => {
  await Storage.set({
    key: companyCodeKey,
    value: companyCode
  })
}

export const resetCompanyCode = async () => {
  await Storage.remove({ key: companyCodeKey })
}
