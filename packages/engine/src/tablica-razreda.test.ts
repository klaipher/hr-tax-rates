import {
  pretpostavke2026,
  pretpostavkeNajave2027,
  ruleset2026,
  rulesetNajave2027,
} from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import { eur, toCentString } from './money.ts'
import type { PodlogaZa } from './obriv.ts'
import { tablicaRazreda } from './tablica-razreda.ts'

/** Чинний закон: набір правил від `primitak` не залежить узагалі. */
const naSnazi: PodlogaZa = () => ({ ruleset: ruleset2026, pretpostavke: pretpostavke2026 })

/** Заплановані зміни: `koeficijent` і `priznati izdatak` різні за розрядами. */
const najava: PodlogaZa = (godisnjiPrimitak) => ({
  ruleset: rulesetNajave2027(godisnjiPrimitak.amount),
  pretpostavke: pretpostavkeNajave2027,
})

describe('таблиця всіх розрядів', () => {
  it('має рядок на кожен розряд таблиці акта', () => {
    expect(tablicaRazreda(eur(20_000), naSnazi).map((redak) => redak.redniBroj)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ])
  })

  it('показує межу й paušalni dohodak кожного розряду', () => {
    const granice = tablicaRazreda(eur(20_000), naSnazi).map((redak) => [
      toCentString(redak.gornjaGranica),
      toCentString(redak.poreznaOsnovica),
    ])

    expect(granice).toEqual([
      ['11300.00', '1695.00'],
      ['15300.00', '2295.00'],
      ['19900.00', '2985.00'],
      ['30600.00', '4590.00'],
      ['40000.00', '6000.00'],
      ['50000.00', '7500.00'],
      ['60000.00', '9000.00'],
    ])
  })

  it('рахує податок і внески того самого розряду, а не поточного', () => {
    const redci = tablicaRazreda(eur(20_000), naSnazi)

    // Розряд 1: 1 695 × 12 % = 203,40. Розряд 7: 9 000 × 12 % = 1 080,00.
    expect([
      toCentString(redci[0]?.porez ?? eur(0)),
      toCentString(redci[6]?.porez ?? eur(0)),
    ]).toEqual(['203.40', '1080.00'])
    // За чинним законом koeficijent однаковий у всіх розрядах, тож внески теж.
    expect(toCentString(redci[0]?.doprinosi ?? eur(0))).toBe(
      toCentString(redci[6]?.doprinosi ?? eur(0)),
    )
  })

  it('у запланованих змінах внески різні за розрядами — бо різний koeficijent', () => {
    const redci = tablicaRazreda(eur(20_000), najava)
    const doprinosi = redci.map((redak) => toCentString(redak.doprinosi))

    // 0,40 у розрядах 1–5, 0,45 у шостому, 0,50 у сьомому — на 2 180 €.
    expect(new Set(doprinosi).size).toBe(3)
    expect([doprinosi[4], doprinosi[5], doprinosi[6]]).toEqual(['3819.36', '4296.78', '4774.20'])
  })

  it('зводить податок і внески в одну річну повинність', () => {
    for (const redak of tablicaRazreda(eur(20_000), najava)) {
      expect(toCentString(redak.ukupno), String(redak.redniBroj)).toBe(
        toCentString(eur(redak.porez.amount.plus(redak.doprinosi.amount))),
      )
    }
  })

  it('позначає рівно той розряд, у якому лежить поточний primitak', () => {
    const primijenjeni = (primitak: string) =>
      tablicaRazreda(eur(primitak), naSnazi)
        .filter((redak) => redak.primijenjen)
        .map((redak) => redak.redniBroj)

    expect(primijenjeni('20000')).toEqual([4])
    // На самій межі розряд ще той, на цент вище — уже наступний.
    expect(primijenjeni('19900')).toEqual([3])
    expect(primijenjeni('19900.01')).toEqual([4])
    // Понад поріг паушалу режиму немає, тож і застосованого розряду теж.
    expect(primijenjeni('60000.01')).toEqual([])
  })

  it('кожен рядок веде до статті з таблицею розрядів (ADR-0002)', () => {
    for (const redak of tablicaRazreda(eur(20_000), najava)) {
      expect(redak.izvor.article.length, String(redak.redniBroj)).toBeGreaterThan(0)
      expect(redak.izvor.url, String(redak.redniBroj)).toMatch(/^https:\/\//)
    }
  })

  it('таблиця не залежить від того, на якому primitak її спитали', () => {
    const bezPrimijenjenog = (primitak: string) =>
      tablicaRazreda(eur(primitak), najava).map(({ primijenjen: _, ...redak }) => redak)

    expect(bezPrimijenjenog('0')).toEqual(bezPrimijenjenog('55000'))
  })
})
