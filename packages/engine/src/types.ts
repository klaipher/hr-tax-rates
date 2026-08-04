import type { LegalReference, Pretpostavke, Ruleset } from '@hr-tax/data'
import type Decimal from 'decimal.js'
import type { Money } from './money.ts'

/**
 * Назва поняття: канонічна хорватська форма й український переклад поруч.
 *
 * Тип змушує дати обидві. `primitak`, `izdatak`, `dohodak` і `dobit` різні,
 * а українською всі четверо тягне до «доходу» — тому переклад іде поруч із
 * хорватським терміном, а не замість нього (CONTEXT.md).
 */
export interface Naziv {
  readonly hr: string
  readonly uk: string
}

/** Вхід форми. */
export interface Unos {
  /**
   * Річний `primitak` (надходження / receipts). Саме він визначає `razred`
   * і поріг паушалу — не `dohodak` і не `dobit`.
   */
  readonly godisnjiPrimitak: Money<'EUR'>
}

/**
 * Два шари даних, на яких стоїть розрахунок: закон і статистика (ADR-0001).
 *
 * Рушій не має свого набору правил і не знає жодного числа з закону — усе
 * приходить сюди ззовні, тож той самий рушій рахує і чинний рік, і проєкт.
 */
export interface Podloga {
  readonly ruleset: Ruleset
  readonly pretpostavke: Pretpostavke
}

export type RezimId = 'pausalni-obrt' | 'obrt-na-dohodak' | 'obrt-na-dobit' | 'zaposlenik' | 'doo'

/** `razred` (розряд / bracket), що застосувався до цього `primitak`. */
export interface PrimijenjeniRazred {
  /** Порядковий номер розряду в таблиці акта. */
  readonly redniBroj: number
  /**
   * `gornja granica razreda` (верхня межа розряду / bracket upper bound).
   * Податок рахується з неї, а не з фактичного `primitak` — тому всередині
   * розряду сума не змінюється, а на межі стрибає.
   */
  readonly gornjaGranica: Money<'EUR'>
  readonly izvor: LegalReference
}

/** Річний податок режиму. */
export interface Porez {
  readonly naziv: Naziv
  /**
   * База, з якої нарахований податок. У паушальному обрті це
   * `paušalni dohodak` (паушальний дохід / deemed income) — юридична фікція,
   * а не різниця `primitak` і `izdatak`.
   */
  readonly osnovica: Money<'EUR'>
  readonly stopa: Decimal
  readonly godisnjiIznos: Money<'EUR'>
  readonly izvor: LegalReference
}

/** Одна складова `doprinosi` (внески / social contributions). */
export interface Doprinos {
  readonly naziv: Naziv
  readonly stopa: Decimal
  readonly godisnjiIznos: Money<'EUR'>
  /**
   * Чи гроші лишаються персональними. II. stup іде на індивідуальний рахунок
   * платника — це відкладені кошти, а не втрачені, і на картці їх не можна
   * показувати нарівні з податком.
   */
  readonly osobnaStednja: boolean
  readonly izvor: LegalReference
}

export interface Doprinosi {
  /**
   * `osnovica` (база нарахування внесків / contribution base) за місяць.
   * Не залежить від фактичного `primitak`.
   */
  readonly mjesecnaOsnovica: Money<'EUR'>
  readonly moPrviStup: Doprinos
  readonly moDrugiStup: Doprinos
  readonly zo: Doprinos
  readonly ukupnoGodisnje: Money<'EUR'>
}

/**
 * Розрахунок режиму. Структура однакова для всіх режимів — саме на ній
 * тримається зіставність, тож поле, якого режим не має, лишається присутнім
 * зі значенням `undefined`, а не зникає.
 */
export interface Izracun {
  /** `undefined` у режимів, які не знають розрядів. */
  readonly razred: PrimijenjeniRazred | undefined
  readonly porez: Porez
  readonly doprinosi: Doprinosi
  /**
   * Скільки лишається людині за рік: `primitak` без податку і без `doprinosi`.
   * Головне число картки. Фактичний `izdatak` цей зріз ще не знає, тож сума
   * рахується до нього.
   */
  readonly netoZaOsobu: Money<'EUR'>
  /**
   * Частка `primitak`, яку забирають усі обов'язкові платежі разом.
   * `undefined` за нульового `primitak`: ділити немає на що.
   */
  readonly efektivnaStopa: Decimal | undefined
}

/**
 * Підсумок режиму: або розрахунок, або причина недоступності. Третього немає,
 * і порожнього розрахунку з нулями теж — нуль на картці не відрізнити від
 * порахованого нуля.
 */
export type Ishod =
  | { readonly status: 'izracunato'; readonly izracun: Izracun }
  | { readonly status: 'nedostupno'; readonly razlog: string }

export interface Rezim {
  readonly id: RezimId
  readonly naziv: Naziv
  readonly ishod: Ishod
}

export interface Usporedba {
  /** Рік правил, за якими зроблено розрахунок. */
  readonly godina: number
  /** Усі режими, завжди всі й завжди в тому самому порядку. */
  readonly rezimi: readonly Rezim[]
}
