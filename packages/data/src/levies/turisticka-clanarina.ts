import Decimal from 'decimal.js'
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
 * `turistička članarina` (туристичний членський внесок / tourist board levy).
 *
 * На відміну від `komorski doprinos`, не універсальна: обов'язок виникає з
 * двох умов одночасно — діяльність за `NKD` є в переліку `čl. 5.`, і `obrt`
 * працює на території місцевої `turistička zajednica` (`čl. 4. st. 1.`).
 *
 * Розрядів туристичних місць (A, B, C, D) чинний закон більше не знає:
 * `čl. 23.` скасував обидва Pravilnika про розряди населених пунктів. Місце
 * тепер впливає лише знижкою для `potpomognuto područje` (`čl. 8. st. 4.`).
 */

const CHECKED_ON = '2026-08-04' as const

const ZAKON_O_CLANARINAMA = {
  jurisdiction: 'HR',
  act: 'Zakon o članarinama u turističkim zajednicama',
  gazette: 'NN 52/19, 144/20',
  url: 'https://www.zakon.hr/z/341/zakon-o-clanarinama-u-turistickim-zajednicama',
  status: 'in-force',
} as const satisfies ActReference

/** `skupina` (група діяльностей / activity group) за `čl. 5. st. 1.`: від неї залежить ставка. */
export type Skupina = 'prva' | 'druga' | 'treca' | 'cetvrta' | 'peta'

/** Ставки у відсотках `osnovica`, `čl. 6.` */
export const TURISTICKA_CLANARINA_STOPE: Sourced<Readonly<Record<Skupina, string>>> = sourced(
  {
    prva: '0.14212',
    druga: '0.11367',
    treca: '0.08527',
    cetvrta: '0.02842',
    peta: '0.01705',
  },
  { ...ZAKON_O_CLANARINAMA, article: 'čl. 6.', checkedOn: CHECKED_ON },
)

/** Знижка у відсотках для `potpomognuto područje`, `čl. 8. st. 4.` */
export const POPUST_ZA_POTPOMOGNUTA_PODRUCJA: Sourced<string> = sourced('20', {
  ...ZAKON_O_CLANARINAMA,
  article: 'čl. 8. st. 4.',
  checkedOn: CHECKED_ON,
})

/** Запис переліку `čl. 5. st. 1.`: код `NKD` і `skupina`, до якої закон його відніс. */
export interface DjelatnostZaClanarinu {
  readonly sifra: string
  readonly skupina: Skupina
  /**
   * Уточнення з тексту закону, що звужує код: не вся діяльність за цим
   * `NKD`, а лише перелічене. Порожньо — код узятий повністю.
   */
  readonly ogranicenje?: string
}

const OGRANICENJE_65_12 =
  'osiguranje djece i školske mladeži od posljedica nezgode i posebna osiguranja mladeži od posljedica nezgode; osiguranje gostiju, posjetitelja priredbi, izletnika i turista od posljedica nezgode; putno zdravstveno osiguranje; turističko osiguranje; osiguranje pomoći (asistencije) za vrijeme puta, izvan mjesta boravka ili prebivališta; ostala osiguranja turističkih rizika; osiguranje od odgovornosti vlasnika odnosno korisnika marine; osiguranje jamstva (osiguranje jamčevine za paket-aranžmane); osiguranje od otkaza turističkih putovanja'

const OGRANICENJE_73_11 =
  'kreiranje promidžbenih kampanja (kreiranje reklama u novinama, časopisima i ostalim medijima, kreiranje reklama na otvorenom prostoru, reklamiranje iz zraka, uređenje štandova i ostalih objekata i prostora) i vođenje marketinških kampanja i ostale usluge oglašavanja koje su usmjerene na privlačenje i zadržavanje kupaca (marketing na mjestu prodaje, oglašavanje izravnom poštom i marketinško savjetovanje)'

/**
 * Перелік діяльностей `čl. 5. st. 1.` — дослівно, включно з перекриттями.
 *
 * Перекриття не помилка виписки: закон називає `45.20` у `treća skupina`,
 * `45.1`, `45.32` і `45.40` у `četvrta`, а весь розділ `45` — у `peta`.
 * Розв'язує їх найточніший збіг (`najtocnijiPogodak`), а не порядок рядків.
 */
