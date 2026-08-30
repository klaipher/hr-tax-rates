/**
 * Правила режиму `obrt na dohodak` (обрт на дохідок / books-based sole trader):
 * прогресивний `porez na dohodak`, `osobni odbitak` за коефіцієнтами і
 * `koeficijent`, з якого будується `osnovica` внесків цього режиму.
 *
 * Чому окремим файлом, а не полем у `Ruleset`: паушальний набір правил цих
 * величин не знає взагалі — у нього одна ставка на всю країну, фіктивний
 * `dohodak` і власний `koeficijent` 0,4. Тут же кожне число живе своїм життям і
 * має власну статтю (ADR-0002).
 *
 * Числа зберігаються без валюти й без одиниць: `ruleset` лише переписує акт, а
 * арифметику додає рушій — так само, як у таблиці розрядів.
 */
import Decimal from 'decimal.js'
import { ZAKON_O_DOPRINOSIMA, ZAKON_O_POREZU_NA_DOHODAK } from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'
import { OSNOVNI_OSOBNI_ODBITAK } from './zajednicke-velicine.ts'

const CHECKED_ON = '2026-08-04' as const

/**
 * `čl. 14. st. 3.` — одна таблиця, з якої беруться і коефіцієнт утриманця, і
 * коефіцієнти дітей. Джерело спільне, бо спільна сама таблиця; що це різні
 * поняття — видно з назв полів, а не з посилань.
 */
const TABLICA_KOEFICIJENATA = {
  ...ZAKON_O_POREZU_NA_DOHODAK,
  article: 'čl. 14. st. 3.',
  checkedOn: CHECKED_ON,
} as const

/**
 * `osobni odbitak` (особистий відрахунок / personal allowance).
 *
 * Закон задає його не сумою, а конструкцією: основний розмір множиться на
 * коефіцієнти за утриманцями й дітьми (`čl. 14. st. 2.`). Тому сумою його тут
 * і немає — є те, з чого вона складається.
 */
export interface OsobniOdbitakPravila {
  /**
   * `osnovni osobni odbitak` (основний особистий відрахунок) — місячна сума,
   * від якої рахується решта.
   *
   * Та сама величина потрібна `komorski doprinos`, який доходу не стосується
   * взагалі, і там вона вже стоїть окремо. Під час злиття гілок вона має
   * лишитися в одному місці.
   */
  readonly osnovni: Sourced<Decimal>
  /**
   * Коефіцієнт за одного `uzdržavani član uže obitelji` (утриманця з близької
   * родини — подружжя, батьки, повнолітні діти після першого працевлаштування;
   * `čl. 14. st. 5.`). Дітей він не стосується — у них своя шкала.
   */
  readonly koeficijentUzdrzavanogClana: Sourced<Decimal>
  /**
   * Коефіцієнти за дітьми, від першої до дев'ятої: акт друкує їх поштучно, і
   * кожна наступна дитина дорожча за попередню, а не така сама.
   *
   * Далі дев'ятої таблиці немає: рядок 11 замість числа друкує правило з
   * пропуском («progresivno se uvećava se za 1,1 … više u odnosu prema
   * koeficijentu za prethodno dijete»), з якого коефіцієнта не відновити.
   * Дописати його «за зростанням» означало б вигадати податок, тож масив
   * обривається там, де обривається текст акта, а рушій на десятій дитині
   * відмовляється рахувати.
   */
  readonly koeficijentiDjece: Sourced<readonly Decimal[]>
  /**
   * Коефіцієнт за інвалідністю (`r. br. 12.`) — окремо на кожну особу: на
   * самого платника, на кожного утриманця й на кожну утримувану дитину.
   *
   * Не «на сім'ю» і не «раз»: акт друкує рядок так, що коефіцієнт множиться
   * на кількість осіб, а не на факт наявності. Порахувати його один раз
   * означало б забрати відрахунок у другої дитини з інвалідністю.
   */
  readonly koeficijentInvalidnosti: Sourced<Decimal>
  /**
   * Коефіцієнт за 100 % інвалідністю по одній підставі або за правом на
   * `doplatak za pomoć i njegu`, `osobna invalidnina` чи `inkluzivni dodatak`
   * (`r. br. 13.`).
   *
   * Акт прямо каже, що використання цього рядка виключає `r. br. 12.` — але
   * для тієї самої особи, а не для всієї сім'ї. Тому в моделі це дві окремі
   * кількості людей, а не прапорець «яка інвалідність».
   */
  readonly koeficijentPotpuneInvalidnosti: Sourced<Decimal>
}

