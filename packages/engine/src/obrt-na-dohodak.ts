/**
 * `obrt na dohodak` (обрт на дохідок / books-based sole trader) — режим, що
 * веде книги і платить `porez na dohodak` з фактичного `dohodak`.
 *
 * Три речі відрізняють його від паушалу, і всі три видно в цьому файлі:
 * `izdatak` тут справжній, а не фікція розряду; `osobni odbitak` будується з
 * коефіцієнтів, а не вводиться сумою; ставка не одна на країну, а дві, і
 * встановлює їх `jedinica lokalne samouprave`.
 *
 * Жодного числа з закону модуль не знає — усе приходить у `podloga` (ADR-0001).
 */
import type { ParStopa, Sourced } from '@hr-tax/data'
import Decimal from 'decimal.js'
// TODO(злиття): замінити на `@hr-tax/data`, коли `packages/data/src/index.ts`
// експортуватиме модуль. Файл індексу належить злиттю гілок, а не цьому
// тікету, тож поки що правила доводиться діставати шляхом.
import type {
  NepriznatiIzdaciPravila,
  ObrtNaDohodakPravila,
  OsobniOdbitakPravila,
  ProgresijaPravila,
} from '../../data/src/rules/porez-na-dohodak.ts'
import { add, eur, isGreaterThan, type Money, scale, subtract, sum, zero } from './money.ts'
import type { Doprinos, Doprinosi, Ishod, Naziv, Podloga, Porez, Unos } from './types.ts'

const MJESECI_U_GODINI = 12

/** Ставки одиниць зберігаються в базисних пунктах: 2300 — це 23 %. */
const BAZNIH_BODOVA_U_JEDINICI = 10000

const godisnje = (mjesecni: Money<'EUR'>): Money<'EUR'> => scale(mjesecni, MJESECI_U_GODINI)

const udio = (bazniBodovi: number): Decimal =>
  new Decimal(bazniBodovi).div(BAZNIH_BODOVA_U_JEDINICI)

/**
 * `izdatak` (видаток / expenditure) за статтями, за якими його вводять, за рік.
 *
 * Статті повторюють ті, за якими розводить видатки сам обртник у книзі
 * `primitaka i izdataka`. Дві з них закон визнає лише наполовину, і саме тому
 * вони стоять окремими полями, а не в «іншому»: злиття їх з рештою зробило б
 * обмежувальну норму невидимою й недосяжною для рушія.
 */
export interface IzdaciPoStavkama {
  /** `najamnina` — оренда. */
  readonly najamnina: Money<'EUR'>
  /** `nabavka robe` — закупівля товару. */
  readonly nabavkaRobe: Money<'EUR'>
  /** `nabavka usluga` — закупівля послуг. */
  readonly nabavkaUsluga: Money<'EUR'>
  /**
   * `plaće radnika` — зарплати найманих працівників разом із податками й
   * внесками на них (`čl. 32. st. 8.`), але **без** власних `doprinosi`
   * обртника: ті рушій рахує сам і віднімає окремо.
   */
  readonly placeRadnika: Money<'EUR'>
  /** `troškovi banke` — банківські витрати. */
  readonly troskoviBanke: Money<'EUR'>
  /**
   * `reprezentacija` (представницькі видатки) — уся сума, а не половина.
   * Половину відріже рушій за `čl. 33. st. 1. t. 1.`
   */
  readonly reprezentacija: Money<'EUR'>
  /**
   * Витрати на особистий автомобіль — теж уся сума. Половину відріже рушій за
   * `čl. 33. st. 1. t. 5.`
   */
  readonly osobnoVozilo: Money<'EUR'>
  /**
   * Решта видатків, зокрема вантажний транспорт: обмеження стосується засобів
   * **особистого** перевезення, тож вантажівка визнається повністю.
   */
  readonly ostalo: Money<'EUR'>
}

