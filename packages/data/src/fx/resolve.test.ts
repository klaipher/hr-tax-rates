import { describe, expect, it } from 'vitest'
import type { FetchLike } from './resolve.ts'
import { resolveExchangeRate } from './resolve.ts'
import { NBU_EUR_UAH_SNAPSHOT } from './snapshot.ts'

const LIVE_URL = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&json'

/** Відповідь НБУ навмисно несе не ті числа, що снепшот — інакше тест не бачив би, яка ланка спрацювала. */
const NBU_RECORD = {
  r030: 978,
  txt: 'Євро',
  rate: 42.1234,
  cc: 'EUR',
  exchangedate: '01.07.2026',
  special: null,
}
const NBU_PAYLOAD = [NBU_RECORD]

/** Записує адреси, за якими ходили, і віддає задану відповідь. */
const stubFetch =
  (calls: string[], respond: () => ReturnType<FetchLike>): FetchLike =>
  (url) => {
    calls.push(url)
    return respond()
  }

const ok = (payload: unknown) => Promise.resolve({ ok: true, json: () => Promise.resolve(payload) })

describe('resolveExchangeRate', () => {
  it('бере живий курс НБУ, коли запит удався', async () => {
    const calls: string[] = []

    const rate = await resolveExchangeRate({ fetch: stubFetch(calls, () => ok(NBU_PAYLOAD)) })

    expect(calls).toEqual([LIVE_URL])
    expect(rate.value.toString()).toBe('42.1234')
    expect(rate.asOf).toBe('2026-07-01')
    expect(rate.origin.kind).toBe('nbu-live')
  })

  it('несе валютну пару, а не саме лише число', async () => {
    const rate = await resolveExchangeRate({ fetch: stubFetch([], () => ok(NBU_PAYLOAD)) })

    expect(rate.base).toBe('EUR')
    expect(rate.quote).toBe('UAH')
  })

  it('ручний курс перебиває живий і не робить жодного запиту', async () => {
    const calls: string[] = []
    const fetch = stubFetch(calls, () => ok(NBU_PAYLOAD))

    const rate = await resolveExchangeRate({ fetch, manual: { value: '50', asOf: '2026-03-14' } })

    expect(calls).toEqual([])
    expect(rate.value.toString()).toBe('50')
    expect(rate.asOf).toBe('2026-03-14')
    expect(rate.origin).toEqual({ kind: 'manual' })
  })

  it('ручний курс перебиває і снепшот, коли мережі немає', async () => {
    const fetch: FetchLike = () => Promise.reject(new Error('мережі немає'))

    const rate = await resolveExchangeRate({ fetch, manual: { value: '50', asOf: '2026-03-14' } })

    expect(rate.origin).toEqual({ kind: 'manual' })
  })

  describe('відкат на снепшот', () => {
    const fallsBack = async (respond: () => ReturnType<FetchLike>) => {
      const rate = await resolveExchangeRate({ fetch: stubFetch([], respond) })

      expect(rate.origin.kind).toBe('nbu-snapshot')
      expect(rate.value.toString()).toBe(NBU_EUR_UAH_SNAPSHOT.value.toString())
      expect(rate.asOf).toBe(NBU_EUR_UAH_SNAPSHOT.asOf)
      return rate
    }

    it('коли мережа недоступна', async () => {
      await fallsBack(() => Promise.reject(new Error('мережі немає')))
    })

    it('коли НБУ відповів помилкою', async () => {
      await fallsBack(() =>
        Promise.resolve({ ok: false, json: () => Promise.resolve(NBU_PAYLOAD) }),
      )
    })

    it('коли тіло відповіді не розбирається як JSON', async () => {
      await fallsBack(() =>
        Promise.resolve({ ok: true, json: () => Promise.reject(new Error('не JSON')) }),
      )
    })

    it('коли НБУ не знає валюти й повертає порожній список', async () => {
      await fallsBack(() => ok([]))
    })

    it('коли у відповіді немає запису саме про євро', async () => {
      await fallsBack(() => ok([{ ...NBU_RECORD, cc: 'USD' }]))
    })

    it('коли курс не число', async () => {
      await fallsBack(() => ok([{ ...NBU_RECORD, rate: '42,12' }]))
    })

    it('коли курс недодатний', async () => {
      await fallsBack(() => ok([{ ...NBU_RECORD, rate: 0 }]))
    })

    it('коли дата курсу в незнайомому форматі', async () => {
      await fallsBack(() => ok([{ ...NBU_RECORD, exchangedate: '2026-07-01' }]))
    })

    it('коли дата курсу неможлива', async () => {
      await fallsBack(() => ok([{ ...NBU_RECORD, exchangedate: '32.07.2026' }]))
    })

    it('коли дата курсу існує лише на вигляд', async () => {
      // 31 лютого розбирається без помилки і мовчки з'їжджає на 3 березня.
      await fallsBack(() => ok([{ ...NBU_RECORD, exchangedate: '31.02.2026' }]))
    })

    it('коли замість списку прийшов об’єкт', async () => {
      await fallsBack(() => ok({ rate: 42.1234, cc: 'EUR', exchangedate: '01.07.2026' }))
    })
  })
})
