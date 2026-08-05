import { describe, expect, it } from 'vitest'
import { type KodSkupineNkd, nkdPoSkupinama } from './izbor-djelatnosti.ts'
import { nkdDirektorij, normalizirajNkd } from './nkd.ts'

const sviKodovi = (): readonly string[] =>
  nkdPoSkupinama.flatMap((s) => s.stavke.map((stavka) => normalizirajNkd(stavka.sifra)))

describe('nkdPoSkupinama', () => {
  it('покриває весь довідник — код без групи не потрапив би у вибір', () => {
    const uVyboru = new Set(sviKodovi())
    const nepokryti = nkdDirektorij
      .map((s) => s.sifra)
      .filter((sifra) => !uVyboru.has(normalizirajNkd(sifra)))

    expect(nepokryti).toEqual([])
  })

  it('не показує той самий код двічі', () => {
    const kodovi = sviKodovi()

    expect(kodovi).toHaveLength(new Set(kodovi).size)
  })

  it('тримає всі шість груп у порядку від найдорожчої ставки', () => {
    const ocekivano: readonly KodSkupineNkd[] = [
      'turisticka-prva',
      'turisticka-druga',
      'turisticka-treca',
      'turisticka-cetvrta',
      'turisticka-peta',
      'spomenicka',
    ]

    expect(nkdPoSkupinama.map((s) => s.kod)).toEqual(ocekivano)
  })

  it('несе назву діяльності поруч із кодом — заради неї вибір і робився', () => {
    const prva = nkdPoSkupinama.find((s) => s.kod === 'turisticka-prva')

    expect(prva?.stavke).toContainEqual({ sifra: '55', naziv: 'Smještaj' })
  })

  it('не лишає жодної групи порожньою', () => {
    expect(nkdPoSkupinama.filter((s) => s.stavke.length === 0)).toEqual([])
  })

  it('розділ 61 стоїть у туристичній групі, а не в обох', () => {
    const uSkupinama = nkdPoSkupinama
      .filter((s) => s.stavke.some((stavka) => stavka.sifra === '61'))
      .map((s) => s.kod)

    expect(uSkupinama).toEqual(['turisticka-druga'])
  })
})
