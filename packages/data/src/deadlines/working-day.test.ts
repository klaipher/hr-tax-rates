import { describe, expect, it } from 'vitest'
import { calendarDate, toIsoDate } from './calendar-date.ts'
import { firstWorkingDay, isWorkingDay } from './working-day.ts'

const nextWorking = (iso: string): string => {
  const [year, month, day] = iso.split('-').map(Number)
  return toIsoDate(firstWorkingDay(calendarDate(year ?? 0, month ?? 0, day ?? 0)))
}

describe('isWorkingDay', () => {
  it('робочий день — це не вихідний і не свято', () => {
    expect(isWorkingDay(calendarDate(2026, 8, 14))).toBe(true) // п'ятниця
    expect(isWorkingDay(calendarDate(2026, 8, 15))).toBe(false) // субота і Velika Gospa
    expect(isWorkingDay(calendarDate(2026, 4, 6))).toBe(false) // понеділок, але Uskrsni ponedjeljak
  })
})

describe('firstWorkingDay', () => {
  it('не рухає дату, яка вже є робочим днем', () => {
    expect(nextWorking('2026-03-31')).toBe('2026-03-31') // вівторок
    expect(nextWorking('2026-12-31')).toBe('2026-12-31') // четвер
  })

  it('переносить строк із вихідного на понеділок', () => {
    // 28 лютого 2026 — субота, і це строк komorski doprinos за I квартал.
    expect(nextWorking('2026-02-28')).toBe('2026-03-02')
    // 31 травня 2026 — неділя, строк komorski doprinos за II квартал.
    expect(nextWorking('2026-05-31')).toBe('2026-06-01')
  })

  it('переносить строк зі свята, що випало на робочий день', () => {
    // 6 квітня 2026 — понеділок і Uskrsni ponedjeljak.
    expect(nextWorking('2026-04-06')).toBe('2026-04-07')
    // 4 червня 2026 — четвер і Tijelovo.
    expect(nextWorking('2026-06-04')).toBe('2026-06-05')
  })

  it('перестрибує через ланцюг свят і вихідних поспіль', () => {
    // 25 грудня 2026 — п'ятниця (Božić), 26 — субота (Sveti Stjepan),
    // 27 — неділя. Найближчий робочий день аж 28-го.
    expect(nextWorking('2026-12-25')).toBe('2026-12-28')
  })

  it('переходить через межу року і місяця', () => {
    // 30 квітня 2028 — неділя, наступний день 1 травня — Praznik rada.
    // Строк річної різниці porez na dobit за 2027 зсувається на вівторок.
    expect(nextWorking('2028-04-30')).toBe('2028-05-02')
    // 1 січня 2027 — п'ятниця (Nova godina), далі субота й неділя.
    expect(nextWorking('2027-01-01')).toBe('2027-01-04')
  })
})
