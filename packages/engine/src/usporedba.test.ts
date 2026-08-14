import {
  clanUprave2026,
  drugaDjelatnost2026,
  obrtNaDobit2026,
  obrtNaDohodak2026,
  PRAVILA_NEPUNE_GODINE,
  placa2026,
  plavaKarta2026,
  pretpostavke2026,
  pretpostavkeNajave2027,
  ruleset2026,
  rulesetNajave2027,
} from '@hr-tax/data'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import type { Money } from './money.ts'
import { add, eur, subtract, sum, toCentString } from './money.ts'
import { BEZ_UZDRZAVANIH } from './obrt-na-dohodak.ts'
import type { Izracun, Podloga, RazlogNedostupnosti, Rezim, RezimId, Usporedba } from './types.ts'
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
): RazlogNedostupnosti => {
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
        'doo-placa',
        'doo-clan-uprave',
        'zaposlenik',
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
      // Причина — структура, а не проза: код плюс параметри, які кожна
      // локаль складає у власне речення.
      expect(ishod.razlog.kod.length).toBeGreaterThan(0)

      // @ts-expect-error — розрахунку в недоступного режиму немає і в типі.
      expect(ishod.izracun).toBeUndefined()
    })

    it('режим без своїх правил називає саме ті правила, яких бракує', () => {
      // Три нові режими стоять на трьох різних наборах, і «немає правил» без
      // назви набору не сказало б, чого саме бракує.
      expect(razlogNedostupnosti('zaposlenik')).toEqual({ kod: 'nema-pravila', pravila: 'plaća' })
      expect(razlogNedostupnosti('doo-clan-uprave')).toEqual({
        kod: 'nema-pravila',
        pravila: 'porez na dobit',
      })
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
      if (razlog.kod !== 'iznad-praga-pausala') {
        throw new Error(`Очікувався поріг, а причина — ${razlog.kod}`)
      }

      expect(toCentString(razlog.prag)).toBe('60000.00')
      expect(toCentString(razlog.primitak)).toBe('60000.01')
      // Поріг несе своє джерело — від числа на екрані є дорога до статті.
      expect(razlog.izvor.article.length).toBeGreaterThan(0)
    })

    it('рівно на порозі паушал ще доступний', () => {
      expect(pausal('60000').razred?.redniBroj).toBe(7)
    })

    it('на суперечливому наборі правил відмовляється рахувати, а не бере верхній розряд', () => {
      // Поріг лишився на 60 000 €, а таблиця обривається на 50 000 €. Мовчки
      // взяти верхній наявний розряд означало б занизити податок і не сказати
      // про це — гірше, ніж відмовитися.
      expect(razlogNedostupnosti('pausalni-obrt', '55000', bezVrhaTablice).kod).toBe(
        'nedosljedna-tablica-razreda',
      )
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
    it('лишає людині primitak без податку, внесків і внеску до палати', () => {
      // 20 000,00 − 550,80 − 3 491,736 − 136,80.
      expect(toCentString(pausal('20000').netoZaOsobu)).toBe('15820.66')
    })

    it('внесок до палати входить у «на руки» — на відміну від калькулятора HOK', () => {
      const izracun = pausal('20000')

      expect(toCentString(izracun.ukupnaDavanja)).toBe('136.80')
      expect(toCentString(add(izracun.netoZaOsobu, izracun.ukupnaDavanja))).toBe('15957.46')
    })

    it('рахує ефективну ставку від усіх обов’язкових платежів', () => {
      // (550,80 + 3 491,736) / 20 000.
      expect(pausal('20000').efektivnaStopa?.toString()).toBe('0.2021268')
    })

    it('не має ефективної ставки за нульового primitak — ділити немає на що', () => {
      const { efektivnaStopa, netoZaOsobu } = pausal('0')

      expect(efektivnaStopa).toBeUndefined()
      // 0 − 203,40 − 3 491,736 − 136,80.
      expect(toCentString(netoZaOsobu)).toBe('-3831.94')
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
          ...pretpostavke2026,
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
    placa: placa2026,
    clanUprave: clanUprave2026,
    plavaKarta: plavaKarta2026,
  }

  const usporedi = (unos: Partial<UnosUsporedbe> = {}) =>
    usporediRezime(
      { godisnjiPrimitak: eur(30000), godisnjiIzdaci: IZDACI, stope: ZAGREB, ...unos },
      PUNA_PODLOGA,
    )

  describe('zaposlenik і d.o.o. у спільному порівнянні', () => {
    const izracun = (id: RezimId, unos: Partial<UnosUsporedbe> = {}) => {
      const nadeno = usporedi(unos).rezimi.find((r) => r.id === id)
      if (nadeno?.ishod.status !== 'izracunato') throw new Error(`${id} недоступний`)
      return nadeno.ishod.izracun
    }

    it('«на руки» найманого не з’їдає внесок, якого він не платив', () => {
      const zaposlenik = izracun('zaposlenik')
      const { doprinosi, netoZaOsobu, ukupanPorez } = zaposlenik

      // Підсумок внесків більший за той, що віднімається: ZO платить
      // роботодавець понад плаћу.
      expect(
        doprinosi.ukupnoGodisnje.amount.greaterThan(doprinosi.ukupnoGodisnjeNaTeretOsobe.amount),
      ).toBe(true)

      // 30 000 брутто без утриманих внесків і без податку. Якби спільна
      // формула віднімала ще й ZO, тут бракувало б 4 950 € — і жоден тест
      // цього не помітив би, бо число лишилося б правдоподібним.
      const ocekivano = subtract(
        subtract(eur(30000), doprinosi.ukupnoGodisnjeNaTeretOsobe),
        ukupanPorez,
      )
      expect(toCentString(netoZaOsobu)).toBe(toCentString(ocekivano))

      // 30 000 × 16,5 % — рівно та сума, якої тут не має бути.
      expect(
        toCentString(subtract(doprinosi.ukupnoGodisnje, doprinosi.ukupnoGodisnjeNaTeretOsobe)),
      ).toBe('4950.00')
    })

    it('витрати форми не віднімаються від плаће: у найманого їх немає', () => {
      // Обртні режими віднімають витрати форми, найм — ні: це витрати
      // діяльності, а не людини. Найманий працівник не орендує офісу.
      expect(toCentString(izracun('zaposlenik').ukupniIzdaci)).toBe('0.00')
      expect(toCentString(izracun('pausalni-obrt').ukupniIzdaci)).toBe('5000.00')
    })

    it('найманий не платить жодного обов’язкового платежу поза податком і внесками', () => {
      const { obveznaDavanja, ukupnaDavanja } = izracun('zaposlenik')

      expect(toCentString(ukupnaDavanja)).toBe('0.00')
      expect(obveznaDavanja.every((d) => d.status === 'ne-primjenjuje-se')).toBe(true)
    })

    it('позначений найм ховає картку найму, а не рахує його двічі', () => {
      const nadeno = usporedi({ uzRadniOdnos: true }).rezimi.find((r) => r.id === 'zaposlenik')
      if (nadeno?.ishod.status !== 'nedostupno') throw new Error('картка мала б замовкнути')

      expect(nadeno.ishod.razlog.kod).toBe('vec-u-radnom-odnosu')
    })

    it('обидва d.o.o. рахуються і платять HOK нічого, а HGK — теж нічого', () => {
      for (const id of ['doo-placa', 'doo-clan-uprave'] as const) {
        const { obveznaDavanja } = izracun(id)
        const komorski = obveznaDavanja.find((d) => d.naziv.hr === 'komorski doprinos')
        const hgk = obveznaDavanja.find((d) => d.naziv.hr === 'članarina HGK')

        expect(komorski?.status).toBe('ne-primjenjuje-se')
        expect(hgk?.status).toBe('ne-primjenjuje-se')
      }
    })

    it('найм зі своєю віссю несе назване припущення, а не мовчить про нього', () => {
      const kodovi = izracun('zaposlenik').napomene.map((n) => n.kod)

      expect(kodovi).toContain('bruto-placa-nije-primitak')
    })

    it('поріг Blue Card стоїть постійно, по обидва боки від нього', () => {
      // Рядок, що з'являється лише в найгіршому випадку, показує поріг саме
      // тому, хто вже його перевищив, — а планує переїзд якраз він.
      const nizak = izracun('zaposlenik', { godisnjiPrimitak: eur(24_000) }).napomene.find(
        (n) => n.kod === 'prag-plave-karte',
      )
      const visok = izracun('zaposlenik', { godisnjiPrimitak: eur(90_000) }).napomene.find(
        (n) => n.kod === 'prag-plave-karte',
      )

      if (nizak?.kod !== 'prag-plave-karte' || visok?.kod !== 'prag-plave-karte') {
        throw new Error('поріг мав би стояти в обох випадках')
      }
      expect([nizak.dosegnut, visok.dosegnut]).toEqual([false, true])
      // 2 016 × 1,5 — з середньої за повний попередній рік, а не за січень–серпень.
      expect(toCentString(nizak.prag)).toBe('3024.00')
    })

    it('без середньої за повний рік поріг мовчить, а не стоїть на чужій статистиці', () => {
      const bezStatistike = usporediRezime(
        { godisnjiPrimitak: eur(30000), stope: ZAGREB },
        {
          ...PUNA_PODLOGA,
          pretpostavke: { ...pretpostavke2026, prosjecnaPlacaPrethodneGodine: undefined },
        },
      ).rezimi.find((r) => r.id === 'zaposlenik')

      if (bezStatistike?.ishod.status !== 'izracunato') throw new Error('найм мав би рахуватися')
      expect(bezStatistike.ishod.izracun.napomene.map((n) => n.kod)).not.toContain(
        'prag-plave-karte',
      )
    })

    it('лідер обирається серед усіх шести режимів, а не серед трьох обртних', () => {
      const svi = usporedi().rezimi.filter((r) => r.ishod.status === 'izracunato')

      expect(svi.length).toBe(6)
    })
  })

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
      expect(rezim.ishod.razlog.kod).toBe('nema-izdataka')
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
      expect(rezim.ishod.razlog.kod).toBe('nema-jedinice')
    }
  })

  it('обов’язкові платежі однакові в усіх трьох режимах', () => {
    // Платежі не знають ні `razred`, ні способу визначати `dohodak`, тож
    // перелік мусить бути той самий — інакше картки порівнювали б різне.
    const popisi = ['pausalni-obrt', 'obrt-na-dohodak', 'obrt-na-dobit'].map((id) =>
      izracunZa(id).obveznaDavanja.map((davanje) => `${davanje.naziv.hr}:${davanje.status}`),
    )

    expect(popisi[1]).toEqual(popisi[0])
    expect(popisi[2]).toEqual(popisi[0])
  })

  it('turistička članarina і spomenička renta входять у «на руки», а не губляться', () => {
    const bezDjelatnosti = izracunZa('pausalni-obrt')
    const rezim = usporedi({
      djelatnost: {
        nkd: '56.10',
        imaLokalnuTuristickuZajednicu: true,
        potpomognutoPodrucje: false,
        pretezitoProizvodna: false,
        polozaj: { kind: 'izvan' },
      },
    }).rezimi[0]
    if (rezim?.ishod.status !== 'izracunato') throw new Error('паушал недоступний')
    const zClanarinom = rezim.ishod.izracun

    // 30 000 € × 0,14212 % = 42,636 → 42,64 € понад 136,80 € komorskog.
    expect(toCentString(zClanarinom.ukupnaDavanja)).toBe('179.44')
    expect(toCentString(bezDjelatnosti.ukupnaDavanja)).toBe('136.80')
    expect(zClanarinom.netoZaOsobu.amount.minus(bezDjelatnosti.netoZaOsobu.amount).toFixed(2)).toBe(
      '-42.64',
    )
  })

  it('новий обрт не платить komorski doprinos — і це видно в «на руки»', () => {
    const rezim = usporedi({ noviObrt: true }).rezimi[0]
    if (rezim?.ishod.status !== 'izracunato') throw new Error('паушал недоступний')

    expect(toCentString(rezim.ishod.izracun.ukupnaDavanja)).toBe('0.00')
    expect(
      rezim.ishod.izracun.netoZaOsobu.amount
        .minus(izracunZa('pausalni-obrt').netoZaOsobu.amount)
        .toFixed(2),
    ).toBe('136.80')
  })

  it('утриманці й діти зменшують porez na dohodak через osobni odbitak', () => {
    const bez = izracunZa('obrt-na-dohodak')
    const zDitmy = usporedi({
      uzdrzavani: { ...BEZ_UZDRZAVANIH, clanoviUzeObitelji: 1, djeca: 2 },
    }).rezimi.find((r) => r.id === 'obrt-na-dohodak')
    if (zDitmy?.ishod.status !== 'izracunato') throw new Error('обрт на дохідок недоступний')

    expect(zDitmy.ishod.izracun.ukupanPorez.amount.lessThan(bez.ukupanPorez.amount)).toBe(true)
  })

  it('понад дев’яту дитину режим відмовляється рахувати, а не обрізає до дев’яти', () => {
    // Закон друкує коефіцієнти лише до дев'ятої дитини, далі — правило з
    // пропуском. Обрізати означало б вигадати податок.
    const rezim = usporedi({
      uzdrzavani: { ...BEZ_UZDRZAVANIH, clanoviUzeObitelji: 0, djeca: 10 },
    }).rezimi.find((r) => r.id === 'obrt-na-dohodak')
    if (rezim?.ishod.status !== 'nedostupno') throw new Error('десята дитина мала б зупинити лічбу')

    expect(rezim.ishod.razlog).toMatchObject({
      kod: 'koeficijent-djeteta-nije-propisan',
      dostupnoDjece: 9,
      trazenoDjece: 10,
    })
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

  it('виграш на внесках рахує рушій, а не екран', () => {
    const bez = izracunZa('pausalni-obrt')
    const rezimUzRad = usporedi({ uzRadniOdnos: true }).rezimi[0]
    if (rezimUzRad?.ishod.status !== 'izracunato') throw new Error('паушал уз рад недоступний')
    const uzRad = rezimUzRad.ishod.izracun

    // Порівнюється той самий режим на тих самих входах — інакше в число
    // потрапила б різниця режимів, а не наявність найму.
    expect(toCentString(uzRad.doprinosi.ustedaUzRadniOdnos ?? eur(0))).toBe(
      toCentString(
        eur(bez.doprinosi.ukupnoGodisnje.amount.minus(uzRad.doprinosi.ukupnoGodisnje.amount)),
      ),
    )
    // Без найму порівнювати немає з чим: нуль тут читався б як «виграшу немає».
    expect(bez.doprinosi.ustedaUzRadniOdnos).toBeUndefined()
  })
})

