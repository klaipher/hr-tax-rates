import { describe, expect, it } from 'vitest'
import {
  addMonths,
  calendarDate,
  compareCalendarDates,
  isWeekend,
  lastDayOfMonth,
  nextDay,
  toIsoDate,
} from './calendar-date.ts'

describe('calendarDate', () => {
  it('відхиляє день, якого в місяці немає', () => {
    // 31 червня не існує. Мовчазне перенесення на 1 липня — саме те, що робить
    // new Date(2026, 5, 31), і саме те, чого календар платежів дозволити не може.
    expect(() => calendarDate(2026, 6, 31)).toThrow('2026-06-31')
  })

  it('приймає 29 лютого лише у високосний рік', () => {
    expect(toIsoDate(calendarDate(2028, 2, 29))).toBe('2028-02-29')
    expect(() => calendarDate(2027, 2, 29)).toThrow('2027-02-29')
  })

  it('знає григоріанське правило століть', () => {
    // 1900 не високосний (ділиться на 100), 2000 — високосний (ділиться на 400).
    expect(() => calendarDate(1900, 2, 29)).toThrow()
    expect(toIsoDate(calendarDate(2000, 2, 29))).toBe('2000-02-29')
  })

  it('відхиляє місяць поза межами року', () => {
    expect(() => calendarDate(2026, 13, 1)).toThrow()
    expect(() => calendarDate(2026, 0, 1)).toThrow()
  })
})

describe('toIsoDate', () => {
  it('доповнює місяць і день нулями до двох знаків', () => {
    expect(toIsoDate(calendarDate(2026, 1, 5))).toBe('2026-01-05')
  })
})

describe('lastDayOfMonth', () => {
  it('дає останній день кожного типу місяця', () => {
    expect(toIsoDate(lastDayOfMonth(2026, 1))).toBe('2026-01-31')
    expect(toIsoDate(lastDayOfMonth(2026, 4))).toBe('2026-04-30')
    expect(toIsoDate(lastDayOfMonth(2026, 2))).toBe('2026-02-28')
    expect(toIsoDate(lastDayOfMonth(2028, 2))).toBe('2028-02-29')
  })
})

describe('nextDay', () => {
  it('переходить через кінець місяця і кінець року', () => {
    expect(toIsoDate(nextDay(calendarDate(2026, 1, 31)))).toBe('2026-02-01')
    expect(toIsoDate(nextDay(calendarDate(2026, 12, 31)))).toBe('2027-01-01')
    expect(toIsoDate(nextDay(calendarDate(2028, 2, 28)))).toBe('2028-02-29')
    expect(toIsoDate(nextDay(calendarDate(2027, 2, 28)))).toBe('2027-03-01')
  })
})

describe('addMonths', () => {
  it('не рухає місяць на нульовому зсуві', () => {
    expect(addMonths(2026, 3, 0)).toEqual({ year: 2026, month: 3 })
  })

  it('переносить рік, коли зсув виходить за грудень', () => {
    // Строк внесків за грудень — уже в наступному році.
    expect(addMonths(2026, 12, 1)).toEqual({ year: 2027, month: 1 })
    // Річна різниця porez na dobit — чотири місяці після кінця року.
    expect(addMonths(2026, 12, 4)).toEqual({ year: 2027, month: 4 })
    expect(addMonths(2026, 1, 23)).toEqual({ year: 2027, month: 12 })
    expect(addMonths(2026, 1, 24)).toEqual({ year: 2028, month: 1 })
  })

  it('відхиляє зсув у минуле — строк не буває раніше за свій період', () => {
    expect(() => addMonths(2026, 3, -1)).toThrow()
  })
})

describe('isWeekend', () => {
  it('визначає день тижня без Date і без часового поясу', () => {
    // 1 січня 2026 — четвер, 3 січня — субота, 4 січня — неділя.
    expect(isWeekend(calendarDate(2026, 1, 1))).toBe(false)
    expect(isWeekend(calendarDate(2026, 1, 3))).toBe(true)
    expect(isWeekend(calendarDate(2026, 1, 4))).toBe(true)
    expect(isWeekend(calendarDate(2026, 1, 5))).toBe(false)
  })

  it('правильно рахує день тижня через межу століття', () => {
    // 29 лютого 2000 — вівторок; 1 січня 1900 — понеділок.
    expect(isWeekend(calendarDate(2000, 2, 29))).toBe(false)
    expect(isWeekend(calendarDate(1900, 1, 1))).toBe(false)
    // 6 січня 1900 — субота.
    expect(isWeekend(calendarDate(1900, 1, 6))).toBe(true)
  })

  it('відносить до вихідних рівно суботу й неділю за цілий тиждень', () => {
    const week = [21, 22, 23, 24, 25, 26, 27].map((day) => isWeekend(calendarDate(2026, 9, day)))
    // 21 вересня 2026 — понеділок.
    expect(week).toEqual([false, false, false, false, false, true, true])
  })
})

describe('compareCalendarDates', () => {
  it('упорядковує за роком, місяцем і днем', () => {
    const dates = [
      calendarDate(2027, 1, 15),
      calendarDate(2026, 3, 31),
      calendarDate(2026, 3, 1),
      calendarDate(2026, 12, 31),
    ]
    expect([...dates].sort(compareCalendarDates).map(toIsoDate)).toEqual([
      '2026-03-01',
      '2026-03-31',
      '2026-12-31',
      '2027-01-15',
    ])
  })
})
