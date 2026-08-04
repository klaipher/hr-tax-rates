import type {
  DrugaDjelatnostPravila,
  KomorskiDoprinosPravila,
  ObrtNaDobitPravila,
  ObrtNaDohodakPravila,
  ParStopa,
} from '@hr-tax/data'
import { KOMORSKI_DOPRINOS_U_SNAZI, komorskiDoprinos } from '@hr-tax/data'
import { eur, type Money, subtract, sum } from './money.ts'
import {
  izracunajPausalniObrtZaRazdoblje,
  type PocetakDjelatnosti,
  type PravilaNepuneGodine,
  razdobljeZa,
} from './nepuna-godina.ts'
import { izracunajObrtNaDobit } from './obrt-na-dobit.ts'
import {
  type IzdaciPoStavkama,
  izracunajObrtNaDohodak,
  type UzdrzavaniClanovi,
} from './obrt-na-dohodak.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import type {
  Ishod,
  Izracun,
  Naziv,
  ObveznoDavanje,
  Podloga,
  RazlogNedostupnosti,
  Rezim,
  RezimId,
  Unos,
  Usporedba,
} from './types.ts'
import { doprinosiUzRadniOdnos } from './uz-radni-odnos.ts'

/**
 * Вхід порівняння.
 *
 * Понад `primitak` усе необов'язкове: форма наповнюється поступово, і режим,
 * якому бракує входу, каже про це конкретно замість того, щоб вигадати число.
 * Саме тому «недоступно» тут — повноцінна відповідь, а не заглушка.
 */
export interface UnosUsporedbe extends Unos {
  /** Річний `izdatak` за статтями. Без нього режими з обліком не рахуються. */
  readonly godisnjiIzdaci?: IzdaciPoStavkama | undefined
  readonly uzdrzavani?: UzdrzavaniClanovi | undefined
  /** Ставки `porez na dohodak` обраної `jedinica lokalne samouprave`. */
  readonly stope?: ParStopa | undefined
  /** Місяць відкриття обрту. Не задано — повний рік. */
  readonly pocetak?: PocetakDjelatnosti | undefined
  /** Чи ведеться обрт паралельно з роботою за наймом. */
  readonly uzRadniOdnos?: boolean | undefined
  /**
   * Чи обрт відкрито менш ніж два роки тому: `čl. 15.` Odluke звільняє
   * новий `obrt` від `komorski doprinos` на перші два роки.
   */
  readonly noviObrt?: boolean | undefined
}

/**
 * Правила понад ті, що потрібні паушалу.
 *
 * Необов'язкові з тієї самої причини, що й входи: набір правил можна
 * підключати частинами, і брак правил — теж названа причина.
 */
export interface PodlogaUsporedbe extends Podloga {
  readonly obrtNaDohodak?: ObrtNaDohodakPravila | undefined
  readonly obrtNaDobit?: ObrtNaDobitPravila | undefined
  readonly drugaDjelatnost?: DrugaDjelatnostPravila | undefined
  readonly nepunaGodina?: PravilaNepuneGodine | undefined
  readonly komorskiDoprinos?: KomorskiDoprinosPravila | undefined
}

const NAZIVI: Readonly<Record<RezimId, Naziv>> = {
  'pausalni-obrt': { hr: 'paušalni obrt', uk: 'паушальний обрт' },
  'obrt-na-dohodak': { hr: 'obrt na dohodak', uk: 'обрт на дохідок' },
  'obrt-na-dobit': { hr: 'obrt na dobit', uk: 'обрт у системі porez na dobit' },
  zaposlenik: { hr: 'zaposlenik', uk: 'найманий працівник' },
  doo: { hr: 'd.o.o.', uk: 'товариство з обмеженою відповідальністю' },
}

const nedostupno = (razlog: RazlogNedostupnosti): Ishod => ({ status: 'nedostupno', razlog })

/**
 * `rashod` для `obrt na dobit` — сума всіх статей `izdatak`.
 *
 * Форма знає одні витрати, а режими міряють їх по-різному: `obrt na dohodak`
 * бере касовий `izdatak`, `obrt na dobit` — `rashod` за нарахуванням.
 * Прирівнювання одного до одного — припущення форми, назване на картці.
 */
const zbrojIzdataka = (izdaci: IzdaciPoStavkama): Money<'EUR'> => sum('EUR', Object.values(izdaci))

