/**
 * Правила `plaća` (зарплата / salary) — те, що спільне для кожного, кому
 * податок утримують із зарплати помісячно.
 *
 * Споживачів троє, і всі троє рахують ту саму механіку: найманий працівник,
 * власник d.o.o. у трудовому договорі з власною фірмою і власник обрту в
 * системі `porez na dobit` через `poduzetnička plaća`. Різняться вони лише
 * тим, звідки береться сама сума й яка законна підлога під нею — тому підлоги
 * стоять окремими записами, а не всередині цих правил.
 *
 * Числа зберігаються без валюти й без одиниць: правила лише переписують акт,
 * арифметику додає рушій (ADR-0001).
 */
import Decimal from 'decimal.js'
import { ZAKON_O_DOPRINOSIMA, ZAKON_O_POREZU_NA_DOHODAK } from '../legal.ts'
import type { ActReference } from '../levies/levy.ts'
import { type Sourced, sourced } from '../sourced.ts'
import type { OsobniOdbitakPravila } from './porez-na-dohodak.ts'
import { MJESECNI_PRAG_VISE_STOPE, OSNOVNI_OSOBNI_ODBITAK } from './zajednicke-velicine.ts'

const CHECKED_ON = '2026-08-05' as const

/** `čl. 20.a` ZoD — уведена NN 114/23 знижка бази для MO I. stup. */
const UMANJENJE_OSNOVICE = {
  ...ZAKON_O_DOPRINOSIMA,
  article: 'čl. 20.a',
  checkedOn: CHECKED_ON,
} as const

/**
 * `Uredba o visini minimalne plaće` — акт, що встановлює мінімальну зарплату
 * на календарний рік. Уряд ухвалює нову щоосені, тож акт цитується роком.
 */
const UREDBA_O_MINIMALNOJ_PLACI = {
  jurisdiction: 'HR',
  act: 'Uredba o visini minimalne plaće za 2026. godinu',
  gazette: 'NN 132/25',
  url: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2025_10_132_1931.html',
  status: 'in-force',
} as const satisfies ActReference

/**
 * `Naredba o iznosima osnovica za obračun doprinosa` — підзаконний акт, що
 * друкує всі бази внесків на рік.
 *
 * Числа в ній — добутки `prosječna plaća` на коефіцієнти закону, і саме
 * коефіцієнти зберігаються тут, а не готові суми: інакше шар правил ніс би в
 * собі статистику, яку закон не встановлює (ADR-0001).
 */
const NAREDBA_O_OSNOVICAMA = {
  jurisdiction: 'HR',
  act: 'Naredba o iznosima osnovica za obračun doprinosa za obvezna osiguranja za 2026. godinu',
  gazette: 'NN 150/25',
  url: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2025_12_150_2237.html',
  status: 'in-force',
} as const satisfies ActReference

/**
 * `Zakon o strancima` — акт, що встановлює умови видачі `EU plava karta`.
 *
 * Єдиний тут акт, який до податків не має стосунку взагалі: він визначає, за
 * якої зарплати дозвіл узагалі видадуть, а не скільки з неї заберуть.
 */
const ZAKON_O_STRANCIMA = {
  jurisdiction: 'HR',
  act: 'Zakon o strancima',
  gazette: 'NN 133/20, 114/22, 151/22, 152/24, 27/25',
  url: 'https://www.zakon.hr/z/142/zakon-o-strancima',
  status: 'in-force',
} as const satisfies ActReference

/**
 * Один щабель `olakšica za mlade` (пільга для молоді / young-worker relief).
 *
 * Щаблі впорядковані за віком і перевіряються згори вниз: перший, чию межу
 * вік іще не переступив, і застосовується.
 */
export interface RazredOlaksiceZaMlade {
  /** Вік, до якого включно діє цей щабель. */
  readonly doNavrsenihGodina: number
  /** Частка податку, яка повертається: 1 — увесь, 0,5 — половина. */
  readonly udio: Decimal
}

/**
 * `olakšica za mlade` — зменшення **річного** `porez na dohodak` із плаће.
 *
 * Три речі роблять її несхожою на решту пільг, і всі три видно тут.
 *
 * По-перше, вона річна, а не місячна: протягом року `predujam` утримують
 * повний, без жодного зменшення, і саме тому вона не змінює платіжки.
 *
 * По-друге, вона приходить поверненням у наступному календарному році — у
 * тому самому `poseban postupak`, у якому Porezna uprava виводить річний
 * податок. Тобто це не менший платіж, а пізніші гроші.
 *
 * По-третє, вона стосується лише тієї частини бази, яку оподатковують
 * **нижчою** ставкою. Заробіток, що дійшов до вищої ставки, повертається не
 * весь — і саме тут пільга тихо перестає бути «звільненням».
 */
