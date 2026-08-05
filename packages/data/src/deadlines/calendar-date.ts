/**
 * Календарна дата без часу і без часового поясу.
 *
 * Строк платежу — це день у хорватському календарі, а не момент на осі часу.
 * `Date` не годиться двічі: він тягне за собою час і зону, тож «31 грудня» в
 * Києві та в Загребі стає різними митями, і він мовчки переносить неіснуючі
 * дати — `new Date(2026, 5, 31)` дає 1 липня замість помилки.
 *
 * Тому дата тут — трійка чисел, а вся арифметика написана вручну. Жодна
 * функція цього модуля не питає «яке сьогодні число»: податковий рік завжди
 * приходить входом.
 */
export interface CalendarDate {
  readonly year: number
  /** Місяць від 1 (siječanj / січень) до 12 (prosinac / грудень). */
  readonly month: number
  /** День місяця від 1 до останнього дня цього місяця. */
  readonly day: number
}

const MONTHS_IN_YEAR = 12

/** Днів у місяці для невисокосного року, від січня до грудня. */
const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

const FEBRUARY = 2

const isLeapYear = (year: number): boolean =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

const daysInMonth = (year: number, month: number): number => {
  const days = DAYS_IN_MONTH[month - 1]
  if (days === undefined) throw new RangeError(`Місяця ${month} не існує`)
  return month === FEBRUARY && isLeapYear(year) ? days + 1 : days
}

const pad = (value: number): string => String(value).padStart(2, '0')

/**
 * Дата з перевіркою: 31 червня або 29 лютого невисокосного року — виняток, а
 * не тихе перенесення на наступний місяць.
 */
export const calendarDate = (year: number, month: number, day: number): CalendarDate => {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    throw new RangeError(`Дата ${year}-${month}-${day} задана нецілими числами`)
  }
  if (month < 1 || month > MONTHS_IN_YEAR) {
    throw new RangeError(`Дати ${year}-${pad(month)}-${pad(day)} не існує: місяць поза 1–12`)
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    throw new RangeError(
      `Дати ${year}-${pad(month)}-${pad(day)} не існує: у цьому місяці ${daysInMonth(year, month)} днів`,
    )
  }
  return { year, month, day }
}

/** Останній день місяця — форма, якою закон називає строк «do posljednjeg dana». */
export const lastDayOfMonth = (year: number, month: number): CalendarDate =>
  calendarDate(year, month, daysInMonth(year, month))

export const nextDay = (date: CalendarDate): CalendarDate => {
  if (date.day < daysInMonth(date.year, date.month)) {
    return calendarDate(date.year, date.month, date.day + 1)
  }
  if (date.month < MONTHS_IN_YEAR) return calendarDate(date.year, date.month + 1, 1)
  return calendarDate(date.year + 1, 1, 1)
}

/**
 * Той самий місяць, зсунутий на `months` уперед, із збереженням року.
 * Строки описані саме так: «останній день місяця, наступного за періодом».
 */
export const addMonths = (
  year: number,
  month: number,
  months: number,
): { readonly year: number; readonly month: number } => {
  if (months < 0) throw new RangeError('Строк платежу не буває раніше за свій період')
  const index = month - 1 + months
  return { year: year + Math.floor(index / MONTHS_IN_YEAR), month: (index % MONTHS_IN_YEAR) + 1 }
}

/**
 * Конгруенція Целлера. Дає день тижня з самої лише арифметики, без `Date` і
 * без часових поясів: січень і лютий рахуються як 13-й і 14-й місяці
 * попереднього року, після чого 0 — субота, 1 — неділя, 2 — понеділок.
 */
const SATURDAY = 0
const SUNDAY = 1

const zellerDayOfWeek = ({ year, month, day }: CalendarDate): number => {
  const shiftedMonth = month < 3 ? month + MONTHS_IN_YEAR : month
  const shiftedYear = month < 3 ? year - 1 : year
  const yearInCentury = shiftedYear % 100
  const century = Math.floor(shiftedYear / 100)
  return (
    (day +
      Math.floor((13 * (shiftedMonth + 1)) / 5) +
      yearInCentury +
      Math.floor(yearInCentury / 4) +
      Math.floor(century / 4) +
      5 * century) %
    7
  )
}

/** Субота або неділя. Обидва дні неробочі за zakon o blagdanima (закон про свята). */
export const isWeekend = (date: CalendarDate): boolean => {
  const weekday = zellerDayOfWeek(date)
  return weekday === SATURDAY || weekday === SUNDAY
}

/** Компаратор для `Array.prototype.sort`: раніша дата йде першою. */
export const compareCalendarDates = (a: CalendarDate, b: CalendarDate): number =>
  a.year - b.year || a.month - b.month || a.day - b.day

/** `YYYY-MM-DD` — форма для показу й для порівнянь у тестах. */
/** @internal Форма для порівнянь у тестах: календар показує дати сам. */
export const toIsoDate = (date: CalendarDate): string =>
  `${date.year}-${pad(date.month)}-${pad(date.day)}`