export const TURISTICKA_CLANARINA_DJELATNOSTI: Sourced<readonly DjelatnostZaClanarinu[]> = sourced(
  [
    { sifra: '49.31', skupina: 'prva' },
    { sifra: '49.32', skupina: 'prva' },
    { sifra: '49.39', skupina: 'prva' },
    { sifra: '50.1', skupina: 'prva' },
    { sifra: '51.10', skupina: 'prva' },
    { sifra: '52.23', skupina: 'prva' },
    { sifra: '55', skupina: 'prva' },
    { sifra: '56', skupina: 'prva' },
    { sifra: '65.12', skupina: 'prva', ogranicenje: OGRANICENJE_65_12 },
    { sifra: '66.12', skupina: 'prva', ogranicenje: 'djelatnosti mjenjačnica' },
    { sifra: '68', skupina: 'prva' },
    { sifra: '73.11', skupina: 'prva', ogranicenje: OGRANICENJE_73_11 },
    { sifra: '77.21', skupina: 'prva' },
    { sifra: '79', skupina: 'prva' },
    { sifra: '82.3', skupina: 'prva' },
    { sifra: '92', skupina: 'prva' },
    { sifra: '93.12', skupina: 'prva' },
    { sifra: '93.21', skupina: 'prva' },
    { sifra: '93.29', skupina: 'prva' },

    { sifra: '50.3', skupina: 'druga' },
    { sifra: '52.29', skupina: 'druga' },
    { sifra: '61', skupina: 'druga' },
    { sifra: '77.11', skupina: 'druga' },
    { sifra: '77.34', skupina: 'druga' },
    { sifra: '77.35', skupina: 'druga' },

    { sifra: '45.20', skupina: 'treca' },
    { sifra: '53', skupina: 'treca' },
    { sifra: '59.11', skupina: 'treca' },
    { sifra: '59.14', skupina: 'treca' },
    { sifra: '81.30', skupina: 'treca' },
    { sifra: '90.01', skupina: 'treca' },
    { sifra: '90.04', skupina: 'treca' },

    { sifra: '45.1', skupina: 'cetvrta' },
    { sifra: '45.32', skupina: 'cetvrta' },
    { sifra: '45.40', skupina: 'cetvrta' },
    { sifra: '47', skupina: 'cetvrta' },
    { sifra: '58.11', skupina: 'cetvrta' },
    { sifra: '58.13', skupina: 'cetvrta' },
    { sifra: '58.14', skupina: 'cetvrta' },
    { sifra: '58.19', skupina: 'cetvrta' },
    { sifra: '59.13', skupina: 'cetvrta' },
    { sifra: '59.2', skupina: 'cetvrta' },
    { sifra: '60', skupina: 'cetvrta' },
    { sifra: '74.1', skupina: 'cetvrta' },

    { sifra: '45', skupina: 'peta' },
    { sifra: '45.31', skupina: 'peta' },
    { sifra: '46.2', skupina: 'peta' },
    { sifra: '46.3', skupina: 'peta' },
    { sifra: '46.4', skupina: 'peta' },
    { sifra: '46.5', skupina: 'peta' },
    { sifra: '46.6', skupina: 'peta' },
    { sifra: '46.7', skupina: 'peta' },
    { sifra: '46.9', skupina: 'peta' },
  ],
  { ...ZAKON_O_CLANARINAMA, article: 'čl. 5. st. 1.', checkedOn: CHECKED_ON },
)

export interface TuristickaClanarinaUlaz {
  /** `NKD` (вид діяльності) обрту. */
  readonly nkd: string
  /**
   * `osnovica` (база нарахування) за рік. Закон називає її прямо: для
   * платника `porez na dohodak` це `primici` від діяльності за переліком
   * (`čl. 7. st. 2.`), а для `paušalni obrt` — «ukupno ostvareni naplaćeni
   * primici» (`čl. 7. st. 4.`). Тобто саме `primitak`, а не `dohodak`.
   */
  readonly primitak: Decimal.Value
  /**
   * Чи є на території діяльності місцева `turistička zajednica`, заснована
   * за законом. Без неї обов'язок за `čl. 4. st. 1.` не виникає.
   */
  readonly imaLokalnuTuristickuZajednicu: boolean
  /**
   * Чи лежить місце діяльності в `potpomognuto područje` (підтримувана
   * територія / assisted area) — I.–IV. `razvojna skupina` одиниці місцевого
   * самоврядування. Тоді внесок менший на 20 %.
   */
  readonly potpomognutoPodrucje: boolean
}

/**
 * Річна `turistička članarina`.
 *
 * Модуль рахує внесок за однією — основною — діяльністю. `čl. 8. st. 2.`
 * дозволяє натомість застосувати ставку переважної діяльності до всього
 * `primitak`, якщо це вигідніше, а `čl. 7. st. 5.` вимагає рахувати кожну
 * `poslovna jedinica` окремо; ані кількох діяльностей, ані філій модуль не
 * моделює — обрт однієї людини з одним місцем роботи цього не потребує.
 */
export const turistickaClanarina = (ulaz: TuristickaClanarinaUlaz): LevyResult => {
  if (!ulaz.imaLokalnuTuristickuZajednicu) {
    return levyNotApplicable(
      { kod: 'izvan-podrucja-turisticke-zajednice' },
      {
        ...ZAKON_O_CLANARINAMA,
        article: 'čl. 4. st. 1.',
        checkedOn: CHECKED_ON,
      },
    )
  }

  const djelatnost = najtocnijiPogodak(ulaz.nkd, TURISTICKA_CLANARINA_DJELATNOSTI.value)
  if (djelatnost === undefined) {
    return levyNotApplicable(
      { kod: 'djelatnost-izvan-popisa', nkd: ulaz.nkd },
      TURISTICKA_CLANARINA_DJELATNOSTI.source,
    )
  }

  const stopa = TURISTICKA_CLANARINA_STOPE.value[djelatnost.skupina]
  const puni = postotakOd(ulaz.primitak, stopa)
  const popust = POPUST_ZA_POTPOMOGNUTA_PODRUCJA.value
  const iznos = ulaz.potpomognutoPodrucje ? puni.minus(postotakOd(puni, popust)) : puni

  const obracun =
    `${djelatnost.skupina} skupina (${djelatnost.sifra} — ${nazivNkd(djelatnost.sifra)}), ` +
    `${stopa} % × ${new Decimal(ulaz.primitak).toFixed(2)} € primitak` +
    (ulaz.potpomognutoPodrucje ? `, знижка ${popust} % за potpomognuto područje` : '')

  return levyDue(
    naCente(iznos),
    obracun,
    TURISTICKA_CLANARINA_STOPE.source,
    djelatnost.ogranicenje === undefined
      ? []
      : [napomenaZaOgranicenje(djelatnost.sifra, djelatnost.ogranicenje)],
  )
}
