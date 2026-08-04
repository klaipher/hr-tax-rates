import Decimal from 'decimal.js'
import { type LegalReference, ZAKON_O_DOPRINOSIMA, ZAKON_O_POREZU_NA_DOHODAK } from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'

/**
 * Правила режиму `obrt na dobit` (обрт у системі porez na dobit).
 *
 * Режим стоїть на трьох актах, і кожен дає своє число:
 * — `Zakon o porezu na dobit` — ставку самого податку на `dobit`;
 * — `Zakon o doprinosima` — `koeficijent` найнижчої `osnovica`
 *   `poduzetnička plaća`;
 * — `Zakon o porezu na dohodak` — усе, що стосується оподаткування самої
 *   `poduzetnička plaća` як плаће, і ставку на виплату `dobit` власнику.
 *
 * Тому це три різні податки під двома законами, і зводити їх в одну суму
 * не можна: `dobit` рахується за методом нарахування, `dohodak` із плаће —
 * за іншим законом і з іншої бази (CONTEXT.md).
 */

const CHECKED_ON = '2026-08-04' as const

/**
 * `Zakon o porezu na dobit` — акт, якого ще немає в спільному `legal.ts`.
 *
 * Константа живе тут, а не там: спільний файл посилань належить іншому
 * тікету, і дописувати туди поза своїми межами не можна. Той самий обхід,
 * що вже застосований для `Zakon o obrtu` в `levies/komorski-doprinos.ts`.
 */
const ZAKON_O_POREZU_NA_DOBIT = {
  jurisdiction: 'HR',
  act: 'Zakon o porezu na dobit',
  gazette:
    'NN 177/04, 90/05, 57/06, 146/08, 80/10, 22/12, 148/13, 143/14, 50/16, 115/16, 106/18, 121/19, 32/20, 138/20, 114/22, 114/23, 151/25',
  url: 'https://www.zakon.hr/z/99/zakon-o-porezu-na-dobit',
  status: 'in-force',
} as const

/** Ставки `porez na dobit` і поріг, що їх розводить. */
export interface PorezNaDobitPravila {
  /** Ставка на `porezna osnovica` до порога `prihodi`. */
  readonly nizaStopa: Sourced<Decimal>
  /** Ставка на `porezna osnovica`, коли `prihodi` дійшли до порога. */
  readonly visaStopa: Sourced<Decimal>
  /**
   * Річні `prihod` (виручка за методом нарахування / revenue), від яких
   * діє вища ставка.
   *
   * Поріг міряється по `prihodi`, а не по `dobit`: обрт із мільйонним
   * `prihod` і нульовою `dobit` усе одно потрапляє під вищу ставку.
   * Закон каже «jednaki ili veći», тож рівно на порозі діє вже вища.
   */
  readonly pragPrihoda: Sourced<Decimal>
}

/**
 * Правила `poduzetnička plaća` (підприємницька зарплата / owner's salary).
 *
 * Плаћа живе одразу в двох законах: `Zakon o doprinosima` бере з неї
 * `osnovica` для внесків, а `Zakon o porezu na dohodak` оподатковує її як
 * плаћу і водночас дозволяє віднести її до витрат при розрахунку
 * `porez na dobit`.
 */
export interface PoduzetnickaPlacaPravila {
  /**
   * `koeficijent` (коефіцієнт / contribution coefficient) найнижчої місячної
   * `osnovica`: `prosječna plaća × koeficijent`. Нижче за це закон рахувати
   * внески не дозволяє, хоч би скільки власник собі виплатив.
   */
  readonly koeficijent: Sourced<Decimal>
  /**
   * Стаття, яка робить саму плаћу `osnovica` внесків.
   *
   * Числа не несе — саме правило числом і не є. Але воно так само мусить
   * вести до тексту акта, і зберігати його разом із рушієм означало б
   * лишити в рушії знання про закон (ADR-0001).
   */
  readonly izvorOsnovice: LegalReference
  /**
   * `osnovni osobni odbitak` (основний особистий відрахунок) на місяць — на
   * нього зменшується місячна база `porez na dohodak` із плаће.
   *
   * Ця ж величина потрібна розрахунку `porez na dohodak` звичайного обрту,
   * який належить іншому тікету. Під час злиття гілок вона має лишитися в
   * одному місці — тут вона стоїть тому, що без неї `poduzetnička plaća`
   * не оподатковується взагалі.
   */
  readonly osnovniOsobniOdbitak: Sourced<Decimal>
  /**
   * Місячна `porezna osnovica`, понад яку `predujam poreza` рахується за
   * вищою ставкою. Не плутати з річними 60 000 € із `čl. 19.`: там річна
   * база, тут місячна, і це різні числа.
   */
  readonly mjesecniPragViseStope: Sourced<Decimal>
}

