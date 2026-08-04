/** Сценарій правил, який відтворює конкретний файл HOK. */
export type HokScenario = 'in-force-2026' | 'announced-2027'

/**
 * Комірка книги. Значення й формула — сирі рядки з XML: у файлах HOK
 * є дрейф float, і його треба зберегти, а не приховати розбором у number.
 */
export interface HokCell {
  readonly formula?: string
  readonly value?: string
  /**
   * Excel зберігає спільну формулу один раз, у комірці-майстрі, а решта
   * успадковують її зі зсувом посилань. Тут формула вже перекладена під цю
   * комірку, а поле показує, звідки вона взялася — щоб походження числа
   * лишалося простежуваним.
   */
  readonly sharedFrom?: string
}

/** Адреса комірки в конкретній книзі. Три поля, що завжди мандрують разом. */
export interface HokCellRef {
  readonly scenario: HokScenario
  readonly sheet: string
  readonly cell: string
}

export interface HokWorkbook {
  readonly sourceFile: string
  readonly sheets: Readonly<Record<string, Readonly<Record<string, HokCell>>>>
}

export type HokWorkbooks = Readonly<Record<HokScenario, HokWorkbook>>
