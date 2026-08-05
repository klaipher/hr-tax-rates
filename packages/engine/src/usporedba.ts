import type {
  ClanUpravePravila,
  DrugaDjelatnostPravila,
  KomorskiDoprinosPravila,
  ObrtNaDobitPravila,
  ObrtNaDohodakPravila,
  ParStopa,
  PlacaPravila,
  PlavaKartaPravila,
} from '@hr-tax/data'
import { type Djelatnost, obveznaDavanjaZa, zbrojDavanja } from './davanja.ts'
import { izracunajDooClanUprave, izracunajDooSPlacom, type PravilaDoo } from './doo.ts'
import { MJESECI_U_GODINI } from './doprinosi.ts'
import { add, eur, isGreaterThan, type Money, scale, subtract, sum } from './money.ts'
import {
  izracunajPausalniObrtZaRazdoblje,
  type PocetakDjelatnosti,
  type PravilaNepuneGodine,
  razdobljeZa,
} from './nepuna-godina.ts'
import { izracunajObrtNaDobit } from './obrt-na-dobit.ts'
import {
  type IzdaciPoStavkama,
  izracunajObrtNaDohodak,
  type UzdrzavaniClanovi,
} from './obrt-na-dohodak.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import { izracunajPlacu } from './placa.ts'
import type {
  Ishod,
  Izracun,
  NapomenaRezima,
  Naziv,
  Podloga,
  PravniOblik,
  RazlogNedostupnosti,
  Rezim,
  RezimId,
  Unos,
  Usporedba,
  VrsteObveza,
} from './types.ts'
import { doprinosiUzRadniOdnos, ustedaNaDoprinosima } from './uz-radni-odnos.ts'

/**
 * Вхід порівняння.
 *
 * Понад `primitak` усе необов'язкове: форма наповнюється поступово, і режим,
 * якому бракує входу, каже про це конкретно замість того, щоб вигадати число.
 * Саме тому «недоступно» тут — повноцінна відповідь, а не заглушка.
 */
export interface UnosUsporedbe extends Unos {
  /** Річний `izdatak` за статтями. Без нього режими з обліком не рахуються. */
  readonly godisnjiIzdaci?: IzdaciPoStavkama | undefined
  readonly uzdrzavani?: UzdrzavaniClanovi | undefined
  /** Ставки `porez na dohodak` обраної `jedinica lokalne samouprave`. */
  readonly stope?: ParStopa | undefined
  /** Місяць відкриття обрту. Не задано — повний рік. */
  readonly pocetak?: PocetakDjelatnosti | undefined
  /** Чи ведеться обрт паралельно з роботою за наймом. */
  readonly uzRadniOdnos?: boolean | undefined
  /**
   * Чи обрт відкрито менш ніж два роки тому: `čl. 15.` Odluke звільняє
   * новий `obrt` від `komorski doprinos` на перші два роки.
   */
  readonly noviObrt?: boolean | undefined
  /**
   * `NKD` і місце діяльності — від них залежать `turistička članarina` і
   * `spomenička renta`. Не задано — застосовність обох невизначена, і вони
   * так і кажуть замість того, щоб зникнути з переліку.
   */
  readonly djelatnost?: Djelatnost | undefined
  /**
   * Вік, якого людина досягає протягом цього податкового періоду.
   *
   * Потрібен рівно одному правилу — `olakšica za mlade`, — і саме тому не
   * задано означає «не рахувати пільгу», а не «понад тридцять»: припустити
   * старший вік означало б тихо забрати пільгу в того, кому вона належить.
   */
  readonly dob?: number | undefined
  /**
   * Місячна брутто-плаћа, яку власник d.o.o. призначив собі сам. Не задано —
   * береться законна підлога.
   *
   * Вільна змінна, а не вхід задля повноти: усе, що не пішло в плаћу, виходить
   * дивідендами під іншу ставку, тож саме це число вирішує, скільки лишиться.
   */
  readonly mjesecnaPlacaVlasnika?: Money<'EUR'> | undefined
}

/**
 * Правила понад ті, що потрібні паушалу.
 *
 * Необов'язкові з тієї самої причини, що й входи: набір правил можна
 * підключати частинами, і брак правил — теж названа причина.
 */
