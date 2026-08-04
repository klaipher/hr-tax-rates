import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { ODLUKA_O_KOMORSKOM_DOPRINOSU } from '../legal.ts'
import { godisnjiZbroj, type LevyResult, levyDue, levyNotApplicable } from './levy.ts'

const IZVOR = {
  ...ODLUKA_O_KOMORSKOM_DOPRINOSU,
  article: 'čl. 6. st. 1.',
  checkedOn: '2026-08-04',
} as const

describe('підсумок обов’язкових платежів', () => {
  it('складає лише нараховані платежі', () => {
    const results: readonly LevyResult[] = [
      levyDue(new Decimal('136.80'), 'перший', IZVOR),
      levyDue(new Decimal('56.85'), 'другий', IZVOR),
    ]
    expect(godisnjiZbroj(results).toFixed(2)).toBe('193.65')
  })

  it('не змішує ненарахований платіж із нулем: сума ігнорує його, але сам запис лишається', () => {
    const skipped = levyNotApplicable('djelatnost-izvan-popisa', 'бо не той NKD', IZVOR)
    const results: readonly LevyResult[] = [
      levyDue(new Decimal('136.80'), 'перший', IZVOR),
      skipped,
    ]

    expect(godisnjiZbroj(results).toFixed(2)).toBe('136.80')
    // Головна вимога тікета: «не застосовується» має лишатися видимим, а не
    // розчинятися в нулі. Тому запис зберігає і причину, і статтю закону.
    expect(skipped.kind).toBe('not-applicable')
    expect(skipped.reason).toBe('djelatnost-izvan-popisa')
    expect(skipped.source.article).toBe('čl. 6. st. 1.')
  })

  it('порожній перелік дає нуль, а не NaN', () => {
    expect(godisnjiZbroj([]).toFixed(2)).toBe('0.00')
  })

  it('не накопичує дрейф float на центах', () => {
    const results = [
      levyDue(new Decimal('0.1'), 'а', IZVOR),
      levyDue(new Decimal('0.2'), 'б', IZVOR),
    ]
    expect(godisnjiZbroj(results).toString()).toBe('0.3')
  })
})