/** Кого платник утримує — від цього залежить його `osobni odbitak`. */
export interface UzdrzavaniClanovi {
  /**
   * `uzdržavani članovi uže obitelji` (утриманці з близької родини) —
   * подружжя, батьки, повнолітні діти після першого працевлаштування
   * (`čl. 14. st. 5.`). Дітей сюди не рахують: у них своя шкала.
   */
  readonly clanoviUzeObitelji: number
  /** `uzdržavana djeca` (утримувані діти / dependent children). */
  readonly djeca: number
}

/** Вхід форми для цього режиму. */
export interface UnosObrtaNaDohodak extends Unos {
  /** Річний `izdatak` за статтями — саме те, чого паушальний зріз не знає. */
  readonly godisnjiIzdaci: IzdaciPoStavkama
  readonly uzdrzavani: UzdrzavaniClanovi
  /**
   * Ставки `porez na dohodak`, які установила `jedinica lokalne samouprave`
   * платника. Беруться з довідника одиниць (`resolveStope`), а не з `ruleset`:
   * закон їх не встановлює, а лише окреслює межі (`čl. 19.a`).
   */
  readonly stope: ParStopa
}

/** Два шари даних плюс правила, яких паушальний набір не містить. */
export interface PodlogaObrtaNaDohodak extends Podloga {
  readonly obrtNaDohodak: ObrtNaDohodakPravila
}

/**
 * Одна складова `doprinosi`.
 *
 * Дослівно те саме, що в паушальному обрті: різниця між режимами — лише в
 * `koeficijent`, з якого будується `osnovica`. Спільного місця для цього коду
 * поки немає, бо `pausalni-obrt.ts` належить іншому тікету; під час злиття
 * гілок обидві копії мають з'їхатися в один модуль.
 */
const doprinos = ({
  naziv,
  stopa,
  mjesecnaOsnovica,
  osobnaStednja,
}: {
  readonly naziv: Naziv
  readonly stopa: Sourced<Decimal>
  readonly mjesecnaOsnovica: Money<'EUR'>
  readonly osobnaStednja: boolean
}): Doprinos => ({
  naziv,
  stopa: stopa.value,
  godisnjiIznos: godisnje(scale(mjesecnaOsnovica, stopa.value)),
  osobnaStednja,
  izvor: stopa.source,
})

/**
 * `doprinosi` цього режиму.
 *
 * `osnovica` будується з `prosječna plaća` і `koeficijent` 0,65 — того самого
 * шва з двох шарів, що й у паушалі (ADR-0001), але з іншим множником. Від
 * фактичного `primitak` і від `izdatak` вона не залежить: закон в'яже її до
 * способу визначати `dohodak`, а не до розміру доходу.
 */
const doprinosiZa = ({
  ruleset,
  pretpostavke,
  obrtNaDohodak,
}: PodlogaObrtaNaDohodak): Doprinosi => {
  const mjesecnaOsnovica = scale(
    eur(pretpostavke.prosjecnaPlaca.value),
    obrtNaDohodak.doprinosi.koeficijent.value,
  )

  const moPrviStup = doprinos({
    naziv: { hr: 'MO — I. stup', uk: 'пенсійне, генераційна солідарність' },
    stopa: ruleset.doprinosi.stopaMoPrviStup,
    mjesecnaOsnovica,
    osobnaStednja: false,
  })
  const moDrugiStup = doprinos({
    naziv: { hr: 'MO — II. stup', uk: 'пенсійне, індивідуальна капіталізована ощадність' },
    stopa: ruleset.doprinosi.stopaMoDrugiStup,
    mjesecnaOsnovica,
    osobnaStednja: true,
  })
  const zo = doprinos({
    naziv: { hr: 'ZO', uk: 'медичне страхування' },
    stopa: ruleset.doprinosi.stopaZo,
    mjesecnaOsnovica,
    osobnaStednja: false,
  })

  return {
    mjesecnaOsnovica,
    moPrviStup,
    moDrugiStup,
    zo,
    ukupnoGodisnje: sum('EUR', [
      moPrviStup.godisnjiIznos,
      moDrugiStup.godisnjiIznos,
      zo.godisnjiIznos,
    ]),
  }
}

