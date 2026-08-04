import { describe, expect, it } from 'vitest'
import { graniceStopa, najsireGranice, uGranicama } from './granice.ts'

describe('najsireGranice', () => {
  it('збігаються з межами Grada Zagreba — найширшими за законом', () => {
    expect(najsireGranice).toEqual(graniceStopa.value['grad-zagreb'])
  })

  it('несуть посилання на статтю, яка їх установлює', () => {
    expect(graniceStopa.source.article).toBe('čl. 19.a st. 2.')
    expect(graniceStopa.source.act).toBe('Zakon o porezu na dohodak')
  })
})

describe('uGranicama', () => {
  it('приймає найнижчу пару, яку закон дозволяє', () => {
    expect(uGranicama({ niza: 1500, visa: 2500 })).toBe(true)
  })

  it('приймає найвищу пару, яку закон дозволяє', () => {
    expect(uGranicama({ niza: 2300, visa: 3300 })).toBe(true)
  })

  it('відкидає нижчу ставку під межею', () => {
    expect(uGranicama({ niza: 1499, visa: 2500 })).toBe(false)
  })

  it('відкидає вищу ставку над межею', () => {
    expect(uGranicama({ niza: 1500, visa: 3301 })).toBe(false)
  })

  it('відкидає переставлену пару', () => {
    // 30 % на місці нижчої ставки — законних меж нижчої це не сягає, і саме
    // так має впасти переплутаний порядок колонок у джерелі.
    expect(uGranicama({ niza: 3000, visa: 2000 })).toBe(false)
  })
})
