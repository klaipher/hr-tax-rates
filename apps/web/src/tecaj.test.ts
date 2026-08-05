import type { ExchangeRate } from '@hr-tax/data'
import { NBU_EUR_UAH_SNAPSHOT } from '@hr-tax/data'
import { eur } from '@hr-tax/engine'
import { describe, expect, it } from 'vitest'
import { pocetniRucniTecaj, rucniTecajZa, uEure } from './tecaj.ts'

/** `Decimal` створюється рушієм: застосунок бібліотеки не тягне. */
const broj = (vrijednost: string) => eur(vrijednost).amount

const TECAJ: ExchangeRate = {
  base: 'EUR',
  quote: 'UAH',
  value: broj('50'),
  asOf: '2026-03-14',
  origin: { kind: 'nbu-live', url: 'https://bank.gov.ua' },
}

describe('ручний курс', () => {
  it('порожнє поле означає «беремо ланцюжок», а не нуль', () => {
    expect(rucniTecajZa({ vrijednost: '', naDan: '2026-03-14' })).toBeUndefined()
    expect(rucniTecajZa({ vrijednost: '   ', naDan: '2026-03-14' })).toBeUndefined()
  })

  it('число з поля перебиває ланцюжок разом із датою, на яку воно дійсне', () => {
    expect(rucniTecajZa({ vrijednost: '48.5', naDan: '2026-03-14' })).toEqual({
      value: '48.5',
      asOf: '2026-03-14',
    })
  })

  it('недодатний і нечисловий курс не стає ручним — інакше поділили б на нуль', () => {
    for (const vrijednost of ['0', '-1', 'сорок', '1,5']) {
      expect(rucniTecajZa({ vrijednost, naDan: '2026-03-14' }), vrijednost).toBeUndefined()
    }
  })

  it('поле починається порожнім: спершу питаємо НБУ, а не себе', () => {
    // Курс, вписаний у поле від початку, перебив би живий запит ще до того,
    // як той відбувся, — і ланцюжок ніколи не дійшов би до НБУ.
    expect(pocetniRucniTecaj.vrijednost).toBe('')
    expect(pocetniRucniTecaj.naDan).toBe(NBU_EUR_UAH_SNAPSHOT.asOf)
  })
})

describe('перерахунок гривень у євро', () => {
  it('ділить на той самий курс, яким гроші дістали', () => {
    expect(uEure(broj('1000'), TECAJ).amount.toFixed(2)).toBe('20.00')
    expect(uEure(broj('1000'), TECAJ).currency).toBe('EUR')
  })

  it('рахує в Decimal, а не в float', () => {
    // Ділення у float одразу з'їдає знаки; `Decimal` тримає свою точність.
    const rate: ExchangeRate = { ...TECAJ, value: broj('3') }

    expect(uEure(broj('1'), rate).amount.toFixed(20)).toBe('0.33333333333333333333')
  })
})
