import { describe, expect, it } from 'vitest'
import { PRAVILA_NEPUNE_GODINE } from './nepuna-godina.ts'

const { mjeseciUPunomRazdoblju, brojanjeMjeseci } = PRAVILA_NEPUNE_GODINE

describe('правила неповного податкового періоду', () => {
  it('розмірне зведення веде до статті, що його встановлює', () => {
    // čl. 3. st. 4. Pravilnika: `godišnji paušalni dohodak ... utvrđuje se
    // razmjerno broju mjeseci obavljanja djelatnosti`, а розряд — за річним
    // primitak, який дає середній місячний, помножений на 12 місяців.
    expect(mjeseciUPunomRazdoblju.source.article).toBe('čl. 3. st. 4.')
    expect(mjeseciUPunomRazdoblju.source.act).toBe(
      'Pravilnik o paušalnom oporezivanju samostalnih djelatnosti',
    )
  })

  it('повний податковий період має рівно 12 місяців', () => {
    // Число не декоративне: саме на нього акт множить середній місячний
    // primitak, щоб дістати річний, за яким визначається розряд.
    expect(mjeseciUPunomRazdoblju.value).toBe(12)
  })

  it('підрахунок місяців веде до окремої статті, а не до тієї самої', () => {
    // čl. 3. st. 6. — окрема норма з окремим правилом: рахується кожен повний
    // календарний місяць і останній місяць попри кількість днів у ньому.
    // Якби обидві норми злилися в одне посилання, з екрана не було б видно,
    // звідки взялася кількість місяців.
    expect(brojanjeMjeseci.article).toBe('čl. 3. st. 6.')
    expect(brojanjeMjeseci.article).not.toBe(mjeseciUPunomRazdoblju.source.article)
  })

  it.each([
    ['розмірне зведення', mjeseciUPunomRazdoblju.source],
    ['підрахунок місяців', brojanjeMjeseci],
  ])('%s веде до статті чинного акта', (_naziv, source) => {
    expect(source.article).toMatch(/^čl\. \d/)
    expect(source.gazette).toMatch(/^NN \d/)
    expect(source.url).toMatch(/^https:\/\//)
    expect(source.status).toBe('in-force')
    expect(Number.isNaN(Date.parse(source.checkedOn))).toBe(false)
  })

  it('обидві норми цитують той самий акт', () => {
    // Розмірність і підрахунок місяців — два стави однієї статті одного
    // Pravilnika. Розбіжність в акті означала б описку в одному з посилань.
    expect(brojanjeMjeseci.act).toBe(mjeseciUPunomRazdoblju.source.act)
    expect(brojanjeMjeseci.url).toBe(mjeseciUPunomRazdoblju.source.url)
  })
})
