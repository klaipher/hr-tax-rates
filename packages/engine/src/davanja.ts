/**
 * Обов'язкові платежі поза податками і `doprinosi`, зведені в один перелік.
 *
 * П'ять рядків під чотирма статутами: дві палати, туристичний внесок і дві
 * пам'яткові ренти. `komorski doprinos` платить кожен `obrt` незалежно від
 * режиму, `članarina HGK` стосується товариств, а решта — лише за певних
 * `NKD` і місць. Незастосовний платіж лишається в переліку зі своєю причиною
 * і своєю статтею: людина мусить відрізнити «не забули» від «нічого не
 * винен».
 *
 * Від режиму перелік не залежить і тепер — залежить від `pravni oblik`, а їх
 * три на шість режимів. Тому складання живе окремо від `usporedba.ts`:
 * платежі не знають ні `razred`, ні способу визначати `dohodak`.
 */
import type {
  KomorskiDoprinosPravila,
  LevyResult,
  PolozajUKulturnomDobru,
  RazlogNeprimjene,
} from '@hr-tax/data'
import {
  clanarinaHgk,
  INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI,
  IZVOR_RENTE_PO_POVRSINI,
  KOMORSKI_DOPRINOS_U_SNAZI,
  komorskiDoprinos,
  OBVEZNO_CLANSTVO_U_HGK,
  spomenickaRenta,
  TURISTICKA_CLANARINA_DJELATNOSTI,
  turistickaClanarina,
} from '@hr-tax/data'
import { eur, type Money, sum } from './money.ts'
import type { Naziv, ObveznoDavanje, PravniOblik } from './types.ts'

/**
 * Діяльність і місце — усе, від чого залежать `turistička članarina` і
 * `spomenička renta`, і рівно те, чого не знає жоден інший розрахунок.
 *
 * Однією структурою, а не п'ятьма окремими полями входу: ці величини мають
 * сенс тільки разом, і разом вони або є, або їх немає.
 */
export interface Djelatnost {
  /**
   * `NKD` (вид діяльності / activity code) обрту — у тому записі, у якому
   * його друкує закон: `55`, `50.1`, `49.31`, `47.111`.
   */
  readonly nkd: string
  /**
   * Чи є на території діяльності місцева `turistička zajednica`. Без неї
   * обов'язок за `čl. 4. st. 1.` не виникає взагалі.
   */
  readonly imaLokalnuTuristickuZajednicu: boolean
  /** Чи лежить місце діяльності в `potpomognuto područje` — знижка 20 %. */
  readonly potpomognutoPodrucje: boolean
  /**
   * Чи є переважною діяльність переробна або виробнича: `čl. 116. st. 9.`
   * звільняє таку від `spomenička renta` за площею — і лише від неї.
   */
  readonly pretezitoProizvodna: boolean
  /** Де ведеться діяльність із погляду `čl. 116.` */
  readonly polozaj: PolozajUKulturnomDobru
}

export interface UlazDavanja {
  /**
   * Річний `primitak` (надходження / receipts) — база `turistička članarina`
   * (`čl. 7.`) і те число, яке модуль пам'яткової ренти бере за `ukupni
   * prihod` (`čl. 117. st. 2.`).
   */
  readonly godisnjiPrimitak: Money<'EUR'>
  /** Чи обрт у перших двох роках від першого впису в `Obrtni registar`. */
  readonly noviObrt: boolean
  /** `undefined` — форма ще не знає `NKD`, і застосовність невизначена. */
  readonly djelatnost: Djelatnost | undefined
  /**
   * Правова форма платника — те, чого цей перелік раніше не знав і чого йому
   * вистачало, поки всі режими були обртами.
   *
   * Тепер не вистачає: `komorski doprinos` платить `obrt`, `članarina HGK`
   * стосується товариств, а найманий працівник не платить жодного з них.
   * Прибрати незастосовні рядки не можна — тоді зникла б і різниця між «не
   * забули» і «нічого не винен», заради якої цей модуль і написаний.
   */
  readonly pravniOblik: PravniOblik
}