describe('дельта між сценаріями — перевірка ADR-0001', () => {
  // Припущення тримаються НЕЗМІННИМИ навмисно. Правила й припущення — різні
  // шари (ADR-0001), і зміна закону видно лише тоді, коли статистика не
  // ворушиться. Проєкт несе прогнозну prosječna plaća, тож із нею числа
  // розходяться всюди — але з правової причини, а зі статистичної.
  const podlogaZa = (primitak: string, najava: boolean): PodlogaUsporedbe =>
    najava ? { ...podloga2026, ruleset: rulesetNajave2027(eur(primitak).amount) } : podloga2026

  const netoZa = (primitak: string, najava: boolean) => {
    const ishod = usporediRezime({ godisnjiPrimitak: eur(primitak) }, podlogaZa(primitak, najava))
      .rezimi[0]?.ishod
    if (ishod?.status !== 'izracunato') throw new Error(`паушал недоступний за ${primitak}`)
    return ishod.izracun.netoZaOsobu
  }

  it.each(['1000', '11300', '19900', '30600', '39999.99', '40000'])(
    'на %s € дельта дорівнює нулю — реформа чіпає лише два верхні розряди',
    (primitak) => {
      expect(toCentString(netoZa(primitak, false))).toBe(toCentString(netoZa(primitak, true)))
    },
  )

  it.each(['40000.01', '50000', '60000'])('на %s € дельта таки з’являється', (primitak) => {
    expect(toCentString(netoZa(primitak, false))).not.toBe(toCentString(netoZa(primitak, true)))
  })

  it('сама лише зміна припущення рухає число там, де закон не змінився', () => {
    // Це друга половина ADR-0001: розходження двох офіційних таблиць на 2027
    // рік пояснюється не різними правилами, а різною prosječna plaća.
    const zPrognozom = usporediRezime(
      { godisnjiPrimitak: eur('20000') },
      { ...podloga2026, pretpostavke: pretpostavkeNajave2027 },
    ).rezimi[0]?.ishod
    if (zPrognozom?.status !== 'izracunato') throw new Error('паушал недоступний')

    expect(toCentString(zPrognozom.izracun.netoZaOsobu)).not.toBe(
      toCentString(netoZa('20000', false)),
    )
  })
})

