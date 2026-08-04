import { describe, expect, it } from 'vitest'
import { parseRazredChain } from './brackets.ts'
import type { HokScenario } from './types.ts'
import { hokFormula } from './workbook.ts'

const PREGLED = 'PREGLED MOGUĆNOSTI '
const at = (scenario: HokScenario, cell: string) => ({ scenario, sheet: PREGLED, cell })

describe('parseRazredChain', () => {
  it('розбирає ланцюг IF у таблицю розрядів', () => {
    const rows = parseRazredChain('IF(A1<=100,7,IF(AND(A1>=100.01,A1<=200),9,IF(A1>200,"ні")))')

    expect(rows).toEqual([
      { gornjaGranica: '100', iznos: '7' },
      { gornjaGranica: '200', iznos: '9' },
    ])
  })

  it('витягає таблицю паушального податку чинного закону просто з файлу HOK', () => {
    const rows = parseRazredChain(hokFormula(at('in-force-2026', 'C13')))

    // Верхня межа розряду × 15% (тобто 1 − priznati izdatak 85%) × 12%.
    expect(rows).toEqual([
      { gornjaGranica: '11300', iznos: '203.4' },
      { gornjaGranica: '15300', iznos: '275.4' },
      { gornjaGranica: '19900', iznos: '358.2' },
      { gornjaGranica: '30600', iznos: '550.8' },
      { gornjaGranica: '40000', iznos: '720' },
      { gornjaGranica: '50000', iznos: '900' },
      { gornjaGranica: '60000', iznos: '1080' },
    ])
  })

  it('показує, що заплановані зміни чіпають лише два верхні розряди', () => {
    const inForce = parseRazredChain(hokFormula(at('in-force-2026', 'C13')))
    const announced = parseRazredChain(hokFormula(at('announced-2027', 'C13')))

    expect(announced.slice(0, 5)).toEqual(inForce.slice(0, 5))
    expect(announced.slice(5)).toEqual([
      { gornjaGranica: '50000', iznos: '1800' },
      { gornjaGranica: '60000', iznos: '3240' },
    ])
  })

  it('не бачить розрядів там, де їх немає', () => {
    expect(parseRazredChain('B5*12')).toEqual([])
  })

  it('не приймає одиничну умову за таблицю', () => {
    // Реальна комірка D13 книги HOK: porez na dobit, жодних розрядів.
    expect(parseRazredChain(hokFormula(at('in-force-2026', 'D13')))).toEqual([])
  })

  it('відмовляється, коли ланцюг порівнює різні комірки', () => {
    expect(() => parseRazredChain('IF(A1<=100,7,IF(B2<=200,9,0))')).toThrow(/різні комірки/)
  })

  it('відмовляється, коли сума розряду задана виразом', () => {
    // Так виглядає ланцюг внесків у сценарії запланованих змін: межі ті самі,
    // але суми — вирази від prosječna plaća, тож потрібен інший розбір.
    expect(() => parseRazredChain(hokFormula(at('announced-2027', 'C5')))).toThrow(/задана виразом/)
  })

  it('відмовляється, коли межі розрядів не зростають', () => {
    expect(() => parseRazredChain('IF(A1<=200,7,IF(A1<=100,9,0))')).toThrow(/не зростають/)
  })
})
