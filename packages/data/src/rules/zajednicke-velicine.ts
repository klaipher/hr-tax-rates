/**
 * Величини `Zakona o porezu na dohodak`, які потрібні більш ніж одному режиму.
 *
 * Модуль існує через дублювання, яке вже сталося: `osnovni osobni odbitak`
 * стояв окремо в правилах `obrt na dohodak` і окремо в правилах
 * `obrt na dobit`, і обидва місця мали JSDoc, що при злитті гілок число має
 * лишитися в одному. Plaća стала третім споживачем — тож замість третьої
 * копії тут одна.
 *
 * Модуль навмисно нічого не імпортує з інших правил: інакше вийшло б коло,
 * бо самі правила імпортують його.
 */
import Decimal from 'decimal.js'
import { ZAKON_O_POREZU_NA_DOHODAK } from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'

const CHECKED_ON = '2026-08-05' as const

/**
 * `osnovni osobni odbitak` (основний особистий відрахунок) — місячна сума, на
 * яку зменшується база `porez na dohodak`.
 *
 * Одна цифра з закону; коефіцієнти за утриманцями й дітьми множаться на неї
 * вже в `OsobniOdbitakPravila`. До цієї ж величини прив'язаний
 * `komorski doprinos`, який до доходу стосунку не має взагалі.
 */
export const OSNOVNI_OSOBNI_ODBITAK: Sourced<Decimal> = sourced(new Decimal('600'), {
  ...ZAKON_O_POREZU_NA_DOHODAK,
  article: 'čl. 14. st. 1.',
  checkedOn: CHECKED_ON,
})

/**
 * Місячна `porezna osnovica`, понад яку `predujam poreza` рахується за вищою
 * ставкою.
 *
 * Не плутати з річними 60 000 € із `čl. 19.`: там річна база річного звіту,
 * тут місячна база авансу, і це різні числа з різних статей. Стосується
 * кожного, кому податок утримують помісячно з plaća — і власника обрту в
 * системі `porez na dobit`, і найманого працівника, і власника d.o.o.
 */
export const MJESECNI_PRAG_VISE_STOPE: Sourced<Decimal> = sourced(new Decimal('5000'), {
  ...ZAKON_O_POREZU_NA_DOHODAK,
  article: 'čl. 24. st. 3.',
  checkedOn: CHECKED_ON,
})
