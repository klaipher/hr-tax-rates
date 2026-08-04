import type { LegalReference, Sourced } from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { formatEur, formatPostotak } from './format.ts'
import { eur, isGreaterThan, type Money, roundToCents, scale, subtract, zero } from './money.ts'

/**
 * `PDV` (ПДВ / VAT) з двох сторін, які відчуває обрт однієї людини.
 *
 * **Вихідна сторона** відповідає на питання, чи буде `PDV` клином у ціні.
 * Для послуг платникові податку місце надання — `sjedište` (місцезнаходження)
 * отримувача, тож рахунок бізнес-клієнтові за кордоном хорватського `PDV` не
 * несе ні до порога
 * 60 000 €, ні після нього: податок рахує собі отримувач (`prijenos porezne
 * obveze`). Клин виникає лише на клієнтах у Хорватії — і лише в системі `PDV`.
 *
 * **Вхідна сторона** — те, чого не показує жоден інший калькулятор. Обрт із
 * `PDV ID`, але поза системою `PDV`, нараховує собі `PDV` на кожну послугу,
 * куплену за кордоном, і відняти його як `pretporez` (вхідний податок / input
 * VAT) не має права. Це чиста витрата. Вхід у систему `PDV` її прибирає, бо
 * право на відрахування з’являється — звідси й інверсія: тому, хто багато
 * купує за кордоном, перетин порога може вийти дешевшим, ніж життя під ним.
 *
 * Обидві сторони подаються окремими рядками і **не сумуються**: чиста витрата
 * вхідної сторони — це гроші, `PDV` на вихідному рахунку — ні. Чи стане він
 * клином, залежить від того, чи може клієнт його відрахувати; цього рушій не
 * знає й не вгадує.
 *
 * **Свідомо не змодельовано**: OSS для продажів споживачам у ЄС, `prag
 * stjecanja` для придбання товарів і `razmjerni odbitak` за змішаної
 * діяльності. Перелік із поясненнями й статтями лежить у
 * `@hr-tax/data` — `PDV_IZVAN_OPSEGA`, і UI показує його поруч із числами.
 *
 * Понад поріг `PDV` зникає й `paušalni obrt`; недоступність режиму рахує
 * `pausalni-obrt.ts` за тим самим порогом, а решта режимів рахуються далі.
 */

/**
 * Звідки клієнти. Три випадки, бо в кожного своя норма й свій наслідок:
 * рахунок у Хорватії носить `PDV`, бізнес-клієнтові в ЄС — ні, і саме він
 * створює обов’язок мати `PDV ID`, а бізнес-клієнт поза ЄС — ні того, ні того.
 *
 * Споживачі в інших державах ЄС окремим випадком не виділені: їх оподатковує
 * держава споживача через OSS, а OSS цей рушій не рахує.
 */
export type TipKlijenta = 'tuzemni' | 'poslovni-eu' | 'poslovni-izvan-eu'

/** Стан щодо системи `PDV`. Третього немає: або в реєстрі, або поза ним. */
export type PdvStatus = 'izvan-sustava' | 'u-sustavu'

export interface PdvUnos {
  /**
   * Річний `primitak` (надходження / receipts). З ним звіряється поріг
   * `čl. 90. st. 1.`, і з нього ж рахується `PDV` на вихідних рахунках.
   *
   * Рушій не ділить `primitak` за місцем надання: `čl. 90. st. 3.` перелічує,
   * які саме обороти входять у поріг, і для послуг бізнесам ЄС це питання
   * спірне. Рушій бере весь `primitak` — так само, як його бере поріг
   * `paušalni obrt`.
   */
  readonly godisnjiPrimitak: Money<'EUR'>
  /** Звідки клієнти — від цього залежить, чи буде `PDV` на вихідних рахунках. */
  readonly tipKlijenta: TipKlijenta
  /**
   * Річна сума послуг, куплених у постачальників без `sjedište`
   * (місцезнаходження) у Хорватії. Норма `čl. 75. st. 1. t. 6.` не розрізняє
   * ЄС і треті країни — значення має лише те, що постачальник не хорватський.
   */
  readonly godisnjeInozemneUsluge: Money<'EUR'>
}

/**
 * Норми `PDV`, які рушій бере ззовні.
 *
 * Рушій не знає жодного числа з закону: і ставка, і поріг приходять сюди
 * набором правил (ADR-0001), а кожна норма несе свою статтю (ADR-0002).
 */
