import Decimal from 'decimal.js'
import { type Divergence, divergences as registry } from './divergences.ts'
import type { HokCellRef } from './types.ts'
import { hokRawValue } from './workbook.ts'

export type HokCheck =
  | { readonly status: 'match'; readonly hok: string; readonly actual: string }
  | {
      readonly status: 'registered-divergence'
      readonly divergence: Divergence
      readonly hok: string
      readonly actual: string
    }
  | { readonly status: 'unregistered-divergence'; readonly hok: string; readonly actual: string }

export interface HokComparison extends HokCellRef {
  /** Наше число. Рядок, а не number — щоб не втратити точність дорогою. */
  readonly actual: string
}

const toCents = (raw: string, what: string): string => {
  let value: Decimal
  try {
    value = new Decimal(raw)
  } catch {
    throw new Error(`${what} не число: «${raw}»`)
  }
  if (!value.isFinite()) throw new Error(`${what} не число: «${raw}»`)
  return value.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)
}

/**
 * Порівнює наше число з кешованим значенням комірки HOK — до цента.
 *
 * Дрейф float у джерелі (290.97800000000001) розбіжністю не вважається: він на
 * порядки менший за цент. Розбіжністю є те, що видно в грошах.
 *
 * Реєстр приймається параметром, щоб тести могли перевірити сам механізм, не
 * засмічуючи справжній реєстр записами «лише для тесту».
 */
export const checkAgainstHok = (
  { actual, ...ref }: HokComparison,
  divergenceRegistry: readonly Divergence[] = registry,
): HokCheck => {
  const hok = toCents(hokRawValue(ref), `${ref.sheet}!${ref.cell}`)
  const ours = toCents(actual, 'наше значення')

  if (hok === ours) return { status: 'match', hok, actual: ours }

  const divergence = divergenceRegistry.find(
    (candidate) =>
      candidate.kind === 'value' &&
      candidate.scenarios.includes(ref.scenario) &&
      candidate.sheet === ref.sheet &&
      candidate.cell === ref.cell &&
      candidate.hokValue === hok &&
      candidate.ourValue === ours,
  )

  return divergence === undefined
    ? { status: 'unregistered-divergence', hok, actual: ours }
    : { status: 'registered-divergence', divergence, hok, actual: ours }
}

/**
 * Те саме порівняння, але незареєстрована розбіжність валить виклик.
 *
 * Голден-тести мають користуватися саме цим: `checkAgainstHok` лише повертає
 * статус, і той, хто забуде його перевірити, отримає зелений тест на
 * розбіжності. Тут забути неможливо.
 */
export const assertMatchesHok = (
  comparison: HokComparison,
  divergenceRegistry: readonly Divergence[] = registry,
): HokCheck => {
  const result = checkAgainstHok(comparison, divergenceRegistry)
  if (result.status === 'unregistered-divergence') {
    throw new Error(
      `Незареєстрована розбіжність із HOK у ${comparison.scenario} ${comparison.sheet}!${comparison.cell}: ` +
        `HOK ${result.hok}, у нас ${result.actual}. Або виправ розрахунок, або внеси розбіжність ` +
        'у реєстр із посиланням на статтю закону — див. ADR-0003.',
    )
  }
  return result
}
