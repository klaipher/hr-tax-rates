import type { Divergence } from '@hr-tax/data'

type VrstaZapisa = Divergence['kind']

/**
 * Порядок, у якому реєстр читається згори вниз.
 *
 * Спершу хибні формули, бо це найважче звинувачення до калькулятора палати;
 * далі розбіжність у числі; наприкінці — те, чого HOK не рахує взагалі.
 */
const REDOSLIJED: readonly VrstaZapisa[] = ['formula', 'value', 'omission']

/** Скільки записів одного виду в реєстрі — для підсумку над списком. */
export interface BrojZapisa {
  readonly kind: VrstaZapisa
  readonly broj: number
}

const usporediIdove = (a: string, b: string): number => {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Записи реєстру в сталому порядку: за видом, усередині виду — за
 * ідентифікатором.
 *
 * Сталість тут не косметика: реєстр — це доказ, а доказ, що перетасовується
 * між збірками, важче звірити з попереднім переглядом сторінки.
 */
export const poredaj = (divergences: readonly Divergence[]): readonly Divergence[] =>
  [...divergences].sort(
    (a, b) => REDOSLIJED.indexOf(a.kind) - REDOSLIJED.indexOf(b.kind) || usporediIdove(a.id, b.id),
  )

/**
 * Підрахунок за видом. Види, яких у реєстрі немає, не показуються: рядок
 * «0 пропущених платежів» повідомляє про порожнечу, а не про факт.
 */
export const prebrojPoVrsti = (divergences: readonly Divergence[]): readonly BrojZapisa[] =>
  REDOSLIJED.map((kind) => ({
    kind,
    broj: divergences.filter((divergence) => divergence.kind === kind).length,
  })).filter(({ broj }) => broj > 0)

/**
 * Чим підписаний запис у заголовку: адресою в книзі HOK або предметом, якого
 * в книзі немає.
 *
 * Заголовок мусить бути унікальним — інакше три записи реєстру перетворяться
 * на три однакові рядки «хибна формула», якими не можна ані навігувати, ані
 * послатися на конкретний запис.
 */
export const predmetZapisa = (divergence: Divergence): string => {
  switch (divergence.kind) {
    case 'formula':
      return `${divergence.sheet.trim()} · ${divergence.cells.join(', ')}`
    case 'value':
      return `${divergence.sheet.trim()} · ${divergence.cell}`
    case 'omission':
      return divergence.subject
  }
}
