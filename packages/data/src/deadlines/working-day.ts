import type { LegalReference } from '../legal.ts'
import { OPCI_POREZNI_ZAKON, ZAKON_O_OPCEM_UPRAVNOM_POSTUPKU } from './acts.ts'
import { isBlagdan } from './blagdani.ts'
import { type CalendarDate, isWeekend, nextDay } from './calendar-date.ts'

/**
 * Перенесення строку з неробочого дня.
 *
 * Норма є, але дістатися до неї можна лише ланцюжком. Opći porezni zakon
 * (загальний податковий закон) правила обчислення строків не має зовсім: у
 * čl. 130. st. 2. він каже, що строк сплати встановлює спеціальний закон, а в
 * čl. 4. — що там, де він мовчить, діє Zakon o općem upravnom postupku (закон
 * про загальний адміністративний процес). Той у čl. 81. st. 2. каже:
 *
 *   «Kad zadnji dan roka pada u nedjelju, na blagdan ili u drugi dan kad
 *   javnopravno tijelo ne radi, rok istječe prvoga sljedećega radnog dana.»
 *
 * Субота названа не прямо, а через «drugi dan kad javnopravno tijelo ne radi»
 * — Porezna uprava в суботу не працює.
 *
 * Застереження, через яке `dueOn` у розкладі лишається законною датою, а
 * перенесення подається окремим полем: čl. 79. ZUP описує строки на вчинення
 * процесуальних дій, тоді як строк сплати `doprinosi` за čl. 67. Zakona o
 * doprinosima — матеріальний і виникає із закону, а не з рішення органу.
 * Поширення čl. 81. на нього — тлумачення за аналогією через čl. 4. OPZ, а не
 * дослівна норма. Дослівної норми «платіж, строк якого припав на неробочий
 * день, сплачується наступного робочого дня» в жодному акті немає.
 *
 * Що практика саме така, видно з оголошення самої Porezna uprava: строк
 * річної декларації за 2025 припав на суботу 28 лютого 2026, і відомство
 * перенесло його на понеділок 2 березня. Цей випадок відтворено тестом —
 * якщо ланцюг тлумачення хибний, ми розійдемося з відомством на видимій даті.
 */
export const PRIJENOS_NA_RADNI_DAN: readonly LegalReference[] = [
  // Сама норма про перенесення.
  { ...ZAKON_O_OPCEM_UPRAVNOM_POSTUPKU, article: 'čl. 81. st. 2.', checkedOn: '2026-08-04' },
  // Місток, без якого норма до податкових строків не дотягується.
  { ...OPCI_POREZNI_ZAKON, article: 'čl. 4.', checkedOn: '2026-08-04' },
]

/** Не субота, не неділя і не `blagdan` (свято). */
export const isWorkingDay = (date: CalendarDate): boolean => !isWeekend(date) && !isBlagdan(date)

/** Сама дата, якщо вона робоча, інакше найближчий робочий день після неї. */
export const firstWorkingDay = (date: CalendarDate): CalendarDate => {
  let candidate = date
  while (!isWorkingDay(candidate)) candidate = nextDay(candidate)
  return candidate
}
