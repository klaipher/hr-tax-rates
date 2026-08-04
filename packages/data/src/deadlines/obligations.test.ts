import { describe, expect, it } from 'vitest'
import { BLAGDANI_REFERENCE } from './blagdani.ts'
import { DEADLINES, OBLIGATION_KINDS } from './obligations.ts'
import { PRIJENOS_NA_RADNI_DAN } from './working-day.ts'

const INSTALMENTS_PER_YEAR = { mjesečno: 12, tromjesečno: 4, godišnje: 1 } as const

describe('строки платежів', () => {
  it('покриває кожен обов’язковий платіж рівно один раз', () => {
    expect(Object.keys(DEADLINES).sort()).toEqual([...OBLIGATION_KINDS].sort())
    expect(new Set(OBLIGATION_KINDS).size).toBe(OBLIGATION_KINDS.length)
  })

  it('кожен строк несе посилання на джерело права — ADR-0002', () => {
    for (const kind of OBLIGATION_KINDS) {
      const { source } = DEADLINES[kind]
      expect(source.act, kind).not.toBe('')
      expect(source.article, kind).not.toBe('')
      expect(source.url, kind).toMatch(/^https:\/\//)
      expect(source.checkedOn, kind).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(source.jurisdiction, kind).toBe('HR')
      expect(source.status, kind).toBe('in-force')
    }
  })

  it('джерелом строку є акт, який справді його встановлює', () => {
    // Сторож від копіювання посилання з сусіднього запису: строки паушалу
    // встановлює pravilnik, а не закон, а внески всіх трьох режимів мають три
    // різні статті одного закону.
    expect(DEADLINES['paušalni porez'].source.act).toContain('Pravilnik o paušalnom')
    expect(DEADLINES['komorski doprinos'].source.act).toContain('Odluka o obveznom komorskom')

    const contributionArticles = [
      DEADLINES['doprinosi (paušalni obrt)'].source.article,
      DEADLINES['doprinosi (obrt na dohodak)'].source.article,
      DEADLINES['doprinosi (obrt na dobit)'].source.article,
    ]
    expect(new Set(contributionArticles).size).toBe(3)

    // Строк у двох авансів однаковий, але акти різні — збіг дат не привід
    // послатися на той самий закон.
    expect(DEADLINES['predujam poreza na dohodak'].source.act).not.toBe(
      DEADLINES['predujam poreza na dobit'].source.act,
    )
  })

  it('перелік готових дат має рівно стільки дат, скільки в році періодів', () => {
    for (const kind of OBLIGATION_KINDS) {
      const { cadence, dueDate } = DEADLINES[kind].value
      if (dueDate.kind !== 'popis datuma') continue
      expect(dueDate.dates, kind).toHaveLength(INSTALMENTS_PER_YEAR[cadence])
    }
  })

  it('жоден строк не відлічується раніше за власний період', () => {
    for (const kind of OBLIGATION_KINDS) {
      const { dueDate } = DEADLINES[kind].value
      if (dueDate.kind !== 'nakon razdoblja') continue
      expect(dueDate.monthsAfterPeriodEnd, kind).toBeGreaterThanOrEqual(0)
      if (dueDate.dayOfMonth !== 'last') {
        expect(dueDate.dayOfMonth, kind).toBeGreaterThanOrEqual(1)
        expect(dueDate.dayOfMonth, kind).toBeLessThanOrEqual(28)
      }
    }
  })

  it('правила про неробочі дні теж підписані джерелом', () => {
    // Перенесення спирається на два акти — норму ZUP і місток із OPZ, — і
    // обидва мають бути названі, інакше ланцюг тлумачення нема як перевірити.
    expect(PRIJENOS_NA_RADNI_DAN).toHaveLength(2)
    for (const reference of [BLAGDANI_REFERENCE, ...PRIJENOS_NA_RADNI_DAN]) {
      expect(reference.article).not.toBe('')
      expect(reference.url).toMatch(/^https:\/\//)
      expect(reference.status).toBe('in-force')
    }
  })
})