const NAZIV_KOMORSKOG = {
  hr: 'komorski doprinos',
  uk: 'внесок до обртницької палати',
} as const

/**
 * Додає обов'язкові платежі й перераховує «на руки».
 *
 * Робиться в одному місці на всі режими навмисно: платежі однакові для
 * кожного `obrt`, і рознесення їх по трьох модулях дало б три копії того
 * самого закону.
 */
const sObveznimDavanjima = (
  izracun: Izracun,
  unos: UnosUsporedbe,
  podloga: PodlogaUsporedbe,
): Izracun => {
  const rezultat = komorskiDoprinos(
    { uPrveDvijeGodine: unos.noviObrt === true },
    podloga.komorskiDoprinos ?? KOMORSKI_DOPRINOS_U_SNAZI,
  )

  const davanje: ObveznoDavanje =
    rezultat.kind === 'due'
      ? {
          status: 'obračunato',
          naziv: NAZIV_KOMORSKOG,
          godisnjiIznos: eur(rezultat.godisnjiIznos),
          obracun: rezultat.obracun,
          napomene: rezultat.napomene,
          izvor: rezultat.source,
        }
      : {
          status: 'ne-primjenjuje-se',
          naziv: NAZIV_KOMORSKOG,
          razlog: rezultat.obrazlozenje,
          izvor: rezultat.source,
        }

  const ukupnaDavanja = davanje.status === 'obračunato' ? davanje.godisnjiIznos : eur(0)

  return {
    ...izracun,
    obveznaDavanja: [davanje],
    ukupnaDavanja,
    netoZaOsobu: subtract(izracun.netoZaOsobu, ukupnaDavanja),
  }
}

/**
 * Замінює `doprinosi` на ті, що чинні для діяльності поряд із наймом.
 *
 * Модифікатор, а не режим: ставка й база інші, решта розрахунку та сама.
 * `netoZaOsobu` перераховується, бо змінилася лише сума внесків.
 */
const uzRadniOdnos = (
  izracun: Izracun,
  podloga: PodlogaUsporedbe,
  godisnjiPrimitak: Izracun['netoZaOsobu'],
): Izracun => {
  const { drugaDjelatnost } = podloga
  if (drugaDjelatnost === undefined) return izracun

  const zamjena = doprinosiUzRadniOdnos(
    { godisnjaOsnovica: izracun.porezi[0]?.poreznaOsnovica ?? eur(0), vrsta: 'pausalni-dohodak' },
    drugaDjelatnost,
    podloga.pretpostavke,
  )

  // Місячної `osnovica` тут немає навмисно: закон другої діяльності її не
  // знає, база річна (`čl. 185.` ZoD). Вигадати місячну означало б показати
  // число, якого в законі немає.
  const doprinosi = {
    mjesecnaOsnovica: undefined,
    moPrviStup: zamjena.moPrviStup,
    moDrugiStup: zamjena.moDrugiStup,
    zo: zamjena.zo,
    ukupnoGodisnje: zamjena.ukupnoGodisnje,
  }
  const netoZaOsobu = subtract(
    subtract(godisnjiPrimitak, izracun.ukupanPorez),
    doprinosi.ukupnoGodisnje,
  )

  return { ...izracun, doprinosi, netoZaOsobu }
}

const pausalniObrt = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { pocetak } = unos
  const { nepunaGodina } = podloga

  // Повний рік лишається шляхом за замовчуванням і рахується так само, як до
  // появи неповного року. Правила пропорції потрібні лише тоді, коли є що
  // пропорціювати — вимагати їх завжди означало б зробити базовий випадок
  // залежним від додатка.
  const ishod =
    pocetak === undefined
      ? izracunajPausalniObrt(unos.godisnjiPrimitak, podloga)
      : nepunaGodina === undefined
        ? nedostupno({ kod: 'nema-pravila', pravila: 'nepuna godina' })
        : izracunajPausalniObrtZaRazdoblje(
            unos.godisnjiPrimitak,
            razdobljeZa(nepunaGodina, pocetak),
            podloga,
          )
  if (ishod.status !== 'izracunato' || unos.uzRadniOdnos !== true) return ishod

  return {
    status: 'izracunato',
    izracun: uzRadniOdnos(ishod.izracun, podloga, unos.godisnjiPrimitak),
  }
}

