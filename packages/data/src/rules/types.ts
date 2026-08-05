import type Decimal from 'decimal.js'
import type { Sourced } from '../sourced.ts'

/**
 * Один `razred` (розряд / bracket) паушального обрту.
 *
 * Числа зберігаються без валюти: `ruleset` лише переписує таблицю з акта, а
 * одиниці й арифметику додає рушій. Валюта однозначна з юрисдикції джерела.
 */
export interface Razred {
  /** Порядковий номер у таблиці акта, від 1 до 7. */
  readonly redniBroj: number
  /**
   * `gornja granica razreda` (верхня межа розряду / bracket upper bound) —
   * найбільший річний `primitak` (надходження / receipts), за якого розряд ще
   * застосовується. Нижня межа розряду на цент більша за верхню межу
   * попереднього, тож окремо не зберігається.
   */
  readonly gornjaGranica: Decimal
  /**
   * `paušalni dohodak` (паушальний дохід / deemed income) за рік — юридична
   * фікція, яку акт друкує готовою для кожного розряду. Не залежить ні від
   * фактичного `izdatak`, ні від того, де всередині розряду лежить `primitak`.
   */
  readonly godisnjiPausalniDohodak: Decimal
}

/** Правила `paušalni obrt` (паушальний обрт / lump-sum sole trader). */
export interface PausalniObrtPravila {
  /**
   * Таблиця розрядів. Джерело одне на всю таблицю, бо таблиця і є вмістом
   * однієї статті — окремий `razred` власного джерела не має.
   */
  readonly razredi: Sourced<readonly Razred[]>
  /**
   * `priznati izdatak` (визнані видатки / deemed expense ratio) — частка
   * `gornja granica razreda`, яку акт вважає видатками без доказів.
   * Зберігається окремо, хоча таблиця вже друкує результат: саме ця частка
   * пояснює, звідки взявся `paušalni dohodak`, і саме її змінює законопроєкт.
   */
  readonly priznatiIzdatak: Sourced<Decimal>
  /**
   * Ставка `paušalni porez` (паушальний податок / lump-sum tax) на
   * `paušalni dohodak`. Встановлена законом і не варіюється за містом.
   */
  readonly stopaPoreza: Sourced<Decimal>
  /**
   * `koeficijent` (коефіцієнт / contribution coefficient) — множник до
   * `prosječna plaća`, з якого виходить місячна `osnovica` паушального обрту.
   */
  readonly koeficijent: Sourced<Decimal>
  /**
   * Річний `primitak`, понад який паушал недоступний. Це той самий поріг, за
   * яким починається обов'язковий `PDV`.
   */
  readonly pragPrimitka: Sourced<Decimal>
}

/**
 * Ставки `doprinosi` (внески / social contributions).
 *
 * MO разом — 20%. Тут вона розкладена на I. stup і II. stup, бо гроші йдуть
 * у різні місця: I. stup — у спільний котел, II. stup — на індивідуальний
 * рахунок платника. Той, хто не є учасником II. stup, платить усі 20% до
 * I. stup за іншим пунктом того самого закону; сума внеску не змінюється.
 */
export interface DoprinosiPravila {
  /** MO — I. stup (генераційна солідарність / pay-as-you-go pillar). */
  readonly stopaMoPrviStup: Sourced<Decimal>
  /** MO — II. stup (індивідуальна капіталізована ощадність / funded pillar). */
  readonly stopaMoDrugiStup: Sourced<Decimal>
  /** ZO — медичне страхування. */
  readonly stopaZo: Sourced<Decimal>
}

/**
 * `ruleset` (набір правил / ruleset) — усе, що написано в законі.
 *
 * Величин, які закон не встановлює, а лише на них посилається, тут немає:
 * вони живуть у `Pretpostavke` окремим шаром (ADR-0001).
 */
export interface Ruleset {
  /** Податковий рік, на який ці правила чинні. */
  readonly godina: number
  readonly pausalniObrt: PausalniObrtPravila
  readonly doprinosi: DoprinosiPravila
}

/**
 * Джерело статистики.
 *
 * Величини, на які закон посилається, але яких не встановлює, мають саме таке
 * джерело, а не правове (ADR-0001). Тому це окремий тип, а не `LegalReference`
 * зі статтею-заглушкою.
 */
export interface StatisticalReference {
  /** Хто опублікував: `Državni zavod za statistiku`. */
  readonly publisher: string
  /** Період, за який рахована величина: `siječanj – kolovoz 2025.`. */
  readonly period: string
  /** Де оприлюднено: `NN 133/25`. */
  readonly publication: string
  readonly url: string
  /**
   * Опубліковане чи прогнозоване. Для року, що ще не настав, величина
   * фізично не існує, і видавати прогноз за факт не можна (ADR-0001).
   */
  readonly status: 'published' | 'forecast'
  /** Дата, коли людина востаннє звіряла число з публікацією, ISO. */
  readonly checkedOn: `${number}-${number}-${number}`
}

/**
 * Величина, яку людина вбила руками.
 *
 * Джерела в неї немає — і саме тому це окремий член об'єднання, а не
 * `StatisticalReference` з порожнім `publisher`: показати вбите руками число
 * під посиланням на `NN 133/25` означало б приписати статистиці те, чого вона
 * не публікувала. Об'єднання змушує кожного, хто малює джерело, спершу
 * розрізнити ці два випадки.
 */
export interface RucnoZadanaVelicina {
  readonly status: 'rucno'
}

/** Звідки взялося число `pretpostavke`: з публікації статистики чи з поля. */
export type PodrijetloPretpostavke = StatisticalReference | RucnoZadanaVelicina

/** Величина з `pretpostavke` разом зі своїм походженням. */
export interface Pretpostavka<T> {
  readonly value: T
  readonly source: PodrijetloPretpostavke
}

/**
 * `pretpostavke` (припущення / assumptions) — величини, на які закон
 * посилається, але яких не встановлює.
 */
export interface Pretpostavke {
  /**
   * `prosječna plaća` (середня брутто-зарплата / average gross salary) —
   * середня місячна брутто-зарплата на одного зайнятого в юридичних особах
   * за січень–серпень року, що передує тому, на який вона застосовується.
   * Основа `osnovica`.
   */
  readonly prosjecnaPlaca: Pretpostavka<Decimal>
}
