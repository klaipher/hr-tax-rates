import type { LegalReference, ObligationKind, Pretpostavke, Ruleset } from '@hr-tax/data'
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
  /** `ruleset` (набір правил / ruleset) — усе, що написано в законі. */
  readonly ruleset: Ruleset
  /**
   * `pretpostavke` (припущення / assumptions) — величини, на які закон
   * посилається, але яких не встановлює.
   */
  readonly pretpostavke: Pretpostavke
}

/** `režim` (режим / regime), який калькулятор уміє показати. */
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
  /** Стаття з таблицею розрядів. */
  readonly izvor: LegalReference
}

/** Річний податок режиму. */
export interface Porez {
  /** Як податок зветься в законі: у паушальному обрті — `paušalni porez`. */
  readonly naziv: Naziv
  /**
   * `porezna osnovica` (база оподаткування / tax base) — з чого нарахований
   * податок.
   *
   * Не плутати з `osnovica`: у цьому глосарії `osnovica` значить базу
   * нарахування внесків і будується з `prosječna plaća`, тоді як база
   * оподаткування береться з іншого закону і з іншої величини. Одне ім'я на
   * обидві схлопнуло б два різні числа.
   *
   * У паушальному обрті базою є `paušalni dohodak` (паушальний дохід /
   * deemed income) — юридична фікція, а не різниця `primitak` і `izdatak`.
   */
  readonly poreznaOsnovica: Money<'EUR'>
  /** Ставка податку — частка від 0 до 1, а не відсотки. */
  readonly stopa: Decimal
  /** Сума податку за рік. */
  readonly godisnjiIznos: Money<'EUR'>
  /** Стаття, з якої взята ставка. */
  readonly izvor: LegalReference
}

/** Одна складова `doprinosi` (внески / social contributions). */
export interface Doprinos {
  /** Як внесок зветься: `MO — I. stup`, `MO — II. stup`, `ZO`. */
  readonly naziv: Naziv
  /** Ставка до `osnovica` — частка від 0 до 1, а не відсотки. */
  readonly stopa: Decimal
  /** Сума внеску за рік. */
  readonly godisnjiIznos: Money<'EUR'>
  /**
   * Чи гроші лишаються персональними. II. stup іде на індивідуальний рахунок
   * платника — це відкладені кошти, а не втрачені, і на картці їх не можна
   * показувати нарівні з податком.
   */
  readonly osobnaStednja: boolean
  /** Стаття, з якої взята ставка. */
  readonly izvor: LegalReference
}

export interface Doprinosi {
  /**
   * `osnovica` (база нарахування внесків / contribution base) за місяць:
   * `prosječna plaća × koeficijent`. Не залежить ні від розряду, ні від
   * фактичного `primitak`.
   *
   * `undefined` у діяльності поряд із наймом: там закон місячної `osnovica`
   * не знає взагалі — база береться з річного результату діяльності
   * (`čl. 185.` ZoD). Показати «місячну базу» там означало б вигадати її.
   */
  readonly mjesecnaOsnovica: Money<'EUR'> | undefined
  /** MO — I. stup (пенсійне, генераційна солідарність / pay-as-you-go pillar). */
  readonly moPrviStup: Doprinos
  /**
   * MO — II. stup (пенсійне, індивідуальна капіталізована ощадність /
   * funded pillar).
   */
  readonly moDrugiStup: Doprinos
  /** ZO (медичне страхування / health insurance). */
  readonly zo: Doprinos
  /** Усі складові разом за рік. */
  readonly ukupnoGodisnje: Money<'EUR'>
}

/**
 * Обов'язковий платіж поза податками і `doprinosi`.
 *
 * `komorski doprinos` платить кожен `obrt` незалежно від режиму, а
 * `turistička članarina` і `spomenička renta` — лише за певних `NKD` і місць.
 * Незастосовний платіж лишається в списку зі своєю причиною: людина має
 * відрізняти «не забули» від «нічого не винен».
 */
export type ObveznoDavanje =
  | {
      readonly status: 'obračunato'
      readonly naziv: Naziv
      readonly godisnjiIznos: Money<'EUR'>
      /** Звідки взялася сума: база й ставка, словами. */
      readonly obracun: string
      readonly napomene: readonly string[]
      readonly izvor: LegalReference
    }
  | {
      readonly status: 'ne-primjenjuje-se'
      readonly naziv: Naziv
      readonly razlog: string
      readonly izvor: LegalReference
    }

/**
 * Які обов'язки має режим — по одному на кожну складову платежу.
 *
 * `razlika` наведена окремо, бо настає вже в наступному календарному році:
 * саме вона стає несподіванкою для тих, хто планував лише поточний.
 */
export interface VrsteObveza {
  /** Обов'язок, за яким сплачується податок протягом року. */
  readonly porez: ObligationKind
  /** Річна доплата за звітом — наступного року. */
  readonly razlika: ObligationKind
  readonly doprinosi: ObligationKind
  readonly komorskiDoprinos: ObligationKind
}

/**
 * Розрахунок режиму. Структура однакова для всіх режимів — саме на ній
 * тримається зіставність, тож поле, якого режим не має, лишається присутнім
 * зі значенням `undefined`, а не зникає.
 */
