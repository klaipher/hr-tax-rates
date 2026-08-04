import { describe, expect, it } from 'vitest'
import { add, eur, roundToCents, scale, sum, toCentString, uah } from './money.ts'

describe('money', () => {
  it('додає суми однієї валюти без дрейфу float', () => {
    // 0.1 + 0.2 !== 0.3 у number. Тут має бути рівно 0.30.
    expect(toCentString(add(eur(0.1), eur(0.2)))).toBe('0.30')
  })

  it('не накопичує дрейф на величинах із калькуляторів HOK', () => {
    // Excel HOK зберігає це значення як 3491.7359999999999.
    const monthly = scale(eur(797.2), 0.365)
    const annual = sum(
      'EUR',
      Array.from({ length: 12 }, () => monthly),
    )
    expect(toCentString(annual)).toBe('3491.74')
  })

  it('округлює до цента за правилом half-up', () => {
    expect(toCentString(roundToCents(eur('0.125')))).toBe('0.13')
    expect(toCentString(roundToCents(eur('0.124')))).toBe('0.12')
  })

  it('не дає скласти євро з гривнями', () => {
    // @ts-expect-error — валюта живе в типі, тож це помилка компіляції.
    expect(() => add(eur(1), uah(1))).not.toThrow()
  })
})
