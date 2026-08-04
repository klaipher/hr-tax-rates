import type Decimal from 'decimal.js'
import { ODLUKA_O_KOMORSKOM_DOPRINOSU, ZAKON_O_POREZU_NA_DOHODAK } from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'
import {
  type ActReference,
  type LevyResult,
  levyDue,
  levyNotApplicable,
  naCente,
  postotakOd,
} from './levy.ts'

/**
 * `komorski doprinos` (внесок до обртницької палати / chamber levy).
 *
 * Єдиний із трьох платежів цього модуля, що universalний: його платить кожен
 * `obrt` незалежно від `režim`, бо база — не `primitak` і не `razred`, а
 * `osnovni osobni odbitak`. Саме тому калькулятори HOK, які рахують від
 * доходу, його не бачать (див. реєстр розбіжностей, `komorski-doprinos-omitted`).
 */

const CHECKED_ON = '2026-08-04' as const

/**
 * `Zakon o obrtu` — підстава, за якою Skupština HOK узагалі має право
 * встановлювати внесок, і місце, де записана його законна стеля.
 *
 * Константа живе тут, а не в `legal.ts`: спільний файл посилань належить
 * іншому тікету, і додавати туди запис поза своїми межами не можна.
 */
const ZAKON_O_OBRTU = {
  jurisdiction: 'HR',
  act: 'Zakon o obrtu',
  gazette: 'NN 143/13, 127/19, 41/20',
  url: 'https://www.zakon.hr/z/297/zakon-o-obrtu',
  status: 'in-force',
} as const satisfies ActReference

/**
 * `Prijedlog zakona o izmjenama i dopunama Zakona o obrtu`, внесений Урядом
 * до Сабору 14 травня 2026 (P.Z. br. 302). Ще не ухвалений — тому `draft`.
 */
const PRIJEDLOG_ZAKONA_O_OBRTU = {
  jurisdiction: 'HR',
  act: 'Prijedlog zakona o izmjenama i dopunama Zakona o obrtu',
  gazette: 'P.Z. br. 302, Hrvatski sabor, 14. svibnja 2026.',
  url: 'https://www.sabor.hr/sites/default/files/uploads/sabor/2026-05-14/180703/PZ_302.pdf',
  status: 'draft',
} as const satisfies ActReference

/**
 * Законна стеля місячного внеску: `Skupština` HOK не може встановити більше.
 * Не ставка — саме межа, у якій ставку ухвалює Odluka.
 */
export const GORNJA_GRANICA_KOMORSKOG_DOPRINOSA: Sourced<string> = sourced('2', {
  ...ZAKON_O_OBRTU,
  article: 'čl. 81. st. 2. podst. 7.',
  checkedOn: CHECKED_ON,
})

/**
 * Чим є число ставки: фактичною ставкою з чинної Odluke чи лише стелею із
 * закону, у межах якої Odluka ще має бути ухвалена.
 */
export type NaravStope = 'stopa' | 'gornja granica'

export interface KomorskiDoprinosPravila {
  /** Місячна ставка у відсотках `osnovni osobni odbitak`. */
  readonly mjesecnaStopa: Sourced<string>
  /** Ставка це чи стеля — від цього залежить, чи сума є розрахунком, чи максимумом. */
  readonly narav: NaravStope
  /** `osnovni osobni odbitak` (основний особистий відрахунок) у євро на місяць. */
  readonly osnovniOsobniOdbitak: Sourced<string>
  /** Скільки років триває звільнення новоствореного `obrt`. */
  readonly oslobodenjeGodina: Sourced<number>
}

/** Скільки місяців у році — множник між місячним внеском і річним. */
const MJESECI = 12

/** Тромісячне зобов'язання: внесок нараховують і сплачують поквартально. */
const MJESECI_U_TROMJESECJU = 3

const OSLOBODENJE: Sourced<number> = sourced(2, {
  ...ODLUKA_O_KOMORSKOM_DOPRINOSU,
  article: 'čl. 15.',
  checkedOn: CHECKED_ON,
})

/**
 * `osnovni osobni odbitak` — 600,00 € на місяць, чинний від 1 січня 2025 і
 * незмінний на 2026.
 *
 * Ця ж величина потрібна розрахунку `porez na dohodak`, який належить іншому
 * тікету. Під час злиття гілок вона має лишитися в одному місці — тут вона
 * стоїть тому, що без неї `komorski doprinos` не рахується взагалі.
 */
const OSNOVNI_OSOBNI_ODBITAK: Sourced<string> = sourced('600.00', {
  ...ZAKON_O_POREZU_NA_DOHODAK,
  article: 'čl. 14. st. 1.',
  checkedOn: CHECKED_ON,
})