export interface PodlogaUsporedbe extends Podloga {
  readonly obrtNaDohodak?: ObrtNaDohodakPravila | undefined
  readonly obrtNaDobit?: ObrtNaDobitPravila | undefined
  readonly drugaDjelatnost?: DrugaDjelatnostPravila | undefined
  readonly nepunaGodina?: PravilaNepuneGodine | undefined
  readonly komorskiDoprinos?: KomorskiDoprinosPravila | undefined
  readonly placa?: PlacaPravila | undefined
  readonly clanUprave?: ClanUpravePravila | undefined
  /**
   * Поріг зарплати `EU plava karta`. Необов'язковий і поза розрахунком: він
   * не бере й не додає жодного цента, а лише каже, чи дозвіл узагалі видадуть.
   */
  readonly plavaKarta?: PlavaKartaPravila | undefined
}

const NAZIVI: Readonly<Record<RezimId, Naziv>> = {
  'pausalni-obrt': { hr: 'paušalni obrt', uk: 'паушальний обрт' },
  'obrt-na-dohodak': { hr: 'obrt na dohodak', uk: 'обрт на дохідок' },
  'obrt-na-dobit': { hr: 'obrt na dobit', uk: 'обрт у системі porez na dobit' },
  'doo-placa': {
    hr: 'd.o.o. — vlasnik u radnom odnosu',
    uk: 'd.o.o. — власник у трудовому договорі',
  },
  'doo-clan-uprave': {
    hr: 'd.o.o. — vlasnik član uprave',
    uk: 'd.o.o. — власник член правління',
  },
  zaposlenik: { hr: 'zaposlenik', uk: 'найманий працівник' },
}

/**
 * Правова форма кожного режиму — від неї залежать обов'язкові платежі й те,
 * чи має режим `izdatak` узагалі.
 *
 * Таблицею, а не виведенням з ідентифікатора: те, що обидва d.o.o. мають одну
 * форму, а три обрти — іншу, є юридичним фактом, і вгадувати його з назви
 * картки означало б тримати право в шарі складання.
 */
const PRAVNI_OBLICI: Readonly<Record<RezimId, PravniOblik>> = {
  'pausalni-obrt': 'obrt',
  'obrt-na-dohodak': 'obrt',
  'obrt-na-dobit': 'obrt',
  'doo-placa': 'trgovačko društvo',
  'doo-clan-uprave': 'trgovačko društvo',
  zaposlenik: 'nesamostalni rad',
}

const nedostupno = (razlog: RazlogNedostupnosti): Ishod => ({ status: 'nedostupno', razlog })

/**
 * Заглушка на місці `vrsteObveza`, доки `uskladi` не підставить справжні.
 *
 * Порожнього значення в цього поля немає: обов'язок або є, або його немає, і
 * `undefined` тут означав би режим без жодного платежу. Тому заглушка названа
 * заглушкою — інакше чужі обов'язки виглядали б як відповідь.
 */
const ZAGLUSKA_OBVEZA: VrsteObveza = {
  porez: 'paušalni porez',
  razlika: 'razlika paušalnog poreza',
  doprinosi: 'doprinosi (paušalni obrt)',
  komorskiDoprinos: undefined,
}

/**
 * Обов'язки кожного режиму — з чого будується календар.
 *
 * Це юридичні факти, а не оформлення: `doprinosi` мають три різні строки за
 * трьома главами `Zakon o doprinosima`, і схлопнути їх в один означало б
 * помилитися для цілого режиму.
 */
