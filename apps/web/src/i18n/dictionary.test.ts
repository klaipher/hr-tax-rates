import { nkdDirektorij } from '@hr-tax/data'
import type { UnosUsporedbe } from '@hr-tax/engine'
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

const IZDACI = {
  najamnina: eur(2000),
  nabavkaRobe: eur(0),
  nabavkaUsluga: eur(1000),
  placeRadnika: eur(0),
  troskoviBanke: eur(200),
  reprezentacija: eur(300),
  osobnoVozilo: eur(400),
  ostalo: eur(500),
}

/**
 * Обставини, які вмикають різні гілки рушія.
 *
 * Порожній варіант лишається першим — саме на ньому видно, що каже рушій,
 * коли форма ще нічого не знає. Решта доводить решту: без витрат і ставок
 * `porez na dohodak` узагалі не з'являється, а без `NKD` і без культурного
 * добра не з'являються причини незастосування двох платежів.
 */
const OKOLNOSTI: readonly Partial<UnosUsporedbe>[] = [
  {},
  { godisnjiIzdaci: IZDACI, stope: { niza: 2300, visa: 3300 } },
  { noviObrt: true },
  { uzdrzavani: { clanoviUzeObitelji: 1, djeca: 10 } },
  ...nkdDirektorij.map(
    (stavka): Partial<UnosUsporedbe> => ({
      djelatnost: {
        nkd: stavka.sifra,
        imaLokalnuTuristickuZajednicu: true,
        potpomognutoPodrucje: false,
        pretezitoProizvodna: false,
        polozaj: { kind: 'izvan' },
      },
    }),
  ),
  {
    djelatnost: {
      // Код правильної форми, якого в переліках немає: рівно той випадок,
      // коли платіж не виникає, а причина мусить це сказати.
      nkd: '62.01',
      imaLokalnuTuristickuZajednicu: false,
      potpomognutoPodrucje: true,
      pretezitoProizvodna: true,
      polozaj: { kind: 'izvan' },
    },
  },
  {
    djelatnost: {
      nkd: '92.00',
      imaLokalnuTuristickuZajednicu: true,
      potpomognutoPodrucje: false,
      pretezitoProizvodna: false,
      polozaj: { kind: 'u-kulturnom-dobru', korisnaPovrsinaM2: 40, mjesecniIznosPoM2: '0.20' },
    },
  },
]

const usporedbe = () =>
  PRIMICI.flatMap((primitak) =>
    OKOLNOSTI.map((okolnosti) =>
      usporediRezime({ ...okolnosti, godisnjiPrimitak: eur(primitak) }, PODLOGA),
    ),
  )

/** Усі обов'язкові платежі, які рушій уміє повернути на цій сітці. */
const davanja = () =>
  usporedbe().flatMap((usporedba) =>
    usporedba.rezimi.flatMap((rezim) =>
      rezim.ishod.status === 'izracunato' ? rezim.ishod.izracun.obveznaDavanja : [],
    ),
  )

describe('покриття того, що повертає рушій', () => {
  it('перекладає кожен хорватський термін, який рушій уміє показати', () => {
    const pojmovi = new Set<string>()

    for (const usporedba of usporedbe()) {
      for (const rezim of usporedba.rezimi) {
        pojmovi.add(rezim.naziv.hr)
        if (rezim.ishod.status !== 'izracunato') {
          continue
        }
        const { porezi, doprinosi, obveznaDavanja } = rezim.ishod.izracun
        for (const porez of porezi) pojmovi.add(porez.naziv.hr)
        for (const doprinos of [doprinosi.moPrviStup, doprinosi.moDrugiStup, doprinosi.zo]) {
          pojmovi.add(doprinos.naziv.hr)
        }
        // Обов'язкові платежі стоять на картці поруч із податком і внесками,
        // тож і пояснення терміна мусять мати ті самі — інакше в переліку
        // мовчки з'явився б рядок без тлумачення.
        for (const davanje of obveznaDavanja) pojmovi.add(davanje.naziv.hr)
      }
    }

    expect(pojmovi.size).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      for (const pojam of pojmovi) {
        expect(DICTIONARIES[locale].pojmovi[pojam], `${locale}: ${pojam}`).toBeTypeOf('string')
      }
    }
  })

  it('пояснює кожну причину, з якої платіж не нараховано', () => {
    // Та сама хвороба, що й із причинами недоступності режиму: рушій віддає
    // код, а словник мусить мати текст на кожен, який той уміє повернути
    // (ADR-0004). Ключується за кодом, тож нова причина без перекладу
    // валить білд.
    const kodovi = new Set(
      davanja().flatMap((davanje) =>
        davanje.status === 'ne-primjenjuje-se' ? [davanje.razlog.kod] : [],
      ),
    )

    expect(kodovi.size).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      const razlozi = DICTIONARIES[locale].kartica.davanjaRazlozi as unknown as Record<
        string,
        Leaf | undefined
      >
      for (const kod of kodovi) expect(razlozi[kod], `${locale}: ${kod}`).toBeDefined()
    }
  })

  it('пояснює кожне застереження, з яким платіж нараховано', () => {
    const kodovi = new Set(
      davanja().flatMap((davanje) =>
        davanje.status === 'obračunato' ? davanje.napomene.map((napomena) => napomena.kod) : [],
      ),
    )

    expect(kodovi.size).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      const napomene = DICTIONARIES[locale].kartica.davanjaNapomene as unknown as Record<
        string,
        Leaf | undefined
      >
      for (const kod of kodovi) expect(napomene[kod], `${locale}: ${kod}`).toBeDefined()
    }
  })

  it('пояснює кожну причину недоступності, яку рушій уміє віддати', () => {
    // Ключем є код причини, а не режим: рушій віддає причину структурою, і
    // саме коди мають бути покриті всіма локалями. Раніше словник ключувався
    // за RezimId і мовчки не помічав нових причин.
    const kodovi = new Set<string>()

    for (const usporedba of usporedbe()) {
      for (const rezim of usporedba.rezimi) {
        if (rezim.ishod.status === 'nedostupno') {
          kodovi.add(rezim.ishod.razlog.kod)
        }
      }
    }

    expect(kodovi.size).toBeGreaterThan(0)
    for (const locale of LOCALES) {
      const razlozi = DICTIONARIES[locale].razlozi as unknown as Record<string, Leaf | undefined>
      for (const kod of kodovi) {
        expect(razlozi[kod], `${locale}: ${kod}`).toBeDefined()
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
