import Decimal from 'decimal.js'
import { type LegalReference, ZAKON_O_DOPRINOSIMA } from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'

/**
 * Внески за `druga djelatnost` (друга діяльність / second activity) — коли
 * обрт ведуть поряд із роботою за наймом.
 *
 * Закон не робить із цього окремого режиму: `paušalni obrt` лишається
 * паушальним, `obrt na dohodak` — обртом на дохідок, змінюються лише
 * правила внесків. Змінюються вони двічі:
 *
 * 1. **База.** Замість місячної `osnovica` з `prosječna plaća × koeficijent`
 *    закон бере річну базу з самої діяльності — `dohodak` або `paušalni
 *    dohodak` (`čl. 185.`). Внески перестають бути фіксованим платежем і
 *    починають залежати від заробленого.
 * 2. **Ставки.** Замість 36,5% діють 17,5%: людина вже застрахована за
 *    основним місцем роботи, тож за другою діяльністю доплачує лише
 *    частину.
 *
 * Головний наслідок: за низького `dohodak` внески майже зникають — саме
 * тому прапорець «працюю за наймом» змінює картку сильніше за будь-який
 * податок.
 */

const CHECKED_ON = '2026-08-04' as const

/**
 * Ставки й стеля внесків другої діяльності.
 *
 * Усі три ставки записані в законі як **винятки** з тих самих статей, що
 * дають звичайні 15%, 5% і 16,5%. Тому кожна цитує свій `stavak`-виняток:
 * загальна норма в тій самій статті каже інше число.
 */
export interface DrugaDjelatnostPravila {
  /** MO — I. stup для того, хто водночас учасник II. stup. */
  readonly stopaMoPrviStup: Sourced<Decimal>
  /** MO — II. stup. */
  readonly stopaMoDrugiStup: Sourced<Decimal>
  /** ZO — медичне страхування. */
  readonly stopaZo: Sourced<Decimal>
  /**
   * `koeficijent` стелі річної `osnovica`:
   * `prosječna plaća × koeficijent × broj mjeseci`.
   *
   * Стеля стосується лише бази з `dohodak` і `dobit` (`čl. 185. st. 1.` і
   * `st. 2.`). Для паушалу її немає — і не потрібно: `paušalni dohodak`
   * найвищого розряду вдвічі менший за стелю, тож вона ніколи не спрацює.
   */
  readonly koeficijentNajviseOsnovice: Sourced<Decimal>
  /**
   * Статті, з яких береться сама база — по одній на кожен вид.
   *
   * Чисел не несуть: база — це результат діяльності, а не число із закону.
   * Але правило так само мусить вести до тексту акта, і тримати ці статті
   * в рушії означало б лишити в ньому знання про закон (ADR-0001).
   */
  readonly izvorOsnovice: IzvorOsnoviceDrugeDjelatnosti
}

/** Звідки береться річна `osnovica` — залежно від того, як обкладається обрт. */
export interface IzvorOsnoviceDrugeDjelatnosti {
  /** База — річний `dohodak` як різниця `primitak` і `izdatak`. */
  readonly dohodak: LegalReference
  /** База — `paušalni dohodak` розряду. */
  readonly pausalniDohodak: LegalReference
}

/** Чинні правила другої діяльності на 2026 рік. */
export const drugaDjelatnost2026: DrugaDjelatnostPravila = {
  // «Iznimno od odredbe stavka 1. točke 1.… za osobu koja je osiguranik i
  // mirovinskog osiguranja na temelju individualne kapitalizirane štednje
  // obračunava se po stopi od 7,5%». Хто не в II. stup, платить усі 10%
  // за t. 1. тієї самої статті; разом MO однаково 10%.
  stopaMoPrviStup: sourced(new Decimal('0.075'), {
    ...ZAKON_O_DOPRINOSIMA,
    article: 'čl. 13. st. 3. t. 2.',
    checkedOn: CHECKED_ON,
  }),
  stopaMoDrugiStup: sourced(new Decimal('0.025'), {
    ...ZAKON_O_DOPRINOSIMA,
    article: 'čl. 17. st. 2.',
    checkedOn: CHECKED_ON,
  }),
  stopaZo: sourced(new Decimal('0.075'), {
    ...ZAKON_O_DOPRINOSIMA,
    article: 'čl. 14. st. 2.',
    checkedOn: CHECKED_ON,
  }),
  // Naredba o iznosima osnovica za 2026. (NN 150/25, čl. 12.) друкує за цим
  // коефіцієнтом 15 545,40 € на рік. Зберігається множник, а не сума: сума
  // тримається на `prosječna plaća`, яку публікує статистика (ADR-0001).
  koeficijentNajviseOsnovice: sourced(new Decimal('0.65'), {
    ...ZAKON_O_DOPRINOSIMA,
    article: 'čl. 186. st. 5.',
    checkedOn: CHECKED_ON,
  }),
  izvorOsnovice: {
    dohodak: { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 185. st. 1.', checkedOn: CHECKED_ON },
    pausalniDohodak: { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 185. st. 3.', checkedOn: CHECKED_ON },
  },
}
