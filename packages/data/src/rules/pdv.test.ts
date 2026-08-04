import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import type { LegalReference } from '../legal.ts'
import type { Sourced } from '../sourced.ts'
import { ruleset2026 } from './hr-2026.ts'
import { PDV_IZVAN_OPSEGA, pdvPravila2026 } from './pdv.ts'

const {
  opcaStopa,
  pragUpisa,
  mjestoUslugePoreznomObvezniku,
  napomenaPrijenosaObveze,
  samoobracunNaPrimljenuUslugu,
  bezPravaNaOdbitak,
  pravoNaOdbitak,
  obvezaPdvIdentifikacijskogBroja,
  izborRedovnogPostupka,
} = pdvPravila2026

/** Кожна норма модуля разом зі статтею, яку вона зобов'язана називати. */
const norme: readonly (readonly [string, LegalReference, string])[] = [
  ['opcaStopa', opcaStopa.source, 'čl. 38. st. 1.'],
  ['pragUpisa', pragUpisa.source, 'čl. 90. st. 1.'],
  ['mjestoUslugePoreznomObvezniku', mjestoUslugePoreznomObvezniku, 'čl. 17. st. 1.'],
  ['napomenaPrijenosaObveze', napomenaPrijenosaObveze, 'čl. 79. st. 7.'],
  ['samoobracunNaPrimljenuUslugu', samoobracunNaPrimljenuUslugu, 'čl. 75. st. 1. t. 6.'],
  ['bezPravaNaOdbitak', bezPravaNaOdbitak, 'čl. 90.g'],
  ['pravoNaOdbitak', pravoNaOdbitak, 'čl. 58. st. 2.'],
  ['obvezaPdvIdentifikacijskogBroja', obvezaPdvIdentifikacijskogBroja, 'čl. 77. st. 4.'],
  ['izborRedovnogPostupka', izborRedovnogPostupka, 'čl. 90.h'],
]

describe('правила PDV 2026', () => {
  describe('числа', () => {
    it('загальна ставка — 25%', () => {
      expect(opcaStopa.value.toFixed(2)).toBe('0.25')
    })

    it('поріг обов’язкового входу в систему — 60 000 €', () => {
      expect(pragUpisa.value.toFixed(2)).toBe('60000.00')
    })

    it('поріг PDV і поріг паушалу — одне й те саме число з однієї статті', () => {
      // Паушал закінчується рівно там, де починається обов’язковий PDV, і
      // число живе в законі про PDV, а не про porez na dohodak. Два записи
      // того самого порогу мусять розходитися голосно, а не тихо.
      const pragPausala = ruleset2026.pausalniObrt.pragPrimitka

      expect(pragUpisa.value.toFixed(2)).toBe(pragPausala.value.toFixed(2))
      expect(pragUpisa.source.article).toBe(pragPausala.source.article)
    })
  })

  describe('джерела', () => {
    it.each(norme)('%s веде рівно до %s', (_naziv, source, article) => {
      expect(source.article).toBe(article)
    })

    it.each(norme)('%s цитує чинний Zakon o PDV-u', (_naziv, source) => {
      expect(source.act).toBe('Zakon o porezu na dodanu vrijednost')
      expect(source.jurisdiction).toBe('HR')
      expect(source.gazette).toMatch(/^NN \d/)
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.status).toBe('in-force')
      expect(Number.isNaN(Date.parse(source.checkedOn))).toBe(false)
    })

    it('жодна норма не позичає статтю в іншої', () => {
      // Вихідна сторона, вхідна сторона і PDV ID стоять на різних нормах.
      // Скопійована стаття зробила б посилання правдоподібним і хибним.
      const clanci = norme.map(([, source]) => source.article)

      expect(new Set(clanci).size).toBe(clanci.length)
    })
  })

  describe('свідомо не змодельоване', () => {
    it('називає рівно три теми, які модуль не рахує', () => {
      expect(PDV_IZVAN_OPSEGA.map(({ tema }) => tema)).toEqual([
        'OSS',
        'prag stjecanja dobara',
        'razmjerni odbitak',
      ])
    })

    it('кожна тема пояснена й підперта статтею', () => {
      for (const { obrazlozenje, izvor } of PDV_IZVAN_OPSEGA) {
        expect(obrazlozenje.length).toBeGreaterThan(40)
        expect(izvor.article).toMatch(/^čl\. \d/)
        expect(izvor.status).toBe('in-force')
      }
    })

    it('поріг придбання товарів названий числом і не плутається з порогом входу', () => {
      // 10 000 € — це поріг придбання товарів, а не 60 000 € порогу PDV.
      // Схлопнути їх в одне число означало б порахувати не той поріг.
      const stjecanje = PDV_IZVAN_OPSEGA.find(({ tema }) => tema === 'prag stjecanja dobara')

      expect(stjecanje?.obrazlozenje).toContain('10 000')
      expect(stjecanje?.izvor.article).toBe('čl. 5. st. 2. t. a)')
    })
  })

  describe('форма для рушія', () => {
    it('віддає рівно ті дев’ять норм, на яких стоїть розрахунок', () => {
      // Рушій оголошує свій контракт у `engine/src/pdv.ts` і не знає жодного
      // числа з закону. Поки `rules/pdv.ts` не виведений через index пакета,
      // структурну збіжність доводить тест рушія; цей стереже склад набору.
      expect(Object.keys(pdvPravila2026).sort()).toEqual([
        'bezPravaNaOdbitak',
        'izborRedovnogPostupka',
        'mjestoUslugePoreznomObvezniku',
        'napomenaPrijenosaObveze',
        'obvezaPdvIdentifikacijskogBroja',
        'opcaStopa',
        'pragUpisa',
        'pravoNaOdbitak',
        'samoobracunNaPrimljenuUslugu',
      ])
    })

    it('числові норми несуть Decimal, а не рядок чи number', () => {
      const brojevi: readonly Sourced<Decimal>[] = [opcaStopa, pragUpisa]

      for (const { value } of brojevi) expect(Decimal.isDecimal(value)).toBe(true)
    })
  })
})
