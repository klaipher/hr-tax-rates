import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { parseRazredChain } from '../hok/brackets.ts'
import { assertMatchesHok } from '../hok/compare.ts'
import type { HokCellRef } from '../hok/types.ts'
import { hokFormula } from '../hok/workbook.ts'
import type { Sourced } from '../sourced.ts'
import { pretpostavke2026, ruleset2026 } from './hr-2026.ts'
import { pretpostavkeNajave2027, razrediNajave2027, rulesetNajave2027 } from './najava-2027.ts'

const MJESECI_U_GODINI = 12

/** Ставки doprinosi разом: 36,5% від osnovica. Проєкт їх не чіпає. */
const STOPA_DOPRINOSA = ruleset2026.doprinosi.stopaMoPrviStup.value
  .plus(ruleset2026.doprinosi.stopaMoDrugiStup.value)
  .plus(ruleset2026.doprinosi.stopaZo.value)

/** Комірка аркуша «OBRT izbor paušalno oporezivanje» книги HOK на 2027. */
const najavaCelija = (cell: string): HokCellRef => ({
  scenario: 'announced-2027',
  sheet: 'PREGLED MOGUĆNOSTI ',
  cell,
})

/**
 * Таблиця розрядів прямо з формули HOK. Кешоване значення комірки тут не
 * годиться: воно порахувало б лише перший розряд.
 */
const hokRazredi = parseRazredChain(hokFormula(najavaCelija('C13')))

const razredZa = (redniBroj: number) => {
  const razred = razrediNajave2027.find((kandidat) => kandidat.redniBroj === redniBroj)
  if (razred === undefined) throw new Error(`Немає розряду ${redniBroj}`)
  return razred
}

/** Ставка паушалу одна на всю таблицю, тож і береться один раз. */
const STOPA_POREZA = rulesetNajave2027(0).pausalniObrt.stopaPoreza.value

const godisnjiPorez = (redniBroj: number): Decimal =>
  razredZa(redniBroj).godisnjiPausalniDohodak.times(STOPA_POREZA)

/** Річні doprinosi розряду за заданою prosječna plaća — два шари разом. */
const godisnjiDoprinosi = (redniBroj: number, prosjecnaPlaca: Decimal): Decimal =>
  prosjecnaPlaca
    .times(razredZa(redniBroj).koeficijent)
    .times(STOPA_DOPRINOSA)
    .times(MJESECI_U_GODINI)
    .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)

