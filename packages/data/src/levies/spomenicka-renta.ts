import Decimal from 'decimal.js'
import type { LegalReference } from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'
import {
  type ActReference,
  type LevyResult,
  levyDue,
  levyNotApplicable,
  naCente,
  postotakOd,
} from './levy.ts'
import { najtocnijiPogodak, napomenaZaOgranicenje, nazivNkd } from './nkd.ts'

/**
 * `spomenička renta` (пам'яткова рента / monument levy).
 *
 * Під однією назвою закон тримає два різні платежі з різними базами, і їх не
 * можна змішувати:
 *
 * - `čl. 116.` — за корисною площею приміщення в нерухомому культурному
 *   добрі або в культурно-історичній зоні; ставку за м² встановлює місто чи
 *   община в межах, які задає закон;
 * - `čl. 117.` — «indirektna spomenička renta», 0,05 % від `ukupni prihod`
 *   за визначеним переліком `NKD`, **без** прив'язки до місця.
 *
 * Обрт може бути винен обидві водночас, одну з них або жодної.
 */

const CHECKED_ON = '2026-08-04' as const

const ZAKON_O_KULTURNIM_DOBRIMA = {
  jurisdiction: 'HR',
  act: 'Zakon o zaštiti i očuvanju kulturnih dobara',
  gazette: 'NN 145/24, 151/25',
  url: 'https://www.zakon.hr/z/340/zakon-o-zastiti-i-ocuvanju-kulturnih-dobara',
  status: 'in-force',
} as const satisfies ActReference

/** Межі місячної ставки за м², у яких місто чи община ухвалює свою Odluku. */
export const RASPON_SPOMENICKE_RENTE_PO_M2: Sourced<{
  readonly najmanje: string
  readonly najvise: string
}> = sourced(
  { najmanje: '0.13', najvise: '0.53' },
  {
    ...ZAKON_O_KULTURNIM_DOBRIMA,
    article: 'čl. 116. st. 4.',
    checkedOn: CHECKED_ON,
  },
)

/**
 * Норма, що робить місце вирішальним для ренти за площею: рента виникає з
 * діяльності **в** нерухомому культурному добрі чи його зоні.
 *
 * Окремою константою, бо на неї посилаються двічі — і сам розрахунок, коли
 * відмовляє, і той, хто збирає платежі в перелік, коли місця ще не знає.
 */
export const IZVOR_RENTE_PO_POVRSINI: LegalReference = {
  ...ZAKON_O_KULTURNIM_DOBRIMA,
  article: 'čl. 116. st. 1.',
  checkedOn: CHECKED_ON,
}

/** Ставка `indirektna spomenička renta` у відсотках `ukupni prihod`. */
export const INDIREKTNA_SPOMENICKA_RENTA_STOPA: Sourced<string> = sourced('0.05', {
  ...ZAKON_O_KULTURNIM_DOBRIMA,
  article: 'čl. 117. st. 2.',
  checkedOn: CHECKED_ON,
})

/** Запис переліку `čl. 117. st. 1.`: код `NKD` і, за потреби, звуження з тексту закону. */
export interface DjelatnostZaRentu {
  readonly sifra: string
  readonly ogranicenje?: string
}

/** Перелік діяльностей, за якими виникає `indirektna spomenička renta`. */
export const INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI: Sourced<readonly DjelatnostZaRentu[]> =
  sourced(
    [
      { sifra: '46.35' },
      { sifra: '46.45' },
      { sifra: '47.26' },
      {
        sifra: '61',
        ogranicenje:
          'osim održavanja komunikacijske mreže i prijenosa radijskog i televizijskog programa',
      },
      { sifra: '64.1' },
      { sifra: '66.1' },
      { sifra: '92.00' },
    ],
    { ...ZAKON_O_KULTURNIM_DOBRIMA, article: 'čl. 117. st. 1.', checkedOn: CHECKED_ON },
  )

const MJESECI = 12

/**
 * Де ведеться діяльність із погляду `čl. 116.` Два стани, бо площа й місцева
 * ставка мають сенс лише всередині культурного добра — поза ним таких чисел
 * просто немає.
 */
export type PolozajUKulturnomDobru =
  | { readonly kind: 'izvan' }
  | {
      readonly kind: 'u-kulturnom-dobru'
      /** `korisna površina poslovnog prostora` — корисна площа приміщення, м². */
      readonly korisnaPovrsinaM2: Decimal.Value
      /** Місячна ставка за м², яку встановила Odluka міста, общини або Grada Zagreba. */
      readonly mjesecniIznosPoM2: Decimal.Value
    }

