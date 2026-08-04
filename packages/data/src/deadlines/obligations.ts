import {
  ODLUKA_O_KOMORSKOM_DOPRINOSU,
  ZAKON_O_DOPRINOSIMA,
  ZAKON_O_POREZU_NA_DOHODAK,
} from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'
import { PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU, ZAKON_O_POREZU_NA_DOBIT } from './acts.ts'

/**
 * Обов'язкові платежі, що мають власну періодичність у календарі.
 *
 * Назви — хорватські юридичні терміни з `CONTEXT.md`. Уточнення в дужках не
 * косметичне: Zakon o doprinosima розводить режими по окремих главах і дає їм
 * різні строки, тож `doprinosi` без назви режиму — це не один платіж, а три.
 */
export const OBLIGATION_KINDS = [
  'paušalni porez',
  'razlika paušalnog poreza',
  'doprinosi (paušalni obrt)',
  'doprinosi (obrt na dohodak)',
  'doprinosi (obrt na dobit)',
  'predujam poreza na dohodak',
  'razlika poreza na dohodak',
  'predujam poreza na dobit',
  'razlika poreza na dobit',
  'komorski doprinos',
] as const

export type ObligationKind = (typeof OBLIGATION_KINDS)[number]

/** Періодичність — тим словом, яким її називає закон. */
export type Cadence = 'mjesečno' | 'tromjesečno' | 'godišnje'

/**
 * Як закон призначає день сплати.
 *
 * Форм дві, бо самі акти написані двома різними способами, і зводити їх до
 * однієї означало б вигадати правило, якого в законі немає.
 */
export type DueDateRule =
  /**
   * Строк відлічується від кінця розрахункового періоду: «do 15. dana u
   * mjesecu za prethodni mjesec», «do posljednjeg dana svakog tromjesečja».
   */
  | {
      readonly kind: 'nakon razdoblja'
      /** 0 — усередині самого періоду, 1 — наступного місяця після нього. */
      readonly monthsAfterPeriodEnd: number
      /** Число місяця або «останній день», коли акт не називає числа. */
      readonly dayOfMonth: number | 'last'
    }
  /**
   * Акт дає готовий перелік дат — по одній на період, у самому податковому
   * році. Так написана odluka про `komorski doprinos`: вона заряджає квартал
   * наперед, тому строк не виводиться з кінця періоду.
   */
  | {
      readonly kind: 'popis datuma'
      readonly dates: readonly { readonly month: number; readonly day: number }[]
    }

export interface Deadline {
  /** Скільки періодів у році — стільки й платежів. */
  readonly cadence: Cadence
  readonly dueDate: DueDateRule
}

const CHECKED_ON = '2026-08-04' as const

// Спільні форми строку. Назви описують форму, а не платіж: різні акти
// збіглися у формулюванні, але не пов'язані між собою. Якщо строк одного
// платежу зміниться, тут з'явиться нова форма — правити спільну не можна,
// інакше зміна тихо перекинеться на решту.
const LAST_DAY_OF_PERIOD: DueDateRule = {
  kind: 'nakon razdoblja',
  monthsAfterPeriodEnd: 0,
  dayOfMonth: 'last',
}

const FIFTEENTH_OF_NEXT_MONTH: DueDateRule = {
  kind: 'nakon razdoblja',
  monthsAfterPeriodEnd: 1,
  dayOfMonth: 15,
}

const LAST_DAY_OF_NEXT_MONTH: DueDateRule = {
  kind: 'nakon razdoblja',
  monthsAfterPeriodEnd: 1,
  dayOfMonth: 'last',
}

/**
 * Строки сплати обов'язкових платежів.
 *
 * Строк — такий самий юридичний факт, як ставка, тож кожен запис несе своє
 * джерело (ADR-0002). Одна дата тут коштує дорожче за решту: річна різниця
 * настає вже в наступному календарному році, і той, хто планував лише
 * поточний, її не бачить.
 *
 * Аванси розписані для фактичного розряду — стійкий стан. Розбіжність між
 * очікуваним і фактичним розрядом протягом року тут не моделюється: у законі
 * її розв'язує саме річна різниця.
 */