/** Усе, що потрібно, щоб порахувати `obrt na dobit`. */
export interface ObrtNaDobitPravila {
  readonly porezNaDobit: PorezNaDobitPravila
  readonly poduzetnickaPlaca: PoduzetnickaPlacaPravila
  /**
   * Ставка `porez na dohodak od kapitala` на виплату `dobit` власнику.
   *
   * Третій податок режиму й останній у ланцюжку: спершу внески й податок із
   * `poduzetnička plaća`, далі `porez na dobit` із залишку, і аж тоді ця
   * ставка з того, що власник забирає собі.
   */
  readonly stopaPorezaNaIsplatuDobiti: Sourced<Decimal>
}

/** Чинні правила `obrt na dobit` на 2026 рік. */
export const obrtNaDobit2026: ObrtNaDobitPravila = {
  porezNaDobit: {
    nizaStopa: sourced(new Decimal('0.10'), {
      ...ZAKON_O_POREZU_NA_DOBIT,
      article: 'čl. 28. t. 1.',
      checkedOn: CHECKED_ON,
    }),
    visaStopa: sourced(new Decimal('0.18'), {
      ...ZAKON_O_POREZU_NA_DOBIT,
      article: 'čl. 28. t. 2.',
      checkedOn: CHECKED_ON,
    }),
    // Поріг названий в обох пунктах статті одразу, тож джерело — стаття
    // цілком, а не котрийсь із них.
    pragPrihoda: sourced(new Decimal('1000000'), {
      ...ZAKON_O_POREZU_NA_DOBIT,
      article: 'čl. 28.',
      checkedOn: CHECKED_ON,
    }),
  },
  poduzetnickaPlaca: {
    // Naredba o iznosima osnovica za obračun doprinosa za 2026. (NN 150/25,
    // čl. 6. r. br. 2) друкує за цим коефіцієнтом 2 192,30 € — але саме як
    // добуток `prosječna plaća × 1,1`, тож тут зберігається множник, а не
    // готова сума (ADR-0001).
    koeficijent: sourced(new Decimal('1.1'), {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 82. st. 2.',
      checkedOn: CHECKED_ON,
    }),
    // Стаття цілком: `st. 1.` робить плаћу базою внесків, `st. 2.` не дає
    // опустити базу нижче за мінімум, `st. 3.` каже, що робити тому, хто
    // плаћу собі не виплачує. Правило працює всіма трьома разом.
    izvorOsnovice: {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 82.',
      checkedOn: CHECKED_ON,
    },
    osnovniOsobniOdbitak: sourced(new Decimal('600.00'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 14. st. 1.',
      checkedOn: CHECKED_ON,
    }),
    mjesecniPragViseStope: sourced(new Decimal('5000'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 24. st. 3.',
      checkedOn: CHECKED_ON,
    }),
  },
  // Виплата власнику — це `primitak od udjela u dobiti` за `čl. 69. st. 1.`
  // («drugi istovjetni primici koji se smatraju raspodjelom dobiti»), а
  // ставку на нього дає `čl. 70. st. 19.`. Від 1 січня 2024 вона 12%, а не
  // 10%: скасований `prirez` закон переніс у самі ставки (NN 114/23).
  stopaPorezaNaIsplatuDobiti: sourced(new Decimal('0.12'), {
    ...ZAKON_O_POREZU_NA_DOHODAK,
    article: 'čl. 70. st. 19.',
    checkedOn: CHECKED_ON,
  }),
}
