import { globalConfigFetcher, resetGlobalConfig } from './global-config'
import { Storage } from '@capacitor/storage'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import * as Sentry from '@sentry/browser'

jest.mock('@sentry/browser')

const companyCode = 'acme-company'

const globalConfig = {
  apiHost: 'https://acme-company.workgrid.com',
  cognito: {
    userPools: [
      {
        appDomain: 'https://acme-company.auth.workgrid.com',
        userPoolId: 'us-east-1_someId',
        clients: {
          workgridclient: {
            clientId: 'some-client-id'
          }
        }
      }
    ]
  }
}

const server = setupServer(
  rest.get(`https://${companyCode}.workgrid.com/config/config.json`, (req, res, ctx) => {
    return res.once(ctx.status(200), ctx.json(globalConfig))
  }),
  rest.get(`https://valid-but-network-error.workgrid.com/config/config.json`, (req, res, ctx) => {
    return res.once(ctx.status(503))
  })
)

describe('global-config', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  beforeEach(async () => {
    await Storage.clear()
  })

  afterEach(async () => {
    server.restoreHandlers()
  })

  test('if not present in storage remotely fetch global config store it in storage and return it to the user', async () => {
    const fetchedGlobalConfig = await globalConfigFetcher(companyCode)

    expect(fetchedGlobalConfig).toEqual(globalConfig)

    // Second request should be from storage and not fetched as MSW is setup to only return a response once.
    await expect(globalConfigFetcher(companyCode)).resolves.toEqual(globalConfig)
  })

  test('if there is a parsing error when fetching from storage capture exception and remotely fetch global config, store in storage and return it to the user', async () => {
    await Storage.set({ key: 'globalConfig', value: 'invalid-json' })

    await expect(globalConfigFetcher(companyCode)).resolves.toEqual(globalConfig)
    expect((Sentry.captureException as jest.Mock).mock.calls[0][0]).toMatchInlineSnapshot(
      `[SyntaxError: Unexpected token i in JSON at position 0]`
    )
  })

  test('if fetching remotely fails throw as the company code is invalid', async () => {
    await expect(globalConfigFetcher('invalid-company-code')).rejects.toThrowErrorMatchingInlineSnapshot(
      `"Network request failed"`
    )
  })

  test('Reset should clear the global config', async () => {
    const fetchedGlobalConfig = await globalConfigFetcher(companyCode)

    expect(fetchedGlobalConfig).toEqual(globalConfig)

    await expect(globalConfigFetcher(companyCode)).resolves.toEqual(globalConfig)

    await resetGlobalConfig()

    // Best proxy to use for validation since fetching stores global config in storage.
    await expect(Storage.keys()).resolves.toMatchInlineSnapshot(`
            Object {
              "keys": Array [],
            }
          `)
  })
})
