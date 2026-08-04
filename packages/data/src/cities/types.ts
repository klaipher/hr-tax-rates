/**
 * Довідник одиниць `jedinica lokalne samouprave` (одиниця місцевого
 * самоврядування / local self-government unit) — це `grad` (місто) або
 * `općina` (община) — і ставок `porez na dohodak` (податок на дохідок), які
 * кожна з них собі установила своєю `odluka` (рішення представницького
 * органу / council decision).
 *
 * Плутати легко, тому прямо: місто рухає ставки **лише** `porez na dohodak`.
 * На `paušalni porez` (паушальний податок) `odluka` міста не впливає ніяк —
 * там 12 %, установлені законом (CONTEXT.md). Довідник із цього файлу не має
 * права торкатися паушального розрахунку.
 */

/**
 * `porezna stopa` (податкова ставка) у базисних пунктах — сотих частках
 * відсотка: 20,5 % — це 2050, 30 % — це 3000.
 *
 * Ціле число, а не частка `number`: у таблиці Porezna uprava 20,5 % лежить
 * як `0.20499999999999999`, і рушій, що звіряється з еталонами до цента, не
 * має права успадкувати цей дрейф float.
 */
export type BazniBodovi = number

/** Дата в ISO — той самий формат, що й `LegalReference.checkedOn`. */
export type Datum = `${number}-${number}-${number}`

/**
 * Пара ставок. Закон задає їх тільки разом: `čl. 19.` — нижча ставка на
 * `porezna osnovica` (податкову базу) до 60 000 €, вища — на частину понад
 * 60 000 €. Одна ставка без другої податку не визначає.
 *
 * Ті 60 000 € — не стеля паушалу з CONTEXT.md: там межа міряється по
 * `primitak`, тут — по `porezna osnovica`. Числа збіглися, поняття різні.
 */
export interface ParStopa {
  /** `niža stopa` (нижча ставка) — на `porezna osnovica` до 60 000 €. */
  readonly niza: BazniBodovi
  /** `viša stopa` (вища ставка) — на частину `porezna osnovica` понад 60 000 €. */
  readonly visa: BazniBodovi
}

/** Ставки однієї одиниці разом зі слідом до `odluka`, яка їх установила. */
export interface StopePorezaNaDohodak extends ParStopa {
  /**
   * «Broj NN» (номер НН) — випуски `Narodne novine` (офіційний вісник /
   * official gazette), у яких оприлюднена `odluka` цієї одиниці, дослівно з
   * таблиці Porezna uprava: `['152/23', '35/25']`.
   *
   * Назв і статей тих `odluka` таблиця не подає, тому повного
   * `LegalReference` на кожну одиницю тут немає — вигадати назву акта було б
   * тим самим, що вигадати число (ADR-0002). Джерело самого довідника лежить
   * поруч зі списком, у `Sourced`.
   */
  readonly narodneNovine: readonly string[]
  /**
   * «Stupanje na snagu» (набрання чинності / entry into force) — дата, з якої
   * ці ставки застосовуються.
   */
  readonly stupanjeNaSnagu: Datum
}

/** Одна `jedinica lokalne samouprave`: `grad` (місто) або `općina` (община). */
export interface JedinicaLokalneSamouprave {
  /**
   * «Šifra grada/općine» (шифра міста/общини) — код одиниці в реєстрі
   * Porezna uprava.
   *
   * Єдиний унікальний ключ довідника: назви не унікальні. OTOK, PRIVLAKA і
   * SVETA NEDELJA трапляються двічі, щоразу з різними ставками, тож вибір за
   * назвою — це вибір навмання між 17 % і 20 %.
   */
  readonly sifra: string
  /**
   * «Ime grada/općine» (назва міста/общини) — як її друкує Porezna uprava:
   * великими літерами.
   */
  readonly ime: string
  readonly stope: StopePorezaNaDohodak
}

/**
 * Вид одиниці за `čl. 19.a st. 2.` — від нього залежить, як високо одиниця
 * має право підняти свої ставки.
 */
export type VrstaJedinice = 'opcina' | 'grad' | 'veliki-grad' | 'grad-zagreb'

/** Відрізок, у якому закон дозволяє одиниці тримати одну ставку. */
export interface RasponStopa {
  readonly min: BazniBodovi
  readonly max: BazniBodovi
}

/** Межі обох ставок для одного виду одиниці. */
export interface GraniceStopa {
  readonly niza: RasponStopa
  readonly visa: RasponStopa
}