export interface PdvPravila {
  /** Загальна ставка `PDV`: `čl. 38. st. 1.` */
  readonly opcaStopa: Sourced<Decimal>
  /** Річний оборот, понад який вхід у систему `PDV` обов’язковий: `čl. 90. st. 1.` */
  readonly pragUpisa: Sourced<Decimal>
  /** Місце надання послуги платникові податку — його `sjedište`: `čl. 17. st. 1.` */
  readonly mjestoUslugePoreznomObvezniku: LegalReference
  /** Напис «prijenos porezne obveze» на рахунку: `čl. 79. st. 7.` */
  readonly napomenaPrijenosaObveze: LegalReference
  /** Самонарахування `PDV` на послугу з-за кордону: `čl. 75. st. 1. t. 6.` */
  readonly samoobracunNaPrimljenuUslugu: LegalReference
  /** Поза системою `PDV` права на `pretporez` немає: `čl. 90.g` */
  readonly bezPravaNaOdbitak: LegalReference
  /** У системі самонарахований `PDV` є `pretporez`: `čl. 58. st. 2.` */
  readonly pravoNaOdbitak: LegalReference
  /** Обов’язок мати `PDV ID` незалежно від порога: `čl. 77. st. 4.` */
  readonly obvezaPdvIdentifikacijskogBroja: LegalReference
  /** Добровільний вхід у `redovni postupak oporezivanja` нижче порога: `čl. 90.h` */
  readonly izborRedovnogPostupka: LegalReference
}

/** Обов’язковий напис на рахунку разом із нормою, що його вимагає. */
export interface NapomenaNaRacunu {
  readonly tekst: string
  readonly izvor: LegalReference
}

/** Вихідна сторона: чи несе рахунок клієнтові хорватський `PDV`. */
export interface IzlaznaStrana {
  readonly obracunavaSePdv: boolean
  /**
   * `PDV`, який за рік ляже на вихідні рахунки. Нуль, коли не нараховується.
   * Це не витрата обрту: клієнт у системі `PDV` відрахує його як `pretporez`,
   * а клієнт поза нею відчує клином у ціні.
   */
  readonly godisnjiPdv: Money<'EUR'>
  /** `undefined`, коли закон окремого напису не вимагає. */
  readonly napomenaNaRacunu: NapomenaNaRacunu | undefined
  readonly obrazlozenje: string
  /** Норма, за якою `PDV` нараховується або не нараховується. */
  readonly izvor: LegalReference
}

/** Вхідна сторона: послуги, куплені за кордоном. */
export interface UlaznaStrana {
  /** Річна сума закордонних послуг — база самонарахування. */
  readonly osnovica: Money<'EUR'>
  /** `PDV`, нарахований самому собі за `čl. 75. st. 1. t. 6.` */
  readonly obracunatiPdv: Money<'EUR'>
  /** Скільки з нарахованого повертається відрахуванням `pretporez`. */
  readonly odbitakPretporeza: Money<'EUR'>
  /**
   * Чиста витрата: нараховане без відрахованого. Поза системою `PDV` дорівнює
   * всьому нарахованому, у системі — нулю. Окремий рядок, бо в жодному рахунку
   * ця сума не видна, а платити її доводиться зі своєї кишені.
   */
  readonly nepovratniPdv: Money<'EUR'>
  readonly obrazlozenje: string
  /**
   * Норма, що змушує нарахувати податок самому собі. Окремо від
   * `izvorOdbitka`, бо це дві різні статті й саме їхня пара творить витрату:
   * одна нараховує, друга не дозволяє відняти.
   */
  readonly izvorSamoobracuna: LegalReference
  /** Норма, яка право на відрахування `pretporez` дає або відбирає. */
  readonly izvorOdbitka: LegalReference
}

/** Чому `PDV ID` став обов’язковим. */
export type PdvIdRazlog = 'usluge-poslovnim-klijentima-eu' | 'usluge-primljene-iz-inozemstva'

/**
 * Обов’язок мати `PDV ID`, що виникає з самих операцій, а не з порога.
 *
 * Пастка, яку пропускає більшість калькуляторів: `čl. 77. st. 4.` починається
 * з «Neovisno o stavku 2.», а саме `st. 2.` звільняє малих платників від
 * `PDV ID`. Тобто обов’язок діє й далеко нижче 60 000 €, і сам `PDV ID` у
 * систему `PDV` не заводить — він лише вмикає самонарахування на вході.
 */
export interface ObvezaPdvIdentifikacijskogBroja {
  readonly obvezan: boolean
  /** Порожньо, коли обов’язку немає. Кодами користується UI, текстом — людина. */
  readonly razlozi: readonly PdvIdRazlog[]
  readonly obrazlozenje: string
  readonly izvor: LegalReference
}

