import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { compareCalendarDates, toIsoDate } from './calendar-date.ts'
import { OBLIGATION_KINDS, type ObligationKind } from './obligations.ts'
import { buildPaymentSchedule, type Instalment } from './schedule.ts'

const scheduleFor = (
  kind: ObligationKind,
  annualAmount: string,
  taxYear = 2026,
): readonly Instalment[] =>
  buildPaymentSchedule(taxYear, [{ obligation: kind, annualAmount: new Decimal(annualAmount) }])

/** Платіж за номером. Кидає замість `undefined`, щоб тест падав на місці. */
const at = (instalments: readonly Instalment[], index: number): Instalment => {
  const instalment = instalments[index]
  if (instalment === undefined) throw new Error(`У календарі немає платежу №${index}`)
  return instalment
}

const dueDates = (instalments: readonly Instalment[]): string[] =>
  instalments.map((instalment) => toIsoDate(instalment.dueOn))

const effectiveDates = (instalments: readonly Instalment[]): string[] =>
  instalments.map((instalment) => toIsoDate(instalment.postponedTo ?? instalment.dueOn))

const amounts = (instalments: readonly Instalment[]): string[] =>
  instalments.map((instalment) => instalment.amount.toFixed(2))

const total = (instalments: readonly Instalment[]): Decimal =>
  instalments.reduce((sum, instalment) => sum.plus(instalment.amount), new Decimal(0))

describe('paušalni porez — квартальні аванси', () => {
  it('сплачується в останній день кожного кварталу', () => {
    const instalments = scheduleFor('paušalni porez', '1000')
    expect(dueDates(instalments)).toEqual(['2026-03-31', '2026-06-30', '2026-09-30', '2026-12-31'])
    expect(amounts(instalments)).toEqual(['250.00', '250.00', '250.00', '250.00'])
  })

  it('кожен аванс покриває свій квартал', () => {
    const instalments = scheduleFor('paušalni porez', '1000')
    expect(toIsoDate(at(instalments, 0).covers.from)).toBe('2026-01-01')
    expect(toIsoDate(at(instalments, 0).covers.to)).toBe('2026-03-31')
    expect(toIsoDate(at(instalments, 3).covers.from)).toBe('2026-10-01')
    expect(toIsoDate(at(instalments, 3).covers.to)).toBe('2026-12-31')
  })
})

describe('doprinosi — щомісячні внески', () => {
  it('сплачуються до 15 числа наступного місяця, а за грудень — уже в наступному році', () => {
    expect(dueDates(scheduleFor('doprinosi (paušalni obrt)', '1200'))).toEqual([
      '2026-02-15',
      '2026-03-15',
      '2026-04-15',
      '2026-05-15',
      '2026-06-15',
      '2026-07-15',
      '2026-08-15',
      '2026-09-15',
      '2026-10-15',
      '2026-11-15',
      '2026-12-15',
      '2027-01-15',
    ])
  })

  it('внески в системі porez na dobit мають інший строк — останній день місяця', () => {
    // Zakon o doprinosima розводить режими по різних главах: čl. 71 і čl. 67
    // дають 15 число, čl. 83 — останній день. Один строк на всі режими був би
    // помилкою для цілого режиму.
    const pausal = dueDates(scheduleFor('doprinosi (paušalni obrt)', '1200'))
    const dobit = dueDates(scheduleFor('doprinosi (obrt na dobit)', '1200'))
    expect(dobit[0]).toBe('2026-02-28')
    expect(dobit).not.toEqual(pausal)
  })

  it('внески obrt na dohodak збігаються за строком із паушальними', () => {
    expect(dueDates(scheduleFor('doprinosi (obrt na dohodak)', '1200'))).toEqual(
      dueDates(scheduleFor('doprinosi (paušalni obrt)', '1200')),
    )
  })

  it('кожен внесок покриває рівно свій місяць', () => {
    const instalments = scheduleFor('doprinosi (paušalni obrt)', '1200')
    expect(toIsoDate(at(instalments, 0).covers.from)).toBe('2026-01-01')
    expect(toIsoDate(at(instalments, 0).covers.to)).toBe('2026-01-31')
    expect(toIsoDate(at(instalments, 11).covers.from)).toBe('2026-12-01')
    expect(toIsoDate(at(instalments, 11).covers.to)).toBe('2026-12-31')
  })
})

