import type { LegalReference, PausalniObrtPravila, Razred, Sourced } from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { doprinosiOdMjesecneOsnovice } from './doprinosi.ts'
import { add, eur, isGreaterThan, type Money, scale, subtract } from './money.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import type { Doprinosi, Ishod, Podloga, Porez } from './types.ts'

/**
 * Паушальний обрт за неповний податковий період.
 *
 * Релокант, який відкриває `obrt` у серпні, платить не за рік, а за свій
 * фактичний період — і це той рік, за яким він вирішує, чи переїздити. Тут
 * важить не лише те, що суми менші: разом із періодом масштабуються **межі
 * розрядів**, а це може перенести людину у **вищий** `razred`, ніж дав би той
 * самий `primitak` за повний рік.
 *
 * Періоду модуль не вгадує і годинника не питає: він приходить входом.
 */

/** Місяць календарного року: 1 — `siječanj`, 12 — `prosinac`. */
export type Mjesec = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12

/**
 * Коли саме в місяці почалася діяльність.
 *
 * Від цього залежить, чи місяць відкриття взагалі входить у `broj mjeseci
 * obavljanja djelatnosti`: закон рахує лише **повні** календарні місяці, а
 * окремо додає останній — попри кількість днів у ньому.
 */
export type DanPocetka = 'prvi-dan-mjeseca' | 'tijekom-mjeseca'

/** Відкриття `obrt` усередині податкового періоду. */
export interface PocetakDjelatnosti {
  /** Місяць, у якому `obrt` відкрито. */
  readonly mjesec: Mjesec
  /**
   * Коли в межах місяця. Без уточнення вважається, що діяльність почалася
   * першого дня, — тоді місяць відкриття повний і рахується.
   */
  readonly dan?: DanPocetka
}

/**
 * Норми неповного року, які рушій дістає ззовні (ADR-0001).
 *
 * Форму задає рушій, бо це його вхід; значення на 2026 рік лежить у
 * `@hr-tax/data` (`PRAVILA_NEPUNE_GODINE`).
 */
export interface PravilaNepuneGodine {
  /**
   * Скільки місяців має повний податковий період, разом зі статтею, яка
   * велить зводити річні величини до фактичного періоду.
   */
  readonly mjeseciUPunomRazdoblju: Sourced<number>
  /** Норма, за якою рахується `broj mjeseci obavljanja djelatnosti`. */
  readonly brojanjeMjeseci: LegalReference
}

/** `razdoblje obavljanja djelatnosti` — період, за який усе й рахується. */
export interface RazdobljeDjelatnosti {
  /** `broj mjeseci obavljanja djelatnosti`: від 1 до 12. */
  readonly brojMjeseci: number
  /** Норми, за якими пораховано період і масштабуються межі розрядів. */
  readonly pravila: PravilaNepuneGodine
}

/**
 * Останній місяць податкового періоду. Період діяльності завжди тягнеться до
 * кінця календарного року: рік закриття цей зріз ще не знає.
 */
const PROSINAC = 12 satisfies Mjesec

const punihMjeseci = ({ pravila }: RazdobljeDjelatnosti): number =>
  pravila.mjeseciUPunomRazdoblju.value

/** Чи період повний — тоді розрахунок не відрізняється від річного. */
export const jePunoRazdoblje = (razdoblje: RazdobljeDjelatnosti): boolean =>
  razdoblje.brojMjeseci === punihMjeseci(razdoblje)

/**
 * `broj mjeseci obavljanja djelatnosti` з місяця відкриття.
 *
 * Рахується кожен повний календарний місяць діяльності плюс останній місяць
 * попри кількість днів у ньому. Звідси два наслідки, які легко проґавити:
 * місяць відкриття не рахується, якщо `obrt` відкрито не першого числа, — і
 * все ж грудень рахується завжди, бо він останній, тож нуля місяців не буває.
 */
const brojMjeseciOd = (pocetak: PocetakDjelatnosti): number => {
  const odPrvogDana = (pocetak.dan ?? 'prvi-dan-mjeseca') === 'prvi-dan-mjeseca'
  const punih = PROSINAC - pocetak.mjesec + (odPrvogDana ? 1 : 0)
  const posljednjiNepun = !odPrvogDana && pocetak.mjesec === PROSINAC

  return punih + (posljednjiNepun ? 1 : 0)
}