export const DEADLINES: Readonly<Record<ObligationKind, Sourced<Deadline>>> = {
  /**
   * `paušalni porez` (паушальний податок) — «plaća se tromjesečno, do
   * posljednjeg dana svakog tromjesečja»: 31.03, 30.06, 30.09, 31.12.
   *
   * Джерело — pravilnik, а не закон: Zakon o porezu na dohodak у čl. 82.
   * st. 11. прямо делегує міністрові фінансів «rokove plaćanja poreza».
   */
  'paušalni porez': sourced(
    { cadence: 'tromjesečno', dueDate: LAST_DAY_OF_PERIOD },
    { ...PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU, article: 'čl. 6. st. 1.', checkedOn: CHECKED_ON },
  ),

  /**
   * Річна різниця `paušalni porez` за звітом PO-SD (Izvješće o paušalnom
   * dohotku od samostalnih djelatnosti).
   *
   * Закон прив'язує сплату не до дати, а до події: «razliku godišnjeg
   * paušalnog poreza uplatiti s danom podnošenja izvješća». Крайній строк
   * подання — 15 днів після кінця року, тобто 15 січня. Календар показує
   * саме цю крайню дату: раніше подаси — раніше й заплатиш.
   *
   * Форма записана окремо, а не спільною з `doprinosi`: там 15 число названо
   * законом прямо, а тут воно виходить із «15 dana od dana isteka godine».
   * Дати збігаються лише тому, що податковий рік — календарний.
   */
  'razlika paušalnog poreza': sourced(
    {
      cadence: 'godišnje',
      dueDate: { kind: 'nakon razdoblja', monthsAfterPeriodEnd: 1, dayOfMonth: 15 },
    },
    { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 82. st. 6.', checkedOn: CHECKED_ON },
  ),

  /** `doprinosi` (внески) паушального обрту — «do 15. dana u mjesecu za prethodni mjesec». */
  'doprinosi (paušalni obrt)': sourced(
    { cadence: 'mjesečno', dueDate: FIFTEENTH_OF_NEXT_MONTH },
    { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 71.', checkedOn: CHECKED_ON },
  ),

  /** `doprinosi` (внески) обрту на дохідок — той самий строк, інша глава закону. */
  'doprinosi (obrt na dohodak)': sourced(
    { cadence: 'mjesečno', dueDate: FIFTEENTH_OF_NEXT_MONTH },
    { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 67.', checkedOn: CHECKED_ON },
  ),

  /**
   * `doprinosi` (внески) обрту в системі porez na dobit — «najkasnije do
   * posljednjeg dana u mjesecu za prethodni mjesec», а не до 15 числа.
   */
  'doprinosi (obrt na dobit)': sourced(
    { cadence: 'mjesečno', dueDate: LAST_DAY_OF_NEXT_MONTH },
    { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 83. st. 2.', checkedOn: CHECKED_ON },
  ),

  /**
   * `predujam poreza` (аванс податку) на дохідок — «plaćaju se mjesečno do
   * posljednjeg dana u mjesecu za prethodni mjesec».
   */
  'predujam poreza na dohodak': sourced(
    { cadence: 'mjesečno', dueDate: LAST_DAY_OF_NEXT_MONTH },
    { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 37. st. 5.', checkedOn: CHECKED_ON },
  ),

  /**
   * Річна різниця porez na dohodak за декларацією DOH.
   *
   * Загальне правило — 15 днів від вручення рішення, але самостійна діяльність
   * із нього прямо вилучена: «Porezni obveznici koji obavljaju samostalnu
   * djelatnost plaćaju porez na dohodak po godišnjoj poreznoj prijavi sa
   * zadnjim danom roka za podnošenje godišnje porezne prijave». Строк подання
   * за čl. 50. st. 2. — «do kraja veljače tekuće godine za prethodnu godinu»,
   * тобто останній день лютого наступного року.
   *
   * Формулювання змінилося в NN 114/23: до того різниця наставала «s danom
   * podnošenja», тепер — крайнім днем строку, тож подання раніше вже не
   * прискорює платіж.
   */
  'razlika poreza na dohodak': sourced(
    {
      cadence: 'godišnje',
      dueDate: { kind: 'nakon razdoblja', monthsAfterPeriodEnd: 2, dayOfMonth: 'last' },
    },
    { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 46. st. 12.', checkedOn: CHECKED_ON },
  ),

  /** `predujam poreza` (аванс податку) на прибуток — «mjesečno do kraja mjeseca za protekli mjesec». */
  'predujam poreza na dobit': sourced(
    { cadence: 'mjesečno', dueDate: LAST_DAY_OF_NEXT_MONTH },
    { ...ZAKON_O_POREZU_NA_DOBIT, article: 'čl. 34. st. 1.', checkedOn: CHECKED_ON },
  ),

  /**
   * Річна різниця porez na dobit: прийом декларації — «najkasnije četiri
   * mjeseca nakon isteka razdoblja», а різниця «dospijeva na zadnji dan roka
   * iz stavka 1.». Для календарного року це 30 квітня наступного.
   */
  'razlika poreza na dobit': sourced(
    {
      cadence: 'godišnje',
      dueDate: { kind: 'nakon razdoblja', monthsAfterPeriodEnd: 4, dayOfMonth: 'last' },
    },
    { ...ZAKON_O_POREZU_NA_DOBIT, article: 'čl. 35. st. 1.–2.', checkedOn: CHECKED_ON },
  ),

  /**
   * `komorski doprinos` (внесок до обртницької палати) — odluka дає таблицю
   * готових дат і заряджає квартал наперед: 28.02 за січень–березень, 31.05
   * за квітень–червень, 31.08 за липень–вересень, 30.11 за жовтень–грудень.
   *
   * Дати записані числами, а не «останнім днем місяця»: у високосний рік
   * odluka все одно каже «28. veljače».
   */
  'komorski doprinos': sourced(
    {
      cadence: 'tromjesečno',
      dueDate: {
        kind: 'popis datuma',
        dates: [
          { month: 2, day: 28 },
          { month: 5, day: 31 },
          { month: 8, day: 31 },
          { month: 11, day: 30 },
        ],
      },
    },
    { ...ODLUKA_O_KOMORSKOM_DOPRINOSU, article: 'čl. 8.', checkedOn: CHECKED_ON },
  ),
}