export interface Izracun {
  /** `undefined` у режимів, які не знають розрядів. */
  readonly razred: PrimijenjeniRazred | undefined
  /**
   * Податки режиму за рік, у порядку, в якому вони виникають.
   *
   * Множина, а не один: `obrt na dobit` платить `porez na dobit`, податок із
   * `poduzetnička plaća` і податок на виплату власнику — три різні податки за
   * двома законами. Схлопнути їх в один означало б втратити і суми, і статті.
   * Режими з одним податком мають список із одного елемента.
   */
  readonly porezi: readonly Porez[]
  /** Сума всіх податків режиму — щоб картка не складала їх сама. */
  readonly ukupanPorez: Money<'EUR'>
  /** `doprinosi` (внески / social contributions), розбиті на складові. */
  readonly doprinosi: Doprinosi
  /**
   * Обов'язкові платежі поза податками і внесками — разом із тими, що не
   * застосувалися, з названою причиною.
   */
  readonly obveznaDavanja: readonly ObveznoDavanje[]
  /** Сума нарахованих `obveznaDavanja` за рік. */
  readonly ukupnaDavanja: Money<'EUR'>
  /**
   * Види обов'язків цього режиму — з чого будується календар платежів.
   *
   * Знає режим, а не інтерфейс: те, коли й чим саме платить `obrt na dobit`,
   * встановлює закон, і вгадувати це з ідентифікатора картки означало б
   * тримати право в шарі показу.
   */
  readonly vrsteObveza: VrsteObveza
  /**
   * Витрати, враховані в `netoZaOsobu`. Нуль, коли форма їх не знає.
   *
   * Поле існує, щоб означення «на руки» було видимим, а не вгадуваним:
   * режими міряють витрати по-різному, і без цього числа сусідні картки
   * можна було б порівнювати помилково.
   */
  readonly ukupniIzdaci: Money<'EUR'>
  /**
   * Скільки лишається людині за рік: `primitak` без податку, без `doprinosi`
   * і без обов'язкових платежів. Головне число картки.
   *
   * Калькулятори HOK сюди `komorski doprinos` не включають — це зареєстрована
   * розбіжність, а не наша похибка: внесок платить кожен `obrt`, і без нього
   * сума систематично завищена.
   */
  readonly netoZaOsobu: Money<'EUR'>
  /**
   * Частка `primitak`, яку забирають усі обов'язкові платежі разом.
   * `undefined` за нульового `primitak`: ділити немає на що.
   */
  readonly efektivnaStopa: Decimal | undefined
}

/**
 * Чому режим недоступний — структурою, а не готовим реченням.
 *
 * Проза не перекладається: рушій не знає мови читача, а склеєний ним рядок
 * інтерфейс може хіба що показати як є. Код плюс параметри дає кожній локалі
 * скласти власне речення з тих самих чисел, і числа лишаються числами —
 * зокрема `Sourced`, тож від них є дорога до статті (ADR-0002).
 */
export type RazlogNedostupnosti =
  | {
      readonly kod: 'iznad-praga-pausala'
      readonly primitak: Money<'EUR'>
      readonly prag: Money<'EUR'>
      readonly izvor: LegalReference
    }
  | {
      /** Межі розрядів не доходять до порогу — набір правил суперечливий. */
      readonly kod: 'nedosljedna-tablica-razreda'
      readonly primitak: Money<'EUR'>
      readonly prag: Money<'EUR'>
    }
  | {
      /** Неповний рік звів `primitak` до річного вище за найвищий розряд. */
      readonly kod: 'svedeni-primitak-izvan-tablice'
      readonly primitak: Money<'EUR'>
      readonly svedeniPrimitak: Money<'EUR'>
      readonly brojMjeseci: number
      readonly izvor: LegalReference
    }
  | {
      /** Закон друкує коефіцієнти лише до певної дитини. */
      readonly kod: 'koeficijent-djeteta-nije-propisan'
      readonly dostupnoDjece: number
      readonly trazenoDjece: number
      readonly izvor: LegalReference
    }
  | { readonly kod: 'nema-izdataka' }
  | { readonly kod: 'nema-jedinice' }
  | { readonly kod: 'nema-izdataka-ni-jedinice' }
  | { readonly kod: 'nema-pravila'; readonly pravila: string }
  | { readonly kod: 'nije-modeliran'; readonly rezim: RezimId }

/**
 * Підсумок режиму: або розрахунок, або причина недоступності. Третього немає,
 * і порожнього розрахунку з нулями теж — нуль на картці не відрізнити від
 * порахованого нуля.
 */
export type Ishod =
  | { readonly status: 'izracunato'; readonly izracun: Izracun }
  | { readonly status: 'nedostupno'; readonly razlog: RazlogNedostupnosti }

/** Один `režim` (режим / regime) у порівнянні. */
export interface Rezim {
  readonly id: RezimId
  /** Канонічна хорватська назва режиму з українським перекладом поруч. */
  readonly naziv: Naziv
  readonly ishod: Ishod
}

export interface Usporedba {
  /** Рік правил, за якими зроблено розрахунок. */
  readonly godina: number
  /** Усі режими, завжди всі й завжди в тому самому порядку. */
  readonly rezimi: readonly Rezim[]
}

/**
 * Єдиний податок режиму, який має рівно один.
 *
 * Існує заради читаності тих режимів, де податок один: `porezi[0]` під
 * `noUncheckedIndexedAccess` дає `Porez | undefined`, а розбирати цю
 * невизначеність у кожному виклику — шум. Режим із кількома податками сюди
 * потрапити не має, тому виклик падає замість того, щоб мовчки взяти перший.
 */
export const jediniPorez = (izracun: Izracun): Porez => {
  const [porez] = izracun.porezi
  if (porez === undefined || izracun.porezi.length !== 1) {
    throw new Error(`Очікувався рівно один податок, а є ${String(izracun.porezi.length)}`)
  }
  return porez
}