export interface SpomenickaRentaUlaz {
  /** `NKD` (вид діяльності) обрту. */
  readonly nkd: string
  /**
   * `ukupni prihod` (сукупний оборот від діяльності / total revenue) за рік —
   * база `indirektna spomenička renta` за `čl. 117. st. 2.` Це не `dohodak`
   * і не `dobit`.
   *
   * TODO: закон називає базу `ukupni prihod` і не уточнює її для платників
   * `porez na dohodak`, які `prihod` не рахують. Джерела, яке б прямо
   * прирівнювало її до наплачених `primitak`, знайти не вдалося — модуль
   * бере те число, яке передали, і не перетворює його самотужки.
   */
  readonly prihod: Decimal.Value
  /**
   * Чи є переважною діяльність переробна або виробнича: `čl. 116. st. 9.`
   * звільняє таку від ренти за площею — і **лише** від неї.
   */
  readonly pretezitoProizvodna: boolean
  readonly polozaj: PolozajUKulturnomDobru
}

/** Дві ренти окремо: кожна зі своєю підставою і своєю причиною відсутності. */
export interface SpomenickaRentaGodisnje {
  /** `čl. 116.` — за корисною площею в культурному добрі. */
  readonly povrsinska: LevyResult
  /** `čl. 117.` — `indirektna spomenička renta` за переліком `NKD`. */
  readonly indirektna: LevyResult
}

const povrsinskaRenta = (ulaz: SpomenickaRentaUlaz): LevyResult => {
  if (ulaz.pretezitoProizvodna) {
    return levyNotApplicable(
      { kod: 'pretezito-proizvodna-djelatnost' },
      {
        ...ZAKON_O_KULTURNIM_DOBRIMA,
        article: 'čl. 116. st. 9.',
        checkedOn: CHECKED_ON,
      },
    )
  }

  if (ulaz.polozaj.kind === 'izvan') {
    return levyNotApplicable({ kod: 'izvan-kulturnog-dobra' }, IZVOR_RENTE_PO_POVRSINI)
  }

  const { korisnaPovrsinaM2, mjesecniIznosPoM2 } = ulaz.polozaj
  const stopa = new Decimal(mjesecniIznosPoM2)
  const { najmanje, najvise } = RASPON_SPOMENICKE_RENTE_PO_M2.value
  if (stopa.lessThan(najmanje) || stopa.greaterThan(najvise)) {
    throw new Error(
      `Місцева ставка spomenička renta ${stopa.toFixed(2)} €/м² виходить за межі 0,13–0,53 €/м², які задає čl. 116. st. 4. — така Odluka міста чи общини існувати не може, і рахувати за нею не можна`,
    )
  }

  const godisnji = new Decimal(korisnaPovrsinaM2).times(stopa).times(MJESECI)

  return levyDue(
    naCente(godisnji),
    `${new Decimal(korisnaPovrsinaM2).toFixed(2)} м² × ${stopa.toFixed(2)} €/м² × ${MJESECI} місяців`,
    RASPON_SPOMENICKE_RENTE_PO_M2.source,
    [{ kod: 'stopu-utvrduje-jedinica' }],
  )
}

const indirektnaRenta = (ulaz: SpomenickaRentaUlaz): LevyResult => {
  const djelatnost = najtocnijiPogodak(ulaz.nkd, INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.value)
  if (djelatnost === undefined) {
    return levyNotApplicable(
      { kod: 'djelatnost-izvan-popisa', nkd: ulaz.nkd },
      INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.source,
    )
  }

  const stopa = INDIREKTNA_SPOMENICKA_RENTA_STOPA.value

  return levyDue(
    naCente(postotakOd(ulaz.prihod, stopa)),
    `${stopa} % × ${new Decimal(ulaz.prihod).toFixed(2)} € prihod (${djelatnost.sifra} — ${nazivNkd(djelatnost.sifra)})`,
    INDIREKTNA_SPOMENICKA_RENTA_STOPA.source,
    djelatnost.ogranicenje === undefined
      ? []
      : [napomenaZaOgranicenje(djelatnost.sifra, djelatnost.ogranicenje)],
  )
}

/**
 * Обидві ренти за рік. Повертає їх окремо, а не однією сумою: підстави
 * різні, і причина відсутності однієї нічого не каже про другу. Скласти
 * дозволене можна через `godisnjiZbroj`.
 */
export const spomenickaRenta = (ulaz: SpomenickaRentaUlaz): SpomenickaRentaGodisnje => ({
  povrsinska: povrsinskaRenta(ulaz),
  indirektna: indirektnaRenta(ulaz),
})
