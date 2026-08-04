import { describe, expect, it } from 'vitest'
import { godisnjiZbroj } from './levy.ts'
import { nkdDirektorij, normalizirajNkd } from './nkd.ts'
import {
  INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI,
  INDIREKTNA_SPOMENICKA_RENTA_STOPA,
  RASPON_SPOMENICKE_RENTE_PO_M2,
  spomenickaRenta,
} from './spomenicka-renta.ts'

const U_ZONI = {
  nkd: '56.10',
  prihod: '40000',
  pretezitoProizvodna: false,
  polozaj: {
    kind: 'u-kulturnom-dobru',
    korisnaPovrsinaM2: '50',
    mjesecniIznosPoM2: '0.20',
  },
} as const

describe('spomenička renta (пам’яткова рента)', () => {
  it('за площею: 50 м² × 0,20 €/м² × 12 місяців = 120,00 € на рік', () => {
    const { povrsinska } = spomenickaRenta(U_ZONI)

    if (povrsinska.kind !== 'due') throw new Error('діяльність у зоні — рента є')
    expect(povrsinska.godisnjiIznos.toFixed(2)).toBe('120.00')
    expect(povrsinska.source.article).toContain('čl. 116.')
  })

  it('поза культурним добром ренти за площею немає — і це сказано прямо', () => {
    const { povrsinska } = spomenickaRenta({ ...U_ZONI, polozaj: { kind: 'izvan' } })

    expect(povrsinska.kind).toBe('not-applicable')
    if (povrsinska.kind !== 'not-applicable') return
    expect(povrsinska.reason).toBe('izvan-kulturnog-dobra')
    expect(povrsinska.source.article).toContain('čl. 116.')
  })

  it('переважно виробнича діяльність звільнена від ренти за площею', () => {
    const { povrsinska } = spomenickaRenta({ ...U_ZONI, pretezitoProizvodna: true })

    expect(povrsinska.kind).toBe('not-applicable')
    if (povrsinska.kind !== 'not-applicable') return
    expect(povrsinska.reason).toBe('pretezito-proizvodna-djelatnost')
    expect(povrsinska.source.article).toBe('čl. 116. st. 9.')
  })

  it('місцева ставка поза законним діапазоном 0,13–0,53 €/м² — це збій, а не тихий розрахунок', () => {
    expect(() =>
      spomenickaRenta({
        ...U_ZONI,
        polozaj: { kind: 'u-kulturnom-dobru', korisnaPovrsinaM2: '50', mjesecniIznosPoM2: '0.60' },
      }),
    ).toThrow(/0,13/)
    expect(() =>
      spomenickaRenta({
        ...U_ZONI,
        polozaj: { kind: 'u-kulturnom-dobru', korisnaPovrsinaM2: '50', mjesecniIznosPoM2: '0.10' },
      }),
    ).toThrow(/0,53/)
  })

  it('межі діапазону приймаються', () => {
    for (const stopa of ['0.13', '0.53']) {
      expect(() =>
        spomenickaRenta({
          ...U_ZONI,
          polozaj: { kind: 'u-kulturnom-dobru', korisnaPovrsinaM2: '1', mjesecniIznosPoM2: stopa },
        }),
      ).not.toThrow()
    }
  })

  it('indirektna spomenička renta: 0,05 % від прибутку за переліком čl. 117.', () => {
    const { indirektna } = spomenickaRenta({ ...U_ZONI, nkd: '92.00' })

    if (indirektna.kind !== 'due') throw new Error('92.00 у переліку čl. 117. є')
    // 40 000 × 0,05 % = 20,00 €.
    expect(indirektna.godisnjiIznos.toFixed(2)).toBe('20.00')
    expect(indirektna.source.article).toContain('čl. 117.')
  })

  it('розділ 61 із переліку ловить свої класи', () => {
    const { indirektna } = spomenickaRenta({ ...U_ZONI, nkd: '61.10' })
    expect(indirektna.kind).toBe('due')
  })

  it('діяльність поза переліком čl. 117. не дає indirektna renta', () => {
    const { indirektna } = spomenickaRenta(U_ZONI)

    expect(indirektna.kind).toBe('not-applicable')
    if (indirektna.kind !== 'not-applicable') return
    expect(indirektna.reason).toBe('djelatnost-izvan-popisa')
    expect(indirektna.obrazlozenje).toContain('56.10')
  })

  it('звільнення для виробничої діяльності стосується лише čl. 116., не čl. 117.', () => {
    // čl. 116. st. 9. звільняє «od plaćanja spomeničke rente propisane ovim
    // člankom» — тобто рівно своєї, за площею. čl. 117. власного звільнення
    // не має, і поширювати чуже було б вигадкою.
    const { povrsinska, indirektna } = spomenickaRenta({
      ...U_ZONI,
      nkd: '92.00',
      pretezitoProizvodna: true,
    })

    expect(povrsinska.kind).toBe('not-applicable')
    expect(indirektna.kind).toBe('due')
  })

  it('обидві ренти можуть виникнути водночас і складаються в одну суму', () => {
    const { povrsinska, indirektna } = spomenickaRenta({ ...U_ZONI, nkd: '92.00' })

    expect(godisnjiZbroj([povrsinska, indirektna]).toFixed(2)).toBe('140.00')
  })

  it('ставки й діапазон узяті із закону та мають джерело', () => {
    expect(INDIREKTNA_SPOMENICKA_RENTA_STOPA.value).toBe('0.05')
    expect(INDIREKTNA_SPOMENICKA_RENTA_STOPA.source.gazette).toContain('145/24')
    expect(RASPON_SPOMENICKE_RENTE_PO_M2.value).toEqual({ najmanje: '0.13', najvise: '0.53' })
    expect(RASPON_SPOMENICKE_RENTE_PO_M2.source.status).toBe('in-force')
  })

  it('кожен код переліку čl. 117. є в довіднику NKD і не повторюється', () => {
    const sifre = INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.value.map((d) => normalizirajNkd(d.sifra))
    expect(new Set(sifre).size).toBe(sifre.length)

    const poznate = new Set(nkdDirektorij.map((s) => normalizirajNkd(s.sifra)))
    for (const sifra of sifre) expect(poznate.has(sifra), sifra).toBe(true)
  })
})