const obrtNaDohodak = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { godisnjiIzdaci, stope } = unos
  const pravila = podloga.obrtNaDohodak

  if (pravila === undefined) {
    return nedostupno({ kod: 'nema-pravila', pravila: 'porez na dohodak' })
  }
  if (godisnjiIzdaci === undefined) {
    return nedostupno({ kod: 'nema-izdataka' })
  }
  if (stope === undefined) {
    return nedostupno({ kod: 'nema-jedinice' })
  }

  const ishod = izracunajObrtNaDohodak(
    {
      godisnjiPrimitak: unos.godisnjiPrimitak,
      godisnjiIzdaci,
      uzdrzavani: unos.uzdrzavani ?? { clanoviUzeObitelji: 0, djeca: 0 },
      stope,
    },
    { ...podloga, obrtNaDohodak: pravila },
  )
  if (ishod.status !== 'izracunato' || unos.uzRadniOdnos !== true) return ishod

  return {
    status: 'izracunato',
    izracun: uzRadniOdnos(ishod.izracun, podloga, unos.godisnjiPrimitak),
  }
}

const obrtNaDobit = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { godisnjiIzdaci, stope } = unos
  const pravila = podloga.obrtNaDobit

  if (pravila === undefined) {
    return nedostupno({ kod: 'nema-pravila', pravila: 'porez na dobit' })
  }
  if (godisnjiIzdaci === undefined || stope === undefined) {
    return nedostupno({ kod: 'nema-izdataka-ni-jedinice' })
  }

  // Форма знає касовий primitak, а dobit визначається за методом нарахування.
  // Прирівнювати одне до одного — припущення форми, а не закону; воно назване
  // в JSDoc `UlazObrtNaDobit` і повторене на картці.
  const izracunDobiti = izracunajObrtNaDobit(
    {
      godisnjiPrihod: unos.godisnjiPrimitak,
      godisnjiRashod: zbrojIzdataka(godisnjiIzdaci),
      stopePorezaNaDohodak: stope,
    },
    podloga,
    pravila,
  )

  return {
    status: 'izracunato',
    izracun: {
      razred: undefined,
      porezi: izracunDobiti.porezi,
      ukupanPorez: sum(
        'EUR',
        izracunDobiti.porezi.map((porez) => porez.godisnjiIznos),
      ),
      doprinosi: izracunDobiti.doprinosi,
      obveznaDavanja: [],
      ukupnaDavanja: eur(0),
      netoZaOsobu: izracunDobiti.netoZaOsobu,
      efektivnaStopa: izracunDobiti.efektivnaStopa,
    },
  }
}

const NEMODELIRANI: readonly RezimId[] = ['zaposlenik', 'doo']

/**
 * Єдина публічна функція рушія: чиста, синхронна, повертає всі режими одразу.
 *
 * Усі режими повертаються завжди і в незмінному порядку, з однаковою
 * структурою результату — саме на ній тримається зіставність, заради якої
 * калькулятор і існує. Жодного числа з закону рушій не знає: правила й
 * припущення приходять у `podloga` (ADR-0001).
 */
export const usporediRezime = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Usporedba => {
  const sDavanjima = (ishod: Ishod): Ishod =>
    ishod.status === 'izracunato'
      ? { status: 'izracunato', izracun: sObveznimDavanjima(ishod.izracun, unos, podloga) }
      : ishod

  const rezimi: readonly Rezim[] = [
    {
      id: 'pausalni-obrt',
      naziv: NAZIVI['pausalni-obrt'],
      ishod: sDavanjima(pausalniObrt(unos, podloga)),
    },
    {
      id: 'obrt-na-dohodak',
      naziv: NAZIVI['obrt-na-dohodak'],
      ishod: sDavanjima(obrtNaDohodak(unos, podloga)),
    },
    {
      id: 'obrt-na-dobit',
      naziv: NAZIVI['obrt-na-dobit'],
      ishod: sDavanjima(obrtNaDobit(unos, podloga)),
    },
    ...NEMODELIRANI.map(
      (id): Rezim => ({
        id,
        naziv: NAZIVI[id],
        ishod: nedostupno({ kod: 'nije-modeliran', rezim: id }),
      }),
    ),
  ]

  return { godina: podloga.ruleset.godina, rezimi }
}
