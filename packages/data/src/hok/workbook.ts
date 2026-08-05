import type { HokCell, HokCellRef, HokScenario, HokWorkbook, HokWorkbooks } from './types.ts'
import { hokWorkbooks } from './workbooks.generated.ts'

// Згенерована фікстура має літеральні ключі; для доступу за довільним рядком
// потрібен ширший тип.
const workbooks: HokWorkbooks = hokWorkbooks

/** @internal Доступ до фікстур HOK — матеріал голден-тестів, не екрана. */
export const hokWorkbook = (scenario: HokScenario): HokWorkbook => workbooks[scenario]

/** @internal Перелік аркушів фікстури: потрібен тестам структури книги. */
export const hokSheetNames = (scenario: HokScenario): readonly string[] =>
  Object.keys(workbooks[scenario].sheets)

export const hokCell = ({ scenario, sheet, cell }: HokCellRef): HokCell => {
  const sheetCells = workbooks[scenario].sheets[sheet]
  if (sheetCells === undefined) {
    throw new Error(`У книзі ${scenario} немає аркуша «${sheet}»`)
  }
  const found = sheetCells[cell]
  if (found === undefined) {
    throw new Error(`На аркуші «${sheet}» книги ${scenario} немає комірки ${cell}`)
  }
  return found
}

/** @internal Формула комірки HOK: нею тести доводять помилки в книгах. */
export const hokFormula = (ref: HokCellRef): string => {
  const { formula } = hokCell(ref)
  if (formula === undefined) {
    throw new Error(
      `Комірка ${ref.cell} на «${ref.sheet}» книги ${ref.scenario} не містить формули`,
    )
  }
  return formula
}

/** Кешоване значення як сирий рядок — саме таке, як його зберіг Excel. */
export const hokRawValue = (ref: HokCellRef): string => {
  const { value } = hokCell(ref)
  if (value === undefined) {
    throw new Error(
      `Комірка ${ref.cell} на «${ref.sheet}» книги ${ref.scenario} не містить значення`,
    )
  }
  return value
}
