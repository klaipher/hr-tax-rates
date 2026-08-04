/**
 * Посилання на джерело права. Обов'язковий супутник кожного юридичного
 * числа в проєкті — див. ADR-0002.
 */
export interface LegalReference {
  /** Юрисдикція, чиє право цитується. */
  readonly jurisdiction: 'HR' | 'UA'
  /** Назва акта мовою оригіналу, як він зветься в офіційному виданні. */
  readonly act: string
  /** Стаття або пункт: `čl. 19`, `čl. 7. t. 39`, `п. 291.4 ст. 291`. */
  readonly article: string
  /** Офіційне оприлюднення: `NN 152/24` для HR, назва й номер для UA. */
  readonly gazette: string
  readonly url: string
  /**
   * Чи норма чинна, чи це лише законопроєкт. Розрізняти обов'язково: у
   * проєкті числа можуть змінитися до ухвалення, і показувати їх як чинні —
   * значить брехати.
   */
  readonly status: 'in-force' | 'draft'
  /** Дата, коли людина востаннє звіряла число з текстом акта, ISO. */
  readonly checkedOn: `${number}-${number}-${number}`
}

export const ZAKON_O_POREZU_NA_DOHODAK = {
  jurisdiction: 'HR',
  act: 'Zakon o porezu na dohodak',
  gazette: 'NN 115/16, 106/18, 121/19, 32/20, 138/20, 151/22, 114/23, 152/24',
  url: 'https://www.zakon.hr/z/85/zakon-o-porezu-na-dohodak',
  status: 'in-force',
} as const

export const ZAKON_O_DOPRINOSIMA = {
  jurisdiction: 'HR',
  act: 'Zakon o doprinosima',
  gazette:
    'NN 84/08, 152/08, 94/09, 18/11, 22/12, 144/12, 148/13, 41/14, 143/14, 115/16, 106/18, 33/23, 114/23, 152/24',
  url: 'https://www.zakon.hr/z/365/zakon-o-doprinosima',
  status: 'in-force',
} as const

export const ODLUKA_O_KOMORSKOM_DOPRINOSU = {
  jurisdiction: 'HR',
  act: 'Odluka o obveznom komorskom doprinosu za jedinstveni sustav organiziranosti obrta',
  gazette: 'NN 154/22',
  url: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2022_12_154_2442.html',
  status: 'in-force',
} as const
