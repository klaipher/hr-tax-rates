import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { formatEur, formatPostotak } from './format.ts'
import { eur } from './money.ts'

describe('format', () => {
  it('групує тисячі пробілом і відділяє центи комою', () => {
    expect(formatEur(eur('60000.01'))).toBe('60 000,01 €')
    expect(formatEur(eur('797.2'))).toBe('797,20 €')
    expect(formatEur(eur('0'))).toBe('0,00 €')
    expect(formatEur(eur('1234567.5'))).toBe('1 234 567,50 €')
  })

  it('пише від’ємну суму типографським мінусом і групує її так само', () => {
    // Стільки лишається обртнику за нульового primitak: самі внески й податок.
    expect(formatEur(eur('-3695.136'))).toBe('−3 695,14 €')
  })

  it('переводить частку у відсотки і не дописує зайвих нулів', () => {
    expect(formatPostotak(new Decimal('0.2021268'))).toBe('20,21 %')
    expect(formatPostotak(new Decimal('0.165'))).toBe('16,5 %')
    expect(formatPostotak(new Decimal('0.12'))).toBe('12 %')
  })
})
