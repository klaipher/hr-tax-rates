import { KOMORSKI_DOPRINOS_PRIJEDLOG } from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import { type Djelatnost, obveznaDavanjaZa } from './davanja.ts'
import { eur, toCentString } from './money.ts'
import type { ObveznoDavanje } from './types.ts'

/** Ресторан у Загребі: `NKD` 56.10 є в переліку `čl. 5.`, у `čl. 117.` — немає. */
const UGOSTITELJSTVO: Djelatnost = {
  nkd: '56.10',
  imaLokalnuTuristickuZajednicu: true,
  potpomognutoPodrucje: false,
  pretezitoProizvodna: false,
  polozaj: { kind: 'izvan' },
}

const davanja = (djelatnost: Djelatnost | undefined, noviObrt = false) =>
  obveznaDavanjaZa({ godisnjiPrimitak: eur(40_000), noviObrt, djelatnost })

const poNazivu = (popis: readonly ObveznoDavanje[], hr: string): ObveznoDavanje => {
  const davanje = popis.find((kandidat) => kandidat.naziv.hr === hr)
  if (davanje === undefined) throw new Error(`Платежу «${hr}» немає в переліку`)
  return davanje
}

const iznos = (davanje: ObveznoDavanje): string =>
  davanje.status === 'obračunato' ? toCentString(davanje.godisnjiIznos) : 'не застосовується'

