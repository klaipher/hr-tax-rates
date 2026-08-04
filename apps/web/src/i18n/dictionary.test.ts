import { eur, usporediRezime } from '@hr-tax/engine'
import { describe, expect, it } from 'vitest'
import { PODLOGA } from '../podloga.ts'
import { DICTIONARIES } from './dictionary.ts'
import { LOCALES } from './locale.ts'

/** Листок словника: готовий рядок або рядок із підставленими величинами. */
type Leaf = string | ((...argumenti: string[]) => string)

interface Branch {
  readonly [kljuc: string]: Branch | Leaf
}

const branch = (locale: (typeof LOCALES)[number]): Branch =>
  DICTIONARIES[locale] as unknown as Branch

/** Усі листки дерева словника разом із їхніми шляхами. */
const leaves = (cvor: Branch, prefiks: string): readonly (readonly [string, Leaf])[] =>
  Object.entries(cvor).flatMap(([kljuc, vrijednost]) => {
    const put = prefiks === '' ? kljuc : `${prefiks}.${kljuc}`

    return typeof vrijednost === 'object' ? leaves(vrijednost, put) : [[put, vrijednost] as const]
  })

const paths = (cvor: Branch): readonly string[] =>
  leaves(cvor, '')
    .map(([put]) => put)
    .sort()

/** Помітна підстановка: у результаті її видно, а з перекладом — не сплутати. */
const MARKER = '⟪підстановка'

describe('словник', () => {
  it('має в кожній локалі той самий набір ключів, що й українська', () => {
    // Українська — мова-джерело перекладів, тож саме її набір ключів є
    // мірилом: ключ, доданий у ній, мусить з'явитися і в решті.
    const dzherelo = paths(branch('uk'))
    expect(dzherelo).not.toHaveLength(0)

    for (const locale of LOCALES) {
      expect(paths(branch(locale)), locale).toEqual(dzherelo)
    }
  })

  it('не має порожніх рядків і не губить підставлених величин', () => {
    for (const locale of LOCALES) {
      for (const [put, vrijednost] of leaves(branch(locale), '')) {
        const opys = `${locale}: ${put}`

        if (typeof vrijednost === 'string') {
          expect(vrijednost.trim(), opys).not.toBe('')
          continue
        }

        // Величина, яку переклад загубив, зникає з екрана мовчки — тому
        // кожен параметр мусить дійти до результату.
        const argumenti = Array.from({ length: vrijednost.length }, (_, i) => `${MARKER}${i}⟫`)
        const rezultat = vrijednost(...argumenti)

        expect(rezultat.trim(), opys).not.toBe('')
        for (const argument of argumenti) {
          expect(rezultat, opys).toContain(argument)
        }
      }
    }
  })
})

/**
 * Сітка річного `primitak`, на якій рушій показує все, що вміє: нуль, середину
 * розрядів, обидва боки порогу паушалу.
 */
const PRIMICI = ['0', '1', '11000', '15000', '19000', '23000', '30000', '40000', '60000', '60001']

const usporedbe = () =>
  PRIMICI.map((primitak) => usporediRezime({ godisnjiPrimitak: eur(primitak) }, PODLOGA))

describe('покриття того, що повертає рушій', () => {
  it('перекладає кожен хорватський термін, який рушій уміє показати', () => {
    const pojmovi = new Set<string>()

    for (const usporedba of usporedbe()) {
      for (const rezim of usporedba.rezimi) {
        pojmovi.add(rezim.naziv.hr)
        if (rezim.ishod.status !== 'izracunato') {
          continue
        }
        const { porezi, doprinosi } = rezim.ishod.izracun
        for (const porez of porezi) pojmovi.add(porez.naziv.hr)
        for (const doprinos of [doprinosi.moPrviStup, doprinosi.moDrugiStup, doprinosi.zo]) {
          pojmovi.add(doprinos.naziv.hr)
        }
      }
    }

    expect(pojmovi.size).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      for (const pojam of pojmovi) {
        expect(DICTIONARIES[locale].pojmovi[pojam], `${locale}: ${pojam}`).toBeTypeOf('string')
      }
    }
  })

  it('пояснює недоступність кожного режиму, який рушій уміє віддати недоступним', () => {
    const nedostupni = new Set<string>()

    for (const usporedba of usporedbe()) {
      for (const rezim of usporedba.rezimi) {
        if (rezim.ishod.status === 'nedostupno') {
          nedostupni.add(rezim.id)
        }
      }
    }

    expect(nedostupni.size).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      const razlozi = DICTIONARIES[locale].razlozi as unknown as Record<string, Leaf | undefined>
      for (const id of nedostupni) {
        expect(razlozi[id], `${locale}: ${id}`).toBeDefined()
      }
    }
  })

  it('має поріг паушалу рівно на стелі найвищого розряду', () => {
    // Картка знає одну причину недоступності паушалу — перевищення порогу.
    // Рушій має ще одну, на суперечливий набір правил, і перекласти її ніяк:
    // прозу він складає сам. Поки таблиця розрядів доходить рівно до порогу,
    // друга причина недосяжна — а щойно перестане, цей тест упаде раніше,
    // ніж картка почне пояснювати недоступність не тим.
    const { razredi, pragPrimitka } = PODLOGA.ruleset.pausalniObrt
    const najvisaGranica = razredi.value
      .map((razred) => razred.gornjaGranica)
      .reduce((najvisa, granica) => (granica.greaterThan(najvisa) ? granica : najvisa))

    expect(najvisaGranica.toFixed(2)).toBe(pragPrimitka.value.toFixed(2))
  })
})
