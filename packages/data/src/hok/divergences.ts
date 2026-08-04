import {
  type LegalReference,
  ODLUKA_O_KOMORSKOM_DOPRINOSU,
  ZAKON_O_DOPRINOSIMA,
  ZAKON_O_POREZU_NA_DOHODAK,
} from '../legal.ts'
import type { HokScenario } from './types.ts'

interface DivergenceBase {
  readonly id: string
  readonly scenarios: readonly HokScenario[]
  /** Чому HOK не має рації і що натомість каже закон. */
  readonly reason: string
  readonly reference: LegalReference
}

/** Формула HOK сама по собі хибна — незалежно від того, які числа в неї подати. */
export interface FormulaDivergence extends DivergenceBase {
  readonly kind: 'formula'
  readonly sheet: string
  readonly cells: readonly string[]
  /** Фрагмент формули, що робить її хибною. Сторож від застарілого запису. */
  readonly formulaContains: string
}

/** Наше число відрізняється від кешованого значення HOK. */
export interface ValueDivergence extends DivergenceBase {
  readonly kind: 'value'
  readonly sheet: string
  readonly cell: string
  /** Значення HOK у центах на момент внесення запису. */
  readonly hokValue: string
  /** Наше значення в центах. */
  readonly ourValue: string
}

/** HOK не рахує платіж узагалі. */
export interface OmissionDivergence extends DivergenceBase {
  readonly kind: 'omission'
  readonly subject: string
  /** Патерн, якого не має бути в жодній комірці. Сторож від застарілого запису. */
  readonly absentPattern: string
}

export type Divergence = FormulaDivergence | ValueDivergence | OmissionDivergence

const CHECKED_ON = '2026-08-04' as const

/**
 * Розбіжності з калькуляторами HOK.
 *
 * Оракулом є закон, а не HOK — див. ADR-0003. Кожен запис пояснює, чия саме
 * поведінка правильна, і підписаний статтею. Розбіжність, якої тут немає,
 * валить білд; запис, який більше не відтворюється, теж.
 */
export const divergences: readonly Divergence[] = [
  {
    kind: 'formula',
    id: 'higher-rate-formula-always-zero',
    scenarios: ['in-force-2026', 'announced-2027'],
    sheet: 'PREGLED MOGUĆNOSTI ',
    cells: ['B15', 'E15'],
    formulaContains: '>=60000*((',
    reason:
      'Формула порівнює всю osnovica з добутком 60 000 × перевищення замість того, щоб оподаткувати саме перевищення, а її IF не має гілки «інакше» — тож вона повертає 0 за будь-яких входів. У результаті вища ставка porez na dohodak не нараховується ніколи. Закон вимагає оподаткувати вищою ставкою частину osnovica понад 60 000 €.',
    reference: {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 19',
      checkedOn: CHECKED_ON,
    },
  },
  {
    kind: 'formula',
    id: 'stale-contribution-cap-for-second-activity',
    scenarios: ['in-force-2026'],
    sheet: 'PREGLED MOGUĆNOSTI ',
    cells: ['E20'],
    formulaContains: '14024.4',
    reason:
      "Річна osnovica для діяльності поряд із наймом порахована зі середньої зарплати позаминулого року, тоді як сусідня комірка B5 у тому ж аркуші вже використовує актуальну. Закон прив'язує osnovica до prosječna plaća за січень–серпень попереднього року, тож обидві комірки мають виходити з однієї величини.",
    reference: {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 7. t. 39',
      checkedOn: CHECKED_ON,
    },
  },
  {
    kind: 'omission',
    id: 'komorski-doprinos-omitted',
    scenarios: ['in-force-2026', 'announced-2027'],
    subject: 'komorski doprinos',
    absentPattern: 'komorsk',
    reason:
      "Калькулятор не рахує обов'язковий внесок до обртницької палати — попри те, що складений самою палатою. Його платить кожен obrt незалежно від режиму, і в найнижчому розряді він додає до податкової частини більш ніж половину її розміру, тож сума «на руки» в HOK систематично завищена.",
    reference: {
      ...ODLUKA_O_KOMORSKOM_DOPRINOSU,
      article: 't. II.',
      checkedOn: CHECKED_ON,
    },
  },
]
