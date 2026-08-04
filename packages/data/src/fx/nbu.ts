import Decimal from 'decimal.js'
import type { CurrencyCode } from './currency.ts'
import type { IsoDate } from './exchange-rate.ts'

/**
 * Відкрите API Національного банку України: офіційний курс гривні до інших
 * валют. Відповідь — масив записів `{ r030, txt, rate, cc, exchangedate }`,
 * де `rate` — скільки гривень дає одиниця валюти `cc`, а `exchangedate` —
 * дата у форматі `DD.MM.YYYY`.
 */
const ENDPOINT = 'https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange'

export const nbuExchangeUrl = (currency: CurrencyCode): string =>
  `${ENDPOINT}?valcode=${currency}&json`

/** Курс, вичитаний з відповіді НБУ. */
export interface NbuQuote {
  readonly value: Decimal
  readonly asOf: IsoDate
}

const DAY_MONTH_YEAR = /^(\d{2})\.(\d{2})\.(\d{4})$/

/**
 * `DD.MM.YYYY` → `YYYY-MM-DD`.
 *
 * `Date` тут — розбір рядка, а не читання годинника: він відсіює дати, що
 * відповідають формату, але не існують (`32.07.2026`, `31.02.2026`).
 */
const toIsoDate = (raw: unknown): IsoDate | null => {
  if (typeof raw !== 'string') return null

  const match = DAY_MONTH_YEAR.exec(raw)
  if (match === null) return null

  const [, day, month, year] = match
  if (day === undefined || month === undefined || year === undefined) return null

  const iso = `${year}-${month}-${day}`
  const parsed = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return null
  // Звірка з тим, що вийшло: `2026-02-31` розбирається без помилки і мовчки
  // з'їжджає на 3 березня, тож самої лише відсутності NaN не досить.
  if (parsed.toISOString().slice(0, 10) !== iso) return null

  return iso as IsoDate
}

const isRecord = (item: unknown): item is Record<string, unknown> =>
  typeof item === 'object' && item !== null

/**
 * Розбір відповіді НБУ.
 *
 * Недовірливий навмисно: `null` замість винятку, бо для резолвера будь-яка
 * несподіванка в чужій відповіді — привід відкотитися на снепшот, а не впасти.
 * Невідому валюту НБУ віддає порожнім списком зі статусом 200, тож на код
 * відповіді покладатися не можна.
 */
export const parseNbuExchange = (payload: unknown, currency: CurrencyCode): NbuQuote | null => {
  if (!Array.isArray(payload)) return null

  const record: unknown = payload.find((item: unknown) => isRecord(item) && item['cc'] === currency)
  if (!isRecord(record)) return null

  const rate = record['rate']
  if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) return null

  const asOf = toIsoDate(record['exchangedate'])
  if (asOf === null) return null

  return { value: new Decimal(rate), asOf }
}