export interface OlaksicaZaMladePravila {
  readonly razredi: Sourced<readonly RazredOlaksiceZaMlade[]>
  /**
   * Стаття, за якою `predujam` протягом року рахується без пільги, а сама
   * пільга виводиться річним звітом.
   *
   * Числа не несе — правило числом і не є. Але без нього картка показала б
   * гроші, які насправді надійдуть лише наступного року, як гроші цього.
   */
  readonly izvorPovrata: import('../legal.ts').LegalReference
}

/**
 * `umanjenje osnovice` (знижка бази / contribution base relief) — зменшення
 * бази **лише** для MO I. stup.
 *
 * Головна пастка цього правила в слові «лише». Знижка стосується пенсійного
 * внеску генераційної солідарності й не стосується ні II. stup, ні ZO: три
 * внески з однієї плаће раптом рахуються з двох різних баз. Хто застосує її
 * до всіх трьох, занизить внески й не помітить цього — сума лишиться
 * правдоподібною.
 *
 * Друга пастка — поріг міряється по **фактичній** плаћі, а не по базі після
 * законної підлоги. Тому працівник на пів ставки може мати підняту базу й
 * водночас знижку від неї.
 */
export interface UmanjenjeOsnovicePravila {
  /** Місячна брутто-плаћа, понад яку знижки немає взагалі. */
  readonly gornjaGranicaPlace: Sourced<Decimal>
  /** Плаћа, до якої знижка стала: нижче за цю межу вона не росте. */
  readonly granicaPunogIznosa: Sourced<Decimal>
  /** Сама стала знижка нижче за `granicaPunogIznosa`. */
  readonly puniIznos: Sourced<Decimal>
  /**
   * Множник, яким знижка спадає між двома межами:
   * `koeficijent × (gornjaGranicaPlace − plaća)`.
   */
  readonly koeficijent: Sourced<Decimal>
}

/** Правила оподаткування плаће, спільні для всіх, кому її нараховують. */
export interface PlacaPravila {
  /**
   * `osobni odbitak` — той самий запис, що в `obrt na dohodak`: закон не
   * розводить його за джерелом доходу.
   */
  readonly osobniOdbitak: OsobniOdbitakPravila
  /** Місячна база, понад яку діє вища ставка. */
  readonly mjesecniPragViseStope: Sourced<Decimal>
  /**
   * `minimalna plaća` (мінімальна зарплата / minimum wage) на місяць.
   *
   * Трудове право, а не податкове: воно не змінює жодної ставки. Але бруто
   * нижче за неї означає неповний робочий час, і сказати це — чесніше, ніж
   * порахувати мовчки.
   */
  readonly minimalnaPlaca: Sourced<Decimal>
  /**
   * `koeficijent` найнижчої місячної `osnovica` внесків для трудового
   * відношення: `prosječna plaća × koeficijent`.
   *
   * Наредба друкує за цим коефіцієнтом 757,34 €, але саме як добуток, тож
   * тут зберігається множник, а не готова сума (ADR-0001).
   */
  readonly koeficijentNajnizeOsnovice: Sourced<Decimal>
  readonly olaksicaZaMlade: OlaksicaZaMladePravila
  readonly umanjenjeOsnovicePrvogStupa: UmanjenjeOsnovicePravila
}

/**
 * Правила `član uprave` (член правління / board member) — те, чим власник
 * d.o.o. відрізняється від будь-якого іншого працівника.
 *
 * Обидва коефіцієнти існують заради одного: не дати вивести гроші повз
 * внески. Хто правлінням керує без трудового договору, платить внески з
 * приписаної бази, хоч би скільки собі виплатив; хто в трудовому договорі —
 * не може опустити базу нижче за власну підлогу. Через це «поставлю собі
 * мінімальну зарплату, решту візьму дивідендами» працює далеко не так
 * вигідно, як здається.
 */
export interface ClanUpravePravila {
  /**
   * `koeficijent` місячної `osnovica` члена правління **без** трудового
   * договору: `prosječna plaća × 1,0`. Наредба друкує 1 993,00 €.
   */
  readonly koeficijentOsnovice: Sourced<Decimal>
  /**
   * `koeficijent` найнижчої місячної `osnovica` для того, хто є членом
   * правління **і** водночас працює в тій самій фірмі на повний час.
   * Наредба друкує 1 295,45 €.
   *
   * Вища за загальну підлогу трудового відношення (0,38) і вища за
   * `minimalna plaća` — саме тому вона тут і стоїть окремо.
   */
  readonly koeficijentNajnizeOsnovicePlace: Sourced<Decimal>
}