const NAZIVI = {
  komorski: { hr: 'komorski doprinos', uk: 'внесок до обртницької палати' },
  clanarinaHgk: { hr: 'članarina HGK', uk: 'членський внесок Господарської палати' },
  clanarina: { hr: 'turistička članarina', uk: 'туристичний членський внесок' },
  renta: { hr: 'spomenička renta', uk: 'пам’яткова рента' },
  indirektnaRenta: { hr: 'indirektna spomenička renta', uk: 'непряма пам’яткова рента' },
} as const satisfies Readonly<Record<string, Naziv>>

/**
 * `LevyResult` статуту → рядок картки.
 *
 * Одна функція на всі чотири платежі: різняться вони статтями й базами, а не
 * формою результату, і повторювати це перетворення чотири рази означало б
 * чотири місця, де воно може розійтися.
 */
const kaoDavanje = (naziv: Naziv, rezultat: LevyResult): ObveznoDavanje =>
  rezultat.kind === 'due'
    ? {
        status: 'obračunato',
        naziv,
        godisnjiIznos: eur(rezultat.godisnjiIznos),
        obracun: rezultat.obracun,
        napomene: rezultat.napomene,
        izvor: rezultat.source,
      }
    : {
        status: 'ne-primjenjuje-se',
        naziv,
        razlog: rezultat.razlog,
        izvor: rezultat.source,
      }

/**
 * Платіж, про який форма ще не поставила питання.
 *
 * Стаття тут не та, що виключає платіж, — такої немає, — а та, яка робить
 * невідому обставину вирішальною: перелік `NKD` для двох платежів і саме
 * місце для ренти за площею. Показати нуль замість цього означало б
 * відповісти на питання, якого ніхто не ставив.
 */
const bezDjelatnosti = (naziv: Naziv, izvorNorme: ObveznoDavanje['izvor']): ObveznoDavanje => ({
  status: 'ne-primjenjuje-se',
  naziv,
  razlog: { kod: 'djelatnost-nije-zadana' },
  izvor: izvorNorme,
})

/**
 * Платіж, якого ця правова форма не знає взагалі.
 *
 * Не звільнення й не нуль: обртницька палата не «пробачила» товариству
 * внесок — товариство просто не є її членом. Стаття тут та, що окреслює коло
 * платників, бо саме вона робить відповідь відомою.
 */
const zbogPravnogOblika = (
  naziv: Naziv,
  razlog: RazlogNeprimjene,
  izvorNorme: ObveznoDavanje['izvor'],
): ObveznoDavanje => ({ status: 'ne-primjenjuje-se', naziv, razlog, izvor: izvorNorme })

/**
 * Усі обов'язкові платежі за рік — завжди всі п'ять і завжди в тому самому
 * порядку, як і режими в порівнянні.
 */