/**
 * Період діяльності, за який рахується все інше.
 *
 * Без місяця відкриття це повний рік — і саме тому цей аргумент
 * необов'язковий: обрт, відкритий раніше, працює всі дванадцять місяців, і
 * неповний рік лишається окремим випадком, який треба назвати явно.
 */
export const razdobljeZa = (
  pravila: PravilaNepuneGodine,
  pocetak?: PocetakDjelatnosti,
): RazdobljeDjelatnosti => ({
  brojMjeseci:
    pocetak === undefined ? pravila.mjeseciUPunomRazdoblju.value : brojMjeseciOd(pocetak),
  pravila,
})

/**
 * Кількість місяців діяльності разом зі статтею, за якою її пораховано.
 *
 * Місяців у періоді п’ять, а не чотири й не шість, — це висновок норми, а не
 * очевидність календаря, тож і він мусить вести до статті за один клік
 * (ADR-0002). Саме на цьому числі стоїть увесь розрахунок неповного року.
 */
export const brojMjeseciDjelatnosti = (razdoblje: RazdobljeDjelatnosti): Sourced<number> => ({
  value: razdoblje.brojMjeseci,
  source: razdoblje.pravila.brojanjeMjeseci,
})

/** Ділення суми на безрозмірне число: `money.ts` дає множення, але не ділення. */
const podijeli = (iznos: Money<'EUR'>, djelitelj: Decimal.Value): Money<'EUR'> =>
  eur(iznos.amount.div(djelitelj))

/**
 * Річну суму, яку закон установлює на повний податковий період, зводить до
 * фактичного періоду діяльності.
 *
 * Придатне не для всякого платежу: `komorski doprinos` за неповний квартал
 * закон ділить не на місяці, а на 365 днів (čl. 9. Odluke) — і в рік
 * відкриття не нараховується взагалі, бо новий `obrt` звільнений на перші
 * два роки. `turistička članarina` і `spomenička renta` беруться відсотком
 * від фактичного `prihod`, який за неповний рік і так менший.
 */
export const razmjernoRazdoblju = (
  godisnjiIznos: Money<'EUR'>,
  razdoblje: RazdobljeDjelatnosti,
): Money<'EUR'> => podijeli(scale(godisnjiIznos, razdoblje.brojMjeseci), punihMjeseci(razdoblje))

/**
 * Річний `primitak`, за яким визначається `razred`: середній місячний
 * `primitak` (`ukupni primitak` ділений на місяці діяльності), помножений на
 * 12 місяців. Не сума на руки і не база податку — лише ключ до таблиці.
 */
const godisnjiPrimitakZaRazred = (
  ukupniPrimitak: Money<'EUR'>,
  razdoblje: RazdobljeDjelatnosti,
): Money<'EUR'> => scale(podijeli(ukupniPrimitak, razdoblje.brojMjeseci), punihMjeseci(razdoblje))

/**
 * `gornja granica razreda`, зведена до фактичного періоду.
 *
 * Акт формулює правило навпаки — річним `primitak`, — але порівняння те саме:
 * `primitak × 12 / mjeseci ≤ granica` рівносильне
 * `primitak ≤ granica × mjeseci / 12`. Масштабована межа краща тим, що
 * лишається числом, яке людині можна показати: ось стеля розряду саме на
 * ваш період, а не абстрактна річна.
 */
const razmjernaGranica = (razred: Razred, razdoblje: RazdobljeDjelatnosti): Money<'EUR'> =>
  razmjernoRazdoblju(eur(razred.gornjaGranica), razdoblje)

const razredZa = (
  razredi: readonly Razred[],
  ukupniPrimitak: Money<'EUR'>,
  razdoblje: RazdobljeDjelatnosti,
): Razred | undefined =>
  razredi.find((razred) => !isGreaterThan(ukupniPrimitak, razmjernaGranica(razred, razdoblje)))

/**
 * `doprinosi` за фактичний період.
 *
 * Скорочується кількість місяців, а не сама `osnovica`: місячна база
 * будується з `prosječna plaća` та `koeficijent` і від довжини періоду не
 * залежить (ADR-0001). Ділити її означало б показати місячну суму, якої
 * ніхто не платить.
 */