/**
 * Частка статті, яка лишається визнаною після відрізаної законом.
 *
 * `porezno` в назві не зайве: `priznati izdatak` паушалу — це частка
 * `primitak`, яку закон вважає видатками без доказів, і до цієї частки він
 * стосунку не має (CONTEXT.md).
 */
const poreznoPriznatiDio = (nepriznati: Sourced<Decimal>): Decimal =>
  new Decimal(1).minus(nepriznati.value)

/**
 * Річний `izdatak`, який закон визнає при визначенні `dohodak`.
 *
 * `čl. 33.` перелічує не визнане, а невизнане, тож правила зберігають саме
 * невизнану частку, а визнану виводить ця функція. Дві обмежені статті названі
 * поіменно, решта входить повністю — і входить автоматично, разом із будь-якою
 * новою статтею, яку додадуть до `IzdaciPoStavkama`.
 *
 * Це не `priznati izdatak` паушалу: там частка `primitak`, яку закон вважає
 * видатками без доказів, тут — справжні, документовані видатки.
 */
const poreznoPriznatiIzdaci = (
  { reprezentacija, osobnoVozilo, ...neogranicene }: IzdaciPoStavkama,
  nepriznati: NepriznatiIzdaciPravila,
): Money<'EUR'> =>
  sum('EUR', [
    ...Object.values(neogranicene),
    scale(reprezentacija, poreznoPriznatiDio(nepriznati.reprezentacija)),
    scale(osobnoVozilo, poreznoPriznatiDio(nepriznati.osobnoVozilo)),
  ])

/**
 * Місячний `osobni odbitak`: основний розмір, помножений на суму коефіцієнтів.
 *
 * Сумою його не вводять — закон задає конструкцію, і саме вона тут відтворена:
 * одиниця за самого платника, коефіцієнт за кожного утриманця і власний
 * коефіцієнт за кожну дитину за порядком (`čl. 14. st. 2.` і `st. 3.`).
 */
const mjesecniOsobniOdbitak = (
  { clanoviUzeObitelji, djeca }: UzdrzavaniClanovi,
  pravila: OsobniOdbitakPravila,
): Money<'EUR'> => {
  const zaPlatnikaIUzdrzavane = new Decimal(1).plus(
    pravila.koeficijentUzdrzavanogClana.value.times(clanoviUzeObitelji),
  )
  const ukupniKoeficijent = pravila.koeficijentiDjece.value
    .slice(0, djeca)
    .reduce((zbroj, koeficijent) => zbroj.plus(koeficijent), zaPlatnikaIUzdrzavane)

  return scale(eur(pravila.osnovni.value), ukupniKoeficijent)
}

/**
 * Прогресивний `porez na dohodak`: нижча ставка до порога, вища — на частину
 * понад нього (`čl. 19.`).
 *
 * Саме тут наш розрахунок навмисно розходиться з калькулятором HOK, чия
 * формула вищої ставки повертає нуль за будь-яких входів. Розбіжність
 * зареєстрована як `higher-rate-formula-always-zero` (ADR-0003).
 *
 * `Porez.stopa` — одне число, а ставок дві, тож там лежить ефективна ставка на
 * базу: рівність «база × ставка = сума» лишається правдивою, а обидві
 * установлені одиницею ставки видно у вході.
 */
const porezZa = (
  poreznaOsnovica: Money<'EUR'>,
  stope: ParStopa,
  progresija: ProgresijaPravila,
): Porez => {
  const prag = eur(progresija.pragViseStope.value)
  const donjiDio = isGreaterThan(poreznaOsnovica, prag) ? prag : poreznaOsnovica
  const gornjiDio = subtract(poreznaOsnovica, donjiDio)
  const godisnjiIznos = add(scale(donjiDio, udio(stope.niza)), scale(gornjiDio, udio(stope.visa)))

  return {
    naziv: { hr: 'porez na dohodak', uk: 'податок на дохідок' },
    poreznaOsnovica,
    stopa: poreznaOsnovica.amount.isZero()
      ? new Decimal(0)
      : godisnjiIznos.amount.div(poreznaOsnovica.amount),
    godisnjiIznos,
    izvor: progresija.pragViseStope.source,
  }
}

