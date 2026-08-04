import { describe, expect, it } from 'vitest'
import { add, eur, roundToCents, scale, sum, toCentString, uah } from './money.ts'

describe('money', () => {
  // Твердження навмисно порівнюють НЕокруглене значення. Порівняння через
  // toCentString довело б рівно нічого: toFixed(2) прибирає той самий дрейф,
  // який ми тут ловимо, і реалізація на звичайних number пройшла б так само.

  it('додає суми однієї валюти без дрейфу float', () => {
    // 0.1 + 0.2 у number дає 0.30000000000000004.
    expect(add(eur('0.1'), eur('0.2')).amount.toString()).toBe('0.3')
  })

  it('не накопичує дрейф на величинах із калькуляторів HOK', () => {
    // osnovica 797,20 × 36,5% × 12 місяців. Excel HOK зберігає місячне значення
    // як 290.97800000000001, а річне — як 3491.7359999999999.
    const monthly = scale(eur('797.20'), '0.365')
    expect(monthly.amount.toString()).toBe('290.978')

    const annual = sum(
      'EUR',
      Array.from({ length: 12 }, () => monthly),
    )
    expect(annual.amount.toString()).toBe('3491.736')
    expect(toCentString(roundToCents(annual))).toBe('3491.74')
  })

  it('округлює до цента за правилом half-up', () => {
    expect(toCentString(roundToCents(eur('0.125')))).toBe('0.13')
    expect(toCentString(roundToCents(eur('0.124')))).toBe('0.12')
  })

  it('різні валюти не складаються — це помилка компіляції, а не рантайму', () => {
    // Перевіркою є сама директива: якщо додавання гривень до євро перестане
    // бути помилкою типів, tsc повідомить про невикористану директиву й білд впаде.
    // @ts-expect-error — валюта живе в типі.
    const mixed = add(eur(1), uah(1))

    // Рантайм тут нічого не ловить: валюта береться з першого аргументa.
    expect(mixed.currency).toBe('EUR')
  })
})
