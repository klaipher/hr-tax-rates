import { describe, expect, it } from 'vitest'
import { blagdani, isBlagdan } from './blagdani.ts'
import { calendarDate, toIsoDate } from './calendar-date.ts'

const isoBlagdani = (year: number): string[] => blagdani(year).map(toIsoDate)

describe('blagdani (свята й неробочі дні)', () => {
  it('дає всі чотирнадцять днів зі статті 1 закону', () => {
    // Тринадцять підпунктів, але третій називає два дні — Uskrs і Uskrsni
    // ponedjeljak, тож днів у році чотирнадцять.
    expect(isoBlagdani(2026)).toEqual([
      '2026-01-01', // Nova godina
      '2026-01-06', // Bogojavljenje
      '2026-04-05', // Uskrs
      '2026-04-06', // Uskrsni ponedjeljak
      '2026-05-01', // Praznik rada
      '2026-05-30', // Dan državnosti
      '2026-06-04', // Tijelovo
      '2026-06-22', // Dan antifašističke borbe
      '2026-08-05', // Dan pobjede i domovinske zahvalnosti
      '2026-08-15', // Velika Gospa
      '2026-11-01', // Svi sveti
      '2026-11-18', // Dan sjećanja na žrtve Domovinskog rata
      '2026-12-25', // Božić
      '2026-12-26', // Sveti Stjepan
    ])
  })

  it('рахує Великдень за григоріанським computus', () => {
    const easter = (year: number): string | undefined => isoBlagdani(year)[2]
    expect(easter(2024)).toBe('2024-03-31')
    expect(easter(2025)).toBe('2025-04-20')
    expect(easter(2026)).toBe('2026-04-05')
    expect(easter(2027)).toBe('2027-03-28')
    expect(easter(2028)).toBe('2028-04-16')
    expect(easter(2038)).toBe('2038-04-25')
  })

  it('відносить Tijelovo рівно на шістдесятий день після Великодня', () => {
    // 2025: Uskrs 20 квітня → Tijelovo 19 червня. Перевіряє перенесення через
    // межу місяця, де наївне додавання днів помиляється.
    expect(isoBlagdani(2025)).toContain('2025-06-19')
    expect(isoBlagdani(2026)).toContain('2026-06-04')
  })

  it('видає дні впорядкованими за датою', () => {
    for (const year of [2024, 2025, 2026, 2027, 2028]) {
      const dates = isoBlagdani(year)
      expect(dates).toEqual([...dates].sort())
    }
  })

  it('не вважає святом spomendan — це робочі дні', () => {
    // 15 січня і 30 квітня — spomendani зі статті 2. Стаття 4 закону згадує
    // лише статті 1 і 3, тож spomendani неробочими не є.
    expect(isBlagdan(calendarDate(2026, 1, 15))).toBe(false)
    expect(isBlagdan(calendarDate(2026, 4, 30))).toBe(false)
  })

  it('впізнає свято, на яке справді припадає строк платежу', () => {
    // 15 серпня — Velika Gospa, і водночас строк doprinosi (внесків) за липень.
    expect(isBlagdan(calendarDate(2026, 8, 15))).toBe(true)
    expect(isBlagdan(calendarDate(2026, 8, 14))).toBe(false)
  })
})
