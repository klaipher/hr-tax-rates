import {
  assertMatchesHok,
  type HokCellRef,
  hokFormula,
  parseRazredChain,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { add, eur, toCentString } from './money.ts'
import type { Izracun, Podloga } from './types.ts'
import { usporediRezime } from './usporedba.ts'

const MJESECI_U_GODINI = 12

/**
 * Голден-тести проти калькулятора HOK на чинний 2026 рік.
 *
 * Оракулом лишається закон, а не HOK (ADR-0003): усе тут іде через
 * `assertMatchesHok`, який валить тест на будь-якій розбіжності, не внесеній
 * у реєстр із посиланням на статтю.
 *
 * У збережених книгах усі входи нульові, тож кешовані значення комірок — це
 * розрахунок для `primitak` 0. Таблиця розрядів звіряється інакше: її дістає
 * з тексту формули `parseRazredChain`, і вона працює на будь-якому вході.
 */

const SCENARIO = 'in-force-2026' as const
const PREGLED = 'PREGLED MOGUĆNOSTI '

/** Стовпець C аркуша HOK — «OBRT izbor paušalno oporezivanje». */
const pausalnaCelija = (cell: string): HokCellRef => ({ scenario: SCENARIO, sheet: PREGLED, cell })

const podloga2026: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

const pausal = (godisnjiPrimitak: Decimal.Value): Izracun => {
  const { rezimi } = usporediRezime({ godisnjiPrimitak: eur(godisnjiPrimitak) }, podloga2026)
  const ishod = rezimi.find((rezim) => rezim.id === 'pausalni-obrt')?.ishod
  if (ishod?.status !== 'izracunato') {
    throw new Error(`Паушал недоступний за primitak ${String(godisnjiPrimitak)}`)
  }
  return ishod.izracun
}

const pausalniPorez = (godisnjiPrimitak: Decimal.Value): string =>
  toCentString(pausal(godisnjiPrimitak).ukupanPorez)

const pausalNedostupan = (godisnjiPrimitak: Decimal.Value): boolean => {
  const { rezimi } = usporediRezime({ godisnjiPrimitak: eur(godisnjiPrimitak) }, podloga2026)
  return rezimi.find((rezim) => rezim.id === 'pausalni-obrt')?.ishod.status === 'nedostupno'
}

/**
 * Таблиця розрядів прямо з формули HOK. Кешоване значення комірки тут
 * не годиться: воно порахувало б лише перший розряд.
 */
const hokRazredi = parseRazredChain(hokFormula(pausalnaCelija('C13')))

const uCentima = (raw: string): string => new Decimal(raw).toFixed(2)

describe('паушальний обрт проти калькулятора HOK 2026', () => {
  describe('таблиця розрядів', () => {
    it('HOK знає рівно сім розрядів', () => {
      // Сторож від мовчазного звуження оракула: якби розбір формули загубив
      // розряд, тести нижче просто перестали б його перевіряти.
      expect(hokRazredi).toHaveLength(7)
    })

    for (const [index, razred] of hokRazredi.entries()) {
      const gornjaGranica = new Decimal(razred.gornjaGranica)
      const sljedeci = hokRazredi[index + 1]

      describe(`розряд ${index + 1} до ${razred.gornjaGranica} €`, () => {
        it('на верхній межі дає той самий paušalni porez, що й HOK', () => {
          expect(pausalniPorez(gornjaGranica)).toBe(uCentima(razred.iznos))
        })

        it('на євро нижче межі лишається в тому самому розряді', () => {
          expect(pausalniPorez(gornjaGranica.minus(1))).toBe(uCentima(razred.iznos))
        })

        it('на євро вище межі переходить туди, куди його веде HOK', () => {
          const primitak = gornjaGranica.plus(1)

          if (sljedeci === undefined) {
            // Понад останню межу таблиця HOK каже «nemoguće primijeniti model».
            expect(pausalNedostupan(primitak)).toBe(true)
            return
          }
          expect(pausalniPorez(primitak)).toBe(uCentima(sljedeci.iznos))
        })
      })
    }
  })

  describe('кешовані комірки книги — розрахунок за нульового primitak', () => {
    const izracun = pausal(0)

    /**
     * Звірка одного числа з коміркою книги.
     *
     * `assertMatchesHok`, а не `checkAgainstHok`: перший валить виклик на
     * незареєстрованій розбіжності, другий лише повертає статус, і той, хто
     * забуде його перевірити, отримає зелений тест на розбіжності (ADR-0003).
     * Твердження про `match` іде понад те: жодна з цих комірок у реєстрі не
     * стоїть, тож поява там запису має стати видимою, а не мовчки пройти.
     */
    const uHok = (cell: string, actual: Decimal) =>
      assertMatchesHok({ ...pausalnaCelija(cell), actual: actual.toString() })

    it('місячні doprinosi сходяться (C5)', () => {
      const mjesecno = izracun.doprinosi.ukupnoGodisnje.amount.div(MJESECI_U_GODINI)

      expect(uHok('C5', mjesecno).status).toBe('match')
    })

    it('річні doprinosi сходяться (C6)', () => {
      expect(uHok('C6', izracun.doprinosi.ukupnoGodisnje.amount).status).toBe('match')
    })

    it('річна податкова повинність сходиться (C19)', () => {
      expect(uHok('C19', izracun.ukupanPorez.amount).status).toBe('match')
    })

    it('сума, що лишається обртнику за рік, сходиться (C21) — до внеску палати', () => {
      // Порівнюється сума ДО obveznaDavanja навмисно. HOK не рахує komorski
      // doprinos — це зареєстрована розбіжність `komorski-doprinos-omitted`,
      // а не наша похибка: внесок платить кожен obrt, і без нього «на руки»
      // систематично завищене. Наше кінцеве число менше рівно на цей внесок,
      // що доводить наступний тест.
      const prijeDavanja = add(izracun.netoZaOsobu, izracun.ukupnaDavanja)

      expect(uHok('C21', prijeDavanja.amount).status).toBe('match')
    })

    it('наше «на руки» менше за HOK рівно на внесок до палати', () => {
      const [davanje] = izracun.obveznaDavanja
      if (davanje?.status !== 'obračunato') throw new Error('внесок палати не нарахований')

      // 1,9 % osnovnog osobnog odbitka × 12 = 136,80 € на рік.
      expect(toCentString(davanje.godisnjiIznos)).toBe('136.80')
      expect(toCentString(izracun.ukupnaDavanja)).toBe('136.80')
    })
  })
})