/** Обидві сторони `PDV` за одного стану щодо системи. */
export interface PdvIzracun {
  readonly status: PdvStatus
  readonly izlaz: IzlaznaStrana
  readonly ulaz: UlaznaStrana
}

export interface PdvUsporedba {
  readonly izvanSustava: PdvIzracun
  readonly uSustavu: PdvIzracun
  /** Стан, який закон нав’язує на цей `primitak`. Другий лишається вибором. */
  readonly obvezniStatus: PdvStatus
  readonly obrazlozenjeStatusa: string
  /** Норма: поріг, коли вхід нав’язаний; право вибору, коли добровільний. */
  readonly izvorStatusa: LegalReference
  /**
   * Скільки вхід у систему `PDV` прибирає з чистої витрати вхідної сторони за
   * рік. Це і є інверсія в одному числі: чим більше закордонних послуг, тим
   * дорожче обходиться життя під порогом.
   */
  readonly ustedaUlazneStrane: Money<'EUR'>
  readonly obvezaPdvIdentifikacijskogBroja: ObvezaPdvIdentifikacijskogBroja
}

const PRIJENOS_POREZNE_OBVEZE = 'prijenos porezne obveze'

/** Число з набору правил як `Money`: `ruleset` зберігає числа без валюти. */
const eurIz = (iznos: Sourced<Decimal>): Money<'EUR'> => eur(iznos.value)

const izlazZa = (unos: PdvUnos, status: PdvStatus, pravila: PdvPravila): IzlaznaStrana => {
  const prag = formatEur(eurIz(pravila.pragUpisa))

  if (unos.tipKlijenta !== 'tuzemni') {
    const uEu = unos.tipKlijenta === 'poslovni-eu'

    return {
      obracunavaSePdv: false,
      godisnjiPdv: zero('EUR'),
      napomenaNaRacunu: uEu
        ? { tekst: PRIJENOS_POREZNE_OBVEZE, izvor: pravila.napomenaPrijenosaObveze }
        : undefined,
      obrazlozenje:
        'Рахунок бізнес-клієнтові за кордоном хорватського PDV не несе: місце надання послуги — ' +
        'sjedište (місцезнаходження) отримувача, тож хорватського обороту тут немає. ' +
        (uEu
          ? `Податок рахує собі отримувач — це ${PRIJENOS_POREZNE_OBVEZE} (перенесення ` +
            'податкового зобов’язання), і напис про це обов’язковий на рахунку. '
          : 'Перенесення податкового зобов’язання хорватський закон для третіх країн не ' +
            'приписує. ') +
        `Так і до порога ${prag}, і після нього.`,
      izvor: pravila.mjestoUslugePoreznomObvezniku,
    }
  }

  if (status === 'izvan-sustava') {
    return {
      obracunavaSePdv: false,
      godisnjiPdv: zero('EUR'),
      napomenaNaRacunu: undefined,
      obrazlozenje:
        `Поки річний primitak не перевищує ${prag}, закон звільняє від сплати PDV: рахунок ` +
        'клієнтові в Хорватії виходить без податку, але й pretporez відраховувати немає з чого.',
      izvor: pravila.pragUpisa.source,
    }
  }

  const godisnjiPdv = roundToCents(scale(unos.godisnjiPrimitak, pravila.opcaStopa.value))

  return {
    obracunavaSePdv: true,
    godisnjiPdv,
    napomenaNaRacunu: undefined,
    obrazlozenje:
      'У системі PDV рахунок клієнтові в Хорватії несе ' +
      `${formatPostotak(pravila.opcaStopa.value)} податку — ${formatEur(godisnjiPdv)} за рік. ` +
      'Клієнтові, який сам у системі PDV, ця сума нічого не коштує: він відрахує її як ' +
      'pretporez. Клієнтові поза системою вона лягає клином у ціну.',
    izvor: pravila.opcaStopa.source,
  }
}

const ulazZa = (unos: PdvUnos, status: PdvStatus, pravila: PdvPravila): UlaznaStrana => {
  const osnovica = unos.godisnjeInozemneUsluge
  const obracunatiPdv = roundToCents(scale(osnovica, pravila.opcaStopa.value))
  const uSustavu = status === 'u-sustavu'
  const odbitakPretporeza = uSustavu ? obracunatiPdv : zero('EUR')

  const samoobracun =
    'Послуги від постачальників з-за кордону обрт нараховує собі сам: ' +
    `${formatPostotak(pravila.opcaStopa.value)} від ${formatEur(osnovica)} — ` +
    `${formatEur(obracunatiPdv)} за рік. `

  return {
    osnovica,
    obracunatiPdv,
    odbitakPretporeza,
    nepovratniPdv: subtract(obracunatiPdv, odbitakPretporeza),
    obrazlozenje:
      samoobracun +
      (uSustavu
        ? 'У системі PDV та сама сума є pretporez і відраховується повністю, тож чистої витрати ' +
          'не лишається.'
        : 'Поза системою PDV права на pretporez немає, тож уся сума лишається чистою витратою — ' +
          'її не видно в жодному рахунку, і повернути її нізвідки.'),
    izvorSamoobracuna: pravila.samoobracunNaPrimljenuUslugu,
    izvorOdbitka: uSustavu ? pravila.pravoNaOdbitak : pravila.bezPravaNaOdbitak,
  }
}

