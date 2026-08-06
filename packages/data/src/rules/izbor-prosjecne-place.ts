/**
 * `prosječna plaća` як величина, яку можна обрати.
 *
 * Офіційних чисел два, і різняться вони не законом (ADR-0001): обґрунтування
 * законопроєкту рахує заплановані ставки від чинних 1 993 €, калькулятор HOK —
 * від прогнозних 2 180 €. Правила в обох ті самі, а суми внесків різні саме
 * через це. Тому обидва лишаються вибором, а не зашиваються в набір правил:
 * інакше перемикач сценарію міняв би водночас закон і статистику, і різниця
 * між ними читалася б як наслідок реформи.
 *
 * Живе в шарі даних, а не у формі, з тієї ж причини, з якої там живуть самі
 * величини: тут уже є `Decimal`, тут же лежать обидва джерела, і тут це
 * перевіряється тестом.
 */

import { Decimal } from 'decimal.js'
import { pretpostavke2026 } from './hr-2026.ts'
import { pretpostavkeNajave2027 } from './najava-2027.ts'
import type { Pretpostavka, Pretpostavke } from './types.ts'

/** Офіційні значення, між якими є сенс перемикатися. */
export const SLUZBENE_PROSJECNE_PLACE: readonly Pretpostavka<Decimal>[] = [
  pretpostavke2026.prosjecnaPlaca,
  pretpostavkeNajave2027.prosjecnaPlaca,
]

/** Значення за замовчуванням: опубліковане, а не прогнозне. */
export const ZADANA_PROSJECNA_PLACA = pretpostavke2026.prosjecnaPlaca

/**
 * Величина разом із її походженням.
 *
 * Число, що збіглося з офіційним, зберігає його джерело — інакше застосунок
 * забув би, звідки воно, щойно людина торкнулася поля. Будь-яке інше стає
 * `rucno`: посилання на публікацію під власноруч уведеним числом приписувало б
 * статистиці те, чого вона не публікувала.
 */
export const prosjecnaPlacaZa = (iznos: Decimal.Value): Pretpostavka<Decimal> => {
  const sluzbena = SLUZBENE_PROSJECNE_PLACE.find((preset) => preset.value.equals(iznos))
  if (sluzbena !== undefined) return sluzbena

  return { value: new Decimal(iznos), source: { status: 'rucno' } }
}

/**
 * Той самий набір припущень, але з іншою `prosječna plaća`.
 *
 * Функція існує через помилку, яку зробив застосунок і не спіймав ані тип,
 * ані 827 тестів: він будував `pretpostavke` заново з одного поля, і друга
 * статистика — середня за повний попередній рік — мовчки зникала разом із
 * порогом `EU plava karta`, що на ній стоїть. Об'єктний літерал у місці
 * узагальненого типу перевіряється поблажливо, тож пропажа була тихою.
 *
 * Заміна одного поля живе тут, а не в шарі показу, саме тому: додати
 * припущення й забути про це місце тепер неможливо.
 */
export const sProsjecnomPlacom = (
  pretpostavke: Pretpostavke,
  iznos: Decimal.Value,
): Pretpostavke => ({ ...pretpostavke, prosjecnaPlaca: prosjecnaPlacaZa(iznos) })