/**
 * Поріг зарплати, за якого видають `EU plava karta`.
 *
 * Не податкове правило: воно не бере й не додає жодного цента. Але для того,
 * хто приїхав працювати за цим дозволом, воно визначає, чи має розрахунок
 * узагалі сенс — тож картка називає поріг, а не мовчить про нього.
 */
export interface PlavaKartaPravila {
  /**
   * Множник до середньої брутто-плаће **попереднього повного року**, а не до
   * тієї, з якої будуються `osnovica` внесків. Статистики дві, періоди в них
   * різні — див. `Pretpostavke`.
   */
  readonly koeficijent: Sourced<Decimal>
}

/** Чинні правила плаће на 2026 рік. */
export const placa2026: PlacaPravila = {
  osobniOdbitak: {
    osnovni: OSNOVNI_OSOBNI_ODBITAK,
    koeficijentUzdrzavanogClana: sourced(new Decimal('0.5'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 14. st. 3.',
      checkedOn: CHECKED_ON,
    }),
    koeficijentiDjece: sourced(
      [
        new Decimal('0.5'),
        new Decimal('0.7'),
        new Decimal('1.0'),
        new Decimal('1.4'),
        new Decimal('1.9'),
        new Decimal('2.5'),
        new Decimal('3.2'),
        new Decimal('4.0'),
        new Decimal('4.9'),
      ],
      { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 14. st. 3.', checkedOn: CHECKED_ON },
    ),
  },
  mjesecniPragViseStope: MJESECNI_PRAG_VISE_STOPE,
  minimalnaPlaca: sourced(new Decimal('1050'), {
    ...UREDBA_O_MINIMALNOJ_PLACI,
    article: 'čl. 1.',
    checkedOn: CHECKED_ON,
  }),
  koeficijentNajnizeOsnovice: sourced(new Decimal('0.38'), {
    ...NAREDBA_O_OSNOVICAMA,
    article: 'čl. 3. (prema čl. 200. st. 3. Zakona o doprinosima)',
    checkedOn: CHECKED_ON,
  }),
  olaksicaZaMlade: {
    razredi: sourced(
      [
        { doNavrsenihGodina: 25, udio: new Decimal('1') },
        { doNavrsenihGodina: 30, udio: new Decimal('0.5') },
      ],
      { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 46. st. 2.', checkedOn: CHECKED_ON },
    ),
    izvorPovrata: {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 46.',
      checkedOn: CHECKED_ON,
    },
  },
  // Уся стаття однією: `čl. 20.a` задає і межі, і сталу знижку, і множник, і
  // — головне — обмеження «лише MO I. stup». Розтягнути її по підпунктах
  // означало б розвести те, що працює тільки разом.
  umanjenjeOsnovicePrvogStupa: {
    gornjaGranicaPlace: sourced(new Decimal('1300'), UMANJENJE_OSNOVICE),
    granicaPunogIznosa: sourced(new Decimal('700'), UMANJENJE_OSNOVICE),
    puniIznos: sourced(new Decimal('300'), UMANJENJE_OSNOVICE),
    koeficijent: sourced(new Decimal('0.5'), UMANJENJE_OSNOVICE),
  },
}

/** Чинні правила члена правління на 2026 рік. */
export const clanUprave2026: ClanUpravePravila = {
  koeficijentOsnovice: sourced(new Decimal('1.0'), {
    ...NAREDBA_O_OSNOVICAMA,
    article: 'čl. 6. r. br. 6. (prema čl. 92. Zakona o doprinosima)',
    checkedOn: CHECKED_ON,
  }),
  koeficijentNajnizeOsnovicePlace: sourced(new Decimal('0.65'), {
    ...NAREDBA_O_OSNOVICAMA,
    article: 'čl. 19. (prema čl. 21. st. 2. Zakona o doprinosima)',
    checkedOn: CHECKED_ON,
  }),
}

/** Чинний поріг `EU plava karta` на 2026 рік. */
export const plavaKarta2026: PlavaKartaPravila = {
  koeficijent: sourced(new Decimal('1.5'), {
    ...ZAKON_O_STRANCIMA,
    article: 'čl. 128.',
    checkedOn: CHECKED_ON,
  }),
}