const doprinosiZa = (
  { ruleset, pretpostavke }: Podloga,
  razdoblje: RazdobljeDjelatnosti,
): Doprinosi =>
  doprinosiOdMjesecneOsnovice(
    scale(eur(pretpostavke.prosjecnaPlaca.value), ruleset.pausalniObrt.koeficijent.value),
    ruleset,
    razdoblje.brojMjeseci,
  )

/**
 * `paušalni porez` за період: `paušalni dohodak` розряду, зведений до місяців
 * діяльності, під ставкою закону.
 */
const porezZa = (
  razred: Razred,
  pravila: PausalniObrtPravila,
  razdoblje: RazdobljeDjelatnosti,
): Porez => {
  const poreznaOsnovica = razmjernoRazdoblju(eur(razred.godisnjiPausalniDohodak), razdoblje)

  return {
    naziv: { hr: 'paušalni porez', uk: 'паушальний податок' },
    poreznaOsnovica,
    stopa: pravila.stopaPoreza.value,
    godisnjiIznos: scale(poreznaOsnovica, pravila.stopaPoreza.value),
    izvor: pravila.stopaPoreza.source,
  }
}

/**
 * Відмови, які від періоду не залежать, беруться з річного розрахунку як є.
 *
 * Поріг паушалу міряється вартістю поставок за календарний рік, а не за
 * періодом діяльності, тож для обрту, відкритого серед року, це той самий
 * поріг і те саме пояснення. Суперечливий набір правил лишається
 * суперечливим за будь-якого періоду. Переписувати обидва тексти наново
 * означало б дати їм мовчки розійтися.
 */
const godisnjaOdbijenica = (ukupniPrimitak: Money<'EUR'>, podloga: Podloga): Ishod | undefined => {
  const godisnji = izracunajPausalniObrt(ukupniPrimitak, podloga)

  return godisnji.status === 'nedostupno' ? godisnji : undefined
}

/**
 * Паушальний обрт за `razdoblje obavljanja djelatnosti`.
 *
 * `Izracun` тут той самий, що й річний, і поля з коренем `godišnji` тримають
 * суми за фактичний період: структура результату одна на всі режими, і саме
 * на ній тримається зіставність карток.
 */
export const izracunajPausalniObrtZaRazdoblje = (
  ukupniPrimitak: Money<'EUR'>,
  razdoblje: RazdobljeDjelatnosti,
  podloga: Podloga,
): Ishod => {
  const odbijenica = godisnjaOdbijenica(ukupniPrimitak, podloga)
  if (odbijenica !== undefined) return odbijenica

  const pravila = podloga.ruleset.pausalniObrt
  const razred = razredZa(pravila.razredi.value, ukupniPrimitak, razdoblje)
  if (razred === undefined) {
    return {
      status: 'nedostupno',
      razlog: {
        kod: 'svedeni-primitak-izvan-tablice',
        primitak: ukupniPrimitak,
        svedeniPrimitak: godisnjiPrimitakZaRazred(ukupniPrimitak, razdoblje),
        brojMjeseci: razdoblje.brojMjeseci,
        izvor: razdoblje.pravila.mjeseciUPunomRazdoblju.source,
      },
    }
  }

  const porez = porezZa(razred, pravila, razdoblje)
  const doprinosi = doprinosiZa(podloga, razdoblje)
  const obvezniPlacanja = add(porez.godisnjiIznos, doprinosi.ukupnoGodisnje)

  return {
    status: 'izracunato',
    izracun: {
      razred: {
        redniBroj: razred.redniBroj,
        gornjaGranica: razmjernaGranica(razred, razdoblje),
        // Масштабованого числа в таблиці акта немає — його дала розмірність,
        // і вести з нього треба саме до неї (ADR-0002).
        izvor: jePunoRazdoblje(razdoblje)
          ? pravila.razredi.source
          : razdoblje.pravila.mjeseciUPunomRazdoblju.source,
      },
      porezi: [porez],
      ukupanPorez: porez.godisnjiIznos,
      doprinosi,
      // Обов\'язкові платежі додає usporedba.ts — вони однакові для всіх режимів.
      obveznaDavanja: [],
      ukupnaDavanja: eur(0),
      ukupniIzdaci: eur(0),
      netoZaOsobu: subtract(ukupniPrimitak, obvezniPlacanja),
      efektivnaStopa: ukupniPrimitak.amount.isZero()
        ? undefined
        : obvezniPlacanja.amount.div(ukupniPrimitak.amount),
    },
  }
}
