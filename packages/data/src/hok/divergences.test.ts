import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { divergences } from './divergences.ts'
import { hokCell, hokRawValue, hokSheetNames, hokWorkbook } from './workbook.ts'

describe('реєстр розбіжностей', () => {
  it('має унікальні ідентифікатори', () => {
    const ids = divergences.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('кожен запис несе посилання на джерело права', () => {
    for (const divergence of divergences) {
      expect(divergence.reference.act).not.toBe('')
      expect(divergence.reference.article).not.toBe('')
      expect(divergence.reference.url).toMatch(/^https:\/\//)
      expect(divergence.reference.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  // Далі — сторожі від застарілого реєстру. Якщо HOK виправить свій файл,
  // запис перестане відтворюватися і тест впаде: реєстр не має заростати
  // мертвими записами, інакше він перестає бути доказом.

  it('дефект формули ще присутній у файлі HOK', () => {
    for (const divergence of divergences) {
      if (divergence.kind !== 'formula') continue
      for (const scenario of divergence.scenarios) {
        for (const cell of divergence.cells) {
          const { formula } = hokCell({ scenario, sheet: divergence.sheet, cell })
          expect(formula, `${divergence.id} / ${scenario} / ${cell}`).toContain(
            divergence.formulaContains,
          )
        }
      }
    }
  })

  it('значення HOK у записі про розбіжність усе ще таке, як записано', () => {
    for (const divergence of divergences) {
      if (divergence.kind !== 'value') continue
      for (const scenario of divergence.scenarios) {
        const raw = hokRawValue({ scenario, sheet: divergence.sheet, cell: divergence.cell })
        const cents = new Decimal(raw).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2)
        expect(cents, `${divergence.id} / ${scenario}`).toBe(divergence.hokValue)
      }
    }
  })

  it('пропущене в HOK досі відсутнє', () => {
    for (const divergence of divergences) {
      if (divergence.kind !== 'omission') continue
      const pattern = new RegExp(divergence.absentPattern, 'i')
      for (const scenario of divergence.scenarios) {
        const { sheets } = hokWorkbook(scenario)
        for (const sheet of hokSheetNames(scenario)) {
          const cells = sheets[sheet] ?? {}
          for (const [ref, cell] of Object.entries(cells)) {
            expect(
              pattern.test(cell.value ?? '') || pattern.test(cell.formula ?? ''),
              `${divergence.id}: ${scenario} / ${sheet}!${ref} згадує пропущене`,
            ).toBe(false)
          }
        }
      }
    }
  })

  it('містить усі відомі помилки HOK і пропущений внесок до палати', () => {
    expect(divergences.map((d) => d.id).sort()).toEqual([
      'higher-rate-formula-always-zero',
      'komorski-doprinos-omitted',
      'stale-contribution-cap-for-second-activity',
      'unfounded-cent-in-poduzetnicka-placa',
    ])
  })
})
