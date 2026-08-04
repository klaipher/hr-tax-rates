import { type Divergence, divergences } from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
// Тести працюють з публічним входом каталогу — тим самим, який бере застосунок.
import { poredaj, prebrojPoVrsti, predmetZapisa } from './index.ts'

const REFERENCE: Divergence['reference'] = {
  jurisdiction: 'HR',
  act: 'Zakon o doprinosima',
  article: 'čl. 7. t. 39',
  gazette: 'NN 152/24',
  url: 'https://example.test/zakon',
  status: 'in-force',
  checkedOn: '2026-08-04',
}

const formula = (id: string): Divergence => ({
  kind: 'formula',
  id,
  scenarios: ['in-force-2026'],
  sheet: 'PREGLED ',
  cells: ['B15', 'E15'],
  formulaContains: '>=60000*((',
  reason: 'причина',
  reference: REFERENCE,
})

const vrijednost = (id: string): Divergence => ({
  kind: 'value',
  id,
  scenarios: ['in-force-2026'],
  sheet: 'PREGLED ',
  cell: 'E20',
  hokValue: '100.00',
  ourValue: '120.00',
  reason: 'причина',
  reference: REFERENCE,
})

const propust = (id: string): Divergence => ({
  kind: 'omission',
  id,
  scenarios: ['announced-2027'],
  subject: 'komorski doprinos',
  absentPattern: 'komorsk',
  reason: 'причина',
  reference: REFERENCE,
})

describe('порядок записів реєстру', () => {
  it('ставить хибні формули перед іншими значеннями, а пропуски — наприкінці', () => {
    const zapisi = poredaj([propust('c'), vrijednost('b'), formula('a')])

    expect(zapisi.map(({ kind }) => kind)).toEqual(['formula', 'value', 'omission'])
  })

  it('усередині виду впорядковує за ідентифікатором', () => {
    const zapisi = poredaj([formula('b'), formula('a'), formula('c')])

    expect(zapisi.map(({ id }) => id)).toEqual(['a', 'b', 'c'])
  })

  it('не чіпає переданий перелік', () => {
    const ulaz = [propust('c'), formula('a')]
    poredaj(ulaz)

    expect(ulaz.map(({ id }) => id)).toEqual(['c', 'a'])
  })

  it('справжній реєстр упорядковується без утрати записів', () => {
    const zapisi = poredaj(divergences)

    expect(zapisi).toHaveLength(divergences.length)
    expect(new Set(zapisi.map(({ id }) => id))).toEqual(new Set(divergences.map(({ id }) => id)))
  })
})

describe('підрахунок записів за видом', () => {
  it('рахує кожен вид окремо', () => {
    expect(prebrojPoVrsti([formula('a'), formula('b'), propust('c')])).toEqual([
      { kind: 'formula', broj: 2 },
      { kind: 'omission', broj: 1 },
    ])
  })

  it('мовчить про види, яких у реєстрі немає', () => {
    expect(prebrojPoVrsti([propust('a')])).toEqual([{ kind: 'omission', broj: 1 }])
    expect(prebrojPoVrsti([])).toEqual([])
  })

  it('разом дає стільки ж, скільки записів у реєстрі', () => {
    const ukupno = prebrojPoVrsti(divergences).reduce((zbroj, { broj }) => zbroj + broj, 0)

    expect(ukupno).toBe(divergences.length)
  })
})

describe('предмет запису', () => {
  it('для хибної формули — аркуш і всі комірки', () => {
    expect(predmetZapisa(formula('a'))).toBe('PREGLED · B15, E15')
  })

  it('для іншого значення — аркуш і комірка', () => {
    expect(predmetZapisa(vrijednost('a'))).toBe('PREGLED · E20')
  })

  it('для пропуску — сам платіж, якого HOK не рахує', () => {
    expect(predmetZapisa(propust('a'))).toBe('komorski doprinos')
  })

  it('розрізняє всі записи справжнього реєстру', () => {
    const predmeti = divergences.map(predmetZapisa)

    expect(new Set(predmeti).size).toBe(divergences.length)
    for (const predmet of predmeti) expect(predmet).not.toBe('')
  })
})