const VRSTE_OBVEZA: Readonly<Record<RezimId, VrsteObveza>> = {
  'pausalni-obrt': {
    porez: 'paušalni porez',
    razlika: 'razlika paušalnog poreza',
    doprinosi: 'doprinosi (paušalni obrt)',
    komorskiDoprinos: 'komorski doprinos',
  },
  'obrt-na-dohodak': {
    porez: 'predujam poreza na dohodak',
    razlika: 'razlika poreza na dohodak',
    doprinosi: 'doprinosi (obrt na dohodak)',
    komorskiDoprinos: 'komorski doprinos',
  },
  'obrt-na-dobit': {
    porez: 'predujam poreza na dobit',
    razlika: 'razlika poreza na dobit',
    doprinosi: 'doprinosi (obrt na dobit)',
    komorskiDoprinos: 'komorski doprinos',
  },
  // Обидва d.o.o. платять `porez na dobit` за тим самим розкладом; різняться
  // вони тим, за яким правилом нараховуються внески, а не коли.
  'doo-placa': {
    porez: 'predujam poreza na dobit',
    razlika: 'razlika poreza na dobit',
    doprinosi: 'doprinosi (plaća)',
    komorskiDoprinos: undefined,
  },
  'doo-clan-uprave': {
    porez: 'predujam poreza na dobit',
    razlika: 'razlika poreza na dobit',
    doprinosi: 'doprinosi (član uprave)',
    komorskiDoprinos: undefined,
  },
  // Найманий працівник сам не платить нічого: і податок, і внески утримує та
  // перераховує роботодавець. Строк однаково лишається строком — саме до
  // нього прив'язана дата, коли гроші зникають із брутто.
  zaposlenik: {
    porez: 'porez na dohodak iz plaće',
    razlika: 'razlika poreza na dohodak',
    doprinosi: 'doprinosi (plaća)',
    komorskiDoprinos: undefined,
  },
}

/**
 * `rashod` для `obrt na dobit` — сума всіх статей `izdatak`.
 *
 * Форма знає одні витрати, а режими міряють їх по-різному: `obrt na dohodak`
 * бере касовий `izdatak`, `obrt na dobit` — `rashod` за нарахуванням.
 * Прирівнювання одного до одного — припущення форми, назване на картці.
 */
const zbrojIzdataka = (izdaci: IzdaciPoStavkama): Money<'EUR'> => sum('EUR', Object.values(izdaci))

/**
 * Додає обов'язкові платежі й зводить «на руки» до спільного означення.
 *
 * Робиться в одному місці на всі режими навмисно, і не лише через платежі.
 * Режими рахували «на руки» по-різному: паушал брав `primitak` без витрат, бо
 * витрат не знав, а `obrt na dobit` — `prihod` за вирахуванням `rashod`. Два
 * різні означення на сусідніх картках роблять їх незіставними, а зіставність —
 * це те, заради чого калькулятор існує.
 *
 * Спільне означення одне: скільки грошей лишається людині за рік, тобто
 * надходження без витрат і без усіх обов'язкових платежів. Форма знає одні
 * витрати, а режими міряють їх по-різному (`izdatak` касовий проти `rashod`
 * за нарахуванням) — прирівнювання назване в JSDoc `UlazObrtNaDobit` і
 * лишається припущенням форми, а не закону.
 */
const uskladi = (
  izracun: Izracun,
  unos: UnosUsporedbe,
  podloga: PodlogaUsporedbe,
  id: RezimId,
): Izracun => {
  const pravniOblik = PRAVNI_OBLICI[id]
  const obveznaDavanja = obveznaDavanjaZa(
    {
      godisnjiPrimitak: unos.godisnjiPrimitak,
      noviObrt: unos.noviObrt === true,
      djelatnost: unos.djelatnost,
      pravniOblik,
    },
    podloga.komorskiDoprinos,
  )
  const ukupnaDavanja = zbrojDavanja(obveznaDavanja)

  // Найманий працівник `izdatak` не має взагалі: витрати з форми належать
  // діяльності, а не людині. Відняти їх від плаће означало б покарати найм за
  // оренду офісу, якого в нього немає.
  const ukupniIzdaci =
    pravniOblik === 'nesamostalni rad' || unos.godisnjiIzdaci === undefined
      ? eur(0)
      : zbrojIzdataka(unos.godisnjiIzdaci)

  return {
    ...izracun,
    obveznaDavanja,
    ukupnaDavanja,
    ukupniIzdaci,
    vrsteObveza: VRSTE_OBVEZA[id],
    // Одна формула на всі режими: надходження без витрат і без усіх
    // обов'язкових платежів. Режими рахували це по-різному — паушал брав
    // primitak без витрат, бо витрат не знав, — і сусідні картки порівнювали
    // різні речі.
    //
    // Внески беруться не всі, а лише ті, що виходять із кишені самої людини.
    // Для кожного, хто веде діяльність сам, це те саме число; для найманого
    // працівника — ні, і саме тут різниця в 16,5% брутто перестає бути тихою.
    netoZaOsobu: sum('EUR', [
      unos.godisnjiPrimitak,
      scale(ukupniIzdaci, -1),
      scale(izracun.ukupanPorez, -1),
      scale(izracun.doprinosi.ukupnoGodisnjeNaTeretOsobe, -1),
      scale(ukupnaDavanja, -1),
      // Повернення річного звіту надійде вже наступного року, але рік
      // рахується цілком: інакше «на руки» молодого працівника було б
      // меншим, ніж він справді отримає за цей рік.
      izracun.povratPoreza,
    ]),
  }
}

