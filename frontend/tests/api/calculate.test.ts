// `calculate` is the seam the whole contract hangs on, so the property under
// test is that it never throws: a 200, a documented 400, a code this build has
// never heard of and a dead server all have to come back as values.
//
// `fetch` is stubbed with real `Response` objects rather than hand-rolled
// doubles, so the parsing path exercised here is the one that runs in the
// browser — and no cast is needed to satisfy the type.

import { afterEach, describe, expect, it, vi } from 'vitest'

import { calculate } from '../../src/api/calculate.ts'
import type { CalculateOutcome } from '../../src/api/calculate.ts'

const ENDPOINT = '/api/v1/calculate'

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function stubFetch(answer: () => Response | Error): void {
  vi.stubGlobal(
    'fetch',
    vi.fn<typeof fetch>(() => {
      const value = answer()
      return value instanceof Error ? Promise.reject(value) : Promise.resolve(value)
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

interface Case {
  name: string
  answer: () => Response | Error
  expected: CalculateOutcome
}

const cases: Case[] = [
  {
    name: 'a well-shaped 200 becomes a success',
    answer: () => jsonResponse({ op: 'divide', a: 10, b: 4, result: 2.5 }, 200),
    expected: { ok: true, value: { op: 'divide', a: 10, b: 4, result: 2.5 } },
  },
  {
    name: 'the API does not round, and neither does the client',
    answer: () => jsonResponse({ op: 'add', a: 0.1, b: 0.2, result: 0.30000000000000004 }, 200),
    expected: { ok: true, value: { op: 'add', a: 0.1, b: 0.2, result: 0.30000000000000004 } },
  },
  {
    name: 'a documented 400 surfaces its code',
    answer: () =>
      jsonResponse({ error: { code: 'division_by_zero', message: 'cannot divide by zero' } }, 400),
    expected: { ok: false, code: 'division_by_zero' },
  },
  {
    // The reason `code` is a plain string and not the union: a server that has
    // grown a code since this bundle was built must still render something.
    name: 'a code this build has never heard of passes through untouched',
    answer: () => jsonResponse({ error: { code: 'not_a_code_yet' } }, 400),
    expected: { ok: false, code: 'not_a_code_yet' },
  },
  {
    name: 'a 400 that is not shaped like the contract is an unexpected response',
    answer: () => jsonResponse({ detail: 'nope' }, 400),
    expected: { ok: false, code: 'unexpected_response' },
  },
  {
    name: 'a 200 missing a field is an unexpected response',
    answer: () => jsonResponse({ op: 'divide', a: 10 }, 200),
    expected: { ok: false, code: 'unexpected_response' },
  },
  {
    name: 'a 200 naming an operation the client does not know is an unexpected response',
    answer: () => jsonResponse({ op: 'tetrate', a: 2, b: 3, result: 16 }, 200),
    expected: { ok: false, code: 'unexpected_response' },
  },
  {
    name: 'a body that is not JSON is an unexpected response',
    answer: () => new Response('<!doctype html><title>502</title>', { status: 200 }),
    expected: { ok: false, code: 'unexpected_response' },
  },
  {
    name: 'a server that is not running is unreachable',
    answer: () => new TypeError('Failed to fetch'),
    expected: { ok: false, code: 'unreachable' },
  },
]

describe('calculate', () => {
  it.each(cases)('$name', async ({ answer, expected }) => {
    stubFetch(answer)

    await expect(calculate('divide', 10, 4)).resolves.toEqual(expected)
  })

  it('sends one POST to the documented endpoint', async () => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(jsonResponse({ op: 'add', a: 1, b: 2, result: 3 }, 200)),
    )
    vi.stubGlobal('fetch', fetchMock)

    await calculate('add', 1, 2)

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe(ENDPOINT)
    expect(init?.method).toBe('POST')
    expect(JSON.parse(String(init?.body))).toEqual({ op: 'add', a: 1, b: 2 })
  })

  it('serialises an unusable operand as null, leaving the rule to the server', async () => {
    const fetchMock = vi.fn<typeof fetch>(() =>
      Promise.resolve(jsonResponse({ error: { code: 'missing_field' } }, 400)),
    )
    vi.stubGlobal('fetch', fetchMock)

    const outcome = await calculate('divide', 10, null)

    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      op: 'divide',
      a: 10,
      b: null,
    })
    expect(outcome).toEqual({ ok: false, code: 'missing_field' })
  })
})