/**
 * Чинні правила: 1,9 % `osnovni osobni odbitak` на місяць, тобто 11,40 €
 * на місяць і 136,80 € на рік за `osobni odbitak` 600 €.
 */
export const KOMORSKI_DOPRINOS_U_SNAZI: KomorskiDoprinosPravila = {
  mjesecnaStopa: sourced('1.9', {
    ...ODLUKA_O_KOMORSKOM_DOPRINOSU,
    article: 'čl. 6. st. 1.',
    checkedOn: CHECKED_ON,
  }),
  narav: 'stopa',
  osnovniOsobniOdbitak: OSNOVNI_OSOBNI_ODBITAK,
  oslobodenjeGodina: OSLOBODENJE,
}

/**
 * Запропоноване зниження. `čl. 32.` проєкту міняє в `čl. 81. st. 2. podst. 7.`
 * `Zakona o obrtu` число «2» на «1,5» — тобто знижує **стелю**, а не ставку.
 * Ставку в нових межах усе одно ухвалює `Skupština` HOK новою Odlukom, тож
 * 1,5 % тут — максимум, а не обіцяна майбутня ставка. Пояснювальна записка
 * проєкту справді говорить про 1,5 % як про намір, але наміру не досить,
 * щоб видавати число за чинну ставку.
 */
export const KOMORSKI_DOPRINOS_PRIJEDLOG: KomorskiDoprinosPravila = {
  mjesecnaStopa: sourced('1.5', {
    ...PRIJEDLOG_ZAKONA_O_OBRTU,
    article: 'čl. 32. (mijenja čl. 81. st. 2. podst. 7. Zakona o obrtu)',
    checkedOn: CHECKED_ON,
  }),
  narav: 'gornja granica',
  osnovniOsobniOdbitak: OSNOVNI_OSOBNI_ODBITAK,
  oslobodenjeGodina: OSLOBODENJE,
}

/** Місячний внесок, заокруглений до цента: саме в такому вигляді його нараховують. */
export const mjesecniKomorskiDoprinos = (
  pravila: KomorskiDoprinosPravila = KOMORSKI_DOPRINOS_U_SNAZI,
): Decimal => naCente(postotakOd(pravila.osnovniOsobniOdbitak.value, pravila.mjesecnaStopa.value))

/** Тромісячне зобов'язання за `čl. 8.` Odluke — три місячні внески. */
export const tromjesecniKomorskiDoprinos = (
  pravila: KomorskiDoprinosPravila = KOMORSKI_DOPRINOS_U_SNAZI,
): Decimal => mjesecniKomorskiDoprinos(pravila).times(MJESECI_U_TROMJESECJU)

export interface KomorskiDoprinosUlaz {
  /**
   * Чи перебуває `obrt` у перших двох роках від першого впису в
   * `Obrtni registar`. Звільнення дає лише **перший** упис — повторно
   * відкритий `obrt` платить із першого дня.
   */
  readonly uPrveDvijeGodine: boolean
}

/**
 * Річний `komorski doprinos`.
 *
 * Розрахунок навмисно не знає ані `režim`, ані `razred`, ані `primitak`:
 * внесок від них не залежить. Часткові квартали (`čl. 9.` Odluke ділить
 * річну суму на 365 днів при відкритті чи закритті всередині кварталу) тут
 * не моделюються — модуль дає суму за повний календарний рік.
 */
export const komorskiDoprinos = (
  ulaz: KomorskiDoprinosUlaz,
  pravila: KomorskiDoprinosPravila = KOMORSKI_DOPRINOS_U_SNAZI,
): LevyResult => {
  const { oslobodenjeGodina } = pravila
  if (ulaz.uPrveDvijeGodine) {
    return levyNotApplicable(
      'novootvoreni-obrt',
      `komorski doprinos не нараховується: новий obrt звільнений на перші ${oslobodenjeGodina.value} роки ведення обрту. Звільнення дає лише перший упис у Obrtni registar.`,
      oslobodenjeGodina.source,
    )
  }

  const mjesecni = mjesecniKomorskiDoprinos(pravila)
  const napomene =
    pravila.narav === 'gornja granica'
      ? [
          `${pravila.mjesecnaStopa.value} % — це законна стеля, а не ухвалена ставка: суму треба читати як максимум, поки HOK не ухвалить нову Odluku в цих межах.`,
        ]
      : []

  return levyDue(
    mjesecni.times(MJESECI),
    `${pravila.mjesecnaStopa.value} % × osnovni osobni odbitak ${pravila.osnovniOsobniOdbitak.value} € = ${mjesecni.toFixed(2)} € на місяць × ${MJESECI}`,
    pravila.mjesecnaStopa.source,
    napomene,
  )
}
