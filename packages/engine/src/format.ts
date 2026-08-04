import type Decimal from 'decimal.js'
import type { Money } from './money.ts'

/**
 * Форматування чисел для людини.
 *
 * Власне, а не через `Intl`: рушій пояснює недоступність режиму текстом із
 * сумою всередині, і ця сума мусить виглядати однаково в тесті, у причині
 * недоступності й на картці. `Intl` розділяє тисячі нерозривним пробілом,
 * який залежить від локалі середовища, — надто хистка основа для порівнянь.
 */

const TISUCE = /\B(?=(\d{3})+(?!\d))/g

const MINUS = '−'

/** Сума в євро: `60 000,01 €`. */
export const formatEur = (iznos: Money<'EUR'>): string => {
  const [cijeli = '0', decimale = '00'] = iznos.amount.toFixed(2).split('.')
  const negativan = cijeli.startsWith('-')
  const znamenke = (negativan ? cijeli.slice(1) : cijeli).replace(TISUCE, ' ')

  return `${negativan ? MINUS : ''}${znamenke},${decimale} €`
}

/**
 * Частка як відсоток: `20,21 %`, `16,5 %`, `12 %`.
 *
 * Хвостові нулі прибираються: ставка 12% у законі записана саме так, і
 * дописувати їй центи означало б натякати на точність, якої немає.
 */
export const formatPostotak = (udio: Decimal): string =>
  `${udio.times(100).toDecimalPlaces(2).toString().replace('.', ',')} %`