describe('обов’язкові платежі поза податками й внесками', () => {
  it('перелічує всі чотири платежі завжди й у тому самому порядку', () => {
    // Незастосовний платіж лишається в переліку: людина мусить відрізнити
    // «не забули» від «нічого не винен».
    expect(davanja(UGOSTITELJSTVO).map((davanje) => davanje.naziv.hr)).toEqual([
      'komorski doprinos',
      'turistička članarina',
      'spomenička renta',
      'indirektna spomenička renta',
    ])
  })

  it('склад переліку не залежить ні від NKD, ні від віку обрту', () => {
    const nazivi = (popis: readonly ObveznoDavanje[]) => popis.map((d) => d.naziv.hr)

    expect(nazivi(davanja(undefined, true))).toEqual(nazivi(davanja(UGOSTITELJSTVO)))
    expect(nazivi(davanja({ ...UGOSTITELJSTVO, nkd: '62.01' }))).toEqual(
      nazivi(davanja(UGOSTITELJSTVO)),
    )
  })

  it('рахує turistička članarina за skupina, у яку закон відніс NKD', () => {
    // 40 000 € × 0,14212 % = 56,848 → 56,85 €.
    expect(iznos(poNazivu(davanja(UGOSTITELJSTVO), 'turistička članarina'))).toBe('56.85')
  })

  it('бере найточніший запис переліку, а не розділ: 45.20 не в одній групі з 45', () => {
    // 45.20 закон називає в `treća skupina` (0,08527 %), а весь розділ 45 —
    // у `peta` (0,01705 %). Реалізація за першим збігом занизила б у п'ять разів.
    const uTrecoj = davanja({ ...UGOSTITELJSTVO, nkd: '45.20' })
    const uPetoj = davanja({ ...UGOSTITELJSTVO, nkd: '45.31' })

    expect([
      iznos(poNazivu(uTrecoj, 'turistička članarina')),
      iznos(poNazivu(uPetoj, 'turistička članarina')),
    ]).toEqual(['34.11', '6.82'])
  })

  it('NKD поза переліком дає названу причину, а не мовчазний нуль', () => {
    const davanje = poNazivu(davanja({ ...UGOSTITELJSTVO, nkd: '62.01' }), 'turistička članarina')

    expect(davanje.status).toBe('ne-primjenjuje-se')
    if (davanje.status !== 'ne-primjenjuje-se') return
    expect(davanje.razlog).toEqual({ kod: 'djelatnost-izvan-popisa', nkd: '62.01' })
    expect(davanje.izvor.article).toContain('čl. 5.')
  })

  it('без введеного NKD застосовність не вигадується, а називається невизначеною', () => {
    for (const naziv of ['turistička članarina', 'indirektna spomenička renta']) {
      const davanje = poNazivu(davanja(undefined), naziv)

      expect(davanje.status, naziv).toBe('ne-primjenjuje-se')
      if (davanje.status !== 'ne-primjenjuje-se') return
      expect(davanje.razlog, naziv).toEqual({ kod: 'djelatnost-nije-zadana' })
      // Причина веде до переліку, який робить `NKD` вирішальним.
      expect(davanje.izvor.url, naziv).toMatch(/^https:\/\//)
    }
  })

  it('дві пам’яткові ренти йдуть окремими рядками з різними статтями', () => {
    const uKulturnomDobru = davanja({
      ...UGOSTITELJSTVO,
      nkd: '92.00',
      polozaj: { kind: 'u-kulturnom-dobru', korisnaPovrsinaM2: 50, mjesecniIznosPoM2: '0.20' },
    })

    // 50 м² × 0,20 €/м² × 12 = 120,00 €; 40 000 € × 0,05 % = 20,00 €.
    expect([
      iznos(poNazivu(uKulturnomDobru, 'spomenička renta')),
      iznos(poNazivu(uKulturnomDobru, 'indirektna spomenička renta')),
    ]).toEqual(['120.00', '20.00'])
    expect(poNazivu(uKulturnomDobru, 'spomenička renta').izvor.article).toContain('čl. 116.')
    expect(poNazivu(uKulturnomDobru, 'indirektna spomenička renta').izvor.article).toContain(
      'čl. 117.',
    )
  })

  it('новий обрт не платить komorski doprinos — і причина називає строк звільнення', () => {
    const davanje = poNazivu(davanja(UGOSTITELJSTVO, true), 'komorski doprinos')

    expect(davanje.status).toBe('ne-primjenjuje-se')
    if (davanje.status !== 'ne-primjenjuje-se') return
    expect(davanje.razlog).toEqual({ kod: 'novootvoreni-obrt', oslobodenjeGodina: 2 })
    expect(davanje.izvor.article).toBe('čl. 15.')
  })

  it('застереження до нарахованого платежу переходить кодом, а не реченням', () => {
    // 65.12 закон бере не повністю, а лише в перелічених видах страхування.
    const davanje = poNazivu(davanja({ ...UGOSTITELJSTVO, nkd: '65.12' }), 'turistička članarina')

    if (davanje.status !== 'obračunato') throw new Error('65.12 у переліку є')
    expect(davanje.napomene.map((napomena) => napomena.kod)).toEqual(['ogranicenje-nkd'])
  })

  it('бере ті правила komorskog doprinosa, які їй дали, а не завжди чинні', () => {
    const zaPrijedlog = obveznaDavanjaZa(
      { godisnjiPrimitak: eur(40_000), noviObrt: false, djelatnost: undefined },
      KOMORSKI_DOPRINOS_PRIJEDLOG,
    )

    // 1,5 % × 600 € × 12 = 108,00 € проти чинних 136,80 €.
    expect(iznos(poNazivu(zaPrijedlog, 'komorski doprinos'))).toBe('108.00')
    expect(iznos(poNazivu(davanja(undefined), 'komorski doprinos'))).toBe('136.80')
  })

  it('сума з проєктної стелі несе застереження, що це стеля, а не ставка', () => {
    const zaPrijedlog = obveznaDavanjaZa(
      { godisnjiPrimitak: eur(40_000), noviObrt: false, djelatnost: undefined },
      KOMORSKI_DOPRINOS_PRIJEDLOG,
    )
    const davanje = poNazivu(zaPrijedlog, 'komorski doprinos')
    if (davanje.status !== 'obračunato') throw new Error('проєкт не скасовує внесок')

    expect(davanje.napomene.map((napomena) => napomena.kod)).toEqual(['stopa-je-gornja-granica'])
    // Чинна ставка — саме ставка, і застереження їй не потрібне.
    const uSnazi = poNazivu(davanja(undefined), 'komorski doprinos')
    if (uSnazi.status !== 'obračunato') throw new Error('чинний обрт платить')
    expect(uSnazi.napomene).toEqual([])
  })

  it('кожен платіж названий хорватською з українським перекладом поруч', () => {
    for (const { naziv } of davanja(UGOSTITELJSTVO)) {
      expect(naziv.hr.length).toBeGreaterThan(0)
      expect(naziv.uk.length).toBeGreaterThan(0)
    }
  })
})
