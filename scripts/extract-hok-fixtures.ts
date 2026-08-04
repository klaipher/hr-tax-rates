/**
 * Витягає вміст Excel-калькуляторів Hrvatska obrtnička komora (HOK) у типізовану
 * фікстуру, з якої живуть голден-тести.
 *
 * Зберігаються і формули, і кешовані значення, обидва як сирі рядки. Рядки, а не
 * числа, — навмисно: у файлах HOK є дрейф float (3491.7359999999999), і його
 * треба бачити, а не втратити на розборі.
 *
 * Запуск: `pnpm run fixtures:extract`. Результат комітиться.
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'
import { unzipSync } from 'fflate'
import type { HokCell } from '../packages/data/src/hok/types.ts'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')

const SOURCES = [
  {
    scenario: 'in-force-2026',
    file: 'Kalkulator_DOBRO JE BITI OBRTNIK 2026..xlsx',
  },
  {
    scenario: 'announced-2027',
    file: 'Kalkulator_DOBRO_JE_BITI_OBRTNIK_2027_prema_najavljenim_mjerama.xlsx',
  },
] as const

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Без цього парсер обрізає пробіли — і назва аркуша «PREGLED MOGUĆNOSTI »
  // тихо втрачає кінцевий пробіл. Фікстура має бути дослівною копією джерела.
  trimValues: false,
  isArray: (name) => ['sheet', 'row', 'c', 'si', 'r', 'Relationship'].includes(name),
})

type Xml = Record<string, unknown>

const asArray = (value: unknown): Xml[] => (Array.isArray(value) ? (value as Xml[]) : [])

const textOf = (node: unknown): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (node === null || node === undefined) return ''
  const record = node as Xml
  const text = record['#text']
  return typeof text === 'string' || typeof text === 'number' ? String(text) : ''
}

/** `si` буває простим (`<t>`) або складеним із форматованих шматків (`<r><t>`). */
const sharedStringText = (si: Xml): string => {
  const runs = asArray(si['r'])
  if (runs.length > 0) return runs.map((run) => textOf(run['t'])).join('')
  return textOf(si['t'])
}

const COLUMN_BASE = 26

const columnToIndex = (letters: string): number =>
  [...letters].reduce((n, letter) => n * COLUMN_BASE + (letter.charCodeAt(0) - 64), 0)

const indexToColumn = (index: number): string => {
  let rest = index
  let letters = ''
  while (rest > 0) {
    const remainder = (rest - 1) % COLUMN_BASE
    letters = String.fromCharCode(65 + remainder) + letters
    rest = (rest - remainder - 1) / COLUMN_BASE
  }
  return letters
}

const A1 = /(\$?)([A-Z]{1,3})(\$?)(\d+)/g

/**
 * Excel зберігає спільну формулу лише в комірці-майстрі; решта успадковують її
 * зі зсувом відносних посилань. Щоб походження числа лишалося простежуваним,
 * формула перекладається під конкретну комірку, а не губиться.
 */
const shiftReferences = (formula: string, columnDelta: number, rowDelta: number): string =>
  formula.replace(A1, (_match, colAbs: string, column: string, rowAbs: string, row: string) => {
    const shiftedColumn =
      colAbs === '$' ? column : indexToColumn(columnToIndex(column) + columnDelta)
    const shiftedRow = rowAbs === '$' ? row : String(Number(row) + rowDelta)
    return `${colAbs}${shiftedColumn}${rowAbs}${shiftedRow}`
  })

const splitRef = (ref: string): { column: string; row: number } => {
  const parsed = /^([A-Z]{1,3})(\d+)$/.exec(ref)
  if (parsed === null) throw new Error(`Незрозуміла адреса комірки: ${ref}`)
  const [, column, row] = parsed
  if (column === undefined || row === undefined) throw new Error(`Незрозуміла адреса: ${ref}`)
  return { column, row: Number(row) }
}

