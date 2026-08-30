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
import { PRAVILNIK_O_POREZU_NA_DOHODAK } from './akti.ts'
import type { OsobniOdbitakPravila } from './porez-na-dohodak.ts'
import { MJESECNI_PRAG_VISE_STOPE, OSNOVNI_OSOBNI_ODBITAK } from './zajednicke-velicine.ts'

const CHECKED_ON = '2026-08-05' as const

/**
 * Дата, коли статтю перевірено безпосередньо на тексті акта, а не на
 * попередній звірці.
 *
 * Окремою константою, а не оновленням `CHECKED_ON`: два підзаконні акти —
 * `Uredba o minimalnoj plaći` і `Naredba o osnovicama` — цією ревізією не
 * перечитувалися, і підписати їх свіжою датою означало б засвідчити перевірку,
 * якої не було.
 */
const CHECKED_ON_REVIZIJE = '2026-08-14' as const

/** `čl. 21.a` ZoD — уведена NN 114/23 знижка бази для MO I. stup. */
const UMANJENJE_OSNOVICE = {
  ...ZAKON_O_DOPRINOSIMA,
  article: 'čl. 21.a',
  checkedOn: CHECKED_ON_REVIZIJE,
} as const

/**
 * `čl. 20. st. 2.` і `st. 3.` ZoD — звільнення від ZO за того, хто вперше
 * працевлаштовується.
 *
 * Не плутати з віковим звільненням «za mlade osobe do 30 godina»: те
 * скасовано з 1 січня 2025 року (NN 152/24) і лишилося чинним тільки для
 * роботодавців, які почали ним користуватися до 31 грудня 2024. Це — інша
 * норма, чинна, і вік у ній не згадано взагалі.
 */
const PRVO_ZAPOSLENJE = {
  ...ZAKON_O_DOPRINOSIMA,
  article: 'čl. 20. st. 2.',
  checkedOn: CHECKED_ON_REVIZIJE,
} as const

/** `čl. 20. st. 3.` ZoD — скільки саме триває це звільнення. */
const TRAJANJE_PRVOG_ZAPOSLENJA = {
  ...ZAKON_O_DOPRINOSIMA,
  article: 'čl. 20. st. 3.',
  checkedOn: CHECKED_ON_REVIZIJE,
} as const

