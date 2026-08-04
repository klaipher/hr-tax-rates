import { describe, expect, it } from 'vitest'
import { assertMatchesHok } from '../hok/compare.ts'
import type { HokCellRef } from '../hok/types.ts'
import { hokFormula, hokRawValue } from '../hok/workbook.ts'
import type { Sourced } from '../sourced.ts'
import { pretpostavke2026, ruleset2026 } from './hr-2026.ts'
import { obrtNaDohodak2026 } from './porez-na-dohodak.ts'

const { porez, doprinosi } = obrtNaDohodak2026
const { osobniOdbitak, progresija, nepriznatiIzdaci } = porez
const { pausalniObrt } = ruleset2026

/** Кожне юридичне число модуля разом зі своєю назвою — для обходу джерел. */
const pravniBrojevi: readonly (readonly [string, Sourced<unknown>])[] = [
  ['osnovniOsobniOdbitak', osobniOdbitak.osnovni],
  ['koeficijentUzdrzavanogClana', osobniOdbitak.koeficijentUzdrzavanogClana],
  ['koeficijentiDjece', osobniOdbitak.koeficijentiDjece],
  ['pragViseStope', progresija.pragViseStope],
  ['nepriznatiDioReprezentacije', nepriznatiIzdaci.reprezentacija],
  ['nepriznatiDioOsobnogVozila', nepriznatiIzdaci.osobnoVozilo],
  ['koeficijentOsnovice', doprinosi.koeficijent],
]

const SCENARIO = 'in-force-2026' as const
const UNOS = 'PRVO UNESITE PODATKE'
const PREGLED = 'PREGLED MOGUĆNOSTI '

const unosnaCelija = (cell: string): HokCellRef => ({ scenario: SCENARIO, sheet: UNOS, cell })

/**
 * Рядок таблиці `osobni odbitak` у книзі HOK: у стовпці G підпис, у стовпці I
 * готова місячна сума. Підпис звіряється разом із сумою — інакше зсув рядка у
 * фікстурі мовчки перевів би тест на чужий коефіцієнт.
 */
const redakOdbitka = (redak: number, natpis: string): string => {
  expect(hokRawValue(unosnaCelija(`G${redak}`))).toBe(natpis)
  return `I${redak}`
}

