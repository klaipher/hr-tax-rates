import {
  drugaDjelatnost2026,
  obrtNaDobit2026,
  obrtNaDohodak2026,
  PRAVILA_NEPUNE_GODINE,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import { eur, type Money, toCentString } from './money.ts'
import { najpovoljnijiRezim, type PodlogaUsporedbeZa, tockePreokreta } from './preokret.ts'
import type { RezimId } from './types.ts'
import type { UnosUsporedbe } from './usporedba.ts'

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

/** Загреб: 23 % / 33 % — найвищі ставки, які закон дозволяє одиниці. */
const ZAGREB = { niza: 2300, visa: 3300 } as const

const POVNYJ_UNOS: UnosUsporedbe = {
  godisnjiPrimitak: eur(0),
  godisnjiIzdaci: IZDACI,
  stope: ZAGREB,
}

const naSnazi: PodlogaUsporedbeZa = () => ({
  ruleset: ruleset2026,
  pretpostavke: pretpostavke2026,
  obrtNaDohodak: obrtNaDohodak2026,
  obrtNaDobit: obrtNaDobit2026,
  drugaDjelatnost: drugaDjelatnost2026,
  nepunaGodina: PRAVILA_NEPUNE_GODINE,
})

/** Лише паушал: решта режимів мовчить, бо їм бракує входу. */
const samoPausal: PodlogaUsporedbeZa = () => ({
  ruleset: ruleset2026,
  pretpostavke: pretpostavke2026,
})

const OPSEG = { najvisiPrimitak: eur(200_000), korak: eur(250) }

const tocke = (unos: UnosUsporedbe = POVNYJ_UNOS, podlogaZa = naSnazi) =>
  tockePreokreta(unos, podlogaZa, OPSEG)

const lider = (primitak: Money<'EUR'>, podlogaZa = naSnazi): RezimId | undefined =>
  najpovoljnijiRezim({ ...POVNYJ_UNOS, godisnjiPrimitak: primitak }, podlogaZa(primitak))

describe('точка перевороту', () => {
  it('називає найвигідніший режим — той, що лишає найбільше на руки', () => {
    expect(lider(eur(20_000))).toBe('pausalni-obrt')
  })

  it('без жодного порахованого режиму лідера немає, а не нуль', () => {
    // Понад поріг паушалу і без витрат та ставок не рахується нічого.
    expect(
      najpovoljnijiRezim({ godisnjiPrimitak: eur(100_000) }, samoPausal(eur(100_000))),
    ).toBeUndefined()
  })

  it('коли режим лише один, перевороту немає — поступитися нема кому', () => {
    expect(tocke({ godisnjiPrimitak: eur(0) }, samoPausal)).toEqual([])
  })

  it('знаходить точку до цента: на цент нижче лідер ще старий', () => {
    for (const tocka of tocke()) {
      const cent = eur(tocka.primitak.amount.minus('0.01'))

      expect([toCentString(tocka.primitak), lider(cent)], toCentString(tocka.primitak)).toEqual([
        toCentString(tocka.primitak),
        tocka.dosadasnji,
      ])
      expect([toCentString(tocka.primitak), lider(tocka.primitak)]).toEqual([
        toCentString(tocka.primitak),
        tocka.sljedeci,
      ])
    }
  })

  it('жодна точка не залишає режим самому собі', () => {
    for (const tocka of tocke()) {
      expect(tocka.dosadasnji, toCentString(tocka.primitak)).not.toBe(tocka.sljedeci)
    }
  })

  it('точки йдуть за зростанням primitak', () => {
    const primici = tocke().map((tocka) => tocka.primitak.amount.toNumber())

    expect(primici).toEqual([...primici].sort((a, b) => a - b))
  })

  it('на порозі паушалу режим міняється рівно на цент за 60 000 €', () => {
    // Понад поріг паушал зникає з таблиці, і місце лідера переходить до
    // режиму з обліком. Це найважливіша точка на всьому діапазоні.
    const naPragu = tocke().find((tocka) => toCentString(tocka.primitak) === '60000.01')

    expect(naPragu).toBeDefined()
    expect([naPragu?.dosadasnji, naPragu?.sljedeci]).toEqual(['pausalni-obrt', 'obrt-na-dohodak'])
  })

  it('знаходить і межу, що не стоїть на жодній межі розряду', () => {
    // Другий переворот виникає не з таблиці, а з арифметики: `obrt na dobit`
    // обганяє `obrt na dohodak` там, де прогресія другого переважує подвійне
    // оподаткування першого. Круглого числа тут немає — і саме тому межу
    // треба шукати, а не читати з акта.
    expect(tocke().map((tocka) => toCentString(tocka.primitak))).toEqual(['60000.01', '95052.36'])
  })

  it('поза межами діапазону не шукає', () => {
    const uzak = tockePreokreta(POVNYJ_UNOS, naSnazi, {
      najvisiPrimitak: eur(50_000),
      korak: eur(250),
    })

    expect(uzak.map((tocka) => toCentString(tocka.primitak))).not.toContain('60000.01')
  })

  it('на однакових входах дає однаковий результат', () => {
    expect(tocke()).toEqual(tocke())
  })
})
