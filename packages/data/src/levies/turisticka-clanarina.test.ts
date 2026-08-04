import { describe, expect, it } from 'vitest'
import { nkdDirektorij, normalizirajNkd } from './nkd.ts'
import {
  POPUST_ZA_POTPOMOGNUTA_PODRUCJA,
  TURISTICKA_CLANARINA_DJELATNOSTI,
  TURISTICKA_CLANARINA_STOPE,
  turistickaClanarina,
} from './turisticka-clanarina.ts'

const UGOSTITELJSTVO = {
  nkd: '56.10',
  primitak: '40000',
  imaLokalnuTuristickuZajednicu: true,
  potpomognutoPodrucje: false,
} as const

describe('turistička članarina (туристичний членський внесок)', () => {
  it('паушальний обрт у `prva skupina`: 0,14212 % від наплачених primitak', () => {
    const result = turistickaClanarina(UGOSTITELJSTVO)

    if (result.kind !== 'due') throw new Error('ugostiteljstvo платить članarina')
    // 40 000 × 0,14212 % = 56,848 → 56,85 €.
    expect(result.godisnjiIznos.toFixed(2)).toBe('56.85')
    expect(result.obracun).toContain('prva')
    expect(result.source.article).toContain('čl. 6.')
  })

  it('діяльність поза переліком čl. 5. — прямо сказано, що платежу немає', () => {
    const result = turistickaClanarina({ ...UGOSTITELJSTVO, nkd: '62.01' })

    expect(result.kind).toBe('not-applicable')
    if (result.kind !== 'not-applicable') return
    expect(result.reason).toBe('djelatnost-izvan-popisa')
    expect(result.obrazlozenje).toContain('62.01')
    expect(result.source.article).toContain('čl. 5.')
  })

  it('перекривні коди розв’язуються за найточнішим, а не за розділом', () => {
    // 45.20 закон називає окремо в `treća skupina` (0,08527 %), хоча весь
    // розділ 45 лежить у `peta` (0,01705 %). Реалізація, що бере розділ,
    // занизила б внесок у п'ять разів.
    const result = turistickaClanarina({ ...UGOSTITELJSTVO, nkd: '45.20' })

    if (result.kind !== 'due') throw new Error('45.20 платить članarina')
    // 40 000 × 0,08527 % = 34,108 → 34,11 €.
    expect(result.godisnjiIznos.toFixed(2)).toBe('34.11')
    expect(result.obracun).toContain('treca')
  })

  it('розділ ловить свої класи, коли точнішого запису немає', () => {
    const result = turistickaClanarina({ ...UGOSTITELJSTVO, nkd: '45.19' })

    if (result.kind !== 'due') throw new Error('45.19 підпадає під 45.1')
    expect(result.obracun).toContain('cetvrta')
  })

  it('potpomognuto područje знижує внесок на 20 %', () => {
    const result = turistickaClanarina({ ...UGOSTITELJSTVO, potpomognutoPodrucje: true })

    if (result.kind !== 'due') throw new Error('знижка не скасовує внесок')
    // 56,848 × 0,8 = 45,4784 → 45,48 €.
    expect(result.godisnjiIznos.toFixed(2)).toBe('45.48')
    expect(result.obracun).toContain('20 %')
  })

  it('без місцевої turistička zajednica обов’язку немає — і це окрема причина', () => {
    const result = turistickaClanarina({ ...UGOSTITELJSTVO, imaLokalnuTuristickuZajednicu: false })

    expect(result.kind).toBe('not-applicable')
    if (result.kind !== 'not-applicable') return
    expect(result.reason).toBe('izvan-podrucja-turisticke-zajednice')
    expect(result.source.article).toContain('čl. 4.')
  })

  it('код, який закон звужує додатковою умовою, дає суму із застереженням', () => {
    // 65.12 у čl. 5. — не все «Ostalo osiguranje», а лише перелічені види
    // туристичних страхувань. Сума без цього застереження вводила б в оману.
    const result = turistickaClanarina({ ...UGOSTITELJSTVO, nkd: '65.12' })

    if (result.kind !== 'due') throw new Error('65.12 у переліку є')
    expect(result.napomene).toHaveLength(1)
    expect(result.napomene[0]).toContain('osiguranje')
  })

  it('нульовий primitak дає нуль як нараховану суму, а не «не застосовується»', () => {
    const result = turistickaClanarina({ ...UGOSTITELJSTVO, primitak: '0' })

    expect(result.kind).toBe('due')
    if (result.kind !== 'due') return
    expect(result.godisnjiIznos.toFixed(2)).toBe('0.00')
  })

  it('ставки всіх п’яти `skupina` узяті з čl. 6. і мають джерело', () => {
    expect(TURISTICKA_CLANARINA_STOPE.value).toEqual({
      prva: '0.14212',
      druga: '0.11367',
      treca: '0.08527',
      cetvrta: '0.02842',
      peta: '0.01705',
    })
    expect(TURISTICKA_CLANARINA_STOPE.source.gazette).toContain('52/19')
    expect(TURISTICKA_CLANARINA_STOPE.source.status).toBe('in-force')
    expect(POPUST_ZA_POTPOMOGNUTA_PODRUCJA.value).toBe('20')
  })

  it('кожен код переліку čl. 5. є в довіднику NKD і не повторюється', () => {
    const sifre = TURISTICKA_CLANARINA_DJELATNOSTI.value.map((d) => normalizirajNkd(d.sifra))
    expect(new Set(sifre).size).toBe(sifre.length)

    const poznate = new Set(nkdDirektorij.map((s) => normalizirajNkd(s.sifra)))
    for (const sifra of sifre) expect(poznate.has(sifra), sifra).toBe(true)
  })
})