const RAZLOG_TEKST: Readonly<Record<PdvIdRazlog, string>> = {
  'usluge-poslovnim-klijentima-eu': 'обрт надає послуги бізнес-клієнтам в іншій державі ЄС',
  'usluge-primljene-iz-inozemstva': 'обрт купує послуги в постачальника з-за кордону',
}

const obvezaPdvIdZa = (unos: PdvUnos, pravila: PdvPravila): ObvezaPdvIdentifikacijskogBroja => {
  const razlozi: PdvIdRazlog[] = []
  if (unos.tipKlijenta === 'poslovni-eu') razlozi.push('usluge-poslovnim-klijentima-eu')
  if (!unos.godisnjeInozemneUsluge.amount.isZero()) razlozi.push('usluge-primljene-iz-inozemstva')

  return {
    obvezan: razlozi.length > 0,
    razlozi,
    obrazlozenje:
      razlozi.length > 0
        ? `PDV ID обов’язковий незалежно від порога ${formatEur(eurIz(pravila.pragUpisa))}: ` +
          `${razlozi.map((razlog) => RAZLOG_TEKST[razlog]).join('; ')}. Звільнення для малих ` +
          'платників на цей обов’язок не поширюється. Сам PDV ID у систему PDV не заводить — він ' +
          'лише вмикає самонарахування PDV на послуги, куплені за кордоном.'
        : 'PDV ID не потрібен: обрт не надає послуг бізнесам ЄС і не купує послуг за кордоном.',
    izvor: pravila.obvezaPdvIdentifikacijskogBroja,
  }
}

const izracunZa = (unos: PdvUnos, status: PdvStatus, pravila: PdvPravila): PdvIzracun => ({
  status,
  izlaz: izlazZa(unos, status, pravila),
  ulaz: ulazZa(unos, status, pravila),
})

/**
 * Обидва стани щодо системи `PDV` поруч — і той, який закон нав’язує.
 *
 * Обидва рахуються завжди, хоч який `primitak`: нижче порога вхід у систему є
 * вибором (`čl. 90.h`), і саме там інверсія має шанс змінити рішення. Різницю
 * видно одним числом — `ustedaUlazneStrane`.
 */
export const usporediSustavPdv = (unos: PdvUnos, pravila: PdvPravila): PdvUsporedba => {
  const prag = eurIz(pravila.pragUpisa)
  const obvezniStatus: PdvStatus = isGreaterThan(unos.godisnjiPrimitak, prag)
    ? 'u-sustavu'
    : 'izvan-sustava'

  const izvanSustava = izracunZa(unos, 'izvan-sustava', pravila)
  const uSustavu = izracunZa(unos, 'u-sustavu', pravila)

  return {
    izvanSustava,
    uSustavu,
    obvezniStatus,
    obrazlozenjeStatusa:
      obvezniStatus === 'u-sustavu'
        ? `Річний primitak ${formatEur(unos.godisnjiPrimitak)} перевищує поріг ` +
          `${formatEur(prag)}, тож вхід у систему PDV обов’язковий. На тому самому порозі закон ` +
          'забирає paušalni obrt — решта режимів рахуються далі.'
        : `Річний primitak ${formatEur(unos.godisnjiPrimitak)} не перевищує порога ` +
          `${formatEur(prag)}, тож вхід у систему PDV — вибір, а не обов’язок: закон дозволяє ` +
          'попроситися в redovni postupak oporezivanja (звичайний режим оподаткування) ' +
          'добровільно.',
    izvorStatusa:
      obvezniStatus === 'u-sustavu' ? pravila.pragUpisa.source : pravila.izborRedovnogPostupka,
    ustedaUlazneStrane: subtract(izvanSustava.ulaz.nepovratniPdv, uSustavu.ulaz.nepovratniPdv),
    obvezaPdvIdentifikacijskogBroja: obvezaPdvIdZa(unos, pravila),
  }
}