describe('ruleset запланованих змін на 2027', () => {
  describe('таблиця розрядів', () => {
    it('має сім розрядів, пронумерованих підряд', () => {
      expect(razrediNajave2027.map((razred) => razred.redniBroj)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('paušalni dohodak кожного розряду — це його стеля без визнаних видатків', () => {
      // Законопроєкт друкує обидва стовпці окремо, і переписані вони теж
      // окремо. Рівність ловить описку в будь-якому з них: 70% від 50 000 дає
      // 15 000, і жодне інше число поруч не стоятиме.
      for (const {
        redniBroj,
        gornjaGranica,
        priznatiIzdatak,
        godisnjiPausalniDohodak,
      } of razrediNajave2027) {
        expect([redniBroj, godisnjiPausalniDohodak.toFixed(2)]).toEqual([
          redniBroj,
          gornjaGranica.times(new Decimal(1).minus(priznatiIzdatak)).toFixed(2),
        ])
      }
    })

    it('закінчується рівно на порозі паушального оподаткування', () => {
      expect(razrediNajave2027.at(-1)?.gornjaGranica.toFixed(2)).toBe(
        rulesetNajave2027(0).pausalniObrt.pragPrimitka.value.toFixed(2),
      )
    })
  })

  describe('нижче 40 000 € не змінюється нічого', () => {
    const razrediBezPromjene = razrediNajave2027.filter((razred) =>
      razred.gornjaGranica.lessThanOrEqualTo(40_000),
    )

    it('розряди 1–5 мають ті самі межі й той самий paušalni dohodak', () => {
      const naSnazi = ruleset2026.pausalniObrt.razredi.value.slice(0, razrediBezPromjene.length)

      expect(
        razrediBezPromjene.map((razred) => [
          razred.gornjaGranica.toFixed(2),
          razred.godisnjiPausalniDohodak.toFixed(2),
        ]),
      ).toEqual(
        naSnazi.map((razred) => [
          razred.gornjaGranica.toFixed(2),
          razred.godisnjiPausalniDohodak.toFixed(2),
        ]),
      )
    })

    it('розряди 1–5 лишають priznati izdatak і koeficijent чинними', () => {
      for (const razred of razrediBezPromjene) {
        expect([
          razred.redniBroj,
          razred.priznatiIzdatak.toFixed(2),
          razred.koeficijent.toFixed(2),
        ]).toEqual([
          razred.redniBroj,
          ruleset2026.pausalniObrt.priznatiIzdatak.value.toFixed(2),
          ruleset2026.pausalniObrt.koeficijent.value.toFixed(2),
        ])
      }
    })

    it('змінюються рівно шостий і сьомий розряди', () => {
      const promijenjeni = razrediNajave2027.filter(
        (razred) =>
          !razred.priznatiIzdatak.equals(ruleset2026.pausalniObrt.priznatiIzdatak.value) ||
          !razred.koeficijent.equals(ruleset2026.pausalniObrt.koeficijent.value),
      )

      expect(promijenjeni.map((razred) => razred.redniBroj)).toEqual([6, 7])
    })
  })

  describe('нові числа', () => {
    it('priznati izdatak падає до 70% і 55%', () => {
      expect([
        razrediNajave2027[5]?.priznatiIzdatak.toFixed(2),
        razrediNajave2027[6]?.priznatiIzdatak.toFixed(2),
      ]).toEqual(['0.70', '0.55'])
    })

    it('koeficijent росте до 0,45 і 0,50', () => {
      expect([
        razrediNajave2027[5]?.koeficijent.toFixed(2),
        razrediNajave2027[6]?.koeficijent.toFixed(2),
      ]).toEqual(['0.45', '0.50'])
    })

    it('річний paušalni porez шостого і сьомого розрядів — 1 800 € і 3 240 €', () => {
      expect([godisnjiPorez(6).toFixed(2), godisnjiPorez(7).toFixed(2)]).toEqual([
        '1800.00',
        '3240.00',
      ])
    })
  })

  describe('матеріалізація набору правил під конкретний primitak', () => {
    it.each([
      ['0', '0.85', '0.4'],
      ['40000', '0.85', '0.4'],
      ['40000.01', '0.7', '0.45'],
      ['50000', '0.7', '0.45'],
      ['50000.01', '0.55', '0.5'],
      ['60000', '0.55', '0.5'],
    ])('primitak %s € бере izdatak %s і koeficijent %s', (primitak, izdatak, koeficijent) => {
      const { pausalniObrt } = rulesetNajave2027(primitak)

      expect([
        pausalniObrt.priznatiIzdatak.value.toString(),
        pausalniObrt.koeficijent.value.toString(),
      ]).toEqual([izdatak, koeficijent])
    })

    it('понад поріг бере найвищий розряд', () => {
      // Режиму там уже немає — рушій відмовить за порогом. Набір правил усе
      // одно мусить бути визначеним, інакше відмова залежала б від того, які
      // числа встигли підставитися.
      expect(rulesetNajave2027('70000').pausalniObrt.koeficijent.value.toString()).toBe('0.5')
    })

    it('таблиця розрядів не залежить від primitak', () => {
      expect(rulesetNajave2027(0).pausalniObrt.razredi.value).toBe(
        rulesetNajave2027('60000').pausalniObrt.razredi.value,
      )
    })
  })

  describe('звірка з калькулятором HOK на 2027', () => {
    it('HOK знає рівно сім розрядів', () => {
      // Сторож від мовчазного звуження оракула: якби розбір формули загубив
      // розряд, перевірки нижче просто перестали б його бачити.
      expect(hokRazredi).toHaveLength(7)
    })

    it('межі й річний paušalni porez збігаються з таблицею HOK', () => {
      expect(
        hokRazredi.map((razred) => [
          new Decimal(razred.gornjaGranica).toFixed(2),
          new Decimal(razred.iznos).toFixed(2),
        ]),
      ).toEqual(
        razrediNajave2027.map((razred) => [
          razred.gornjaGranica.toFixed(2),
          godisnjiPorez(razred.redniBroj).toFixed(2),
        ]),
      )
    })

    it('кешовані комірки книги сходяться за нульового primitak', () => {
      // `assertMatchesHok`, а не `checkAgainstHok`: перший валить виклик на
      // незареєстрованій розбіжності, другий лише повертає статус, і той, хто
      // забуде його перевірити, отримає зелений тест на розбіжності (ADR-0003).
      const prosjecnaPlaca = pretpostavkeNajave2027.prosjecnaPlaca.value

      expect(
        assertMatchesHok({ ...najavaCelija('C13'), actual: godisnjiPorez(1).toString() }).status,
      ).toBe('match')
      expect(
        assertMatchesHok({
          ...najavaCelija('C5'),
          actual: godisnjiDoprinosi(1, prosjecnaPlaca).div(MJESECI_U_GODINI).toString(),
        }).status,
      ).toBe('match')
      expect(
        assertMatchesHok({
          ...najavaCelija('C6'),
          actual: godisnjiDoprinosi(1, prosjecnaPlaca).toString(),
        }).status,
      ).toBe('match')
    })
  })

  describe('шари даних', () => {
    it('ті самі правила над іншою prosječna plaća дають таблицю з самого законопроєкту', () => {
      // ADR-0001: два офіційні варіанти 2027 різняться лише припущенням.
      // Таблиця в обґрунтуванні законопроєкту рахована з чинних 1 993 €, а
      // калькулятор HOK — з прогнозних 2 180 €. Правила в обох ті самі.
      const placaNaSnazi = pretpostavke2026.prosjecnaPlaca.value

      expect([
        godisnjiDoprinosi(1, placaNaSnazi).toFixed(2),
        godisnjiDoprinosi(6, placaNaSnazi).toFixed(2),
        godisnjiDoprinosi(7, placaNaSnazi).toFixed(2),
      ]).toEqual(['3491.74', '3928.20', '4364.67'])
    })

    it('prosječna plaća не зашита в ruleset', () => {
      const serijalizirano = JSON.stringify(rulesetNajave2027('50000'))

      // Спершу доводимо, що пошук взагалі щось бачить: якби Decimal перестав
      // серіалізуватися в рядок із цифрами, «немає 2180» стало б правдою з
      // хибної причини, і тест мовчки перетворився б на декорацію.
      expect(serijalizirano).toContain('11300')
      expect(serijalizirano).not.toContain('2180')
      expect(serijalizirano).not.toContain('1993')
    })

    it('prosječna plaća на 2027 подана як прогноз, а не як опублікована величина', () => {
      // Величина за січень–серпень 2026 фізично не існує на момент розрахунку:
      // її публікують восени. Видати прогноз за факт — те саме, що видати
      // законопроєкт за закон (ADR-0001).
      const { source, value } = pretpostavkeNajave2027.prosjecnaPlaca

      expect(source).toMatchObject({ status: 'forecast', period: expect.stringContaining('2026') })
      expect(value.toFixed(2)).toBe('2180.00')
    })
  })

  describe('джерела', () => {
    const brojeviIzNacrta: readonly (readonly [string, Sourced<unknown>])[] = [
      ['razredi', rulesetNajave2027('50000').pausalniObrt.razredi],
      ['priznatiIzdatak', rulesetNajave2027('50000').pausalniObrt.priznatiIzdatak],
      ['stopaPoreza', rulesetNajave2027('50000').pausalniObrt.stopaPoreza],
      ['koeficijent', rulesetNajave2027('50000').pausalniObrt.koeficijent],
    ]

    it.each(brojeviIzNacrta)(
      '%s веде до статті законопроєкту зі статусом draft',
      (_naziv, { source }) => {
        expect(source.status).toBe('draft')
        expect(source.article).toMatch(/^čl\. \d/)
        expect(source.url).toMatch(/^https:\/\/esavjetovanja\.gov\.hr\//)
        expect(source.gazette).not.toMatch(/^NN \d/)
        expect(Number.isNaN(Date.parse(source.checkedOn))).toBe(false)
      },
    )

    it('жодне число, що відрізняється від чинного, не подане як чинне право', () => {
      // Саме заради цього в джерелі є поле статусу: показати неухвалену цифру
      // як закон — рівно те, що воно має унеможливити (ADR-0002).
      const najava = rulesetNajave2027('60000')
      const parovi: readonly (readonly [string, Sourced<Decimal>, Sourced<Decimal>])[] = [
        [
          'priznatiIzdatak',
          najava.pausalniObrt.priznatiIzdatak,
          ruleset2026.pausalniObrt.priznatiIzdatak,
        ],
        ['stopaPoreza', najava.pausalniObrt.stopaPoreza, ruleset2026.pausalniObrt.stopaPoreza],
        ['koeficijent', najava.pausalniObrt.koeficijent, ruleset2026.pausalniObrt.koeficijent],
        ['pragPrimitka', najava.pausalniObrt.pragPrimitka, ruleset2026.pausalniObrt.pragPrimitka],
        [
          'stopaMoPrviStup',
          najava.doprinosi.stopaMoPrviStup,
          ruleset2026.doprinosi.stopaMoPrviStup,
        ],
        [
          'stopaMoDrugiStup',
          najava.doprinosi.stopaMoDrugiStup,
          ruleset2026.doprinosi.stopaMoDrugiStup,
        ],
        ['stopaZo', najava.doprinosi.stopaZo, ruleset2026.doprinosi.stopaZo],
      ]

      const promijenjeni = parovi.filter(([, nove, staro]) => !nove.value.equals(staro.value))

      expect(promijenjeni.map(([naziv]) => naziv)).toEqual(['priznatiIzdatak', 'koeficijent'])
      for (const [naziv, nove] of promijenjeni) {
        expect([naziv, nove.source.status]).toEqual([naziv, 'draft'])
      }
    })

    it('числа, яких законопроєкт не чіпає, лишаються при чинному акті', () => {
      // Позначити чинну норму проєктом — теж брехня, лише в інший бік: за
      // статтею законопроєкту про ставку ZO не написано нічого.
      const najava = rulesetNajave2027('60000')

      expect([
        najava.pausalniObrt.pragPrimitka.source.status,
        najava.doprinosi.stopaMoPrviStup.source.status,
        najava.doprinosi.stopaMoDrugiStup.source.status,
        najava.doprinosi.stopaZo.source.status,
      ]).toEqual(['in-force', 'in-force', 'in-force', 'in-force'])
    })

    it('рік набору правил — 2027', () => {
      expect(rulesetNajave2027(0).godina).toBe(2027)
    })
  })
})
