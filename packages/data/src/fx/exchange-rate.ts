import type Decimal from 'decimal.js'
import type { CurrencyCode } from './currency.ts'

/** Календарна дата в ISO, `YYYY-MM-DD`. Той самий формат, що `checkedOn` у джерелах. */
export type IsoDate = `${number}-${number}-${number}`

/**
 * Звідки взявся курс. Показується поруч із числом, тому це не деталь
 * реалізації: снепшот піврічної давнини і живий курс НБУ — різні за
 * достовірністю величини, і користувач мусить бачити, яка з них перед ним.
 */
export type ExchangeRateOrigin =
  /** Живий запит до відкритого API НБУ. */
  | { readonly kind: 'nbu-live'; readonly url: string }
  /** Останній збережений у репозиторії відлік НБУ — коли живий запит не вдався. */
  | { readonly kind: 'nbu-snapshot'; readonly url: string }
  /** Значення, яке ввів користувач. Джерела не має за визначенням. */
  | { readonly kind: 'manual' }

/**
 * Курс однієї валюти до іншої — `pretpostavke`, а не `ruleset`: закон на нього
 * посилається, але не встановлює (ADR-0001). Тому супроводжується не статтею
 * закону, а походженням і датою.
 */
export interface ExchangeRate {
  /** Валюта, одиниця якої котирується. */
  readonly base: CurrencyCode
  /** Валюта, в якій виражена ціна одиниці `base`. */
  readonly quote: CurrencyCode
  /** Скільки одиниць `quote` дає одна одиниця `base`. */
  readonly value: Decimal
  /** Дата, якій курс належить, — не дата, коли його запитали. */
  readonly asOf: IsoDate
  readonly origin: ExchangeRateOrigin
}
