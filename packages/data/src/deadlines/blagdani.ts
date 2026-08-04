import type { LegalReference } from '../legal.ts'
import { ZAKON_O_BLAGDANIMA } from './acts.ts'
import { type CalendarDate, calendarDate, compareCalendarDates, nextDay } from './calendar-date.ts'

/**
 * `blagdani i neradni dani` (свята й неробочі дні) Хорватії.
 *
 * Потрібні не самі по собі, а тому що строк платежу, який припадає на
 * неробочий день, переноситься — див. `working-day.ts`. Один із таких збігів
 * не гіпотетичний: 15 серпня — Velika Gospa і водночас строк `doprinosi`
 * (внесків) за липень.
 *
 * Список закритий статтею 1 закону. `spomendani` (пам'ятні дні) зі статті 2
 * сюди не входять: стаття 4 говорить лише про статті 1 і 3, тож пам'ятні дні
 * лишаються робочими.
 */
export const BLAGDANI_REFERENCE: LegalReference = {
  ...ZAKON_O_BLAGDANIMA,
  article: 'čl. 1. st. 1.',
  checkedOn: '2026-08-04',
}

/** Свята з нерухомою датою: [місяць, день] у порядку зростання. */
const FIXED: readonly (readonly [number, number])[] = [
  [1, 1], // Nova godina (Новий рік)
  [1, 6], // Bogojavljenje ili Sveta tri kralja (Богоявлення)
  [5, 1], // Praznik rada (День праці)
  [5, 30], // Dan državnosti (День державності)
  [6, 22], // Dan antifašističke borbe (День антифашистської боротьби)
  [8, 5], // Dan pobjede i domovinske zahvalnosti i Dan hrvatskih branitelja
  [8, 15], // Velika Gospa (Успіння)
  [11, 1], // Svi sveti (День усіх святих)
  [11, 18], // Dan sjećanja na žrtve Domovinskog rata i žrtvu Vukovara i Škabrnje
  [12, 25], // Božić (Різдво)
  [12, 26], // Sveti Stjepan (День святого Стефана)
]

/** Tijelovo (Тіла Христового) — шістдесятий день після Великодня. */
const DAYS_FROM_EASTER_TO_TIJELOVO = 60

const addDays = (date: CalendarDate, days: number): CalendarDate => {
  let result = date
  for (let step = 0; step < days; step++) result = nextDay(result)
  return result
}

/**
 * Григоріанський computus (анонімний алгоритм, Meeus/Butcher) — дата Великодня
 * західної церкви.
 *
 * TODO: джерела не має і мати не може. Закон називає `Uskrs` і `Tijelovo`, але
 * не встановлює, як їх обчислювати, і жоден інший акт цього теж не робить —
 * дата свята належить церковному календарю, а не праву. Тому на цих двох днях
 * `BLAGDANI_REFERENCE` підтверджує лише те, що вони є святами, а не коли саме
 * вони настають.
 */
const uskrs = (year: number): CalendarDate => {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const dayOfYear = h + l - 7 * m + 114
  return calendarDate(year, Math.floor(dayOfYear / 31), (dayOfYear % 31) + 1)
}

/** Усі `blagdani` року, впорядковані за датою. */
export const blagdani = (year: number): readonly CalendarDate[] => {
  const easter = uskrs(year)
  const movable = [easter, nextDay(easter), addDays(easter, DAYS_FROM_EASTER_TO_TIJELOVO)]
  const fixed = FIXED.map(([month, day]) => calendarDate(year, month, day))
  return [...fixed, ...movable].sort(compareCalendarDates)
}

export const isBlagdan = (date: CalendarDate): boolean =>
  blagdani(date.year).some((blagdan) => compareCalendarDates(blagdan, date) === 0)
