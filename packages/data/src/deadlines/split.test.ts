import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { splitIntoInstalments } from './split.ts'

const split = (annual: string, count: number): string[] =>
  splitIntoInstalments(new Decimal(annual), count).map((part) => part.toString())

/** Суми, на яких ділення націло не виходить, і суми з реальних розрахунків. */
const AWKWARD_ANNUAL_AMOUNTS = [
  '0',
  '0.01',
  '0.02',
  '100',
  '100.01',
  '1000.99',
  '3491.736',
  '2440.80',
  '203.40',
  '1.999',
  '-100.01',
]

describe('splitIntoInstalments', () => {
  it('ділить націло, коли сума ділиться націло', () => {
    expect(split('1000', 4)).toEqual(['250', '250', '250', '250'])
  })

  it('роздає зайві центи, а не ховає їх у округленні', () => {
    // 100 / 3 = 33,333… Наївне округлення дало б 33,33 × 3 = 99,99 і загубило цент.
    expect(split('100', 3)).toEqual(['33.33', '33.34', '33.33'])
  })

  it('не вигадує центів, коли сума менша за кількість платежів', () => {
    // Один цент на дванадцять місяців: одинадцять нулів і рівно один цент.
    const parts = split('0.01', 12)
    expect(parts.filter((part) => part !== '0')).toEqual(['0.01'])
    expect(parts).toHaveLength(12)
  })

  it('останній платіж вбирає залишок, дрібніший за цент', () => {
    // 3491,736 — річні doprinosi (внески) з дрейфом HOK. Округлити суму
    // самотужки означало б розійтися з річним підсумком на 0,4 цента.
    const parts = splitIntoInstalments(new Decimal('3491.736'), 12)
    expect(parts.reduce((a, b) => a.plus(b), new Decimal(0)).toString()).toBe('3491.736')
  })

  it('сума платежів точно дорівнює річній сумі — за будь-якої кількості платежів', () => {
    for (const annual of AWKWARD_ANNUAL_AMOUNTS) {
      for (let count = 1; count <= 12; count++) {
        const parts = splitIntoInstalments(new Decimal(annual), count)
        const total = parts.reduce((a, b) => a.plus(b), new Decimal(0))
        const expected = new Decimal(annual).toString()
        expect(`${annual}×${count} → ${total.toString()}`).toBe(`${annual}×${count} → ${expected}`)
      }
    }
  })

  it('жоден платіж не відхиляється від рівної частки більш ніж на цент', () => {
    for (const annual of AWKWARD_ANNUAL_AMOUNTS) {
      for (let count = 1; count <= 12; count++) {
        const even = new Decimal(annual).div(count)
        for (const part of splitIntoInstalments(new Decimal(annual), count)) {
          expect(part.minus(even).abs().lessThan('0.01')).toBe(true)
        }
      }
    }
  })

  it('вимагає щонайменше одного платежу', () => {
    expect(() => splitIntoInstalments(new Decimal('100'), 0)).toThrow()
    expect(() => splitIntoInstalments(new Decimal('100'), 1.5)).toThrow()
  })
})
