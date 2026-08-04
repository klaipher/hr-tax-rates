import { describe, expect, it } from 'vitest'
import { jedinicaBySifra, resolveStope, searchJedinice } from './directory.ts'
import type { JedinicaLokalneSamouprave } from './types.ts'

/** Довідник має віддати саме цю одиницю, інакше тест не має що перевіряти. */
const bySifra = (sifra: string): JedinicaLokalneSamouprave => {
  const jedinica = jedinicaBySifra(sifra)
  if (jedinica === undefined) throw new Error(`У довіднику немає шифри ${sifra}`)
  return jedinica
}

describe('searchJedinice', () => {
  it('знаходить одиницю за точною назвою', () => {
    expect(searchJedinice('ANDRIJAŠEVCI').map(({ sifra }) => sifra)).toEqual(['19'])
  })

  it('не зважає на регістр', () => {
    expect(searchJedinice('osijek').map(({ ime }) => ime)).toEqual(['OSIJEK'])
  })

  it('віддає всі назви, що містять запит, а не лише точний збіг', () => {
    expect(searchJedinice('rijeka').map(({ ime }) => ime)).toEqual(['GORNJA RIJEKA', 'RIJEKA'])
  })

  it('не зважає на діакритику в назві', () => {
    expect(searchJedinice('sibenik').map(({ ime }) => ime)).toEqual(['ŠIBENIK'])
  })

  it('зводить `đ` до `d` — самої лише нормалізації Unicode для цього мало', () => {
    // NFD розкладає `Š` на `S` + діакритик, але `Đ` — окрема літера і не
    // розкладається. Без окремого правила ĐAKOVO не знайшовся б ніколи.
    expect(searchJedinice('dakovo').map(({ ime }) => ime)).toEqual(['ĐAKOVO'])
  })

  it('однаково розуміє запит із діакритикою і без неї', () => {
    expect(searchJedinice('Đakovo')).toEqual(searchJedinice('dakovo'))
  })

  it('шукає підрядок, а не лише початок назви', () => {
    expect(searchJedinice('ska vod').map(({ ime }) => ime)).toEqual(['BAŠKA VODA'])
  })

  it('віддає всі однойменні одиниці, бо ставки в них різні', () => {
    const otoci = searchJedinice('OTOK')

    expect(otoci.map(({ sifra, stope }) => [sifra, stope.niza, stope.visa])).toEqual([
      ['3140', 1700, 2700],
      ['5355', 2000, 3000],
    ])
  })

  it('на порожній запит віддає весь довідник — це список для вибору', () => {
    expect(searchJedinice('  ')).toHaveLength(556)
  })

  it('на невідому назву не вигадує нічого', () => {
    expect(searchJedinice('Лохвиця')).toEqual([])
  })
})

describe('jedinicaBySifra', () => {
  it('розрізняє однойменні одиниці за шифрою', () => {
    expect(bySifra('3140').ime).toBe('OTOK')
    expect(bySifra('5355').ime).toBe('OTOK')
    expect(bySifra('3140').stope.niza).toBe(1700)
    expect(bySifra('5355').stope.niza).toBe(2000)
  })

  it('не знає неіснуючої шифри', () => {
    expect(jedinicaBySifra('0')).toBeUndefined()
  })
})

describe('resolveStope', () => {
  it('без ручних ставок бере ставки з `odluka` одиниці', () => {
    expect(resolveStope({ jedinica: bySifra('3140') })).toEqual({
      niza: 1700,
      visa: 2700,
      izvor: 'odluka',
    })
  })

  it('ручні ставки б’ють довідник', () => {
    expect(
      resolveStope({ jedinica: bySifra('3140'), rucnoZadano: { niza: 2000, visa: 3000 } }),
    ).toEqual({ niza: 2000, visa: 3000, izvor: 'rucno' })
  })

  it('відмовляється від нижчої ставки, якої закон не дозволяє', () => {
    expect(() =>
      resolveStope({ jedinica: bySifra('3140'), rucnoZadano: { niza: 1400, visa: 3000 } }),
    ).toThrow(/čl\. 19\.a/)
  })

  it('відмовляється від вищої ставки, якої закон не дозволяє', () => {
    expect(() =>
      resolveStope({ jedinica: bySifra('3140'), rucnoZadano: { niza: 2000, visa: 3400 } }),
    ).toThrow(/čl\. 19\.a/)
  })
})
