// Правила ще не проходять через `index.ts` пакета: барель належить злиттю
// гілок. Після нього імпорт стане пакетним, шлях — зникне.
import type { DrugaDjelatnostPravila, LegalReference, Pretpostavke, Sourced } from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { eur, isGreaterThan, type Money, scale, subtract, sum, zero } from './money.ts'
import type { Doprinos, Doprinosi, Naziv } from './types.ts'

/**
 * Модифікатор «поряд із роботою за наймом» — прапорець, а не режим.
 *
 * Той, хто веде обрт паралельно з роботою за наймом, лишається в тому
 * самому режимі: паушал лишається паушалом, обрт на дохідок — обртом на
 * дохідок. Змінюються тільки внески, і одразу двома способами: база стає
 * річною і береться з самої діяльності (`čl. 185.`), а ставки падають із
 * 36,5% до 17,5%, бо основне страхування вже оплачене за місцем роботи.
 *
 * Тому модуль не рахує ані податку, ані розрядів і не знає, який саме
 * режим його викликав: він бере річну базу, яку режим уже порахував, і
 * повертає з неї внески. Один і той самий модифікатор працює і для
 * `paušalni obrt`, і для `obrt na dohodak`.
 */

const MJESECI_U_GODINI = 12

/**
 * Річна `osnovica` другої діяльності — те, з чого закон велить рахувати
 * внески (`čl. 185.`).
 */
export interface OsnovicaDrugeDjelatnosti {
  /**
   * Звідки взялася база: `dohodak` як різниця `primitak` і `izdatak` чи
   * `paušalni dohodak` розряду. Від цього залежить і стаття, і те, чи діє
   * стеля.
   */
  readonly vrsta: 'dohodak' | 'pausalni-dohodak'
  /** Сума бази, яку режим уже порахував за своїми правилами. */
  readonly godisnjaOsnovica: Money<'EUR'>
}

/** Стеля річної `osnovica` і те, чи вона справді спрацювала. */
export interface GornjaGranicaOsnovice {
  /** `prosječna plaća × koeficijent × 12`. */
  readonly iznos: Money<'EUR'>
  /** Чи база справді впала до стелі, чи стеля лишилася вище за неї. */
  readonly primijenjena: boolean
  readonly izvor: LegalReference
}

/** Внески другої діяльності за рік. */
export interface DoprinosiUzRadniOdnos {
  /**
   * База після стелі — те, на що справді нараховані внески.
   *
   * Річна, а не місячна: закон другої діяльності місячної `osnovica` не
   * знає взагалі, бо база береться з річного результату діяльності.
   */
  readonly godisnjaOsnovica: Money<'EUR'>
  /**
   * Стеля бази. `undefined`, коли закон її для цієї бази не встановлює —
   * `čl. 186. st. 5.` називає лише базу з `dohodak` і з `dobit`, а
   * паушальну не називає.
   */
  readonly gornjaGranica: GornjaGranicaOsnovice | undefined
  /** MO — I. stup (пенсійне, генераційна солідарність / pay-as-you-go pillar). */
  readonly moPrviStup: Doprinos
  /**
   * MO — II. stup (пенсійне, індивідуальна капіталізована ощадність /
   * funded pillar).
   */
  readonly moDrugiStup: Doprinos
  /** ZO (медичне страхування / health insurance). */
  readonly zo: Doprinos
  /** Усі складові разом за рік. */
  readonly ukupnoGodisnje: Money<'EUR'>
  /** Стаття, з якої взята сама база. */
  readonly izvorOsnovice: LegalReference
}

const doprinos = ({
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
 * Стеля річної `osnovica` для бази з `dohodak`.
 *
 * Береться з двох шарів: `koeficijent` із закону, `prosječna plaća` зі
 * статистики (ADR-0001). Саме тому наше число відрізняється від HOK: там
 * стеля порахована зі середньої зарплати позаминулого року — розбіжність
 * `stale-contribution-cap-for-second-activity` у реєстрі.
 */
const gornjaGranicaZa = (
  koeficijent: Sourced<Decimal>,
  pretpostavke: Pretpostavke,
  godisnjaOsnovica: Money<'EUR'>,
): GornjaGranicaOsnovice => {
  const iznos = scale(
    eur(pretpostavke.prosjecnaPlaca.value.times(koeficijent.value)),
    MJESECI_U_GODINI,
  )

  return { iznos, primijenjena: isGreaterThan(godisnjaOsnovica, iznos), izvor: koeficijent.source }
}

/**
 * Внески обрту, який ведуть поряд із роботою за наймом.
 *
 * Приймає річну базу режиму, а не сам режим: правило однакове для паушалу
 * й для обрту на дохідок, різниться лише те, звідки база взялася і чи має
 * вона стелю.
 */
export const doprinosiUzRadniOdnos = (
  osnovica: OsnovicaDrugeDjelatnosti,
  pravila: DrugaDjelatnostPravila,
  pretpostavke: Pretpostavke,
): DoprinosiUzRadniOdnos => {
  // Вид бази вирішує одразу дві речі — чи діє стеля і яку статтю цитувати.
  const premaDohotku = osnovica.vrsta === 'dohodak'

  // Збиток базою не стає: закон бере `dohodak ostvaren u poreznom
  // razdoblju`, а від'ємний внесок не має сенсу ні в законі, ні на картці.
  const ostvarenaOsnovica = osnovica.godisnjaOsnovica.amount.isNegative()
    ? zero('EUR')
    : osnovica.godisnjaOsnovica

  const gornjaGranica = premaDohotku
    ? gornjaGranicaZa(pravila.koeficijentNajviseOsnovice, pretpostavke, ostvarenaOsnovica)
    : undefined

  const godisnjaOsnovica =
    gornjaGranica?.primijenjena === true ? gornjaGranica.iznos : ostvarenaOsnovica

  const moPrviStup = doprinos({
    naziv: { hr: 'MO — I. stup', uk: 'пенсійне, генераційна солідарність' },
    stopa: pravila.stopaMoPrviStup,
    godisnjaOsnovica,
    osobnaStednja: false,
  })
  const moDrugiStup = doprinos({
    naziv: { hr: 'MO — II. stup', uk: 'пенсійне, індивідуальна капіталізована ощадність' },
    stopa: pravila.stopaMoDrugiStup,
    godisnjaOsnovica,
    osobnaStednja: true,
  })
  const zo = doprinos({
    naziv: { hr: 'ZO', uk: 'медичне страхування' },
    stopa: pravila.stopaZo,
    godisnjaOsnovica,
    osobnaStednja: false,
  })

  return {
    godisnjaOsnovica,
    gornjaGranica,
    moPrviStup,
    moDrugiStup,
    zo,
    ukupnoGodisnje: sum('EUR', [
      moPrviStup.godisnjiIznos,
      moDrugiStup.godisnjiIznos,
      zo.godisnjiIznos,
    ]),
    izvorOsnovice: premaDohotku
      ? pravila.izvorOsnovice.dohodak
      : pravila.izvorOsnovice.pausalniDohodak,
  }
}

/**
 * Наскільки менші внески виходять із наймом, ніж без нього.
 *
 * Додатне число означає виграш. Порівнюються річні суми того самого
 * режиму — інакше порівнювалися б різні режими, а не наявність найму.
 */
export const ustedaNaDoprinosima = (
  redovni: Doprinosi,
  uzRadniOdnos: DoprinosiUzRadniOdnos,
): Money<'EUR'> => subtract(redovni.ukupnoGodisnje, uzRadniOdnos.ukupnoGodisnje)
