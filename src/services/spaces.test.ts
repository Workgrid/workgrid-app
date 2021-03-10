import { spacesFetcher, onSpaceChange } from './spaces'
import { Storage } from '@capacitor/storage'
import { setupServer } from 'msw/node'
import { rest } from 'msw'
import * as Sentry from '@sentry/browser'

jest.mock('@sentry/browser')

const userSpaces = {
  status: 'success',
  data: [
    { id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', name: 'Space 1', default: false },
    { id: 'ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj', name: 'Space 2', default: true },
    { id: 'kkkkkkkk-llll-mmmm-nnnn-oooooooooooo', name: 'Space 3', default: false }
  ]
}

const apiHost = 'https://acme-company.workgrid.com'

const server = setupServer(
  rest.get(`${apiHost}/v1/userspaces`, (req, res, ctx) => {
    return res.once(ctx.status(200), ctx.json(userSpaces))
  })
)

describe('spaces', () => {
  beforeAll(() => server.listen())
  afterAll(() => server.close())

  beforeEach(async () => {
    await Storage.clear()
  })

  afterEach(async () => {
    server.restoreHandlers()
  })

  const options = {
    authToken: 'auth-token',
    apiHost
  }

  test('fetch current space and spaces over the network. currentSpaceId is undefined since one has not been set', async () => {
    const fetchedSpaces = await spacesFetcher(options)

    expect(fetchedSpaces).toMatchInlineSnapshot(`
      Object {
        "currentSpaceId": undefined,
        "defaultSpaceId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
        "spaces": Array [
          Object {
            "default": false,
            "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            "name": "Space 1",
          },
          Object {
            "default": true,
            "id": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
            "name": "Space 2",
          },
          Object {
            "default": false,
            "id": "kkkkkkkk-llll-mmmm-nnnn-oooooooooooo",
            "name": "Space 3",
          },
        ],
      }
    `)
  })

  test('fetch current space and spaces over the network. currentSpaceId is specified when fetched from storage', async () => {
    await onSpaceChange(userSpaces.data[0].id)

    const fetchedSpaces = await spacesFetcher(options)

    expect(fetchedSpaces).toMatchInlineSnapshot(`
      Object {
        "currentSpaceId": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        "defaultSpaceId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
        "spaces": Array [
          Object {
            "default": false,
            "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            "name": "Space 1",
          },
          Object {
            "default": true,
            "id": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
            "name": "Space 2",
          },
          Object {
            "default": false,
            "id": "kkkkkkkk-llll-mmmm-nnnn-oooooooooooo",
            "name": "Space 3",
          },
        ],
      }
    `)
  })

  test('When currentSpaceId is not in the list of spaces returned from the server set it to undefined', async () => {
    await onSpaceChange('space-does-not-exist')

    const fetchedSpaces = await spacesFetcher(options)

    expect(fetchedSpaces).toMatchInlineSnapshot(`
      Object {
        "currentSpaceId": undefined,
        "defaultSpaceId": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
        "spaces": Array [
          Object {
            "default": false,
            "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
            "name": "Space 1",
          },
          Object {
            "default": true,
            "id": "ffffffff-gggg-hhhh-iiii-jjjjjjjjjjjj",
            "name": "Space 2",
          },
          Object {
            "default": false,
            "id": "kkkkkkkk-llll-mmmm-nnnn-oooooooooooo",
            "name": "Space 3",
          },
        ],
      }
    `)
  })

  test('if user spaces network call fails do not throw, capture exception and return an empty list of spaces.', async () => {
    const fetchedSpaces = await spacesFetcher({ ...options, apiHost: 'https://bad-host.workgrid.com' })

    expect(fetchedSpaces).toMatchInlineSnapshot(`
      Object {
        "currentSpaceId": undefined,
        "spaces": Array [],
      }
    `)
    expect((Sentry.captureException as jest.Mock).mock.calls[0][0]).toMatchInlineSnapshot(
      `[TypeError: Network request failed]`
    )
  })
})