export const obveznaDavanjaZa = (
  ulaz: UlazDavanja,
  pravilaKomorskog: KomorskiDoprinosPravila = KOMORSKI_DOPRINOS_U_SNAZI,
): readonly ObveznoDavanje[] => {
  const { godisnjiPrimitak, djelatnost, pravniOblik } = ulaz

  const komorski =
    pravniOblik === 'obrt'
      ? kaoDavanje(
          NAZIVI.komorski,
          komorskiDoprinos({ uPrveDvijeGodine: ulaz.noviObrt }, pravilaKomorskog),
        )
      : zbogPravnogOblika(
          NAZIVI.komorski,
          { kod: 'nije-obrt' },
          pravilaKomorskog.mjesecnaStopa.source,
        )

  const clanarinaHgkRedak =
    pravniOblik === 'trgovačko društvo'
      ? kaoDavanje(
          NAZIVI.clanarinaHgk,
          clanarinaHgk({
            // Критерій скупини закон міряє по `prihod` за нарахуванням, а
            // форма знає лише касовий `primitak`. Те саме прирівнювання, що
            // в `UlazDoo`, і так само припущення форми, а не закону —
            // назване тут, бо мовчки схлопнути ці два терміни означало б
            // рівно те, проти чого стоїть глосарій.
            godisnjiPrihod: godisnjiPrimitak.amount,
            // Калькулятор моделює діяльність однієї людини. Число лишається
            // входом, бо воно є одним із трьох критеріїв закону.
            brojZaposlenih: 1,
          }),
        )
      : zbogPravnogOblika(
          NAZIVI.clanarinaHgk,
          { kod: 'nije-trgovacko-drustvo' },
          OBVEZNO_CLANSTVO_U_HGK,
        )

  // Найманий працівник самостійної діяльності не веде: три платежі, що
  // залежать від `NKD` і місця, до нього не доходять не тому, що форма не
  // спитала, а тому, що питання не існує.
  if (pravniOblik === 'nesamostalni rad') {
    const nemaDjelatnosti = (naziv: Naziv, izvorNorme: ObveznoDavanje['izvor']): ObveznoDavanje =>
      zbogPravnogOblika(naziv, { kod: 'nema-samostalne-djelatnosti' }, izvorNorme)

    return [
      komorski,
      clanarinaHgkRedak,
      nemaDjelatnosti(NAZIVI.clanarina, TURISTICKA_CLANARINA_DJELATNOSTI.source),
      nemaDjelatnosti(NAZIVI.renta, IZVOR_RENTE_PO_POVRSINI),
      nemaDjelatnosti(NAZIVI.indirektnaRenta, INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.source),
    ]
  }

  if (djelatnost === undefined) {
    return [
      komorski,
      clanarinaHgkRedak,
      bezDjelatnosti(NAZIVI.clanarina, TURISTICKA_CLANARINA_DJELATNOSTI.source),
      // Рента за площею від `NKD` не залежить узагалі — її вирішує саме
      // місце, тож і норма тут інша, ніж у двох сусідів.
      bezDjelatnosti(NAZIVI.renta, IZVOR_RENTE_PO_POVRSINI),
      bezDjelatnosti(NAZIVI.indirektnaRenta, INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.source),
    ]
  }

  const { povrsinska, indirektna } = spomenickaRenta({
    nkd: djelatnost.nkd,
    // Закон називає базою `ukupni prihod` і не уточнює її для платників
    // `porez na dohodak`, які `prihod` не рахують; форма знає лише касовий
    // `primitak`. Прирівнювання назване в JSDoc `SpomenickaRentaUlaz`.
    prihod: godisnjiPrimitak.amount,
    pretezitoProizvodna: djelatnost.pretezitoProizvodna,
    polozaj: djelatnost.polozaj,
  })

  return [
    komorski,
    clanarinaHgkRedak,
    kaoDavanje(
      NAZIVI.clanarina,
      turistickaClanarina({
        nkd: djelatnost.nkd,
        primitak: godisnjiPrimitak.amount,
        imaLokalnuTuristickuZajednicu: djelatnost.imaLokalnuTuristickuZajednicu,
        potpomognutoPodrucje: djelatnost.potpomognutoPodrucje,
      }),
    ),
    kaoDavanje(NAZIVI.renta, povrsinska),
    kaoDavanje(NAZIVI.indirektnaRenta, indirektna),
  ]
}

/**
 * Сума нарахованих платежів. Ненараховані не дають нуля — вони просто не
 * входять у суму, лишаючись окремими записами з причиною.
 */
export const zbrojDavanja = (davanja: readonly ObveznoDavanje[]): Money<'EUR'> =>
  sum(
    'EUR',
    davanja.map((davanje) => (davanje.status === 'obračunato' ? davanje.godisnjiIznos : eur(0))),
  )
