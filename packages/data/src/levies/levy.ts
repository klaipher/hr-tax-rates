import Decimal from 'decimal.js'
import type { LegalReference } from '../legal.ts'

/**
 * Акт без прив'язки до конкретної статті — рівно та форма, у якій акти
 * лежать у `legal.ts`. Стаття й дата звірки додаються в місці вжитку, бо
 * той самий акт цитується різними статтями.
 */
export type ActReference = Omit<LegalReference, 'article' | 'checkedOn'>

/**
 * Спільний результат обов'язкового платежу поза податками та внесками —
 * `komorski doprinos`, `turistička članarina`, `spomenička renta`.
 *
 * Тип має рівно два стани, і другий із них не є нулем. Платіж, що не
 * застосовується, повертається окремим значенням із причиною та статтею
 * закону: користувач мусить відрізнити «не винен нічого» від «забули
 * порахувати». Функція, що в такому разі тихо віддає 0, цю різницю знищує.
 */
export type LevyResult = LevyDue | LevyNotApplicable

/**
 * Застереження, за якого нарахована сума може виявитися іншою.
 *
 * Код із параметрами, а не готове речення (ADR-0004): шар даних мови читача
 * не знає, тож речення складає інтерфейс. `ogranicenje` — виняток лише на
 * вигляд: це дослівна цитата з тексту акта хорватською, і вона лишається
 * такою в кожній локалі, як і сам термін.
 */
export type Napomena =
  /** Закон бере код `NKD` не повністю, а лише в перелічених межах. */
  | { readonly kod: 'ogranicenje-nkd'; readonly nkd: string; readonly ogranicenje: string }
  /** Число ставки — законна стеля, а не ухвалена ставка. */
  | { readonly kod: 'stopa-je-gornja-granica'; readonly stopa: string }
  /** Ставку в межах закону встановлює `jedinica lokalne samouprave`. */
  | { readonly kod: 'stopu-utvrduje-jedinica' }

/** Платіж нараховано: закон його вимагає, і ось скільки за рік. */
export interface LevyDue {
  readonly kind: 'due'
  /** Річна сума у євро (eura). */
  readonly godisnjiIznos: Decimal
  /** Звідки взялася сума: база й ставка, словами. */
  readonly obracun: string
  /**
   * Застереження, за яких сума може виявитися іншою: закон звужує код `NKD`
   * додатковою умовою, ставку встановлює місто, тощо. Порожній масив —
   * застережень немає.
   */
  readonly napomene: readonly Napomena[]
  /** Норма, за якою платіж нараховано. */
  readonly source: LegalReference
}

/**
 * Чому платіж не нараховано — код із параметрами, а не проза (ADR-0004).
 *
 * Речення складає інтерфейс мовою читача. Числа лишаються числами, тож
 * `nkd` у причині можна показати кодом, а не втопити в готовому рядку.
 */
export type RazlogNeprimjene =
  /** `komorski doprinos`: обрт у перші роки після першого впису в `Obrtni registar`. */
  | { readonly kod: 'novootvoreni-obrt'; readonly oslobodenjeGodina: number }
  /**
   * Діяльність і місце не задані, а без них застосовність не визначена.
   *
   * Ширше за «немає `NKD`» навмисно: `turistička članarina` і `indirektna
   * spomenička renta` залежать від коду, а `spomenička renta` за площею —
   * від місця й площі, і жодного з цих трьох питань форма ще не поставила.
   *
   * Єдина причина, яку складає не цей шар, а той, хто збирає платежі в один
   * перелік: статуту нема чого сказати про питання, якого йому не поставили.
   * Вона живе тут, бо перелік причин має бути один — інакше інтерфейс мусив
   * би розбирати два.
   */
  | { readonly kod: 'djelatnost-nije-zadana' }
  /** `NKD` не входить до переліку діяльностей, за які платять. */
  | { readonly kod: 'djelatnost-izvan-popisa'; readonly nkd: string }
  /** Немає місцевої `turistička zajednica`, на території якої виникає обов'язок. */
  | { readonly kod: 'izvan-podrucja-turisticke-zajednice' }
  /** Діяльність не ведеться в нерухомому культурному добрі чи його зоні. */
  | { readonly kod: 'izvan-kulturnog-dobra' }
  /** Переважна діяльність — переробна або виробнича: закон її звільняє. */
  | { readonly kod: 'pretezito-proizvodna-djelatnost' }

/** Платіж не застосовується — і ось чому саме. */
export interface LevyNotApplicable {
  readonly kind: 'not-applicable'
  readonly razlog: RazlogNeprimjene
  /** Норма, яка виключає платіж або встановлює межу його застосування. */
  readonly source: LegalReference
}

export const levyDue = (
  godisnjiIznos: Decimal,
  obracun: string,
  source: LegalReference,
  napomene: readonly Napomena[] = [],
): LevyDue => ({ kind: 'due', godisnjiIznos, obracun, napomene, source })

export const levyNotApplicable = (
  razlog: RazlogNeprimjene,
  source: LegalReference,
): LevyNotApplicable => ({ kind: 'not-applicable', razlog, source })

/**
 * Річна сума нарахованих платежів. Ненараховані не дають нуля — вони просто
 * не входять у суму, лишаючись окремими записами з причиною.
 *
 * @internal Застосунок складає вже готові рядки картки (`zbrojDavanja` в
 * рушії), а не сирі `LevyResult`. Тут функція лишається для тестів статутів,
 * які складають дві ренти ще до того, як ті стануть рядками.
 */
export const godisnjiZbroj = (results: readonly LevyResult[]): Decimal =>
  results.reduce(
    (zbroj, result) => (result.kind === 'due' ? zbroj.plus(result.godisnjiIznos) : zbroj),
    new Decimal(0),
  )

/**
 * Округлення до цента, half-up — те саме правило, що в податкових
 * розрахунках. Рушій має власний `roundToCents` над `Money`, але `@hr-tax/data`
 * навмисно не залежить від `@hr-tax/engine`, тож правило дублюється тут.
 */
export const naCente = (iznos: Decimal): Decimal => iznos.toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

const POSTOTAK = 100

/**
 * Відсоток від бази. Усі три платежі виражені саме так — `stopa` у відсотках
 * від `osnovica`, — тож ділення на сто живе в одному місці, а не в трьох.
 */
export const postotakOd = (osnovica: Decimal.Value, stopa: Decimal.Value): Decimal =>
  new Decimal(osnovica).times(stopa).dividedBy(POSTOTAK)
