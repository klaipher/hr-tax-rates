import type { LegalReference, Ruleset } from '@hr-tax/data'
import { eur, formatEur, formatPostotak } from '@hr-tax/engine'

/**
 * `Sourced<Decimal>` без прямої залежності від decimal.js: тип береться з
 * самого `ruleset`. Вебзастосунок decimal.js у залежностях не має і не
 * повинен мати — числа сюди приходять уже порахованими.
 */
type SourcedDecimal = Ruleset['doprinosi']['stopaZo']

/**
 * Ідентифікатор юридичного числа. Текст до нього — назва, переклад і
 * пояснення — живе в `tekst.ts`, щоб переклади доклеювалися одним рухом.
 */
export type StavkaId =
  | 'razredi'
  | 'priznati-izdatak'
  | 'stopa-pausalnog-poreza'
  | 'koeficijent'
  | 'prag-primitka'
  | 'stopa-mo-prvi-stup'
  | 'stopa-mo-drugi-stup'
  | 'stopa-zo'

/** Рядок таблиці розрядів, уже відформатований для показу. */
export interface RazredRedak {
  readonly redniBroj: number
  readonly gornjaGranica: string
  readonly godisnjiPausalniDohodak: string
}

interface StavkaBase {
  readonly id: StavkaId
  /** Акт і стаття, з яких число взяте. Без джерела числа тут не буває (ADR-0002). */
  readonly izvor: LegalReference
}

/** Скалярне юридичне число: ставка, коефіцієнт, поріг. */
export interface Broj extends StavkaBase {
  readonly vrsta: 'broj'
  readonly vrijednost: string
}

/**
 * Таблиця розрядів: багато чисел з одним джерелом на всю таблицю.
 *
 * Джерело справді одне: таблиця і є вмістом однієї статті, окремий `razred`
 * власного посилання не має.
 */
export interface Tablica extends StavkaBase {
  readonly vrsta: 'tablica'
  readonly redci: readonly RazredRedak[]
}

export type Stavka = Broj | Tablica

/** Група позицій одного акта: акт цитується раз, числа — списком. */
export interface SkupinaAkta {
  /** Стала тотожність групи: назва акта, оприлюднення й URL разом. */
  readonly kljuc: string
  readonly act: string
  readonly gazette: string
  readonly stavke: readonly Stavka[]
}

const broj = (id: StavkaId, sourced: SourcedDecimal, prikaz: string): Broj => ({
  vrsta: 'broj',
  id,
  vrijednost: prikaz,
  izvor: sourced.source,
})

const postotak = (id: StavkaId, sourced: SourcedDecimal): Broj =>
  broj(id, sourced, formatPostotak(sourced.value))

const iznos = (id: StavkaId, sourced: SourcedDecimal): Broj =>
  broj(id, sourced, formatEur(eur(sourced.value)))

/**
 * `koeficijent` показується множником, а не відсотком: 0,4 — це частка
 * `prosječna plaća`, з якої виходить `osnovica`, а не ставка від чогось.
 */
const mnozitelj = (id: StavkaId, sourced: SourcedDecimal): Broj =>
  broj(id, sourced, sourced.value.toString().replace('.', ','))

/**
 * Усі юридичні числа `ruleset` разом зі своїми джерелами — у тому порядку, у
 * якому вони записані в наборі правил.
 *
 * Порядок не сортується: набір правил іде за оповіддю самого закону —
 * спершу паушал, потім внески, — і сторінка джерел не має права її
 * перетасовувати.
 */
export const pravneStavke = (ruleset: Ruleset): readonly Stavka[] => {
  const { pausalniObrt, doprinosi } = ruleset

  return [
    {
      vrsta: 'tablica',
      id: 'razredi',
      izvor: pausalniObrt.razredi.source,
      redci: pausalniObrt.razredi.value.map((razred) => ({
        redniBroj: razred.redniBroj,
        gornjaGranica: formatEur(eur(razred.gornjaGranica)),
        godisnjiPausalniDohodak: formatEur(eur(razred.godisnjiPausalniDohodak)),
      })),
    },
    postotak('priznati-izdatak', pausalniObrt.priznatiIzdatak),
    postotak('stopa-pausalnog-poreza', pausalniObrt.stopaPoreza),
    mnozitelj('koeficijent', pausalniObrt.koeficijent),
    iznos('prag-primitka', pausalniObrt.pragPrimitka),
    postotak('stopa-mo-prvi-stup', doprinosi.stopaMoPrviStup),
    postotak('stopa-mo-drugi-stup', doprinosi.stopaMoDrugiStup),
    postotak('stopa-zo', doprinosi.stopaZo),
  ]
}

const kljucAkta = (izvor: LegalReference): string =>
  [izvor.act, izvor.gazette, izvor.url].join('\n')

/**
 * Числа, згруповані за актом, щоб довгий перелік NN стояв раз на акт, а не
 * повторювався за кожним числом.
 *
 * Групуються лише ті посилання, у яких збігаються назва акта, оприлюднення й
 * URL. Дві редакції того самого акта під різними NN — це два різні джерела, і
 * схлопнути їх в одну групу означало б показати одне оприлюднення замість
 * двох. Статус і дата звірки в групу не піднімаються з тієї ж причини: вони
 * належать статті, а не актові.
 */
export const grupirajPoAktu = (stavke: readonly Stavka[]): readonly SkupinaAkta[] => {
  const poKljucu = new Map<string, { readonly izvor: LegalReference; readonly stavke: Stavka[] }>()

  for (const stavka of stavke) {
    const kljuc = kljucAkta(stavka.izvor)
    const skupina = poKljucu.get(kljuc)

    if (skupina === undefined) {
      poKljucu.set(kljuc, { izvor: stavka.izvor, stavke: [stavka] })
    } else {
      skupina.stavke.push(stavka)
    }
  }

  return [...poKljucu].map(([kljuc, { izvor, stavke: vlastite }]) => ({
    kljuc,
    act: izvor.act,
    gazette: izvor.gazette,
    stavke: vlastite,
  }))
}
