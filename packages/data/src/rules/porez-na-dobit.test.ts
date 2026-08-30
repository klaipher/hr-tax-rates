import type Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import type { Sourced } from '../sourced.ts'
import { pretpostavke2026 } from './hr-2026.ts'
import { obrtNaDobit2026 } from './porez-na-dobit.ts'

/**
 * Правила `obrt na dobit` (обрт у системі porez na dobit).
 *
 * Тест сторожить не арифметику — її рахує рушій, — а те, що кожне число
 * веде до своєї статті (ADR-0002). Режим цитує три акти одразу, і сплутати
 * їх легко: `porez na dobit` бере ставку з одного закону, `poduzetnička
 * plaća` — коефіцієнт з другого й особистий відрахунок із третього.
 */

const svaSourced: readonly (readonly [string, Sourced<Decimal>])[] = [
  ['nizaStopa', obrtNaDobit2026.porezNaDobit.nizaStopa],
  ['visaStopa', obrtNaDobit2026.porezNaDobit.visaStopa],
  ['pragPrihoda', obrtNaDobit2026.porezNaDobit.pragPrihoda],
  ['koeficijent', obrtNaDobit2026.poduzetnickaPlaca.koeficijent],
  ['osnovniOsobniOdbitak', obrtNaDobit2026.poduzetnickaPlaca.osnovniOsobniOdbitak],
  ['mjesecniPragViseStope', obrtNaDobit2026.poduzetnickaPlaca.mjesecniPragViseStope],
  ['stopaPorezaNaIsplatuDobiti', obrtNaDobit2026.stopaPorezaNaIsplatuDobiti],
]

describe('правила obrt na dobit на 2026', () => {
  describe('porez na dobit', () => {
    it('має дві ставки, і вища втричі не дорівнює нижчій', () => {
      const { nizaStopa, visaStopa } = obrtNaDobit2026.porezNaDobit

      expect(nizaStopa.value.toString()).toBe('0.1')
      expect(visaStopa.value.toString()).toBe('0.18')
    })

    it('розводить ставки порогом річних prihodi, а не dobit', () => {
      // Ставку визначає виручка за методом нарахування, а не прибуток: обрт
      // із мільйонним prihod і нульовою dobit усе одно в системі вищої ставки.
      expect(obrtNaDobit2026.porezNaDobit.pragPrihoda.value.toString()).toBe('1000000')
    })

    it('веде обидві ставки до статті про ставку', () => {
      const { nizaStopa, visaStopa, pragPrihoda } = obrtNaDobit2026.porezNaDobit

      expect(nizaStopa.source.act).toBe('Zakon o porezu na dobit')
      expect(nizaStopa.source.article).toBe('čl. 28. t. 1.')
      expect(visaStopa.source.article).toBe('čl. 28. t. 2.')
      expect(pragPrihoda.source.article).toBe('čl. 28.')
    })
  })

  describe('poduzetnička plaća', () => {
    it('бере koeficijent найнижчої osnovica із закону про внески', () => {
      const { koeficijent } = obrtNaDobit2026.poduzetnickaPlaca

      expect(koeficijent.value.toString()).toBe('1.1')
      expect(koeficijent.source.act).toBe('Zakon o doprinosima')
      expect(koeficijent.source.article).toBe('čl. 82. st. 2.')
    })

    it('дає ту саму osnovica, що й опублікована Naredba на 2026', () => {
      // Naredba o iznosima osnovica za 2026. (NN 150/25, čl. 6. r. br. 2)
      // друкує для «djelatnost obrta – utvrđuje dobit» 2 192,30 €. Число
      // тут не записане — воно виходить із двох шарів: prosječna plaća зі
      // статистики × koeficijent із закону (ADR-0001). Тест ловить розхід
      // між шарами, а не переписує підсумок.
      const osnovica = pretpostavke2026.prosjecnaPlaca.value.times(
        obrtNaDobit2026.poduzetnickaPlaca.koeficijent.value,
      )

      expect(osnovica.toFixed(2)).toBe('2192.30')
    })

    it('несе основний osobni odbitak і місячний поріг вищої ставки', () => {
      const { osnovniOsobniOdbitak, mjesecniPragViseStope } = obrtNaDobit2026.poduzetnickaPlaca

      expect(osnovniOsobniOdbitak.value.toFixed(2)).toBe('600.00')
      expect(osnovniOsobniOdbitak.source.article).toBe('čl. 14. st. 1.')
      expect(mjesecniPragViseStope.value.toString()).toBe('5000')
      expect(mjesecniPragViseStope.source.article).toBe('čl. 24. st. 3.')
    })

    it('веде саме правило «plaća і є osnovica» до своєї статті', () => {
      // Правило числом не є, але без статті воно так само нічим не
      // підтверджене, як і ставка без джерела (ADR-0002).
      const { izvorOsnovice } = obrtNaDobit2026.poduzetnickaPlaca

      expect(izvorOsnovice.act).toBe('Zakon o doprinosima')
      expect(izvorOsnovice.article).toBe('čl. 82.')
      expect(izvorOsnovice.status).toBe('in-force')
    })

    it('веде plaća до закону про porez na dohodak, а не про dobit', () => {
      // `poduzetnička plaća` оподатковується як plaća і лише зменшує базу
      // porez na dobit — це два різні закони, і сплутати їх означало б
      // оподаткувати зарплату власника ставкою прибутку.
      const { osnovniOsobniOdbitak, mjesecniPragViseStope } = obrtNaDobit2026.poduzetnickaPlaca

      expect(osnovniOsobniOdbitak.source.act).toBe('Zakon o porezu na dohodak')
      expect(mjesecniPragViseStope.source.act).toBe('Zakon o porezu na dohodak')
    })
  })

  describe('податок на виплату dobit власнику', () => {
    it('бере 12% зі статті про dohodak od kapitala', () => {
      const { stopaPorezaNaIsplatuDobiti } = obrtNaDobit2026

      expect(stopaPorezaNaIsplatuDobiti.value.toString()).toBe('0.12')
      expect(stopaPorezaNaIsplatuDobiti.source.act).toBe('Zakon o porezu na dohodak')
      expect(stopaPorezaNaIsplatuDobiti.source.article).toBe('čl. 70. st. 19.')
    })
  })

  describe('джерела', () => {
    it('кожне число несе чинну статтю, посилання й дату звірки', () => {
      for (const [naziv, broj] of svaSourced) {
        expect(broj.source.article, naziv).not.toBe('')
        expect(broj.source.url, naziv).toMatch(/^https:\/\//)
        expect(broj.source.status, naziv).toBe('in-force')
        expect(broj.source.checkedOn, naziv).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(broj.source.jurisdiction, naziv).toBe('HR')
      }
    })

    it('цитує рівно три акти — по одному на кожен податок і на внески', () => {
      const akti = new Set(svaSourced.map(([, broj]) => broj.source.act))

      expect([...akti].sort()).toEqual([
        'Zakon o doprinosima',
        'Zakon o porezu na dobit',
        'Zakon o porezu na dohodak',
      ])
    })
  })
})
