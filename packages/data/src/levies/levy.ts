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
  readonly napomene: readonly string[]
  /** Норма, за якою платіж нараховано. */
  readonly source: LegalReference
}

/**
 * Машинно-читна причина, чому платіж не нараховано. Вільний текст поруч —
 * для людини; код — для UI, який має показати саме цей випадок, а не
 * підставити в шаблон чужий рядок.
 */
export type LevyNotApplicableReason =
  /** `komorski doprinos`: обрт у перші два роки після першого впису в `Obrtni registar`. */
  | 'novootvoreni-obrt'
  /** `NKD` не входить до переліку діяльностей, за які платять. */
  | 'djelatnost-izvan-popisa'
  /** Немає місцевої `turistička zajednica`, на території якої виникає обов'язок. */
  | 'izvan-podrucja-turisticke-zajednice'
  /** Діяльність не ведеться в нерухомому культурному добрі чи його зоні. */
  | 'izvan-kulturnog-dobra'
  /** Переважна діяльність — переробна або виробнича: закон її звільняє. */
  | 'pretezito-proizvodna-djelatnost'

/** Платіж не застосовується — і ось чому саме. */
export interface LevyNotApplicable {
  readonly kind: 'not-applicable'
  readonly reason: LevyNotApplicableReason
  /** Пояснення для людини українською, з хорватським терміном усередині. */
  readonly obrazlozenje: string
  /** Норма, яка виключає платіж або встановлює межу його застосування. */
  readonly source: LegalReference
}

export const levyDue = (
  godisnjiIznos: Decimal,
  obracun: string,
  source: LegalReference,
  napomene: readonly string[] = [],
): LevyDue => ({ kind: 'due', godisnjiIznos, obracun, napomene, source })

export const levyNotApplicable = (
  reason: LevyNotApplicableReason,
  obrazlozenje: string,
  source: LegalReference,
): LevyNotApplicable => ({ kind: 'not-applicable', reason, obrazlozenje, source })

/**
 * Річна сума нарахованих платежів. Ненараховані не дають нуля — вони просто
 * не входять у суму, лишаючись окремими записами з причиною.
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
