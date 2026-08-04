import { describe, expect, it } from 'vitest'
import { ZAKON_O_DOPRINOSIMA } from '../legal.ts'
import { assertMatchesHok, checkAgainstHok } from './compare.ts'
import type { ValueDivergence } from './divergences.ts'

const PREGLED = 'PREGLED MOGUĆNOSTI '
// Місячні doprinosi паушального обрту. HOK зберігає це як 290.97800000000001.
const CELL = { scenario: 'in-force-2026', sheet: PREGLED, cell: 'C5' } as const

const registered = (over: Partial<ValueDivergence> = {}): ValueDivergence => ({
  kind: 'value',
  id: 'test-only',
  scenarios: ['in-force-2026'],
  sheet: PREGLED,
  cell: 'C5',
  hokValue: '290.98',
  ourValue: '300.00',
  reason: 'запис лише для тесту',
  reference: { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 7', checkedOn: '2026-08-04' },
  ...over,
})

describe('checkAgainstHok', () => {
  it('визнає збіг, коли числа сходяться до цента', () => {
    expect(checkAgainstHok({ ...CELL, actual: '290.98' })).toEqual({
      status: 'match',
      hok: '290.98',
      actual: '290.98',
    })
  })

  it('не вважає дрейф float у джерелі розбіжністю', () => {
    // 290.97800000000001 і 290.978 — те саме число з точністю до цента.
    expect(checkAgainstHok({ ...CELL, actual: '290.9780' }).status).toBe('match')
  })

  it('позначає незареєстровану розбіжність', () => {
    expect(checkAgainstHok({ ...CELL, actual: '300.00' })).toEqual({
      status: 'unregistered-divergence',
      hok: '290.98',
      actual: '300.00',
    })
  })

  it('пропускає розбіжність, яка є в реєстрі', () => {
    expect(checkAgainstHok({ ...CELL, actual: '300.00' }, [registered()]).status).toBe(
      'registered-divergence',
    )
  })

  it('не приймає запис реєстру, який описує інше число', () => {
    const stale = registered({ hokValue: '111.11' })

    expect(checkAgainstHok({ ...CELL, actual: '300.00' }, [stale]).status).toBe(
      'unregistered-divergence',
    )
  })

  it('відмовляється порівнювати нечислову комірку', () => {
    expect(() =>
      checkAgainstHok({ scenario: 'in-force-2026', sheet: PREGLED, cell: 'A5', actual: '1.00' }),
    ).toThrow(/не число/)
  })
})

describe('assertMatchesHok', () => {
  it('мовчить на збігу', () => {
    expect(assertMatchesHok({ ...CELL, actual: '290.98' }).status).toBe('match')
  })

  it('мовчить на зареєстрованій розбіжності', () => {
    expect(assertMatchesHok({ ...CELL, actual: '300.00' }, [registered()]).status).toBe(
      'registered-divergence',
    )
  })

  it('валить незареєстровану розбіжність і каже, що з нею робити', () => {
    expect(() => assertMatchesHok({ ...CELL, actual: '300.00' })).toThrow(
      /Незареєстрована розбіжність.*ADR-0003/s,
    )
  })
})
