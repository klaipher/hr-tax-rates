import type Decimal from 'decimal.js'
import {
  addMonths,
  type CalendarDate,
  calendarDate,
  compareCalendarDates,
  lastDayOfMonth,
} from './calendar-date.ts'
import { type Cadence, DEADLINES, type DueDateRule, type ObligationKind } from './obligations.ts'
import { splitIntoInstalments } from './split.ts'
import { firstWorkingDay } from './working-day.ts'

/** Відрізок календаря, за який сплачується платіж. */
export interface DateRange {
  readonly from: CalendarDate
  readonly to: CalendarDate
}

/** Річна сума одного обов'язкового платежу — вхід календаря. */
export interface AnnualObligation {
  readonly obligation: ObligationKind
  readonly annualAmount: Decimal
}

/** Один платіж у календарі. */
export interface Instalment {
  readonly obligation: ObligationKind
  readonly amount: Decimal
  /** Розрахунковий період, за який платіж. */
  readonly covers: DateRange
  /**
   * Строк за законом. Саме ця дата написана в акті, і саме її треба показувати
   * як строк — навіть коли вона припадає на неділю.
   */
  readonly dueOn: CalendarDate
  /**
   * Перший робочий день після `dueOn` — і лише тоді, коли `dueOn` неробочий.
   * Окремим полем, а не заміною `dueOn`, бо перенесення спирається на
   * тлумачення за аналогією, а не на дослівну норму — див. `working-day.ts`.
   */
  readonly postponedTo?: CalendarDate
}

const MONTHS_IN_YEAR = 12
const MONTHS_IN_QUARTER = 3

/** Розрахункові періоди податкового року — стільки, скільки платежів. */
const periodsOf = (cadence: Cadence, taxYear: number): readonly DateRange[] => {
  const range = (firstMonth: number, months: number): DateRange => ({
    from: calendarDate(taxYear, firstMonth, 1),
    to: lastDayOfMonth(taxYear, firstMonth + months - 1),
  })

  switch (cadence) {
    case 'mjesečno':
      return Array.from({ length: MONTHS_IN_YEAR }, (_, index) => range(index + 1, 1))
    case 'tromjesečno':
      return Array.from({ length: MONTHS_IN_YEAR / MONTHS_IN_QUARTER }, (_, index) =>
        range(index * MONTHS_IN_QUARTER + 1, MONTHS_IN_QUARTER),
      )
    case 'godišnje':
      return [range(1, MONTHS_IN_YEAR)]
  }
}

const dueDatesOf = (
  rule: DueDateRule,
  periods: readonly DateRange[],
  taxYear: number,
): readonly CalendarDate[] => {
  if (rule.kind === 'popis datuma') {
    if (rule.dates.length !== periods.length) {
      throw new Error(
        `Перелік строків має ${rule.dates.length} дат на ${periods.length} періодів — дані суперечать самі собі`,
      )
    }
    return rule.dates.map(({ month, day }) => calendarDate(taxYear, month, day))
  }

  return periods.map((period) => {
    const { year, month } = addMonths(period.to.year, period.to.month, rule.monthsAfterPeriodEnd)
    return rule.dayOfMonth === 'last'
      ? lastDayOfMonth(year, month)
      : calendarDate(year, month, rule.dayOfMonth)
  })
}

const instalmentsOf = (
  { obligation, annualAmount }: AnnualObligation,
  taxYear: number,
): readonly Instalment[] => {
  const { cadence, dueDate } = DEADLINES[obligation].value
  const periods = periodsOf(cadence, taxYear)
  const dates = dueDatesOf(dueDate, periods, taxYear)
  const amounts = splitIntoInstalments(annualAmount, periods.length)

  return periods.map((covers, index): Instalment => {
    const dueOn = dates[index]
    const amount = amounts[index]
    // Підставити тут щось «розумне» означало б видати вигаданий строк або
    // вигадану суму за пораховані. Обидва масиви будуються за довжиною
    // `periods`, тож порожнє місце — це помилка в коді, а не випадок даних.
    if (dueOn === undefined || amount === undefined) {
      throw new Error(`Календар «${obligation}»: період №${index} лишився без строку або суми`)
    }
    const working = firstWorkingDay(dueOn)
    return {
      obligation,
      amount,
      covers,
      dueOn,
      ...(compareCalendarDates(working, dueOn) === 0 ? {} : { postponedTo: working }),
    }
  })
}

/**
 * Календар платежів на податковий рік.
 *
 * Бере річні суми й повертає їх розписаними по датах — по одному платежу на
 * розрахунковий період кожного обов'язкового платежу. Про режими не знає
 * нічого: режим уже втілений у тому, які саме `ObligationKind` йому подали.
 *
 * Дві властивості, на які можна спиратися:
 *
 * - сума платежів кожного обов'язкового платежу точно дорівнює його річній
 *   сумі — жодного цента не втрачено на округленні й жодного не вигадано;
 * - платежі впорядковані за строком, тож це календар, а не звіт.
 *
 * Рік — вхід, а не «сьогодні»: жодна функція тут не питає системного часу,
 * інакше той самий розрахунок давав би різні відповіді в різні дні.
 */
export const buildPaymentSchedule = (
  taxYear: number,
  obligations: readonly AnnualObligation[],
): readonly Instalment[] => {
  if (!Number.isInteger(taxYear)) {
    throw new RangeError(`Податковий рік має бути цілим числом, а не ${taxYear}`)
  }

  const seen = new Set<ObligationKind>()
  for (const { obligation } of obligations) {
    if (seen.has(obligation)) {
      throw new Error(`Платіж «${obligation}» подано двічі — річна сума мала б бути одна`)
    }
    seen.add(obligation)
  }

  return obligations
    .flatMap((obligation) => instalmentsOf(obligation, taxYear))
    .sort((a, b) => compareCalendarDates(a.dueOn, b.dueOn))
}
