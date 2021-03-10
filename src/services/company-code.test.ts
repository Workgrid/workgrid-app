import { companyCodeFetcher, onCompanyCodeChange, resetCompanyCode } from './company-code'
import { Storage } from '@capacitor/storage'

describe('company-code', () => {
  const companyCode = 'acme-company'

  beforeEach(async () => {
    await Storage.clear()
  })

  test('return undefined if company code is not present in storage', async () => {
    await expect(companyCodeFetcher()).resolves.toBeUndefined()
  })

  test('return company code if it is present', async () => {
    await onCompanyCodeChange(companyCode)

    await expect(companyCodeFetcher()).resolves.toEqual(companyCode)
  })

  test('Reset should clear the company code', async () => {
    await onCompanyCodeChange(companyCode)

    await expect(companyCodeFetcher()).resolves.toEqual(companyCode)

    await resetCompanyCode()

    await expect(companyCodeFetcher()).resolves.toBeUndefined()
  })
})