describe('«на руки» означене однаково в усіх режимах', () => {
  const IZDACI_ZA_USPOREDBU = {
    najamnina: eur(2000),
    nabavkaRobe: eur(0),
    nabavkaUsluga: eur(1000),
    placeRadnika: eur(0),
    troskoviBanke: eur(200),
    reprezentacija: eur(0),
    osobnoVozilo: eur(0),
    ostalo: eur(800),
  }
  const UKUPNI_IZDACI = '4000.00'

  const puna: PodlogaUsporedbe = {
    ...podloga2026,
    obrtNaDohodak: obrtNaDohodak2026,
    obrtNaDobit: obrtNaDobit2026,
    drugaDjelatnost: drugaDjelatnost2026,
    nepunaGodina: PRAVILA_NEPUNE_GODINE,
  }

  const usporedba = usporediRezime(
    {
      godisnjiPrimitak: eur(35000),
      godisnjiIzdaci: IZDACI_ZA_USPOREDBU,
      stope: { niza: 2300, visa: 3300 },
    },
    puna,
  )

  const izracuni = usporedba.rezimi
    .map((r) =>
      r.ishod.status === 'izracunato' ? { id: r.id, izracun: r.ishod.izracun } : undefined,
    )
    .filter((x) => x !== undefined)

  it('усі три режими рахують «на руки» за однією формулою', () => {
    expect(izracuni.length).toBe(3)

    for (const { id, izracun } of izracuni) {
      // primitak − izdaci − податки − внески − обов'язкові платежі.
      const ocekivano = sum('EUR', [
        eur(35000),
        eur(izracun.ukupniIzdaci.amount.negated()),
        eur(izracun.ukupanPorez.amount.negated()),
        eur(izracun.doprinosi.ukupnoGodisnje.amount.negated()),
        eur(izracun.ukupnaDavanja.amount.negated()),
      ])

      expect(toCentString(izracun.netoZaOsobu), id).toBe(toCentString(ocekivano))
    }
  })

  it('усі три враховують ті самі витрати — інакше порівнювали б різне', () => {
    for (const { id, izracun } of izracuni) {
      expect(toCentString(izracun.ukupniIzdaci), id).toBe(UKUPNI_IZDACI)
    }
  })

  it('різниця між режимами йде лише з податків, внесків і платежів', () => {
    const [prvi, drugi] = izracuni
    if (prvi === undefined || drugi === undefined) throw new Error('замало режимів')

    const obveze = ({ izracun }: (typeof izracuni)[number]) =>
      sum('EUR', [izracun.ukupanPorez, izracun.doprinosi.ukupnoGodisnje, izracun.ukupnaDavanja])
        .amount

    // Якщо зобов'язання різні, а «на руки» однакове — формула десь розійшлася.
    expect(obveze(prvi).equals(obveze(drugi))).toBe(
      prvi.izracun.netoZaOsobu.amount.equals(drugi.izracun.netoZaOsobu.amount),
    )
  })
})
