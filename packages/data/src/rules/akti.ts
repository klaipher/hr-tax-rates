/**
 * Акти, які цитує `ruleset` паушального обрту і яких ще немає в `legal.ts`.
 *
 * Запис описує акт без статті: статтю додає те місце, де число справді
 * береться, бо один акт живить кілька різних чисел (ADR-0002).
 */

export const PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU = {
  jurisdiction: 'HR',
  act: 'Pravilnik o paušalnom oporezivanju samostalnih djelatnosti',
  gazette: 'NN 1/20, 1/21, 156/22, 15/23, 1/24, 16/25',
  url: 'https://www.zakon.hr/c/podzakonski-propis/60049/pravilnik-o-pausalnom-oporezivanju-samostalnih-djelatnosti-%E2%80%93-procisceni-tekst',
  status: 'in-force',
} as const

/**
 * Підзаконний акт, що друкує таблицю `neoporezivi primici`.
 *
 * Сам закон стель не називає: `čl. 21. st. 1. t. 1. podt. b)` лише каже, що
 * виплати понад приписані суми стають плаћом, а самі суми віддає міністрові.
 * Тому кожне з цих чисел цитує правилник, а не закон.
 */
export const PRAVILNIK_O_POREZU_NA_DOHODAK = {
  jurisdiction: 'HR',
  act: 'Pravilnik o porezu na dohodak',
  gazette:
    'NN 10/17, 128/17, 106/18, 1/19, 80/19, 1/20, 74/20, 1/21, 102/22, 112/22, 156/22, 1/24, 16/25',
  url: 'https://www.zakon.hr/c/podzakonski-propis/60043/pravilnik-o-porezu-na-dohodak-%E2%80%93-procisceni-tekst',
  status: 'in-force',
} as const

/**
 * Поріг паушалу — це поріг обов'язкового входу в систему `PDV`. Сам закон про
 * `porez na dohodak` числа не називає, а посилається на цей акт.
 */
export const ZAKON_O_PDV = {
  jurisdiction: 'HR',
  act: 'Zakon o porezu na dodanu vrijednost',
  gazette:
    'NN 73/13, 99/13, 148/13, 153/13, 143/14, 115/16, 106/18, 121/19, 138/20, 39/22, 113/22, 33/23, 114/23, 35/24, 152/24, 52/25, 151/25, 32/26, 48/26',
  url: 'https://www.zakon.hr/z/1455/zakon-o-porezu-na-dodanu-vrijednost',
  status: 'in-force',
} as const
