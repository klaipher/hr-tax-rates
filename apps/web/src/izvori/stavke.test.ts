import { ruleset2026 } from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
// Тести працюють з публічним входом каталогу — тим самим, який бере застосунок.
import { grupirajPoAktu, pravneStavke, type Stavka, type StavkaId } from './index.ts'

const stavka = (id: StavkaId, act: string, gazette: string, url: string): Stavka => ({
  vrsta: 'broj',
  id,
  vrijednost: '1 %',
  izvor: {
    jurisdiction: 'HR',
    act,
    article: 'čl. 1.',
    gazette,
    url,
    status: 'in-force',
    checkedOn: '2026-08-04',
  },
})

/**
 * Скільки в наборі правил значень із правовим джерелом.
 *
 * Обхід ішов би зайвим, якби перелік на сторінці будувався сам собою, але він
 * виписаний руками — тож без цього лічильника нове число в `ruleset` тихо не
 * потрапило б на сторінку джерел і лишилося б без статті (ADR-0002).
 */
const prebrojIzvore = (vrijednost: unknown): number => {
  if (typeof vrijednost !== 'object' || vrijednost === null) return 0

  const zapis = vrijednost as Record<string, unknown>
  const izvor = zapis['source']
  if (izvor !== undefined && typeof izvor === 'object' && izvor !== null && 'act' in izvor) return 1

  return Object.values(zapis).reduce<number>((zbroj, dijete) => zbroj + prebrojIzvore(dijete), 0)
}

describe('юридичні числа набору правил', () => {
  const stavke = pravneStavke(ruleset2026)

  it('не пропускає жодного числа з джерелом, яке є в наборі правил', () => {
    expect(stavke).toHaveLength(prebrojIzvore(ruleset2026))
  })

  it('перелічує всі числа в порядку набору правил', () => {
    expect(stavke.map(({ id }) => id)).toEqual([
      'razredi',
      'priznati-izdatak',
      'stopa-pausalnog-poreza',
      'koeficijent',
      'prag-primitka',
      'stopa-mo-prvi-stup',
      'stopa-mo-drugi-stup',
      'stopa-zo',
    ])
  })

  it('несе джерело за кожним числом', () => {
    for (const { id, izvor } of stavke) {
      expect(izvor.act, id).not.toBe('')
      expect(izvor.article, id).not.toBe('')
      expect(izvor.gazette, id).toMatch(/NN /)
      expect(izvor.url, id).toMatch(/^https:\/\//)
      expect(izvor.checkedOn, id).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('цитує джерело того самого набору правил, а не власну копію', () => {
    const izdatak = stavke.find(({ id }) => id === 'priznati-izdatak')
    expect(izdatak?.izvor).toBe(ruleset2026.pausalniObrt.priznatiIzdatak.source)
  })

  it('показує ставки відсотком, поріг — сумою, коефіцієнт — множником', () => {
    const vrijednosti = new Map(
      stavke.flatMap((s) => (s.vrsta === 'broj' ? [[s.id, s.vrijednost] as const] : [])),
    )

    expect(vrijednosti.get('stopa-pausalnog-poreza')).toBe('12 %')
    expect(vrijednosti.get('priznati-izdatak')).toBe('85 %')
    expect(vrijednosti.get('stopa-zo')).toBe('16,5 %')
    expect(vrijednosti.get('prag-primitka')).toBe('60 000,00 €')
    // Коефіцієнт — частка prosječna plaća, а не ставка від чогось: 0,4, не 40 %.
    expect(vrijednosti.get('koeficijent')).toBe('0,4')
  })

  it('віддає таблицю розрядів рядками, готовими до показу', () => {
    const razredi = stavke.find(({ id }) => id === 'razredi')

    expect(razredi?.vrsta).toBe('tablica')
    if (razredi?.vrsta !== 'tablica') return

    expect(razredi.redci).toHaveLength(7)
    expect(razredi.redci[0]).toEqual({
      redniBroj: 1,
      gornjaGranica: '11 300,00 €',
      godisnjiPausalniDohodak: '1 695,00 €',
    })
    expect(razredi.redci.at(-1)?.gornjaGranica).toBe('60 000,00 €')
  })
})

describe('групування чисел за актом', () => {
  it('зводить числа одного акта в одну групу, зберігаючи порядок появи', () => {
    const skupine = grupirajPoAktu(pravneStavke(ruleset2026))

    expect(skupine.map(({ act }) => act)).toEqual([
      'Pravilnik o paušalnom oporezivanju samostalnih djelatnosti',
      'Zakon o porezu na dohodak',
      'Zakon o doprinosima',
      'Zakon o porezu na dodanu vrijednost',
    ])
    expect(skupine.map(({ stavke }) => stavke.map(({ id }) => id))).toEqual([
      ['razredi', 'priznati-izdatak'],
      ['stopa-pausalnog-poreza'],
      ['koeficijent', 'stopa-mo-prvi-stup', 'stopa-mo-drugi-stup', 'stopa-zo'],
      ['prag-primitka'],
    ])
  })

  it('не змішує дві редакції того самого акта під різними NN', () => {
    const skupine = grupirajPoAktu([
      stavka('stopa-zo', 'Zakon o doprinosima', 'NN 152/24', 'https://example.test/a'),
      stavka('koeficijent', 'Zakon o doprinosima', 'NN 114/23', 'https://example.test/a'),
    ])

    expect(skupine).toHaveLength(2)
    expect(skupine.map(({ gazette }) => gazette)).toEqual(['NN 152/24', 'NN 114/23'])
  })

  it('розрізняє групи, у яких збігається все, крім URL', () => {
    const skupine = grupirajPoAktu([
      stavka('stopa-zo', 'Odluka', 'NN 154/22', 'https://example.test/a'),
      stavka('koeficijent', 'Odluka', 'NN 154/22', 'https://example.test/b'),
    ])

    expect(skupine).toHaveLength(2)
    expect(new Set(skupine.map(({ kljuc }) => kljuc)).size).toBe(2)
  })

  it('порожній перелік дає порожнє групування', () => {
    expect(grupirajPoAktu([])).toEqual([])
  })
})