/**
 * Замінює `doprinosi` на ті, що чинні для діяльності поряд із наймом.
 *
 * Модифікатор, а не режим: ставка й база інші, решта розрахунку та сама.
 * `netoZaOsobu` перераховується, бо змінилася лише сума внесків.
 */
const uzRadniOdnos = (
  izracun: Izracun,
  podloga: PodlogaUsporedbe,
  godisnjiPrimitak: Izracun['netoZaOsobu'],
): Izracun => {
  const { drugaDjelatnost } = podloga
  if (drugaDjelatnost === undefined) return izracun

  const zamjena = doprinosiUzRadniOdnos(
    { godisnjaOsnovica: izracun.porezi[0]?.poreznaOsnovica ?? eur(0), vrsta: 'pausalni-dohodak' },
    drugaDjelatnost,
    podloga.pretpostavke,
  )

  // Місячної `osnovica` тут немає навмисно: закон другої діяльності її не
  // знає, база річна (`čl. 185.` ZoD). Вигадати місячну означало б показати
  // число, якого в законі немає.
  const doprinosi = {
    mjesecnaOsnovica: undefined,
    moPrviStup: zamjena.moPrviStup,
    moDrugiStup: zamjena.moDrugiStup,
    zo: zamjena.zo,
    ukupnoGodisnje: zamjena.ukupnoGodisnje,
    // Другу діяльність людина веде сама, тож усі три внески — її гроші.
    ukupnoGodisnjeNaTeretOsobe: zamjena.ukupnoGodisnje,
    ustedaUzRadniOdnos: ustedaNaDoprinosima(izracun.doprinosi, zamjena),
  }
  const netoZaOsobu = subtract(
    subtract(godisnjiPrimitak, izracun.ukupanPorez),
    doprinosi.ukupnoGodisnje,
  )

  return { ...izracun, doprinosi, netoZaOsobu }
}

const pausalniObrt = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { pocetak } = unos
  const { nepunaGodina } = podloga

  // Повний рік лишається шляхом за замовчуванням і рахується так само, як до
  // появи неповного року. Правила пропорції потрібні лише тоді, коли є що
  // пропорціювати — вимагати їх завжди означало б зробити базовий випадок
  // залежним від додатка.
  const ishod =
    pocetak === undefined
      ? izracunajPausalniObrt(unos.godisnjiPrimitak, podloga)
      : nepunaGodina === undefined
        ? nedostupno({ kod: 'nema-pravila', pravila: 'nepuna godina' })
        : izracunajPausalniObrtZaRazdoblje(
            unos.godisnjiPrimitak,
            razdobljeZa(nepunaGodina, pocetak),
            podloga,
          )
  if (ishod.status !== 'izracunato' || unos.uzRadniOdnos !== true) return ishod

  return {
    status: 'izracunato',
    izracun: uzRadniOdnos(ishod.izracun, podloga, unos.godisnjiPrimitak),
  }
}