const extract = (file: string): Record<string, Record<string, HokCell>> => {
  const zip = unzipSync(new Uint8Array(readFileSync(join(repoRoot, 'fixtures', 'hok', file))))
  const decoder = new TextDecoder()
  const read = (path: string): string => {
    const entry = zip[path]
    if (entry === undefined) throw new Error(`У ${file} немає запису ${path}`)
    return decoder.decode(entry)
  }

  const sharedStrings = zip['xl/sharedStrings.xml']
    ? asArray((parser.parse(read('xl/sharedStrings.xml'))['sst'] as Xml)['si']).map(
        sharedStringText,
      )
    : []

  const relationships = new Map(
    asArray(
      (parser.parse(read('xl/_rels/workbook.xml.rels'))['Relationships'] as Xml)['Relationship'],
    ).map((rel) => [String(rel['@_Id']), String(rel['@_Target'])]),
  )

  const workbook = parser.parse(read('xl/workbook.xml'))['workbook'] as Xml
  const sheetList = asArray((workbook['sheets'] as Xml)['sheet'])

  const sheets: Record<string, Record<string, HokCell>> = {}

  for (const sheet of sheetList) {
    const name = String(sheet['@_name'])
    const target = relationships.get(String(sheet['@_r:id']))
    if (target === undefined) throw new Error(`Аркуш ${name} без зв'язку з файлом`)
    const path = target.startsWith('xl/') ? target : `xl/${target.replace(/^\/+/, '')}`

    const worksheet = parser.parse(read(path))['worksheet'] as Xml
    const rows = asArray((worksheet['sheetData'] as Xml | undefined)?.['row'])

    const cells: Record<string, HokCell> = {}
    // si -> комірка-майстер спільної формули та її текст.
    const sharedMasters = new Map<string, { anchor: string; formula: string }>()

    for (const row of rows) {
      for (const cell of asArray(row['c'])) {
        const ref = String(cell['@_r'])
        const formulaNode = cell['f'] as Xml | string | undefined
        const rawFormula = formulaNode === undefined ? '' : textOf(formulaNode)
        const sharedIndex =
          typeof formulaNode === 'object' && formulaNode !== null ? formulaNode['@_si'] : undefined

        let formula: string | undefined
        let sharedFrom: string | undefined

        if (sharedIndex !== undefined) {
          const si = String(sharedIndex)
          if (rawFormula !== '') {
            sharedMasters.set(si, { anchor: ref, formula: rawFormula })
            formula = rawFormula
          } else {
            const master = sharedMasters.get(si)
            if (master === undefined) {
              throw new Error(`Комірка ${ref} успадковує спільну формулу si=${si}, якої ще немає`)
            }
            const from = splitRef(master.anchor)
            const to = splitRef(ref)
            formula = shiftReferences(
              master.formula,
              columnToIndex(to.column) - columnToIndex(from.column),
              to.row - from.row,
            )
            sharedFrom = master.anchor
          }
        } else if (rawFormula !== '') {
          formula = rawFormula
        }

        let value: string | undefined
        if (cell['@_t'] === 's' && cell['v'] !== undefined) {
          value = sharedStrings[Number(textOf(cell['v']))]
        } else if (cell['is'] !== undefined) {
          value = textOf((cell['is'] as Xml)['t'])
        } else if (cell['v'] !== undefined) {
          value = textOf(cell['v'])
        }

        if (formula === undefined && value === undefined) continue
        cells[ref] = {
          ...(formula !== undefined ? { formula } : {}),
          ...(value !== undefined ? { value } : {}),
          ...(sharedFrom !== undefined ? { sharedFrom } : {}),
        }
      }
    }
    sheets[name] = cells
  }

  return sheets
}

const workbooks = Object.fromEntries(
  SOURCES.map(({ scenario, file }) => [scenario, { sourceFile: file, sheets: extract(file) }]),
)

const output = `// ЗГЕНЕРОВАНО \`pnpm run fixtures:extract\` — не редагувати руками.
//
// Вміст Excel-калькуляторів Hrvatska obrtnička komora (HOK). Формули й кешовані
// значення збережені сирими рядками, щоб дрейф float у джерелі лишався видимим.

import type { HokWorkbooks } from './types.ts'

export const hokWorkbooks = ${JSON.stringify(workbooks, null, 2)} as const satisfies HokWorkbooks
`

const destination = join(repoRoot, 'packages', 'data', 'src', 'hok', 'workbooks.generated.ts')
writeFileSync(destination, output, 'utf8')

// JSON.stringify дає подвійні лапки й лапки на ключах — не той стиль, що в решті
// репозиторію. Згенероване має читатися так само, як рукописне.
execFileSync('pnpm', ['exec', 'biome', 'check', '--write', destination], {
  cwd: repoRoot,
  stdio: 'ignore',
})

for (const [scenario, workbook] of Object.entries(workbooks)) {
  const cells = Object.values(workbook.sheets).reduce(
    (n, sheet) => n + Object.keys(sheet).length,
    0,
  )
  console.log(`${scenario}: ${Object.keys(workbook.sheets).length} аркушів, ${cells} комірок`)
}
