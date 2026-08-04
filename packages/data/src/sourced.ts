import type { LegalReference } from './legal.ts'

/**
 * Юридичне число разом зі своїм джерелом.
 *
 * Тип існує, щоб число без посилання на акт неможливо було створити — див.
 * ADR-0002. Ставки, межі розрядів і коефіцієнти зберігаються тільки так.
 *
 * Величини, які закон не встановлює, а лише на них посилається — `prosječna
 * plaća`, курс валют, українська мінімальна зарплата — це `pretpostavke`, і
 * вони мають власне джерело статистики, а не правове (ADR-0001).
 */
export interface Sourced<T> {
  readonly value: T
  readonly source: LegalReference
}

export const sourced = <T>(value: T, source: LegalReference): Sourced<T> => ({ value, source })