describe('komorski doprinos — квартальний і наперед', () => {
  it('має чотири власні дати з переліку в odluci, усі в межах податкового року', () => {
    expect(dueDates(scheduleFor('komorski doprinos', '400'))).toEqual([
      '2026-02-28',
      '2026-05-31',
      '2026-08-31',
      '2026-11-30',
    ])
  })

  it('строк настає раніше за кінець кварталу, який платіж покриває', () => {
    // Це не описка в даних: odluka заряджає квартал наперед, і саме тому строк
    // не виводиться з кінця періоду, як в інших платежів.
    for (const instalment of scheduleFor('komorski doprinos', '400')) {
      expect(compareCalendarDates(instalment.dueOn, instalment.covers.to)).toBeLessThan(0)
    }
  })

  it('28 лютого лишається 28 лютого й у високосний рік', () => {
    // Odluka називає дату числом, а не «останнім днем місяця», тож правило
    // «останній день» дало б тут 29 лютого і помилковий строк раз на чотири роки.
    expect(dueDates(scheduleFor('komorski doprinos', '400', 2028))[0]).toBe('2028-02-28')
  })
})

describe('річна доплата — окремий платіж у наступному році', () => {
  it('різниця паушального податку настає за строком подання PO-SD', () => {
    const instalments = scheduleFor('razlika paušalnog poreza', '340.55')
    expect(instalments).toHaveLength(1)
    expect(dueDates(instalments)).toEqual(['2027-01-15'])
    expect(amounts(instalments)).toEqual(['340.55'])
  })

  it('різниця паушального податку покриває весь податковий рік', () => {
    const instalments = scheduleFor('razlika paušalnog poreza', '340.55')
    expect(toIsoDate(at(instalments, 0).covers.from)).toBe('2026-01-01')
    expect(toIsoDate(at(instalments, 0).covers.to)).toBe('2026-12-31')
  })

  it('різниця porez na dobit настає через чотири місяці після кінця року', () => {
    expect(dueDates(scheduleFor('razlika poreza na dobit', '1000'))).toEqual(['2027-04-30'])
  })

  it('різниця porez na dohodak настає останнім днем лютого наступного року', () => {
    expect(dueDates(scheduleFor('razlika poreza na dohodak', '1000'))).toEqual(['2027-02-28'])
    // Високосний рік: останній день лютого — 29-те, а не 28-ме.
    expect(dueDates(scheduleFor('razlika poreza na dohodak', '1000', 2027))).toEqual(['2028-02-29'])
  })

  it('відтворює строк, який Porezna uprava оголосила для декларації за 2025', () => {
    // Незалежна перевірка всього ланцюга — строку, вихідних і перенесення.
    // Porezna uprava: «zakonski rok ... pada u neradni dan (subota, 28.
    // veljače), rok za podnošenje godišnje porezne prijave za 2025. godinu je
    // 2. ožujka 2026.» Наш календар мусить дати ту саму пару дат.
    const instalments = scheduleFor('razlika poreza na dohodak', '1000', 2025)
    expect(dueDates(instalments)).toEqual(['2026-02-28'])
    expect(effectiveDates(instalments)).toEqual(['2026-03-02'])
  })

  it('три режими мають три різні строки річної доплати', () => {
    // Саме той платіж, який стає сюрпризом: він настає вже в наступному
    // календарному році, і в кожному режимі — свого дня.
    expect(dueDates(scheduleFor('razlika paušalnog poreza', '100'))).toEqual(['2027-01-15'])
    expect(dueDates(scheduleFor('razlika poreza na dohodak', '100'))).toEqual(['2027-02-28'])
    expect(dueDates(scheduleFor('razlika poreza na dobit', '100'))).toEqual(['2027-04-30'])
  })
})

describe('predujam poreza — аванси на дохідок і на прибуток', () => {
  it('сплачуються в останній день наступного місяця', () => {
    expect(dueDates(scheduleFor('predujam poreza na dohodak', '1200'))).toEqual([
      '2026-02-28',
      '2026-03-31',
      '2026-04-30',
      '2026-05-31',
      '2026-06-30',
      '2026-07-31',
      '2026-08-31',
      '2026-09-30',
      '2026-10-31',
      '2026-11-30',
      '2026-12-31',
      '2027-01-31',
    ])
  })

  it('аванс з porez na dobit має той самий строк', () => {
    expect(dueDates(scheduleFor('predujam poreza na dobit', '1200'))).toEqual(
      dueDates(scheduleFor('predujam poreza na dohodak', '1200')),
    )
  })
})

