import Decimal from 'decimal.js'
import type { CurrencyCode } from './currency.ts'
import type { ExchangeRate, IsoDate } from './exchange-rate.ts'
import { type NbuQuote, nbuExchangeUrl, parseNbuExchange } from './nbu.ts'
import { NBU_EUR_UAH_SNAPSHOT } from './snapshot.ts'

/**
 * Рівно те, що резолвер бере від `fetch`, і не більше.
 *
 * Вузький тип, а не `typeof globalThis.fetch`: мок у тесті лишається двома
 * рядками, а сам резолвер не має доступу ні до чого, крім адреси й тіла.
 */
export type FetchLike = (url: string) => Promise<{
  readonly ok: boolean
  readonly json: () => Promise<unknown>
}>

/** Курс, який користувач вбив руками. */
export interface ManualExchangeRate {
  readonly value: Decimal.Value
  /** Дата, на яку цей курс дійсний, — задає користувач, а не годинник. */
  readonly asOf: IsoDate
}

export interface ResolveExchangeRateOptions {
  /**
   * Запит. Обов'язковий і явний: із типовим значенням `globalThis.fetch` тест,
   * що забув підставити мок, тихо пішов би в мережу.
   */
  readonly fetch: FetchLike
  /** Якщо заданий — перебиває і живий запит, і снепшот. */
  readonly manual?: ManualExchangeRate
}

const BASE: CurrencyCode = 'EUR'
const QUOTE: CurrencyCode = 'UAH'

const request = async (fetch: FetchLike, url: string): Promise<NbuQuote | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    return parseNbuExchange(await response.json(), BASE)
  } catch {
    // Мережа, DNS, обрив, невалідне тіло — усе це однаково означає «живого
    // курсу немає», і жодне з них не привід валити застосунок.
    return null
  }
}

/**
 * Курс EUR/UAH: живий запит до НБУ → снепшот із датою → ручне значення, яке
 * перебиває обидва.
 *
 * Єдине місце в проєкті з вводом-виводом. Рушій лишається чистим і синхронним
 * саме тому, що курс приходить до нього вже готовим числом (ADR-0001).
 */
export const resolveExchangeRate = async (
  options: ResolveExchangeRateOptions,
): Promise<ExchangeRate> => {
  const { fetch, manual } = options
  const pair = { base: BASE, quote: QUOTE }

  // Ручний курс обриває ланцюжок до запиту: ходити в мережу по число, яке
  // однаково буде відкинуте, немає сенсу.
  if (manual !== undefined) {
    return {
      ...pair,
      value: new Decimal(manual.value),
      asOf: manual.asOf,
      origin: { kind: 'manual' },
    }
  }

  const url = nbuExchangeUrl(BASE)
  const live = await request(fetch, url)
  if (live !== null) {
    return { ...pair, value: live.value, asOf: live.asOf, origin: { kind: 'nbu-live', url } }
  }

  return {
    ...pair,
    value: NBU_EUR_UAH_SNAPSHOT.value,
    asOf: NBU_EUR_UAH_SNAPSHOT.asOf,
    // Адреса та сама: снепшот — це не інше джерело, а старіший відлік того ж.
    origin: { kind: 'nbu-snapshot', url },
  }
}