/** `čl. 7. t. 54.` ZoD — хто саме вважається таким, що вперше працевлаштовується. */
const DEFINICIJA_PRVOG_ZAPOSLENJA = {
  ...ZAKON_O_DOPRINOSIMA,
  article: 'čl. 7. t. 54.',
  checkedOn: CHECKED_ON_REVIZIJE,
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
 * `olakšica za mlade` — зменшення **річного** `porez na dohodak` із plaća.
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
 * внески з однієї plaća раптом рахуються з двох різних баз. Хто застосує її
 * до всіх трьох, занизить внески й не помітить цього — сума лишиться
 * правдоподібною.
 *
 * Друга пастка — поріг міряється по **фактичній** plaća, а не по базі після
 * законної підлоги. Тому працівник на пів ставки може мати підняту базу й
 * водночас знижку від неї.
 */
export interface UmanjenjeOsnovicePravila {
  /** Місячна bruto plaća, понад яку знижки немає взагалі. */
  readonly gornjaGranicaPlace: Sourced<Decimal>
  /** Plaća, до якої знижка стала: нижче за цю межу вона не росте. */
  readonly granicaPunogIznosa: Sourced<Decimal>
  /** Сама стала знижка нижче за `granicaPunogIznosa`. */
  readonly puniIznos: Sourced<Decimal>
  /**
   * Множник, яким знижка спадає між двома межами:
   * `koeficijent × (gornjaGranicaPlace − plaća)`.
   */
  readonly koeficijent: Sourced<Decimal>
}

/**
 * `prvo zaposlenje` (перше працевлаштування / first employment) — єдина чинна
 * пільга роботодавця, що стосується цієї plaća.
 *
 * Її постійно плутають із віковою: «до 30 років роботодавець не платить
 * внесків». Та вікова норма скасована з 1 січня 2025 року (NN 152/24) і
 * доживає лише в тих, хто почав нею користуватися до 31 грудня 2024. Ця —
 * чинна, і віку в ній немає взагалі: значення має те, що людина ніколи не
 * мала договору на неозначений час.
 *
 * Механіка проста й дуже помітна в підсумку: за таку особу нараховують лише
 * внески **з** бази — обидва стовпи MO. ZO, який роботодавець платить понад
 * plaća, не нараховують зовсім, тож plaća коштує фірмі рівно на 16,5 %
 * дешевше. На «на руки» це не впливає ніяк: цих грошей людина не бачила й так.
 */
export interface PrvoZaposlenjePravila {
  /** Стаття, за якою ZO не нараховують узагалі. */
  readonly izvorOslobodenja: import('../legal.ts').LegalReference
  /**
   * Скільки місяців триває звільнення. Закон каже «do jedne godine», тож
   * дванадцять — це стеля, а не тривалість кожного випадку.
   */
  readonly trajanjeMjeseci: Sourced<number>
  /** Означення того, хто вважається таким, що вперше працевлаштовується. */
  readonly izvorDefinicije: import('../legal.ts').LegalReference
}

/**
 * Зменшення **річного** податку з `čl. 46.` — ті, що стосуються plaća.
 *
 * `olakšica za mlade` теж живе в цій статті, але окремим записом: вона
 * рахується не від усього податку, а лише від частини за нижчою ставкою, і
 * механіка в неї інша.
 *
 * Порядок і виключення тут не декоративні. `st. 7.` вимагає застосувати
 * молодіжне зменшення **перед** територіальним, інакше друге з'їло б базу
 * першого. `st. 9.` каже, що зменшення для поверненця виключає обидва інші —
 * тобто це не додача, а заміна.
 */
export interface UmanjenjaGodisnjegPorezaPravila {
  /**
   * `st. 1.` — частка річного податку з plaća, яку знімають мешканцю одиниці
   * з I. skupine розвиненості або Вуковара.
   *
   * На відміну від молодіжного, рахується від **усього** податку з plaća, а
   * не лише від частини за нижчою ставкою.
   */
  readonly zaPodrucje: Sourced<Decimal>
  /**
   * `st. 3.` — частка річного податку з plaća для громадянина Хорватії, який
   * щонайменше два роки безперервно жив за кордоном і повернувся.
   */
  readonly zaPovratnika: Sourced<Decimal>
  /** `st. 3.` — скільки років поспіль діє це зменшення. */
  readonly trajanjePovratnikaGodina: Sourced<number>
  /** `st. 7.` — молодіжне зменшення застосовується перед територіальним. */
  readonly izvorRedoslijeda: import('../legal.ts').LegalReference
  /** `st. 9.` — зменшення для поверненця виключає обидва інші. */
  readonly izvorIskljucenja: import('../legal.ts').LegalReference
}

/**
 * Стеля одного виду `neoporezivi primitak`.
 *
 * Три види, бо `Pravilnik` друкує їх трьома різними способами, і звести їх до
 * одного числа означало б порахувати замість акта (ADR-0001). Рядки 1–18
 * друкуються коефіцієнтом до основного `osobni odbitak`, рядки 19–39 — сумою
 * в євро, а частина взагалі не має стелі, крім самих витрат.
 */
export type GranicaNeoporezivog =
  | { readonly vrsta: 'koeficijent'; readonly koeficijent: Decimal }
  | { readonly vrsta: 'godisnji-iznos'; readonly iznos: Decimal }
  | { readonly vrsta: 'mjesecni-iznos'; readonly iznos: Decimal }
  | { readonly vrsta: 'stvarni-izdaci' }

/** Один рядок таблиці `neoporezivi primici`, як його друкує `čl. 7. st. 2.` */
export interface NeoporeziviPrimitak {
  /** «R.br.» — номер рядка в таблиці акта. Ключ, за яким рядок звіряють. */
  readonly redniBroj: number
  readonly granica: GranicaNeoporezivog
  /**
   * Рядки, які цей виключає. `Pravilnik` дозволяє або паушальну наднадбавку
   * на харчування, або документовані витрати на нього — не обидва.
   */
  readonly iskljucuje: readonly number[]
}

/**
 * `neoporezivi primici` (неоподатковані виплати / non-taxable receipts) —
 * гроші, які роботодавець може дати понад plaća без податку й без внесків.
 *
 * У розрахунок вони входять сумою, яку ввела людина, а не цим переліком:
 * закон називає стелю, а не зобов'язання, і підставити стелю за замовчуванням
 * означало б показати чужу щедрість як норму. Перелік існує рівно для того,
 * щоб людина знала, скільки просити.
 *
 * Тут лише ті рядки таблиці, які звичайний працівник отримує щороку. Дневниці,
 * отпремнини й морська надбавка залежать від подій, а не від року, і вигадати
 * їхню річну суму неможливо.
 */
export interface NeoporeziviPrimiciPravila {
  readonly stavke: Sourced<readonly NeoporeziviPrimitak[]>
}

/** Правила оподаткування plaća, спільні для всіх, кому її нараховують. */
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
  readonly prvoZaposlenje: PrvoZaposlenjePravila
  readonly umanjenjaGodisnjegPoreza: UmanjenjaGodisnjegPorezaPravila
  readonly neoporeziviPrimici: NeoporeziviPrimiciPravila
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
   * Множник до середньої bruto plaća **попереднього повного року**, а не до
   * тієї, з якої будуються `osnovica` внесків. Статистики дві, періоди в них
   * різні — див. `Pretpostavke`.
   */
  readonly koeficijent: Sourced<Decimal>
}

