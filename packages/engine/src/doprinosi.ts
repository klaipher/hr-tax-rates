import type { Ruleset, Sourced } from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { type Money, scale, sum } from './money.ts'
import type { Doprinos, Doprinosi, Naziv } from './types.ts'

/**
 * `doprinosi` (внески / social contributions) — спільний розрахунок для всіх
 * режимів.
 *
 * Режими різняться лише тим, звідки береться база: паушал будує її з
 * `koeficijent` свого розряду, `obrt na dohodak` — зі свого, `obrt na dobit` —
 * із `poduzetnička plaća`, а неповний рік ще й ділить її на місяці. Самі ж
 * ставки й спосіб нарахування однакові, бо взяті з тих самих статей.
 *
 * Модуль існує саме тому: чотири копії цього коду розійшлися б, і розійшлися б
 * тихо — числа лишалися б правдоподібними.
 */

/** Скільки місяців у повному році. Не константа домену, а календарний факт. */
export const MJESECI_U_GODINI = 12

export const godisnje = (mjesecni: Money<'EUR'>): Money<'EUR'> => scale(mjesecni, MJESECI_U_GODINI)

const NAZIVI = {
  moPrviStup: {
    hr: 'MO — I. stup',
    uk: 'пенсійне, генераційна солідарність',
  },
  moDrugiStup: {
    hr: 'MO — II. stup',
    uk: 'пенсійне, індивідуальна капіталізована ощадність',
  },
  zo: { hr: 'ZO', uk: 'медичне страхування' },
} as const satisfies Record<string, Naziv>

/**
 * Одна складова внесків від річної бази.
 *
 * Річна, а не місячна: місячну базу знають не всі режими — закон другої
 * діяльності її не має взагалі, — а річна є завжди.
 */
export const doprinos = ({
  naziv,
  stopa,
  godisnjaOsnovica,
  osobnaStednja,
}: {
  readonly naziv: Naziv
  readonly stopa: Sourced<Decimal>
  readonly godisnjaOsnovica: Money<'EUR'>
  readonly osobnaStednja: boolean
}): Doprinos => ({
  naziv,
  stopa: stopa.value,
  godisnjiIznos: scale(godisnjaOsnovica, stopa.value),
  osobnaStednja,
  izvor: stopa.source,
})

/**
 * Усі три складові внесків від річної бази.
 *
 * `mjesecnaOsnovica` передається окремо і лише для показу: режим, який
 * місячної бази не має, передає `undefined`, і картка не вигадує її.
 */
export const doprinosiOdGodisnjeOsnovice = (
  godisnjaOsnovica: Money<'EUR'>,
  ruleset: Ruleset,
  mjesecnaOsnovica: Money<'EUR'> | undefined,
): Doprinosi => {
  const moPrviStup = doprinos({
    naziv: NAZIVI.moPrviStup,
    stopa: ruleset.doprinosi.stopaMoPrviStup,
    godisnjaOsnovica,
    osobnaStednja: false,
  })
  const moDrugiStup = doprinos({
    naziv: NAZIVI.moDrugiStup,
    stopa: ruleset.doprinosi.stopaMoDrugiStup,
    godisnjaOsnovica,
    // II. stup іде на індивідуальний рахунок платника: це відкладені гроші,
    // а не втрачені, і на картці їх не можна показувати нарівні з податком.
    osobnaStednja: true,
  })
  const zo = doprinos({
    naziv: NAZIVI.zo,
    stopa: ruleset.doprinosi.stopaZo,
    godisnjaOsnovica,
    osobnaStednja: false,
  })

  return {
    mjesecnaOsnovica,
    moPrviStup,
    moDrugiStup,
    zo,
    ukupnoGodisnje: sum('EUR', [
      moPrviStup.godisnjiIznos,
      moDrugiStup.godisnjiIznos,
      zo.godisnjiIznos,
    ]),
  }
}

/**
 * Внески від місячної бази за задану кількість місяців.
 *
 * Обгортка над річним варіантом для режимів, чия база місячна: вона ж
 * тримає `mjesecnaOsnovica` для показу.
 */
export const doprinosiOdMjesecneOsnovice = (
  mjesecnaOsnovica: Money<'EUR'>,
  ruleset: Ruleset,
  brojMjeseci: number = MJESECI_U_GODINI,
): Doprinosi =>
  doprinosiOdGodisnjeOsnovice(scale(mjesecnaOsnovica, brojMjeseci), ruleset, mjesecnaOsnovica)
