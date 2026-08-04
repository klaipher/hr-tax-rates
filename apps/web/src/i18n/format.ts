import type { Money, Porez } from '@hr-tax/engine'
import type { Locale } from './locale.ts'

/**
 * Число рушія — воно завжди `Decimal`, чи то ставка, чи то сума.
 *
 * Тип береться з контракту рушія, а не з `decimal.js` напряму, щоб не тягнути
 * бібліотеку в залежності застосунку: інтерфейс сам нічого не рахує, він лише
 * показує готові числа.
 */
type DecimalniBroj = Porez['stopa']

/**
 * Валюта одна на всі локалі.
 *
 * Мова інтерфейсу міняє розділювач розрядів, десятковий знак і місце символу,
 * але не міняє грошей: хорватські податки сплачуються в євро незалежно від
 * того, якою мовою людина читає сторінку. Показати ті самі суми в гривнях
 * означало б підмінити юридичну величину курсом.
 */
const VALUTA = 'EUR'

/**
 * Форматування чисел для людини — за локаллю, через `Intl`.
 *
 * Це не те саме, що `formatEur` рушія, і дублюванням не є: рушій форматує
 * числа всередині власних повідомлень і мусить давати той самий рядок у
 * тесті й у голден-фікстурі, тому локалі не знає взагалі. Інтерфейс,
 * навпаки, зобов'язаний писати числа так, як їх пише мова читача.
 */
export interface Formatters {
  /** Сума в євро за правилами локалі: `60 000,01 €`, `€60,000.01`. */
  readonly eur: (iznos: Money<'EUR'>) => string
  /**
   * Сума в гривнях за правилами локалі.
   *
   * Окремий форматувальник, а не той самий із іншою валютою: гривня
   * з'являється лише в порівнянні з рідною країною, і показувати її як євро
   * означало б переплутати валюти на екрані.
   */
  readonly uah: (iznos: Money<'UAH'>) => string
  /** Частка як відсоток: `20,21 %`. Хвостові нулі не дописуються. */
  readonly percent: (udio: DecimalniBroj) => string
  /** Звичайне число з групуванням розрядів. */
  readonly number: (broj: number) => string
}

/**
 * Максимум знаків після коми у відсотку.
 *
 * Мінімум не задається навмисно: ставка 12% у законі записана саме так, і
 * дописувати їй два нулі означало б натякати на точність, якої немає.
 */
const ZNAMENKE_POSTOTKA = 2

/**
 * `Decimal` → `number` для показу.
 *
 * Дрейф float тут нешкідливий, бо число вже пораховане й округлене рушієм у
 * `Decimal`: цей крок лише передає готову величину форматувальнику, а не бере
 * участь у розрахунку.
 */
const zaPrikaz = (vrijednost: DecimalniBroj): number => vrijednost.toNumber()

export const createFormatters = (locale: Locale): Formatters => {
  // `narrowSymbol` замість типового `symbol`: українська за замовчуванням
  // друкує «EUR» літерами, і поруч із сумами хорватських податків це шум.
  // Скільки знаків після коми має євро, `Intl` знає з самої валюти.
  const novac = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: VALUTA,
    currencyDisplay: 'narrowSymbol',
  })
  const grivnja = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'UAH',
    currencyDisplay: 'narrowSymbol',
  })
  const postotak = new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: ZNAMENKE_POSTOTKA,
  })
  const broj = new Intl.NumberFormat(locale)

  return {
    eur: (iznos) => novac.format(zaPrikaz(iznos.amount)),
    uah: (iznos) => grivnja.format(zaPrikaz(iznos.amount)),
    percent: (udio) => postotak.format(zaPrikaz(udio)),
    number: (vrijednost) => broj.format(vrijednost),
  }
}