const provjeriBrojOsoba = (naziv: string, broj: number): void => {
  if (!Number.isInteger(broj) || broj < 0) {
    throw new RangeError(`${naziv}: очікується невід'ємне ціле число, а не ${broj}`)
  }
}

export const izracunajObrtNaDohodak = (
  unos: UnosObrtaNaDohodak,
  podloga: PodlogaObrtaNaDohodak,
): Ishod => {
  const { osobniOdbitak, progresija, nepriznatiIzdaci } = podloga.obrtNaDohodak.porez
  const { clanoviUzeObitelji, djeca } = unos.uzdrzavani

  provjeriBrojOsoba('Кількість утриманців із близької родини', clanoviUzeObitelji)
  provjeriBrojOsoba('Кількість утримуваних дітей', djeca)

  const koeficijentiDjece = osobniOdbitak.koeficijentiDjece.value
  if (djeca > koeficijentiDjece.length) {
    return {
      status: 'nedostupno',
      razlog:
        `Закон друкує коефіцієнти osobni odbitak лише до ${koeficijentiDjece.length}-ї дитини ` +
        `(${osobniOdbitak.koeficijentiDjece.source.article}), а правило для кожної наступної ` +
        'подано з пропуском — «progresivno se uvećava se za 1,1 … više u odnosu prema ' +
        `koeficijentu za prethodno dijete». Коефіцієнта для ${djeca}-ї дитини в тексті акта ` +
        'немає, а вигадати його означало б вигадати податок.',
    }
  }

  const doprinosi = doprinosiZa(podloga)
  const izdaci = poreznoPriznatiIzdaci(unos.godisnjiIzdaci, nepriznatiIzdaci)

  // `dohodak` = `primitak` − `izdatak` (`čl. 30. st. 1.`), причому сплачені
  // обов'язкові внески самі є визнаним `izdatak` (`čl. 32. st. 6.`) — інакше
  // база була б завищена на всю річну суму `doprinosi`.
  const dohodak = subtract(subtract(unos.godisnjiPrimitak, izdaci), doprinosi.ukupnoGodisnje)

  // `porezna osnovica` = `dohodak` − `osobni odbitak` (`čl. 18. st. 1.`).
  // Від'ємною вона не буває: збиток не породжує від'ємного податку, він
  // переноситься на наступні роки, і це вже інший розрахунок.
  const umanjeniDohodak = subtract(
    dohodak,
    godisnje(mjesecniOsobniOdbitak(unos.uzdrzavani, osobniOdbitak)),
  )
  const poreznaOsnovica = isGreaterThan(umanjeniDohodak, zero('EUR'))
    ? umanjeniDohodak
    : zero('EUR')

  const porez = porezZa(poreznaOsnovica, unos.stope, progresija)
  const obvezniPlacanja = add(porez.godisnjiIznos, doprinosi.ukupnoGodisnje)

  return {
    status: 'izracunato',
    izracun: {
      // Розрядів режим не знає: вони існують лише там, де `dohodak` презюмується.
      razred: undefined,
      porez,
      doprinosi,
      // `doprinosi` вже відняті всередині `dohodak` як визнаний `izdatak`, тож
      // удруге їх віднімати не можна. У паушальній картці те саме число
      // рахується від `primitak`, бо той зріз фактичного `izdatak` не знає.
      netoZaOsobu: subtract(dohodak, porez.godisnjiIznos),
      efektivnaStopa: unos.godisnjiPrimitak.amount.isZero()
        ? undefined
        : obvezniPlacanja.amount.div(unos.godisnjiPrimitak.amount),
    },
  }
}
