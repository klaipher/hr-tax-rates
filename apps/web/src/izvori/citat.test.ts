import type { LegalReference } from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
// Тести працюють з публічним входом каталогу — тим самим, який бере застосунок.
import { citat } from './index.ts'

const izvor: LegalReference = {
  jurisdiction: 'HR',
  act: 'Zakon o doprinosima',
  article: 'čl. 70.',
  gazette: 'NN 152/24',
  url: 'https://example.test/zakon',
  status: 'in-force',
  checkedOn: '2026-08-04',
}

describe('цитата джерела', () => {
  it('називає акт і статтю разом', () => {
    expect(citat(izvor)).toBe('Zakon o doprinosima, čl. 70.')
  })

  it('містить статтю дослівно, щоб видимий текст посилання лишався в його назві', () => {
    expect(citat(izvor)).toContain(izvor.article)
  })
})
