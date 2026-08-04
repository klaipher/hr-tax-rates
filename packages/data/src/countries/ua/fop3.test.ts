import { describe, expect, it } from 'vitest'
import type { HomeCountryCharge, HomeCountryResult } from '../home-country.ts'
import { FOP_3_SKUPINE } from './fop3.ts'

/** Мінімальна зарплата 2026 — 8 647 ₴, отже ліміт третьої групи 1167 × 8 647. */
const LIMIT = '10091049'

const charge = (result: HomeCountryResult, id: string): HomeCountryCharge => {
  const found = result.charges.find((item) => item.id === id)
  if (found === undefined) throw new Error(`У розбивці немає рядка «${id}»`)
  return found
}

const at = (annualIncome: string) => FOP_3_SKUPINE.calculate(annualIncome)

describe('FOP 3. skupine', () => {
  it('рахує в гривні й називає свою країну', () => {
    expect(FOP_3_SKUPINE.code).toBe('UA')
    expect(FOP_3_SKUPINE.currency).toBe('UAH')
    expect(at('1000000').currency).toBe('UAH')
  })

  it('розбиває платіж на єдиний податок, військовий збір і ЄСВ — і ні на що більше', () => {
    expect(at('1000000').charges.map((item) => item.id)).toEqual([
      'yedynyi-podatok',
      'viiskovyi-zbir',
      'yesv',
    ])
  })

  it('бере єдиний податок як 5% доходу', () => {
    expect(charge(at('1000000'), 'yedynyi-podatok').annual.toFixed(2)).toBe('50000.00')
    expect(charge(at('250000'), 'yedynyi-podatok').annual.toFixed(2)).toBe('12500.00')
  })

  it('бере військовий збір як 1% доходу', () => {
    expect(charge(at('1000000'), 'viiskovyi-zbir').annual.toFixed(2)).toBe('10000.00')
    expect(charge(at('250000'), 'viiskovyi-zbir').annual.toFixed(2)).toBe('2500.00')
  })

  it('бере ЄСВ як 22% мінімальної зарплати за кожен місяць — незалежно від доходу', () => {
    // 8 647 × 22% = 1 902,34 на місяць, 22 828,08 за рік.
    expect(charge(at('250000'), 'yesv').annual.toFixed(2)).toBe('22828.08')
    expect(charge(at('1000000'), 'yesv').annual.toFixed(2)).toBe('22828.08')
  })

  it('лишає на руки дохід мінус усі три платежі', () => {
    const result = at('1000000')

    expect(result.totalCharges.toFixed(2)).toBe('82828.08')
    expect(result.net.toFixed(2)).toBe('917171.92')
  })

  it('показує ефективну ставку часткою від доходу', () => {
    expect(at('1000000').effectiveRate.toFixed(6)).toBe('0.082828')
  })

  it('лишає ЄСВ до сплати навіть за нульового доходу', () => {
    const result = at('0')

    expect(result.totalCharges.toFixed(2)).toBe('22828.08')
    expect(result.net.toFixed(2)).toBe('-22828.08')
    // Ділення на нуль — не привід кидати виняток посеред перерахунку в UI.
    expect(result.effectiveRate.toFixed(2)).toBe('0.00')
  })

  describe('річний ліміт третьої групи', () => {
    it('мовчить рівно на межі', () => {
      expect(at(LIMIT).breaches).toEqual([])
    })

    it('повідомляє про перевищення і показує, на скільки', () => {
      const result = at('12000000')
      const [breach] = result.breaches

      expect(result.breaches).toHaveLength(1)
      expect(breach?.id).toBe('annual-income-limit')
      expect(breach?.limit.toFixed(2)).toBe('10091049.00')
      expect(breach?.excess.toFixed(2)).toBe('1908951.00')
    })

    it('бачить перевищення на одну копійку', () => {
      expect(at('10091049.01').breaches).toHaveLength(1)
    })

    it('підписує межу статтею, що її встановлює', () => {
      const [breach] = at('12000000').breaches

      expect(breach?.references.map((ref) => ref.article)).toEqual([
        'пп. 3 п. 291.4 ст. 291',
        'ст. 8',
      ])
    })
  })

  describe('джерела', () => {
    it('веде єдиний податок до Податкового кодексу', () => {
      expect(charge(at('1000000'), 'yedynyi-podatok').references).toEqual([
        expect.objectContaining({
          jurisdiction: 'UA',
          act: 'Податковий кодекс України',
          article: 'пп. 2 п. 293.3 ст. 293',
        }),
      ])
    })

    it('веде військовий збір до перехідних положень Податкового кодексу', () => {
      expect(charge(at('1000000'), 'viiskovyi-zbir').references).toEqual([
        expect.objectContaining({
          jurisdiction: 'UA',
          act: 'Податковий кодекс України',
          article: 'пп. 3 пп. 1.3 п. 16-1 підрозд. 10 розд. XX',
        }),
      ])
    })

    it('веде ЄСВ і до ставки внеску, і до мінімальної зарплати, з якої його рахують', () => {
      expect(charge(at('1000000'), 'yesv').references).toEqual([
        expect.objectContaining({
          act: 'Закон України «Про збір та облік єдиного внеску на загальнообов’язкове державне соціальне страхування»',
          article: 'ч. 5 ст. 8',
        }),
        expect.objectContaining({
          act: 'Закон України «Про Державний бюджет України на 2026 рік»',
          article: 'ст. 8',
        }),
      ])
    })
  })
})
