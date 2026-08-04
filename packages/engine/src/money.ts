import Decimal from 'decimal.js'

/**
 * Валюти, з якими працює рушій. EUR — хорватська сторона, UAH — українська.
 */
export type Currency = 'EUR' | 'UAH'

/**
 * Грошова сума. Валюта живе в типі, тому скласти EUR із UAH не можна —
 * це помилка компіляції, а не тиха помилка в числі.
 *
 * Значення зберігається в `Decimal`, а не в `number`: рушій множить відсотки
 * на суми і порівнюється з еталонами до цента, тож дрейф float неприйнятний.
 */
export interface Money<C extends Currency = Currency> {
  readonly currency: C
  readonly amount: Decimal
}

const make = <C extends Currency>(currency: C, amount: Decimal.Value): Money<C> => ({
  currency,
  amount: new Decimal(amount),
})

/** Сума в євро (eura). */
export const eur = (amount: Decimal.Value): Money<'EUR'> => make('EUR', amount)

/** Сума в гривнях (hrivnja). */
export const uah = (amount: Decimal.Value): Money<'UAH'> => make('UAH', amount)

export const zero = <C extends Currency>(currency: C): Money<C> => make(currency, 0)

// `NoInfer` на другому аргументі — не косметика. Без нього TypeScript виводить
// `C` з обох аргументів і схлопує його в `'EUR' | 'UAH'`, після чого додавання
// гривень до євро тихо компілюється, а бренд валюти нічого не захищає.
export const add = <C extends Currency>(a: Money<C>, b: NoInfer<Money<C>>): Money<C> =>
  make(a.currency, a.amount.plus(b.amount))

/** Множення на безрозмірний коефіцієнт — ставку, коефіцієнт, частку. */
export const scale = <C extends Currency>(a: Money<C>, factor: Decimal.Value): Money<C> =>
  make(a.currency, a.amount.times(factor))

export const sum = <C extends Currency>(
  currency: C,
  items: readonly NoInfer<Money<C>>[],
): Money<C> => items.reduce<Money<C>>((acc, item) => add(acc, item), zero(currency))

/** Округлення до цента. Half-up — те саме правило, що в податкових розрахунках. */
export const roundToCents = <C extends Currency>(a: Money<C>): Money<C> =>
  make(a.currency, a.amount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP))

/** Рядок для порівнянь у тестах і для форматування: завжди два знаки. */
export const toCentString = (a: Money): string => a.amount.toFixed(2)
