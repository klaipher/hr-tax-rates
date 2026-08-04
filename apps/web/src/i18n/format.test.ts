import { eur } from '@hr-tax/engine'
import { describe, expect, it } from 'vitest'
import { createFormatters } from './format.ts'

/**
 * `decimal.js` не є залежністю застосунку — і не мусить бути, бо всі числа
 * приходять готовими з рушія. Тому частку для тесту беремо тим самим шляхом,
 * що й інтерфейс: із грошової суми рушія.
 */
const udio = (vrijednost: string) => eur(vrijednost).amount

// Нерозривний пробіл і типографський мінус записані кодами навмисно: саме
// вони й відрізняють локалі, а на око в редакторі вони не відрізняються від
// звичайного пробілу й дефіса.
const NBSP = '\u00a0'
const MINUS = '\u2212'

describe('createFormatters', () => {
  it('форматує суму за правилами локалі, але валюта всюди EUR', () => {
    const iznos = eur('60000.01')

    expect(createFormatters('uk').eur(iznos)).toBe(`60${NBSP}000,01${NBSP}€`)
    expect(createFormatters('hr').eur(iznos)).toBe(`60.000,01${NBSP}€`)
    expect(createFormatters('en').eur(iznos)).toBe('€60,000.01')
  })

  it('показує євро символом у кожній локалі, а не кодом валюти', () => {
    // Українська за замовчуванням друкує «EUR» літерами; для калькулятора, де
    // валюта одна на всі режими, це шум, а не інформація.
    for (const locale of ['uk', 'hr', 'en'] as const) {
      expect(createFormatters(locale).eur(eur('0'))).toContain('€')
      expect(createFormatters(locale).eur(eur('0'))).not.toContain('EUR')
    }
  })

  it('форматує від’ємну суму знаком тієї ж локалі', () => {
    // Стільки лишається обртнику за нульового primitak: самі внески й податок.
    const iznos = eur('-3695.136')

    expect(createFormatters('uk').eur(iznos)).toBe(`-3${NBSP}695,14${NBSP}€`)
    expect(createFormatters('hr').eur(iznos)).toBe(`${MINUS}3.695,14${NBSP}€`)
    expect(createFormatters('en').eur(iznos)).toBe('-€3,695.14')
  })

  it('переводить частку у відсотки і не дописує зайвих нулів', () => {
    expect(createFormatters('uk').percent(udio('0.2021268'))).toBe('20,21%')
    expect(createFormatters('hr').percent(udio('0.2021268'))).toBe(`20,21${NBSP}%`)
    expect(createFormatters('en').percent(udio('0.2021268'))).toBe('20.21%')

    expect(createFormatters('uk').percent(udio('0.165'))).toBe('16,5%')
    expect(createFormatters('uk').percent(udio('0.12'))).toBe('12%')
  })

  it('групує розряди звичайного числа за локаллю', () => {
    expect(createFormatters('uk').number(12345)).toBe(`12${NBSP}345`)
    expect(createFormatters('hr').number(12345)).toBe('12.345')
    expect(createFormatters('en').number(12345)).toBe('12,345')
  })
})