const obrtNaDohodak = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { godisnjiIzdaci, stope } = unos
  const pravila = podloga.obrtNaDohodak

  if (pravila === undefined) {
    return nedostupno({ kod: 'nema-pravila', pravila: 'porez na dohodak' })
  }
  if (godisnjiIzdaci === undefined) {
    return nedostupno({ kod: 'nema-izdataka' })
  }
  if (stope === undefined) {
    return nedostupno({ kod: 'nema-jedinice' })
  }

  const ishod = izracunajObrtNaDohodak(
    {
      godisnjiPrimitak: unos.godisnjiPrimitak,
      godisnjiIzdaci,
      uzdrzavani: unos.uzdrzavani ?? { clanoviUzeObitelji: 0, djeca: 0 },
      stope,
    },
    { ...podloga, obrtNaDohodak: pravila },
  )
  if (ishod.status !== 'izracunato' || unos.uzRadniOdnos !== true) return ishod

  return {
    status: 'izracunato',
    izracun: uzRadniOdnos(ishod.izracun, podloga, unos.godisnjiPrimitak),
  }
}

const obrtNaDobit = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { godisnjiIzdaci, stope } = unos
  const pravila = podloga.obrtNaDobit

  if (pravila === undefined) {
    return nedostupno({ kod: 'nema-pravila', pravila: 'porez na dobit' })
  }
  if (godisnjiIzdaci === undefined || stope === undefined) {
    return nedostupno({ kod: 'nema-izdataka-ni-jedinice' })
  }

  // Форма знає касовий primitak, а dobit визначається за методом нарахування.
  // Прирівнювати одне до одного — припущення форми, а не закону; воно назване
  // в JSDoc `UlazObrtNaDobit` і повторене на картці.
  const izracunDobiti = izracunajObrtNaDobit(
    {
      godisnjiPrihod: unos.godisnjiPrimitak,
      godisnjiRashod: zbrojIzdataka(godisnjiIzdaci),
      stopePorezaNaDohodak: stope,
    },
    podloga,
    pravila,
  )

  return {
    status: 'izracunato',
    izracun: {
      razred: undefined,
      porezi: izracunDobiti.porezi,
      ukupanPorez: sum(
        'EUR',
        izracunDobiti.porezi.map((porez) => porez.godisnjiIznos),
      ),
      doprinosi: izracunDobiti.doprinosi,
      povratPoreza: eur(0),
      napomene: [],
      obveznaDavanja: [],
      ukupnaDavanja: eur(0),
      ukupniIzdaci: eur(0),
      // Види обов'язків підставляє `uskladi`: там відомо, який це режим.
      vrsteObveza: VRSTE_OBVEZA['obrt-na-dobit'],
      netoZaOsobu: izracunDobiti.netoZaOsobu,
      efektivnaStopa: izracunDobiti.efektivnaStopa,
    },
  }
}

/**
 * Спільний каркас `Izracun` для режимів, які його не будують самі.
 *
 * Поля, що їх однаково перезапише `uskladi`, стоять тут порожніми: писати їх
 * заново в кожному режимі означало б чотири місця, де можна помилитися й не
 * помітити, бо `uskladi` все одно накриє результат зверху.
 *
 * `vrsteObveza` серед них — і саме воно потребує застереження, бо порожнього
 * значення в нього немає. Тут стоїть заглушка, яку `uskladi` замінює на
 * справжні обов'язки режиму за таблицею `VRSTE_OBVEZA`. Прочитати її як
 * відповідь не можна: до `uskladi` цей `Izracun` нікуди не потрапляє.
 */
const kaoIzracun = ({
  porezi,
  ukupanPorez,
  doprinosi,
  povratPoreza,
  napomene,
  efektivnaStopa,
}: Pick<
  Izracun,
  'porezi' | 'ukupanPorez' | 'doprinosi' | 'povratPoreza' | 'napomene' | 'efektivnaStopa'
>): Izracun => ({
  razred: undefined,
  porezi,
  ukupanPorez,
  doprinosi,
  povratPoreza,
  napomene,
  obveznaDavanja: [],
  ukupnaDavanja: eur(0),
  ukupniIzdaci: eur(0),
  vrsteObveza: ZAGLUSKA_OBVEZA,
  netoZaOsobu: eur(0),
  efektivnaStopa,
})