describe('правила obrt na dohodak 2026', () => {
  describe('osobni odbitak', () => {
    it('основний розмір збігається з таблицею HOK', () => {
      assertMatchesHok({
        ...unosnaCelija(redakOdbitka(7, 'osnovni osobni odbitak')),
        actual: osobniOdbitak.osnovni.value.toFixed(2),
      })
    })

    it('коефіцієнт утриманця дає ту саму суму, що й HOK', () => {
      const iznos = osobniOdbitak.osnovni.value.times(
        osobniOdbitak.koeficijentUzdrzavanogClana.value,
      )

      assertMatchesHok({
        ...unosnaCelija(redakOdbitka(8, 'uzdržavani član')),
        actual: iznos.toFixed(2),
      })
    })

    // HOK друкує лише сімох дітей, закон — дев'ятьох. Звіряємо перетин: далі
    // еталона просто немає, і вигадувати його з чужої таблиці не можна.
    const djecaUHok: readonly (readonly [number, string])[] = [
      [9, 'prvo dijete'],
      [10, 'drugo dijete'],
      [11, 'treće dijete'],
      [12, 'četvrto dijete'],
      [13, 'peto dijete'],
      [14, 'šesto dijete'],
      [15, 'sedmo dijete'],
    ]

    it.each(djecaUHok)('коефіцієнт дитини з рядка %i (%s) сходиться з HOK', (redak, natpis) => {
      const koeficijent = osobniOdbitak.koeficijentiDjece.value[redak - 9]
      expect(koeficijent).toBeDefined()

      assertMatchesHok({
        ...unosnaCelija(redakOdbitka(redak, natpis)),
        actual: osobniOdbitak.osnovni.value.times(koeficijent ?? 0).toFixed(2),
      })
    })

    it("покриває дев'ятьох дітей — стільки, скільки друкує закон", () => {
      expect(osobniOdbitak.koeficijentiDjece.value).toHaveLength(9)
    })

    it('коефіцієнти дітей зростають', () => {
      const koeficijenti = osobniOdbitak.koeficijentiDjece.value.map((k) => k.toNumber())

      expect(koeficijenti).toEqual([...koeficijenti].sort((a, b) => a - b))
      expect(new Set(koeficijenti).size).toBe(koeficijenti.length)
    })
  })

  describe('прогресія', () => {
    it('поріг вищої ставки — 60 000 € porezne osnovice', () => {
      expect(progresija.pragViseStope.value.toFixed(2)).toBe('60000.00')
    })

    it('поріг узятий із закону про porez na dohodak, а не з порога паушалу', () => {
      // Числа збіглися, поняття різні: поріг паушалу міряється по `primitak`
      // і живе в законі про PDV, а цей — по `porezna osnovica`, čl. 19. Тому
      // те, що вони однакові, звірці не підлягає — звірці підлягає джерело.
      expect(progresija.pragViseStope.source.act).toBe('Zakon o porezu na dohodak')
      expect(progresija.pragViseStope.source.article).toBe('čl. 19.')
      expect(pausalniObrt.pragPrimitka.source.act).toBe('Zakon o porezu na dodanu vrijednost')
    })
  })

  describe('невизнані izdatak', () => {
    it('половина reprezentacije не визнається', () => {
      expect(nepriznatiIzdaci.reprezentacija.value.toFixed(2)).toBe('0.50')
    })

    it('половина витрат на особистий автомобіль не визнається', () => {
      expect(nepriznatiIzdaci.osobnoVozilo.value.toFixed(2)).toBe('0.50')
    })

    it('обидві частки — з різних пунктів čl. 33.', () => {
      expect(nepriznatiIzdaci.reprezentacija.source.article).toBe('čl. 33. st. 1. t. 1.')
      expect(nepriznatiIzdaci.osobnoVozilo.source.article).toBe('čl. 33. st. 1. t. 5.')
    })

    it('HOK повертає ту саму половину назад у dohodak', () => {
      // У HOK обидві статті спершу входять у загальний izdatak повністю, а
      // потім половина додається назад. Наш бік визнає їх наполовину одразу —
      // результат той самий, і саме це підтверджує фрагмент формули.
      expect(hokFormula({ scenario: SCENARIO, sheet: PREGLED, cell: 'B9' })).toContain(
        "('PRVO UNESITE PODATKE'!C15+'PRVO UNESITE PODATKE'!C16)*0.5",
      )
    })
  })

  describe('osnovica doprinosa', () => {
    it('коефіцієнт із двома шарами дає суму, яку друкує Naredba', () => {
      // Naredba o iznosima osnovica za obračun doprinosa za obvezna osiguranja
      // za 2026. godinu (NN 150/25), čl. 6, шифра 0101 «djelatnost obrta –
      // utvrđuje dohodak od samostalne djelatnosti»: 1 295,45 €. Числа ми не
      // зберігаємо — воно має вийти саме, з prosječna plaća та koeficijent.
      const osnovica = pretpostavke2026.prosjecnaPlaca.value.times(doprinosi.koeficijent.value)

      expect(osnovica.toFixed(2)).toBe('1295.45')
    })

    it('та сама osnovica стоїть у формулі HOK', () => {
      expect(hokFormula({ scenario: SCENARIO, sheet: PREGLED, cell: 'B5' })).toContain('1295.45')
    })

    it('коефіцієнт вищий за паушальний — режим коштує дорожче', () => {
      // Не «0,65 більше за 0,4»: паушальне число береться з набору правил, а
      // не переписується сюди вдруге. Порівняння лишається правдивим і тоді,
      // коли законодавець зрушить будь-яке з двох.
      expect(doprinosi.koeficijent.value.greaterThan(pausalniObrt.koeficijent.value)).toBe(true)
    })
  })

  describe('джерела', () => {
    it.each(pravniBrojevi)('%s веде до статті чинного акта', (_naziv, { source }) => {
      expect(source.article).toMatch(/^čl\. \d/)
      expect(source.gazette).toMatch(/^NN \d/)
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.status).toBe('in-force')
      expect(Number.isNaN(Date.parse(source.checkedOn))).toBe(false)
    })

    it('коефіцієнт osnovice взятий із закону про внески, а не про податок', () => {
      expect(doprinosi.koeficijent.source.act).toBe('Zakon o doprinosima')
      expect(doprinosi.koeficijent.source.article).toBe('čl. 66. st. 1. t. 1.')
    })
  })
})
