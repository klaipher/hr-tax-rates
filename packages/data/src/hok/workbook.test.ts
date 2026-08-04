import { describe, expect, it } from 'vitest'
import type { HokScenario } from './types.ts'
import { hokCell, hokFormula, hokRawValue, hokSheetNames, hokWorkbook } from './workbook.ts'

const PREGLED = 'PREGLED MOGUĆNOSTI '
const SCENARIOS: readonly HokScenario[] = ['in-force-2026', 'announced-2027']
const at = (scenario: HokScenario, cell: string) => ({ scenario, sheet: PREGLED, cell })

describe('фікстура HOK', () => {
  it.each(SCENARIOS)('%s містить три аркуші книги', (scenario) => {
    expect(hokSheetNames(scenario)).toEqual(['List1', 'PRVO UNESITE PODATKE', PREGLED])
  })

  it.each(SCENARIOS)('%s посилається на файл, з якого зроблена', (scenario) => {
    expect(hokWorkbook(scenario).sourceFile).toMatch(/\.xlsx$/)
  })

  it('зберігає і формулу, і кешоване значення', () => {
    expect(hokCell(at('in-force-2026', 'C5'))).toEqual({
      formula: '797.2*(0.2+0.165)',
      value: '290.97800000000001',
    })
  })

  it('зберігає дрейф float джерела недоторканим', () => {
    // Якби фікстура розбирала значення в number і друкувала назад, цей хвіст
    // зник би — і ми втратили б доказ, що дрейф у джерелі є.
    expect(hokRawValue(at('in-force-2026', 'C6'))).toBe('3491.7359999999999')
  })

  it('відновлює спільні формули замість того, щоб їх губити', () => {
    // Excel зберігає формулу лише в C6, а D6 успадковує її зі зсувом. Без
    // відновлення річні внески обрту на дохідок лишилися б без походження.
    expect(hokCell(at('in-force-2026', 'D6'))).toEqual({
      formula: 'D5*12',
      value: '9602.3940000000002',
      sharedFrom: 'C6',
    })
  })

  it('показує різне припущення про prosječna plaća у двох сценаріях', () => {
    // Чинний закон: osnovica 797,20 = 1 993,00 × 0,40 — величина вже відома.
    expect(hokFormula(at('in-force-2026', 'C5'))).toContain('797.2')
    // Заплановані зміни: HOK бере прогнозні 2 180 замість чинних 1 993, тому
    // його суми внесків не збігаються з таблицею RIA до законопроєкту.
    // Саме заради цього випадку ruleset і pretpostavke розділені — ADR-0001.
    expect(hokFormula(at('announced-2027', 'C5'))).toContain('2180*0.4')
  })

  it('пояснює, чого бракує, а не падає мовчки', () => {
    expect(() => hokCell({ scenario: 'in-force-2026', sheet: 'Sheet42', cell: 'A1' })).toThrow(
      /немає аркуша/,
    )
    expect(() => hokCell(at('in-force-2026', 'ZZ999'))).toThrow(/немає комірки/)
    expect(() => hokFormula(at('in-force-2026', 'A3'))).toThrow(/не містить формули/)
  })
})
