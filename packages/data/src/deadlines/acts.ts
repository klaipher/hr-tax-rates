/**
 * Акти, які встановлюють строки платежів.
 *
 * `legal.ts` уже містить три акти, потрібні для самих сум — Zakon o porezu na
 * dohodak, Zakon o doprinosima і Odluka o komorskom doprinosu. Строки
 * посилаються ще на чотири, і вони живуть тут, поруч із календарем, а не в
 * спільному файлі: жоден інший розрахунок їх не потребує.
 */

/**
 * Zakon o blagdanima, spomendanima i neradnim danima u Republici Hrvatskoj
 * (закон про свята, пам'ятні дні та неробочі дні).
 *
 * Остання зміна NN 72/25 доповнила лише перелік `spomendani` (пам'ятних днів)
 * зі статті 2 — перелік свят зі статті 1 вона не чіпала.
 */
export const ZAKON_O_BLAGDANIMA = {
  jurisdiction: 'HR',
  act: 'Zakon o blagdanima, spomendanima i neradnim danima u Republici Hrvatskoj',
  gazette: 'NN 110/19, 72/25',
  url: 'https://www.zakon.hr/z/372/Zakon-o-blagdanima,-spomendanima-i-neradanim-danima-u-Republici-Hrvatskoj',
  status: 'in-force',
} as const

/** Zakon o općem upravnom postupku (закон про загальний адміністративний процес). */
export const ZAKON_O_OPCEM_UPRAVNOM_POSTUPKU = {
  jurisdiction: 'HR',
  act: 'Zakon o općem upravnom postupku',
  gazette: 'NN 47/09, 110/21',
  url: 'https://www.zakon.hr/z/65/Zakon-o-op%C4%87em-upravnom-postupku',
  status: 'in-force',
} as const

/** Opći porezni zakon (загальний податковий закон). */
export const OPCI_POREZNI_ZAKON = {
  jurisdiction: 'HR',
  act: 'Opći porezni zakon',
  gazette: 'NN 115/16, 106/18, 121/19, 32/20, 42/20, 114/22, 152/24, 151/25',
  url: 'https://www.zakon.hr/z/100/Op%C4%87i-porezni-zakon',
  status: 'in-force',
} as const

/**
 * Pravilnik o paušalnom oporezivanju samostalnih djelatnosti (підзаконний акт
 * про паушальне оподаткування самостійної діяльності).
 *
 * Саме він, а не закон, встановлює строки сплати `paušalni porez`: Zakon o
 * porezu na dohodak у čl. 82. st. 11. прямо делегує міністрові фінансів
 * «rokove plaćanja poreza».
 */
export const PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU = {
  jurisdiction: 'HR',
  act: 'Pravilnik o paušalnom oporezivanju samostalnih djelatnosti',
  gazette: 'NN 1/20, 1/21, 156/22, 15/23, 1/24, 16/25',
  url: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2020_01_1_1.html',
  status: 'in-force',
} as const

/** Zakon o porezu na dobit (закон про податок на прибуток). */
export const ZAKON_O_POREZU_NA_DOBIT = {
  jurisdiction: 'HR',
  act: 'Zakon o porezu na dobit',
  gazette:
    'NN 177/04, 90/05, 57/06, 146/08, 80/10, 22/12, 148/13, 143/14, 50/16, 115/16, 106/18, 121/19, 32/20, 138/20, 114/22, 114/23, 151/25',
  url: 'https://www.zakon.hr/z/99/Zakon-o-porezu-na-dobit',
  status: 'in-force',
} as const