/**
 * `zaposlenik` — найм як альтернатива діяльності, а не додаток до неї.
 *
 * Слайдер тут читається як річна брутто-плаћа, і це прирівнювання назване на
 * картці: клієнт обрту платить рівно введену суму, роботодавець найманого —
 * більше на внески, які він несе понад плаћу.
 */
const zaposlenik = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { stope } = unos
  const pravila = podloga.placa

  if (pravila === undefined) return nedostupno({ kod: 'nema-pravila', pravila: 'plaća' })
  if (stope === undefined) return nedostupno({ kod: 'nema-jedinice' })
  // Людина вже сказала, що має роботу за наймом. Тоді ця картка порівнювала б
  // із обртом не альтернативу, а той самий найм удруге.
  if (unos.uzRadniOdnos === true) return nedostupno({ kod: 'vec-u-radnom-odnosu' })

  const placa = izracunajPlacu(
    {
      mjesecnaBrutoPlaca: eur(unos.godisnjiPrimitak.amount.div(MJESECI_U_GODINI)),
      stope,
      uzdrzavani: unos.uzdrzavani ?? { clanoviUzeObitelji: 0, djeca: 0 },
      dob: unos.dob,
      najnizaOsnovica: {
        mjesecniIznos: scale(
          eur(podloga.pretpostavke.prosjecnaPlaca.value),
          pravila.koeficijentNajnizeOsnovice.value,
        ),
        izvor: pravila.koeficijentNajnizeOsnovice.source,
      },
      // Роботодавець — чужа фірма: ZO ніколи не був грошима цієї людини.
      vlastitiPoslodavac: false,
    },
    podloga,
    pravila,
  )

  const napomene: readonly NapomenaRezima[] = [
    // Прирівнювання слайдера до брутто-плаће робить саме цей режим, тож і
    // називає його він, а не модуль плаће.
    { kod: 'bruto-placa-nije-primitak', trosakZaPoslodavca: placa.trosakZaPoslodavca },
    ...placa.napomene,
    ...pragPlaveKarte(placa.mjesecnaBrutoPlaca, podloga),
  ]

  const obvezniPlacanja = subtract(
    add(placa.porez.godisnjiIznos, placa.doprinosi.ukupnoGodisnjeNaTeretOsobe),
    placa.olaksicaZaMlade?.iznos ?? eur(0),
  )

  return {
    status: 'izracunato',
    izracun: kaoIzracun({
      porezi: [placa.porez],
      ukupanPorez: placa.porez.godisnjiIznos,
      doprinosi: placa.doprinosi,
      povratPoreza: placa.olaksicaZaMlade?.iznos ?? eur(0),
      napomene,
      efektivnaStopa: unos.godisnjiPrimitak.amount.isZero()
        ? undefined
        : obvezniPlacanja.amount.div(unos.godisnjiPrimitak.amount),
    }),
  }
}

/**
 * Поріг `EU plava karta` — постійним рядком, а не лише коли зарплата його не
 * дістає.
 *
 * Порожньо лише тоді, коли рахувати нема з чого: правил немає або середньої
 * за повний попередній рік не існує — для року, що ще не настав, її не
 * публікує ніхто. Мовчання там чесніше за поріг, порахований із чужої
 * статистики.
 */
const pragPlaveKarte = (
  mjesecnaBrutoPlaca: Money<'EUR'>,
  podloga: PodlogaUsporedbe,
): readonly NapomenaRezima[] => {
  const { plavaKarta } = podloga
  const prosjek = podloga.pretpostavke.prosjecnaPlacaPrethodneGodine
  if (plavaKarta === undefined || prosjek === undefined) return []

  const prag = scale(eur(prosjek.value), plavaKarta.koeficijent.value)
  return [
    {
      kod: 'prag-plave-karte',
      prag,
      dosegnut: !isGreaterThan(prag, mjesecnaBrutoPlaca),
      izvor: plavaKarta.koeficijent.source,
    },
  ]
}