/** Прогресія `porez na dohodak`: дві ставки й точка переходу між ними. */
export interface ProgresijaPravila {
  /**
   * `porezna osnovica` (база оподаткування), до якої діє `niža stopa`; на
   * частину понад неї йде `viša stopa`.
   *
   * Не плутати з порогом паушалу: там 60 000 € міряються по `primitak` і
   * число живе в законі про `PDV`, тут — по `porezna osnovica` і в `čl. 19.`
   * Числа збіглися, поняття різні.
   *
   * Самих ставок тут немає навмисно: їх установлює `jedinica lokalne
   * samouprave` своєю `odluka` (`čl. 19.a st. 1.`), і живуть вони в довіднику
   * одиниць, а не в наборі правил.
   */
  readonly pragViseStope: Sourced<Decimal>
}

/**
 * Частки `izdatak`, які закон **не** визнає (`čl. 33.` — «Izdaci koji se
 * porezno ne priznaju»).
 *
 * Записані саме як невизнана частка, а не як визнана: у статті надруковано
 * «50 % izdataka reprezentacije», тож число в коді дослівно те саме, що в
 * акті. Скільки лишається визнаним — уже арифметика, і робить її рушій.
 *
 * З `priznati izdatak` паушалу це не має нічого спільного: там частка
 * `primitak`, яку закон вважає видатками без доказів, тут — частка справжнього,
 * документованого `izdatak`, яку закон відмовляється визнати.
 */
export interface NepriznatiIzdaciPravila {
  /** `reprezentacija` (представницькі видатки / entertainment). */
  readonly reprezentacija: Sourced<Decimal>
  /**
   * Видатки на власний чи орендований особистий автомобіль та інші засоби
   * особистого перевезення — коли за їхнє використання не нараховується
   * `plaća` чи інший `dohodak`.
   */
  readonly osobnoVozilo: Sourced<Decimal>
}

/** Правила `porez na dohodak`, спільні для всіх, хто рахує реальний `dohodak`. */
export interface PorezNaDohodakPravila {
  readonly osobniOdbitak: OsobniOdbitakPravila
  readonly progresija: ProgresijaPravila
  readonly nepriznatiIzdaci: NepriznatiIzdaciPravila
}

/** `doprinosi` режиму: та сама арифметика, що в паушалі, інший `koeficijent`. */
export interface DoprinosiObrtaNaDohodakPravila {
  /**
   * `koeficijent` (коефіцієнт / contribution coefficient) — множник до
   * `prosječna plaća`, з якого виходить місячна `osnovica`.
   *
   * 0,65 проти 0,4 в паушалі: обрт, що веде книги, платить внесків більш ніж
   * у півтора раза більше за той самий `primitak`, і закон ставить це в
   * залежність не від доходу, а від самого способу визначати `dohodak`.
   */
  readonly koeficijent: Sourced<Decimal>
}

/**
 * Усе, чого режим `obrt na dohodak` потребує понад паушальний `Ruleset`.
 *
 * Два закони в одному записі, і це не недбалість: податкову частину задає
 * `Zakon o porezu na dohodak`, внескову — `Zakon o doprinosima`, а режим не
 * існує без обох. Розділені вони полями, а не файлами.
 */
export interface ObrtNaDohodakPravila {
  readonly porez: PorezNaDohodakPravila
  readonly doprinosi: DoprinosiObrtaNaDohodakPravila
}

/** Чинні правила режиму на 2026 рік. */
export const obrtNaDohodak2026: ObrtNaDohodakPravila = {
  porez: {
    osobniOdbitak: {
      // Спільна величина: plaća й `obrt na dobit` беруть її з того самого
      // місця, бо закон не розводить `osobni odbitak` за джерелом доходу.
      osnovni: OSNOVNI_OSOBNI_ODBITAK,
      koeficijentUzdrzavanogClana: sourced(new Decimal('0.5'), TABLICA_KOEFICIJENATA),
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
        TABLICA_KOEFICIJENATA,
      ),
      koeficijentInvalidnosti: sourced(new Decimal('0.3'), TABLICA_KOEFICIJENATA),
      koeficijentPotpuneInvalidnosti: sourced(new Decimal('1.0'), TABLICA_KOEFICIJENATA),
    },
    progresija: {
      pragViseStope: sourced(new Decimal('60000'), {
        ...ZAKON_O_POREZU_NA_DOHODAK,
        article: 'čl. 19.',
        checkedOn: CHECKED_ON,
      }),
    },
    nepriznatiIzdaci: {
      reprezentacija: sourced(new Decimal('0.5'), {
        ...ZAKON_O_POREZU_NA_DOHODAK,
        article: 'čl. 33. st. 1. t. 1.',
        checkedOn: CHECKED_ON,
      }),
      osobnoVozilo: sourced(new Decimal('0.5'), {
        ...ZAKON_O_POREZU_NA_DOHODAK,
        article: 'čl. 33. st. 1. t. 5.',
        checkedOn: CHECKED_ON,
      }),
    },
  },
  doprinosi: {
    koeficijent: sourced(new Decimal('0.65'), {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 66. st. 1. t. 1.',
      checkedOn: CHECKED_ON,
    }),
  },
}
