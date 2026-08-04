import {
  drugaDjelatnost2026,
  obrtNaDobit2026,
  obrtNaDohodak2026,
  PRAVILA_NEPUNE_GODINE,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import type { Money } from './money.ts'
import { eur, sum, toCentString } from './money.ts'
import type { Izracun, Podloga, Rezim, RezimId, Usporedba } from './types.ts'
import { jediniPorez } from './types.ts'
import type { PodlogaUsporedbe, UnosUsporedbe } from './usporedba.ts'
import { usporediRezime } from './usporedba.ts'

/**
 * Місячна `osnovica` там, де закон її має. У діяльності поряд із наймом її
 * немає — тест, який туди зазирає, помиляється в припущенні, тож падає.
 */
const mjesecnaOsnovicaIliPad = (doprinosi: {
  readonly mjesecnaOsnovica: Money<'EUR'> | undefined
}): Money<'EUR'> => {
  const { mjesecnaOsnovica } = doprinosi
  if (mjesecnaOsnovica === undefined) throw new Error('Цей режим не має місячної osnovica')
  return mjesecnaOsnovica
}

const podloga2026: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

/** Режими, які цей зріз не рахує з принципу, а не через завеликий `primitak`. */
const NEMODELIRANI = ['obrt-na-dohodak', 'obrt-na-dobit', 'zaposlenik', 'doo'] as const

const usporedi = (godisnjiPrimitak: string, podloga: Podloga = podloga2026): Usporedba =>
  usporediRezime({ godisnjiPrimitak: eur(godisnjiPrimitak) }, podloga)

const rezim = (usporedba: Usporedba, id: RezimId): Rezim => {
  const found = usporedba.rezimi.find((kandidat) => kandidat.id === id)
  if (found === undefined) throw new Error(`Режиму ${id} немає в результаті`)
  return found
}

/** Розрахунок паушального обрту або виняток, якщо режим недоступний. */
const pausal = (godisnjiPrimitak: string, podloga: Podloga = podloga2026): Izracun => {
  const { ishod } = rezim(usporedi(godisnjiPrimitak, podloga), 'pausalni-obrt')
  if (ishod.status !== 'izracunato') {
    throw new Error(`Паушал недоступний за primitak ${godisnjiPrimitak}: ${ishod.razlog}`)
  }
  return ishod.izracun
}

const razlogNedostupnosti = (
  id: RezimId,
  godisnjiPrimitak = '20000',
  podloga: Podloga = podloga2026,
): string => {
  const { ishod } = rezim(usporedi(godisnjiPrimitak, podloga), id)
  if (ishod.status !== 'nedostupno') throw new Error(`Режим ${id} несподівано розрахований`)
  return ishod.razlog
}

/** Той самий набір правил, але з обрізаною таблицею розрядів. */
const bezVrhaTablice: Podloga = {
  ruleset: {
    ...ruleset2026,
    pausalniObrt: {
      ...ruleset2026.pausalniObrt,
      razredi: {
        ...ruleset2026.pausalniObrt.razredi,
        value: ruleset2026.pausalniObrt.razredi.value.slice(0, -1),
      },
    },
  },
  pretpostavke: pretpostavke2026,
}

describe('usporediRezime', () => {
  describe('структура результату', () => {
    it('повертає всі режими одразу і завжди в тому самому порядку', () => {
      expect(usporedi('20000').rezimi.map((r) => r.id)).toEqual([
        'pausalni-obrt',
        'obrt-na-dohodak',
        'obrt-na-dobit',
        'zaposlenik',
        'doo',
      ])
    })

    it('порядок і склад режимів не залежать від входу', () => {
      const ids = (primitak: string) => usporedi(primitak).rezimi.map((r) => r.id)

      // 100 000 € виводить паушал за поріг, але картка мусить лишитися на місці.
      expect(ids('100000')).toEqual(ids('0'))
    })

    it('кожен режим названий хорватською, з українським перекладом поруч', () => {
      // Канонічна мова моделі — хорватська; переклад іде поруч, а не замість
      // (CONTEXT.md). Тип змушує дати обидва, тест — не лишити їх порожніми.
      for (const { naziv } of usporedi('20000').rezimi) {
        expect(naziv.hr.length).toBeGreaterThan(0)
        expect(naziv.uk.length).toBeGreaterThan(0)
      }
    })

    it('недоступний режим несе причину і жодного числа', () => {
      const { ishod } = rezim(usporedi('20000'), 'zaposlenik')
      if (ishod.status !== 'nedostupno') throw new Error('Найманий працівник не мав би рахуватися')

      // Крім статусу й причини, у недоступному режимі немає нічого: ні нулів,
      // ні порожніх сум, які на картці не відрізнити від розрахунку.
      expect(Object.keys(ishod).sort()).toEqual(['razlog', 'status'])
      expect(ishod.razlog.length).toBeGreaterThan(0)

      // @ts-expect-error — розрахунку в недоступного режиму немає і в типі.
      expect(ishod.izracun).toBeUndefined()
    })

    it('режими, яких зріз ще не рахує, пояснюють саме себе, а не відбуваються спільною фразою', () => {
      const razlozi = NEMODELIRANI.map((id) => razlogNedostupnosti(id))

      expect(new Set(razlozi).size).toBe(razlozi.length)
      for (const razlog of razlozi) expect(razlog.length).toBeGreaterThan(40)
    })

    it('у режимів, яких зріз не рахує, немає числа навіть у тексті причини', () => {
      // Цифра в поясненні читалася б як порахована сума — а рахувати ці режими
      // ще немає з чого. Найманий працівник і d.o.o. серед них.
      for (const id of NEMODELIRANI) expect(razlogNedostupnosti(id)).not.toMatch(/\d/)
    })
  })

  describe('paušalni obrt — razred', () => {
    it('бере розряд за верхньою межею, а не за фактичним primitak', () => {
      const { razred } = pausal('20000')

      expect(razred?.redniBroj).toBe(4)
      expect(toCentString(razred?.gornjaGranica ?? eur(0))).toBe('30600.00')
    })

    it('на верхній межі лишається в розряді, на цент вище — переходить у наступний', () => {
      expect(pausal('19900').razred?.redniBroj).toBe(3)
      expect(pausal('19900.01').razred?.redniBroj).toBe(4)
    })

    it('нульовий primitak потрапляє в перший розряд, а не поза таблицю', () => {
      expect(pausal('0').razred?.redniBroj).toBe(1)
    })

    it('понад поріг паушал недоступний, і причина називає і поріг, і сам primitak', () => {
      const razlog = razlogNedostupnosti('pausalni-obrt', '60000.01')

      expect(razlog).toContain('60 000')
      expect(razlog).toContain('60 000,01')
    })

    it('рівно на порозі паушал ще доступний', () => {
      expect(pausal('60000').razred?.redniBroj).toBe(7)
    })

    it('на суперечливому наборі правил відмовляється рахувати, а не бере верхній розряд', () => {
      // Поріг лишився на 60 000 €, а таблиця обривається на 50 000 €. Мовчки
      // взяти верхній наявний розряд означало б занизити податок і не сказати
      // про це — гірше, ніж відмовитися.
      expect(razlogNedostupnosti('pausalni-obrt', '55000', bezVrhaTablice)).toContain('не покриває')
    })
  })

  describe('paušalni obrt — paušalni porez', () => {
    it('рахує податок зі стелі розряду, а не з фактичного primitak', () => {
      // Розряд 4: paušalni dohodak 4 590,00 € × 12%.
      const porez = jediniPorez(pausal('20000'))

      expect(toCentString(porez.poreznaOsnovica)).toBe('4590.00')
      expect(toCentString(porez.godisnjiIznos)).toBe('550.80')
      expect(porez.stopa.toString()).toBe('0.12')
    })

    it('не змінює податок, поки primitak лишається в тому самому розряді', () => {
      expect(toCentString(pausal('19901').ukupanPorez)).toBe(
        toCentString(pausal('30600').ukupanPorez),
      )
    })

    it('податок стрибає на межі розряду без стрибка primitak', () => {
      expect(toCentString(pausal('19900').ukupanPorez)).toBe('358.20')
      expect(toCentString(pausal('19900.01').ukupanPorez)).toBe('550.80')
    })

    it('веде податок до статті закону', () => {
      expect(jediniPorez(pausal('20000')).izvor.article).toBe('čl. 82. st. 6.')
    })
  })

  describe('paušalni obrt — doprinosi', () => {
    it('будує osnovica з prosječna plaća та koeficijent', () => {
      // 1 993,00 € × 0,40.
      expect(toCentString(mjesecnaOsnovicaIliPad(pausal('20000').doprinosi))).toBe('797.20')
    })

    it('розбиває внески на MO I. stup, MO II. stup і ZO', () => {
      const { moPrviStup, moDrugiStup, zo, ukupnoGodisnje } = pausal('20000').doprinosi

      expect(toCentString(moPrviStup.godisnjiIznos)).toBe('1434.96')
      expect(toCentString(moDrugiStup.godisnjiIznos)).toBe('478.32')
      expect(toCentString(zo.godisnjiIznos)).toBe('1578.46')
      expect(toCentString(ukupnoGodisnje)).toBe('3491.74')
    })

    it('позначає II. stup як персональні відкладені кошти, а решту — ні', () => {
      const { moPrviStup, moDrugiStup, zo } = pausal('20000').doprinosi

      expect(moDrugiStup.osobnaStednja).toBe(true)
      expect(moPrviStup.osobnaStednja).toBe(false)
      expect(zo.osobnaStednja).toBe(false)
    })

    it('не залежить від розряду: внески однакові й на дні, і на стелі паушалу', () => {
      // Саме тому на низькому primitak внески важать більше за податок.
      expect(toCentString(pausal('0').doprinosi.ukupnoGodisnje)).toBe(
        toCentString(pausal('60000').doprinosi.ukupnoGodisnje),
      )
    })

    it('веде кожну складову до своєї статті закону', () => {
      const { moPrviStup, moDrugiStup, zo } = pausal('20000').doprinosi

      expect(moPrviStup.izvor.article).toBe('čl. 13. st. 1. t. 1.2.')
      expect(moDrugiStup.izvor.article).toBe('čl. 17. st. 1. t. 1.')
      expect(zo.izvor.article).toBe('čl. 14. st. 1. t. 1.')
    })
  })

  describe('paušalni obrt — на руки та ефективна ставка', () => {
    it('лишає людині primitak без податку і без внесків', () => {
      // 20 000,00 − 550,80 − 3 491,736.
      expect(toCentString(pausal('20000').netoZaOsobu)).toBe('15957.46')
    })

    it('рахує ефективну ставку від усіх обов’язкових платежів', () => {
      // (550,80 + 3 491,736) / 20 000.
      expect(pausal('20000').efektivnaStopa?.toString()).toBe('0.2021268')
    })

    it('не має ефективної ставки за нульового primitak — ділити немає на що', () => {
      const { efektivnaStopa, netoZaOsobu } = pausal('0')

      expect(efektivnaStopa).toBeUndefined()
      expect(toCentString(netoZaOsobu)).toBe('-3695.14')
    })

    it('ефективна ставка падає з ростом primitak усередині розряду', () => {
      const niza = pausal('30600').efektivnaStopa
      const visa = pausal('19901').efektivnaStopa

      expect(niza?.lessThan(visa ?? 0)).toBe(true)
    })
  })

  describe('шари даних', () => {
    it('prosječna plaća рухає внески й не чіпає податок', () => {
      // Той самий розкол, що й у двох офіційних джерелах на 2027 (ADR-0001):
      // правила ті самі, prosječna plaća різна — і різняться лише doprinosi.
      const prognoza: Podloga = {
        ruleset: ruleset2026,
        pretpostavke: {
          prosjecnaPlaca: { ...pretpostavke2026.prosjecnaPlaca, value: new Decimal('2180') },
        },
      }

      expect(toCentString(pausal('20000', prognoza).ukupanPorez)).toBe('550.80')
      // 2 180,00 × 0,40 × 36,5% × 12.
      expect(toCentString(pausal('20000', prognoza).doprinosi.ukupnoGodisnje)).toBe('3819.36')
    })

    it('повертає рік правил, за якими рахувало', () => {
      expect(usporedi('20000').godina).toBe(2026)
    })
  })

  describe('чистота', () => {
    it('на однакових входах дає однаковий результат і нічого не запам’ятовує', () => {
      expect(usporedi('20000')).toEqual(usporedi('20000'))
    })
  })
})

describe('усі три обртні режими в одному порівнянні', () => {
  const IZDACI = {
    najamnina: eur(3000),
    nabavkaRobe: eur(0),
    nabavkaUsluga: eur(1200),
    placeRadnika: eur(0),
    troskoviBanke: eur(300),
    reprezentacija: eur(0),
    osobnoVozilo: eur(0),
    ostalo: eur(500),
  }
  const ZAGREB = { niza: 2300, visa: 3300 } as const

  const PUNA_PODLOGA: PodlogaUsporedbe = {
    ...podloga2026,
    obrtNaDohodak: obrtNaDohodak2026,
    obrtNaDobit: obrtNaDobit2026,
    drugaDjelatnost: drugaDjelatnost2026,
    nepunaGodina: PRAVILA_NEPUNE_GODINE,
  }

  const usporedi = (unos: Partial<UnosUsporedbe> = {}) =>
    usporediRezime(
      { godisnjiPrimitak: eur(30000), godisnjiIzdaci: IZDACI, stope: ZAGREB, ...unos },
      PUNA_PODLOGA,
    )

  const izracunZa = (id: string) => {
    const rezim = usporedi().rezimi.find((r) => r.id === id)
    if (rezim?.ishod.status !== 'izracunato') {
      throw new Error(
        `${id} недоступний: ${rezim?.ishod.status === 'nedostupno' ? rezim.ishod.razlog : 'немає'}`,
      )
    }
    return rezim.ishod.izracun
  }

  it('рахує всі три обртні режими, а не лише паушал', () => {
    for (const id of ['pausalni-obrt', 'obrt-na-dohodak', 'obrt-na-dobit']) {
      expect(() => izracunZa(id), id).not.toThrow()
    }
  })

  it('віддає однакову структуру результату — на ній тримається зіставність', () => {
    const kljucevi = ['pausalni-obrt', 'obrt-na-dohodak', 'obrt-na-dobit'].map((id) =>
      Object.keys(izracunZa(id)).sort(),
    )

    expect(kljucevi[1]).toEqual(kljucevi[0])
    expect(kljucevi[2]).toEqual(kljucevi[0])
  })

  it('у obrt na dobit три різні податки, а не один', () => {
    // Саме заради цього Izracun.porezi — множина: податок із poduzetnička
    // plaća, porez na dobit і податок на виплату власнику.
    expect(izracunZa('obrt-na-dobit').porezi.length).toBe(3)
    expect(izracunZa('pausalni-obrt').porezi.length).toBe(1)
  })

  it('ukupanPorez завжди дорівнює сумі своїх складових', () => {
    for (const id of ['pausalni-obrt', 'obrt-na-dohodak', 'obrt-na-dobit']) {
      const { porezi, ukupanPorez } = izracunZa(id)
      const zbroj = sum(
        'EUR',
        porezi.map((porez) => porez.godisnjiIznos),
      )
      expect(toCentString(ukupanPorez), id).toBe(toCentString(zbroj))
    }
  })

  it('без izdatak режими з обліком кажуть, чого саме бракує', () => {
    const bezIzdataka = usporediRezime(
      { godisnjiPrimitak: eur(30000), stope: ZAGREB },
      PUNA_PODLOGA,
    )
    const rezim = bezIzdataka.rezimi.find((r) => r.id === 'obrt-na-dohodak')

    expect(rezim?.ishod.status).toBe('nedostupno')
    if (rezim?.ishod.status === 'nedostupno') {
      expect(rezim.ishod.razlog).toContain('izdatak')
    }
  })

  it('без обраного міста каже саме про ставки, а не про витрати', () => {
    const bezGrada = usporediRezime(
      { godisnjiPrimitak: eur(30000), godisnjiIzdaci: IZDACI },
      PUNA_PODLOGA,
    )
    const rezim = bezGrada.rezimi.find((r) => r.id === 'obrt-na-dohodak')

    expect(rezim?.ishod.status).toBe('nedostupno')
    if (rezim?.ishod.status === 'nedostupno') {
      expect(rezim.ishod.razlog).toContain('jedinica lokalne samouprave')
    }
  })

  it('модифікатор найму зменшує внески паушалу', () => {
    const bez = izracunZa('pausalni-obrt')
    const rezimUzRad = usporedi({ uzRadniOdnos: true }).rezimi[0]
    if (rezimUzRad?.ishod.status !== 'izracunato') throw new Error('паушал уз рад недоступний')
    const uzRad = rezimUzRad.ishod.izracun

    expect(
      uzRad.doprinosi.ukupnoGodisnje.amount.lessThan(bez.doprinosi.ukupnoGodisnje.amount),
    ).toBe(true)
    // Закон другої діяльності місячної osnovica не знає — база річна.
    expect(uzRad.doprinosi.mjesecnaOsnovica).toBeUndefined()
  })
})