describe('перенесення строку з неробочого дня', () => {
  it('лишає в dueOn законну дату, а робочу подає окремо', () => {
    // 15 лютого 2026 — неділя.
    const january = at(scheduleFor('doprinosi (paušalni obrt)', '1200'), 0)
    expect(toIsoDate(january.dueOn)).toBe('2026-02-15')
    expect(january.postponedTo).toBeDefined()
    expect(toIsoDate(january.postponedTo ?? january.dueOn)).toBe('2026-02-16')
  })

  it('не додає postponedTo, коли строк і так робочий день', () => {
    expect(at(scheduleFor('paušalni porez', '1000'), 0).postponedTo).toBeUndefined()
  })

  it('переносить строк, що припав на свято', () => {
    // Внески за липень: 15 серпня 2026 — і субота, і Velika Gospa.
    const july = at(scheduleFor('doprinosi (paušalni obrt)', '1200'), 6)
    expect(toIsoDate(july.dueOn)).toBe('2026-08-15')
    expect(toIsoDate(july.postponedTo ?? july.dueOn)).toBe('2026-08-17')
  })

  it('переносить квартальний внесок до палати з суботи на понеділок', () => {
    expect(effectiveDates(scheduleFor('komorski doprinos', '400'))).toEqual([
      '2026-03-02',
      '2026-06-01',
      '2026-08-31',
      '2026-11-30',
    ])
  })

  it('перенесення не змінює суми платежу', () => {
    expect(amounts(scheduleFor('komorski doprinos', '400'))).toEqual([
      '100.00',
      '100.00',
      '100.00',
      '100.00',
    ])
  })
})

describe('календар як ціле', () => {
  it('сума платежів точно дорівнює річній сумі — для кожного обов’язкового платежу', () => {
    for (const kind of OBLIGATION_KINDS) {
      for (const annual of ['0', '0.01', '1000.99', '3491.736', '203.40', '2440.80']) {
        const instalments = scheduleFor(kind, annual)
        expect(`${kind}/${annual}: ${total(instalments).toString()}`).toBe(
          `${kind}/${annual}: ${new Decimal(annual).toString()}`,
        )
      }
    }
  })

  it('віддає платежі впорядкованими за строком, а не згрупованими за платежем', () => {
    const schedule = buildPaymentSchedule(2026, [
      { obligation: 'paušalni porez', annualAmount: new Decimal('1000') },
      { obligation: 'doprinosi (paušalni obrt)', annualAmount: new Decimal('1200') },
      { obligation: 'komorski doprinos', annualAmount: new Decimal('400') },
    ])
    expect(dueDates(schedule)).toEqual([...dueDates(schedule)].sort())
    expect(schedule).toHaveLength(4 + 12 + 4)
  })

  it('лишає квартальні аванси відокремленими від щомісячних внесків', () => {
    const schedule = buildPaymentSchedule(2026, [
      { obligation: 'paušalni porez', annualAmount: new Decimal('1000') },
      { obligation: 'doprinosi (paušalni obrt)', annualAmount: new Decimal('1200') },
    ])
    const countOf = (kind: ObligationKind): number =>
      schedule.filter((instalment) => instalment.obligation === kind).length
    expect(countOf('paušalni porez')).toBe(4)
    expect(countOf('doprinosi (paušalni obrt)')).toBe(12)
  })

  it('бере податковий рік із входу, а не з поточної дати', () => {
    expect(dueDates(scheduleFor('paušalni porez', '1000', 2031))).toEqual([
      '2031-03-31',
      '2031-06-30',
      '2031-09-30',
      '2031-12-31',
    ])
  })

  it('на порожньому вході дає порожній календар', () => {
    expect(buildPaymentSchedule(2026, [])).toEqual([])
  })

  it('відхиляє двічі поданий той самий платіж', () => {
    expect(() =>
      buildPaymentSchedule(2026, [
        { obligation: 'komorski doprinos', annualAmount: new Decimal('400') },
        { obligation: 'komorski doprinos', annualAmount: new Decimal('400') },
      ]),
    ).toThrow('komorski doprinos')
  })

  it('відхиляє податковий рік, який не є цілим числом', () => {
    expect(() => scheduleFor('paušalni porez', '1000', 2026.5)).toThrow()
  })
})
