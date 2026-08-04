/**
 * Довідник місцевих одиниць: пошук за назвою, вибірка за шифрою і чинні
 * ставки `porez na dohodak` з урахуванням ручного перевизначення.
 *
 * Модуль безголовий і нічого не малює. Але одну річ, яку екран мусить сказати
 * вголос, варто повторити й тут: усе, на що впливає вибір міста, — це
 * `porez na dohodak`. `paušalni porez` (паушальний податок) рахується за
 * ставкою 12 %, установленою законом, і жодна `odluka` міста її не зачіпає
 * (CONTEXT.md). Підставляти ці ставки в паушальний розрахунок — помилка.
 */
import type { Sourced } from '../sourced.ts'
import { uGranicama } from './granice.ts'
import { jediniceLokalneSamouprave } from './jedinice.generated.ts'
import type { JedinicaLokalneSamouprave, ParStopa } from './types.ts'

/** Увесь довідник разом зі своїм джерелом — див. ADR-0002. */
export const sveJedinice: Sourced<readonly JedinicaLokalneSamouprave[]> = jediniceLokalneSamouprave

/**
 * Знімає з тексту все, чим назви відрізняються тільки на письмі.
 *
 * NFD розкладає `Š` на `S` плюс діакритик, і той знімається як комбінувальний
 * знак. З `Đ` цей шлях не працює: це окрема літера, а не `D` з рискою, тому
 * розкласти її нема на що і правило доводиться писати руками.
 */
const bezDijakritike = (tekst: string): string =>
  tekst
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/đ/gu, 'd')

// Назви нормалізуються один раз на завантаження модуля, а не на кожен запит:
// пошук живе під полем вводу, і 556 нормалізацій на натиск клавіші — марні.
const indeks = sveJedinice.value.map((jedinica) => ({
  jedinica,
  trazivo: bezDijakritike(jedinica.ime),
}))

const poSifri = new Map(sveJedinice.value.map((jedinica) => [jedinica.sifra, jedinica]))

/**
 * Одиниці, чия назва містить запит — байдуже до регістру й діакритики.
 *
 * Порожній запит віддає весь довідник: поле пошуку починається порожнім, і
 * список для вибору має бути повним, а не порожнім.
 *
 * Однойменні одиниці (OTOK, PRIVLAKA, SVETA NEDELJA) повертаються всі, і це
 * не надмірність: ставки в них різні, тож вибрати за назвою — те саме, що
 * вибрати навмання. Розрізняти їх треба за `sifra`.
 */
export const searchJedinice = (upit: string): readonly JedinicaLokalneSamouprave[] => {
  const trazeno = bezDijakritike(upit.trim())
  return indeks.filter(({ trazivo }) => trazivo.includes(trazeno)).map(({ jedinica }) => jedinica)
}

/** Одиниця за «Šifra grada/općine» — єдиним унікальним ключем довідника. */
export const jedinicaBySifra = (sifra: string): JedinicaLokalneSamouprave | undefined =>
  poSifri.get(sifra)

/** Звідки взялися чинні ставки: з `odluka` одиниці чи вбиті руками. */
export type IzvorStopa = 'odluka' | 'rucno'

/** Вибір користувача: одиниця з довідника і, за потреби, власні ставки. */
export interface IzborStopa {
  readonly jedinica: JedinicaLokalneSamouprave
  /**
   * Ставки, вбиті руками, — на випадок, коли довідник застарів або одиниця
   * змінила рішення серед року.
   *
   * Тільки обидві разом: `ParStopa` не дозволяє перевизначити одну ставку й
   * лишити другу з довідника. Половина рішення одиниці, склеєна з половиною
   * старого довідника, не відповідає жодній `odluka`.
   */
  readonly rucnoZadano?: ParStopa
}

/** Ставки, за якими треба рахувати, і слід того, звідки вони. */
export interface EfektivneStope extends ParStopa {
  readonly izvor: IzvorStopa
}

/**
 * Чинні ставки: ручні мають пріоритет над довідником.
 *
 * Ручні ставки поза межами `čl. 19.a st. 2.` — це виняток, а не мовчазне
 * «як скажете»: жодна одиниця такого рішення ухвалити не могла, тож рахувати
 * за ним означало б показати людині число, якого в природі немає. Форма, що
 * хоче попередити раніше за виняток, має спитати `uGranicama`.
 */
export const resolveStope = ({ jedinica, rucnoZadano }: IzborStopa): EfektivneStope => {
  if (rucnoZadano === undefined) {
    const { niza, visa } = jedinica.stope
    return { niza, visa, izvor: 'odluka' }
  }
  if (!uGranicama(rucnoZadano)) {
    throw new Error(
      `Ставки ${rucnoZadano.niza}/${rucnoZadano.visa} б.п. поза межами, ` +
        'які čl. 19.a st. 2. Zakona o porezu na dohodak дозволяє місцевій одиниці',
    )
  }
  const { niza, visa } = rucnoZadano
  return { niza, visa, izvor: 'rucno' }
}
