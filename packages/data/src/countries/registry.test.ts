import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { homeCountries } from './registry.ts'

const registered = Object.values(homeCountries)

describe('реєстр рідних країн', () => {
  it('містить Україну', () => {
    expect(homeCountries.UA.code).toBe('UA')
    expect(homeCountries.UA.currency).toBe('UAH')
  })

  it('кладе кожну країну під її власний код', () => {
    for (const [code, country] of Object.entries(homeCountries)) {
      expect(country.code).toBe(code)
    }
  })
})

// Спільний контракт «рідної країни». Саме на ньому тримається зіставність із
// хорватськими режимами: нова країна, додана файлом даних, або задовольняє ці
// властивості, або не збирається.
describe.each(registered.map((country) => [country.code, country] as const))(
  'контракт рідної країни: %s',
  (_code, country) => {
    const result = country.calculate('1000000')

    it('повертає результат у валюті країни', () => {
      expect(result.currency).toBe(country.currency)
      expect(result.country).toBe(country.code)
    })

    it('повертає непорожню розбивку з унікальними рядками', () => {
      const ids = result.charges.map((charge) => charge.id)

      expect(ids.length).toBeGreaterThan(0)
      expect(new Set(ids).size).toBe(ids.length)
    })

    it('має суму платежів, що дорівнює сумі рядків розбивки', () => {
      const sum = result.charges.reduce((acc, charge) => acc.plus(charge.annual), new Decimal(0))

      expect(result.totalCharges.toFixed(2)).toBe(sum.toFixed(2))
    })

    it('має на руки рівно дохід мінус платежі', () => {
      expect(result.net.toFixed(2)).toBe(result.annualIncome.minus(result.totalCharges).toFixed(2))
    })

    it('має ефективну ставку, що дорівнює частці платежів у доході', () => {
      expect(result.effectiveRate.toFixed(8)).toBe(
        result.totalCharges.div(result.annualIncome).toFixed(8),
      )
    })

    it('підписує кожен платіж джерелом своєї юрисдикції', () => {
      for (const charge of result.charges) {
        expect(charge.references.length).toBeGreaterThan(0)

        for (const reference of charge.references) {
          expect(reference.jurisdiction).toBe(country.code)
          expect(reference.article).not.toBe('')
          expect(reference.url).toMatch(/^https:\/\//)
        }
      }
    })
  },
)