/** Чинні правила plaća на 2026 рік. */
export const placa2026: PlacaPravila = {
  osobniOdbitak: {
    osnovni: OSNOVNI_OSOBNI_ODBITAK,
    koeficijentUzdrzavanogClana: sourced(new Decimal('0.5'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 14. st. 3.',
      checkedOn: CHECKED_ON_REVIZIJE,
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
      { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 14. st. 3.', checkedOn: CHECKED_ON_REVIZIJE },
    ),
    koeficijentInvalidnosti: sourced(new Decimal('0.3'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 14. st. 3. r. br. 12.',
      checkedOn: CHECKED_ON_REVIZIJE,
    }),
    koeficijentPotpuneInvalidnosti: sourced(new Decimal('1.0'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 14. st. 3. r. br. 13.',
      checkedOn: CHECKED_ON_REVIZIJE,
    }),
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
      { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 46. st. 2.', checkedOn: CHECKED_ON_REVIZIJE },
    ),
    izvorPovrata: {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      // `st. 10.` — саме той пункт, який відповідає на «коли гроші»: з
      // визначеного річного податку віднімають сплачені `predujam`, і різниця
      // або доплачується, або повертається. Пункт `st. 3.`, який стояв тут
      // раніше, — про зовсім інше зменшення, для поверненця з-за кордону.
      article: 'čl. 46. st. 10.',
      checkedOn: CHECKED_ON_REVIZIJE,
    },
  },
  prvoZaposlenje: {
    izvorOslobodenja: PRVO_ZAPOSLENJE,
    trajanjeMjeseci: sourced(12, TRAJANJE_PRVOG_ZAPOSLENJA),
    izvorDefinicije: DEFINICIJA_PRVOG_ZAPOSLENJA,
  },
  umanjenjaGodisnjegPoreza: {
    zaPodrucje: sourced(new Decimal('0.5'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 46. st. 1.',
      checkedOn: CHECKED_ON_REVIZIJE,
    }),
    zaPovratnika: sourced(new Decimal('1'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 46. st. 3.',
      checkedOn: CHECKED_ON_REVIZIJE,
    }),
    trajanjePovratnikaGodina: sourced(5, {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 46. st. 3.',
      checkedOn: CHECKED_ON_REVIZIJE,
    }),
    izvorRedoslijeda: {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 46. st. 7.',
      checkedOn: CHECKED_ON_REVIZIJE,
    },
    izvorIskljucenja: {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 46. st. 9.',
      checkedOn: CHECKED_ON_REVIZIJE,
    },
  },
  neoporeziviPrimici: {
    stavke: sourced(
      [
        // Рядки 1–18 акт друкує коефіцієнтом, і саме коефіцієнт тут лежить:
        // 2,0 × 600 € дає ті 1 200 €, що ходять пресою, але множення робить
        // рушій, а не цей файл (ADR-0001).
        {
          redniBroj: 18,
          granica: { vrsta: 'koeficijent', koeficijent: new Decimal('2') },
          iskljucuje: [],
        },
        {
          redniBroj: 25,
          granica: { vrsta: 'godisnji-iznos', iznos: new Decimal('700') },
          iskljucuje: [],
        },
        { redniBroj: 29, granica: { vrsta: 'stvarni-izdaci' }, iskljucuje: [] },
        {
          redniBroj: 32,
          granica: { vrsta: 'godisnji-iznos', iznos: new Decimal('140') },
          iskljucuje: [],
        },
        {
          redniBroj: 33,
          granica: { vrsta: 'godisnji-iznos', iznos: new Decimal('400') },
          iskljucuje: [],
        },
        // Або паушальна наднадбавка на харчування, або документовані витрати
        // на нього — `st. 43.` дозволяє одне з двох, і саме тому вища стеля
        // не додається до нижчої.
        {
          redniBroj: 34,
          granica: { vrsta: 'godisnji-iznos', iznos: new Decimal('1200') },
          iskljucuje: [35],
        },
        {
          redniBroj: 35,
          granica: { vrsta: 'godisnji-iznos', iznos: new Decimal('1800') },
          iskljucuje: [34],
        },
        {
          redniBroj: 38,
          granica: { vrsta: 'godisnji-iznos', iznos: new Decimal('500') },
          iskljucuje: [],
        },
        {
          redniBroj: 39,
          granica: { vrsta: 'mjesecni-iznos', iznos: new Decimal('70') },
          iskljucuje: [],
        },
      ],
      {
        ...PRAVILNIK_O_POREZU_NA_DOHODAK,
        article: 'čl. 7. st. 2.',
        checkedOn: CHECKED_ON_REVIZIJE,
      },
    ),
  },
  // Уся стаття однією: `čl. 21.a` задає і межі, і сталу знижку, і множник, і
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
