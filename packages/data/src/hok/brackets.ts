/**
 * Розбір таблиці розрядів (`razred`) із формули HOK.
 *
 * У збережених книгах усі входи нульові, тож кешовані значення комірок — це
 * розрахунок для нуля, а не таблиця. Сама таблиця живе в тексті формули:
 *
 *   IF(C3<=11300,203.4,IF(AND(C3>=11300.01,C3<=15300),275.4,…))
 *
 * Тому голден-тести звіряються не зі значеннями, а з розібраним ланцюгом IF —
 * це і є машинно-читна таблиця розрядів прямо з файлу палати.
 *
 * Розбір навмисно недовірливий. Оракул, який мовчки вигадує таблицю з чужої
 * формули або губить розряд, гірший за виняток: помилка перетікає в правила
 * і вилазить уже в грошах.
 */

export interface RazredRow {
  /** `gornja granica razreda` — верхня межа розряду, сирим рядком із формули. */
  readonly gornjaGranica: string
  /** Сума для цього розряду, сирим рядком із формули. */
  readonly iznos: string
}

// Ланки виглядають двома способами: `C3<=11300,203.4` для першої
// і `C3<=15300),275.4` для решти — звідси необов'язкова дужка.
const LINK = /([A-Z]{1,3}\d+)\s*<=\s*(\d+(?:\.\d+)?)\s*\)?\s*,\s*([^,)]+)/g

const LITERAL = /^\d+(?:\.\d+)?$/

/**
 * Одна ланка — це не таблиця. Умова на кшталт `IF(D12<=0,0,…)` синтаксично
 * не відрізняється від першої ланки ланцюга, тому розрядом вважаємо лише те,
 * що має принаймні дві ланки.
 */
const MIN_LINKS = 2

export const parseRazredChain = (formula: string): readonly RazredRow[] => {
  const links = [...formula.matchAll(LINK)]
  if (links.length < MIN_LINKS) return []

  const rows: RazredRow[] = []
  let variable: string | undefined
  let previous: number | undefined

  for (const [, ref, bound, amount] of links) {
    if (ref === undefined || bound === undefined || amount === undefined) continue

    if (variable === undefined) variable = ref
    else if (ref !== variable) {
      throw new Error(
        `Ланцюг порівнює різні комірки (${variable} і ${ref}) — це не таблиця розрядів: ${formula}`,
      )
    }

    const trimmed = amount.trim()
    if (!LITERAL.test(trimmed)) {
      throw new Error(
        `Сума розряду ${bound} задана виразом «${trimmed}», а не числом — потрібен інший розбір: ${formula}`,
      )
    }

    const numeric = Number(bound)
    if (previous !== undefined && numeric <= previous) {
      throw new Error(`Межі розрядів не зростають (${previous} → ${numeric}): ${formula}`)
    }
    previous = numeric

    rows.push({ gornjaGranica: bound, iznos: trimmed })
  }

  return rows
}