/** Спільна перевірка входів обох режимів d.o.o. */
const pravilaDoo = (podloga: PodlogaUsporedbe): PravilaDoo | RazlogNedostupnosti => {
  const { obrtNaDobit, placa, clanUprave } = podloga
  if (obrtNaDobit === undefined) return { kod: 'nema-pravila', pravila: 'porez na dobit' }
  if (placa === undefined) return { kod: 'nema-pravila', pravila: 'plaća' }
  if (clanUprave === undefined) return { kod: 'nema-pravila', pravila: 'član uprave' }

  return {
    porezNaDobit: obrtNaDobit.porezNaDobit,
    stopaPorezaNaIsplatuDobiti: obrtNaDobit.stopaPorezaNaIsplatuDobiti,
    placa,
    clanUprave,
  }
}

/** Вхід, спільний для обох режимів d.o.o. */
const ulazDoo = (unos: UnosUsporedbe, stope: ParStopa) => ({
  // Форма знає касовий `primitak`, а `dobit` визначається за нарахуванням.
  // Прирівнювання назване в JSDoc `UlazDoo` і повторене на картці.
  godisnjiPrihod: unos.godisnjiPrimitak,
  godisnjiRashod: unos.godisnjiIzdaci === undefined ? eur(0) : zbrojIzdataka(unos.godisnjiIzdaci),
  stopePorezaNaDohodak: stope,
  uzdrzavani: unos.uzdrzavani ?? { clanoviUzeObitelji: 0, djeca: 0 },
  dob: unos.dob,
  mjesecnaPlacaVlasnika: unos.mjesecnaPlacaVlasnika,
})

const dooPlaca = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { stope } = unos
  // Правила перевіряються перед входами — так само, як в `obrt na dohodak`:
  // брак цілого набору правил є важливішою відповіддю, ніж брак одного поля.
  const pravila = pravilaDoo(podloga)
  if ('kod' in pravila) return nedostupno(pravila)
  if (stope === undefined) return nedostupno({ kod: 'nema-jedinice' })

  const izlaz = izracunajDooSPlacom(ulazDoo(unos, stope), podloga, pravila)
  return { status: 'izracunato', izracun: kaoIzracun(izlaz) }
}

const dooClanUprave = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Ishod => {
  const { stope } = unos
  // Правила перевіряються перед входами — так само, як в `obrt na dohodak`:
  // брак цілого набору правил є важливішою відповіддю, ніж брак одного поля.
  const pravila = pravilaDoo(podloga)
  if ('kod' in pravila) return nedostupno(pravila)
  if (stope === undefined) return nedostupno({ kod: 'nema-jedinice' })

  return {
    status: 'izracunato',
    izracun: kaoIzracun(izracunajDooClanUprave(ulazDoo(unos, stope), podloga, pravila)),
  }
}

/**
 * Єдина публічна функція рушія: чиста, синхронна, повертає всі режими одразу.
 *
 * Усі режими повертаються завжди і в незмінному порядку, з однаковою
 * структурою результату — саме на ній тримається зіставність, заради якої
 * калькулятор і існує. Жодного числа з закону рушій не знає: правила й
 * припущення приходять у `podloga` (ADR-0001).
 */
export const usporediRezime = (unos: UnosUsporedbe, podloga: PodlogaUsporedbe): Usporedba => {
  const dovrsi = (id: RezimId, ishod: Ishod): Rezim => ({
    id,
    naziv: NAZIVI[id],
    ishod:
      ishod.status === 'izracunato'
        ? { status: 'izracunato', izracun: uskladi(ishod.izracun, unos, podloga, id) }
        : ishod,
  })

  // Порядок сталий і осмислений: три обртні режими, два товариства, найм.
  // Спершу те, що людина відкриває сама і найдешевше, далі — те, що вимагає
  // окремої юридичної особи, і насамкінець відмова від власної справи.
  const rezimi: readonly Rezim[] = [
    dovrsi('pausalni-obrt', pausalniObrt(unos, podloga)),
    dovrsi('obrt-na-dohodak', obrtNaDohodak(unos, podloga)),
    dovrsi('obrt-na-dobit', obrtNaDobit(unos, podloga)),
    dovrsi('doo-placa', dooPlaca(unos, podloga)),
    dovrsi('doo-clan-uprave', dooClanUprave(unos, podloga)),
    dovrsi('zaposlenik', zaposlenik(unos, podloga)),
  ]

  return { godina: podloga.ruleset.godina, rezimi }
}
