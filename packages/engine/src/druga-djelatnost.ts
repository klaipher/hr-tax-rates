/**
 * `paušalni obrt` як `druga djelatnost` — коли обрт ведуть **поряд** із
 * роботою за наймом, а не замість неї.
 *
 * Модуль існує тому, що це інше питання, ніж те, на яке відповідає
 * `usporedba.ts`. Там шість режимів — взаємовиключні альтернативи, і
 * `Izracun` збудований саме на цьому: одна база, одна `efektivna stopa`, одне
 * «на руки». Тут джерел двоє одночасно, вони належать одній людині, і скласти
 * їх — не помилка, а сама відповідь. Сьомий режим у порівнянні дав би кожній
 * із шести карток поля, які для них порожні (ADR-0006).
 *
 * Складати можна саме тому, що обидва податки остаточні й не зустрічаються:
 * `paušalni porez` не входить у річну декларацію з `dohodak`, а `osobni
 * odbitak` живе на боці plaća й до паушалу не доходить узагалі. Тож жодне
 * число одного джерела не змінює бази другого — крім внесків, і рівно там усе
 * найцікавіше й відбувається.
 */
import type {
  DrugaDjelatnostPravila,
  KomorskiDoprinosPravila,
  LegalReference,
  ParStopa,
  PlacaPravila,
  PlavaKartaPravila,
} from '@hr-tax/data'
import {
  INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI,
  IZVOR_RENTE_PO_POVRSINI,
  komorskiDoprinos,
  TURISTICKA_CLANARINA_DJELATNOSTI,
} from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { kaoDavanje, NAZIVI_DAVANJA } from './davanja.ts'
import { MJESECI_U_GODINI } from './doprinosi.ts'
import {
  add,
  eur,
  isGreaterThan,
  type Money,
  roundToCents,
  scale,
  subtract,
  sum,
  zero,
} from './money.ts'
import type { UzdrzavaniClanovi } from './obrt-na-dohodak.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import { type IzracunPlace, izracunajPlacu, type RaspodjelaPoStopama } from './placa.ts'
import {
  type Doprinosi,
  jediniPorez,
  type NapomenaRezima,
  type Naziv,
  type ObveznoDavanje,
  type Podloga,
  type Porez,
  type PrimijenjeniRazred,
  type RazlogNedostupnosti,
} from './types.ts'
import {
  type DoprinosiUzRadniOdnos,
  doprinosiUzRadniOdnos,
  ustedaNaDoprinosima,
} from './uz-radni-odnos.ts'

/**
 * Вхід: два числа й обставини платника.
 *
 * Обидва числа річні. `primitak` — бо річним його міряє закон; `plaća` — бо
 * розрахунок увесь на повний рік, і два періоди на вході означали б, що
 * людина зводить їх до одного сама.
 */
export interface UlazDrugeDjelatnosti {
  /**
   * Річна брутто-`plaća`.
   *
   * Річна, як і `primitak` обрту: розрахунок увесь на повний рік, і два
   * періоди на вході означали б, що людина зводить їх сама.
   *
   * Місячну величину, без якої не обійтися — законна підлога бази внесків і
   * поріг `EU plava karta` встановлені саме на місяць, — виводить цей модуль
   * діленням на дванадцять. Це **припущення**: рік із тринадцятою виплатою
   * або з нерівними місяцями дасть ту саму річну суму й інший місячний
   * знаменник. Ділити тут, а не у формі, — щоб припущення жило поруч із
   * правилом, яке його потребує, а не в шарі показу.
   */
  readonly godisnjaBrutoPlaca: Money<'EUR'>
  /** Річний `primitak` обрту. Саме він вибирає `razred` і впирається в поріг. */
  readonly godisnjiPrimitakObrta: Money<'EUR'>
  /**
   * Ставки `porez na dohodak` тієї одиниці, де людина живе. `undefined` —
   * одиницю ще не обрано, і податок із plaća не рахується взагалі: без ставок
   * його нема з чого нарахувати, а підставити чужі означало б вигадати число.
   */
  readonly stope: ParStopa | undefined
  readonly uzdrzavani: UzdrzavaniClanovi
  /**
   * Вік, якого людина досягає протягом цього податкового періоду. `undefined`
   * — не рахувати `olakšica za mlade` взагалі: припустити «понад тридцять»
   * означало б тихо забрати пільгу в того, кому вона належить.
   */
  readonly dob: number | undefined
  /**
   * Чи обрт у перших двох роках від **першого** впису в `Obrtni registar` —
   * `čl. 15.` Odluke звільняє такий від `komorski doprinos`.
   */
  readonly noviObrt: boolean
}

/**
 * Правила, яких цей розрахунок потребує понад ті, що вже є в `Podloga`.
 *
 * Обов'язкові всі до одного, на відміну від `PodlogaUsporedbe`: там режим без
 * правил чесно каже «недоступно» й лишається на екрані поруч із рештою, а тут
 * джерел лише двоє, і брак правил не лишає що показувати.
 */
export interface PodlogaDrugeDjelatnosti extends Podloga {
  readonly placa: PlacaPravila
  readonly drugaDjelatnost: DrugaDjelatnostPravila
  readonly plavaKarta: PlavaKartaPravila
  readonly komorskiDoprinos: KomorskiDoprinosPravila
}

/** Платіж, який цей калькулятор навмисно не рахує, і норма, за якою він живе. */
export interface NeuracunatoDavanje {
  readonly naziv: Naziv
  readonly izvor: LegalReference
}

/**
 * Застереження, які походять із самої комбінації, а не з одного джерела.
 *
 * Власний тип, а не нові коди в `NapomenaRezima`: додати їх туди означало б
 * змінити union, який розбирає працюючий застосунок порівняння, — заради
 * рядків, яких у ньому ніколи не буде.
 */
export type NapomenaDrugeDjelatnosti =
  | {
      /**
       * Розрахунок зроблено на повний календарний рік.
       *
       * Стоїть завжди, а не лише коли обрт відкрито в середині року: місяця
       * відкриття цей калькулятор не питає взагалі, тож відрізнити один
       * випадок від другого не може. Мовчати про це не можна — помилка тут
       * односпрямована: у того, хто відкрився в серпні, і внески, і
       * `komorski doprinos` виходять завищеними.
       */
      readonly kod: 'racun-za-punu-godinu'
    }
  | {
      /**
       * `turistička članarina` і дві `spomenička renta` не враховані: усі
       * три залежать від `NKD` і місця діяльності, яких форма не питає.
       *
       * Помилка знову односпрямована — рядок обрту виходить заниженим, і саме
       * тому застереження не можна замінити нулем.
       */
      readonly kod: 'davanja-ovisna-o-djelatnosti-nisu-uracunata'
      readonly stavke: readonly NeuracunatoDavanje[]
    }
  | {
      /**
       * Обрт забрав більше, ніж приніс.
       *
       * Не помилка розрахунку, а властивість паушалу: база задана розрядом, а
       * не заробленим, тож обрт із нульовим `primitak` однаково платить
       * податок першого розряду, внески з нього й `komorski doprinos`. Мінус
       * у рядку «лишається» правдивий — але без пояснення читається як збій,
       * а не як ціна відкритого й непрацюючого обрту.
       */
      readonly kod: 'obrt-kosta-vise-nego-donosi'
      readonly manjak: Money<'EUR'>
    }

/**
 * Одне джерело в підсумку — рівно ті числа, з яких складається рядок таблиці.
 *
 * `odbijeno` не дублює складові, а виводиться відніманням `neto` від бази:
 * два способи дійти до того самого числа розійшлися б тихо, щойно з'явився б
 * третій доданок.
 */
export interface StranaIzvora {
  readonly naziv: Naziv
  /** Річна сума, з якої все починається: брутто-`plaća` або `primitak`. */
  readonly baza: Money<'EUR'>
  /** Скільки з цієї суми лишається людині за рік. */
  readonly neto: Money<'EUR'>
  /**
   * Те саме на місяць — річне поділене на дванадцять.
   *
   * **Середнє, а не платіжка.** Ні з одного боку гроші так не приходять:
   * `paušalni porez` і внески другої діяльності сплачуються не рівними
   * місячними частками, а `olakšica za mlade` з боку plaća взагалі
   * повертається наступного року. Число корисне рівно для одного — прикинути
   * місячний бюджет, — і саме тому воно тут, а не виводиться на екрані:
   * ділення на дванадцять є твердженням про рік, а не форматуванням.
   */
  readonly mjesecniNeto: Money<'EUR'>
  /** Скільки з неї віддано — податок, внески й обов'язкові платежі разом. */
  readonly odbijeno: Money<'EUR'>
  /** `odbijeno / baza`. `undefined`, коли база нульова: ділити нема на що. */
  readonly efektivnaStopa: Decimal | undefined
}

/**
 * Сторона plaća — рівно ті числа, які показує таблиця.
 *
 * Не весь `IzracunPlace`: барель пакета навмисно не виставляє `placa.ts`
 * назовні, бо решта того модуля — внутрішня кухня двох режимів порівняння.
 * Просочити її сюди цілим полем означало б обійти ту межу боком.
 */
export interface StranaPlace extends StranaIzvora {
  readonly mjesecnaBrutoPlaca: Money<'EUR'>
  /**
   * `predujam poreza na dohodak` за рік — **до** будь-якого зменшення.
   *
   * Разом із `povrat`, а не замість нього: протягом року утримують саме цю
   * суму, а пільга повертається наступного календарного року. Одне число
   * замість двох сховало б той факт, що гроші приходять із запізненням.
   */
  readonly porez: Porez
  /** Скільки податку повертається річним звітом — усі зменшення разом. */
  readonly povrat: Money<'EUR'>
  readonly doprinosi: Doprinosi
  /**
   * Як прогресія розклала податок: дві ставки одиниці й місячний поріг між
   * ними. Без цього `porez.stopa` несе лише ефективну частку — правдиву, але
   * таку, з якої не видно, що ставок дві.
   */
  readonly raspodjelaPoStopama: RaspodjelaPoStopama
}

/**
 * Наскільки дешевші внески виходять через те, що обрт ведуть поряд із наймом.
 *
 * Обидва числа, а не саму різницю: без «замість чого» виграш нічого не
 * пояснює, а пояснює він тут головне. Внески звичайного паушалу — **фіксовані**
 * (`prosječna plaća × koeficijent × 12`) і не залежать від заробленого взагалі;
 * внески другої діяльності стоять на `paušalni dohodak` розряду і ще й за
 * ставками 17,5 % замість 36,5 %. Тому виграш найбільший там, де заробіток
 * найменший, — і це рівно протилежне тому, чого чекають від «знижки».
 *
 * Рахується в рушії, а не на екрані: інакше шар показу складав би два
 * розрахунки того самого режиму, а це вже не показ (ADR-0005 сусідить із тією
 * самою межею).
 */
export interface UstedaOdRadnogOdnosa {
  /** Скільки внесків було б, якби найму не було. */
  readonly bezRadnogOdnosa: Money<'EUR'>
  /**
   * Різниця. Додатна означає виграш; на паушалі вона додатна завжди, бо навіть
   * найвищий `paušalni dohodak` за ставкою 17,5 % не дотягує до фіксованої
   * бази за 36,5 %. Знак усе одно перевіряється на екрані — тип не обіцяє
   * того, чого не гарантує закон.
   */
  readonly usteda: Money<'EUR'>
}

/** Сторона обрту: розряд, податок, внески другої діяльності й палата. */
export interface StranaObrta extends StranaIzvora {
  readonly razred: PrimijenjeniRazred
  readonly porez: Porez
  readonly doprinosi: DoprinosiUzRadniOdnos
  /** Що дала сама паралельність — і з чим це порівнюють. */
  readonly ustedaOdRadnogOdnosa: UstedaOdRadnogOdnosa
  readonly komorskiDoprinos: ObveznoDavanje
}

/** Поріг зарплати, за якого видають `EU plava karta`. */
export interface PragPlaveKarte {
  readonly mjesecniPrag: Money<'EUR'>
  /** Чи введена bruto plaća дістає порога. */
  readonly dosegnut: boolean
  readonly izvor: LegalReference
}

export interface IzracunDrugeDjelatnosti {
  readonly placa: StranaPlace
  readonly obrt: StranaObrta
  /** «На руки за рік» — обидва джерела разом. */
  readonly ukupnoNeto: Money<'EUR'>
  /** Те саме на місяць — із тим самим застереженням, що й у джерел. */
  readonly ukupnoMjesecniNeto: Money<'EUR'>
  /** «Віддано за рік» — обидва джерела разом. */
  readonly ukupnoOdbijeno: Money<'EUR'>
  /** Ефективна ставка на все: `ukupnoOdbijeno` до суми обох баз. */
  readonly ukupnaEfektivnaStopa: Decimal | undefined
  /**
   * Скільки plaća коштує роботодавцю — брутто разом із внесками, які він
   * платить понад неї.
   *
   * У підсумок не входить і входити не може: ці гроші ніколи не були
   * грошима цієї людини (ADR-0005). Стоїть окремо саме тому, що людина, яка
   * питає «скільки з мене беруть», має бачити й те, скільки беруть **на** неї.
   */
  readonly trosakZaPoslodavca: Money<'EUR'>
  /** `undefined`, коли статистики за повний попередній рік іще немає. */
  readonly pragPlaveKarte: PragPlaveKarte | undefined
  readonly napomene: readonly (NapomenaRezima | NapomenaDrugeDjelatnosti)[]
}

export type IshodDrugeDjelatnosti =
  | { readonly status: 'izracunato'; readonly izracun: IzracunDrugeDjelatnosti }
  | { readonly status: 'nedostupno'; readonly razlog: RazlogNedostupnosti }

const NAZIVI = {
  placa: { hr: 'plaća', uk: 'зарплата за наймом' },
  obrt: { hr: 'paušalni obrt', uk: 'паушальний обрт' },
} as const satisfies Readonly<Record<string, Naziv>>

/**
 * Місячна `plaća` з річної — за припущенням про дванадцять рівних місяців.
 *
 * Ділення в `Decimal`, а не в `number`: результат іде в базу внесків, і дрейф
 * float тут перетворився б на розбіжність у центах проти еталонів.
 */
const mjesecnaOd = (godisnja: Money<'EUR'>): Money<'EUR'> =>
  eur(godisnja.amount.div(MJESECI_U_GODINI))

/** Місячне середнє з річної суми — заокруглене до цента, бо йде на екран. */
const mjesecniProsjek = (godisnja: Money<'EUR'>): Money<'EUR'> => roundToCents(mjesecnaOd(godisnja))

/** Частка відданого в базі. Нульова база не дає нуля — вона не дає нічого. */
const efektivnaStopaZa = (baza: Money<'EUR'>, odbijeno: Money<'EUR'>): Decimal | undefined =>
  baza.amount.isZero() ? undefined : odbijeno.amount.div(baza.amount)

/**
 * Поріг `EU plava karta`: `1,5 × prosječna plaća` **за повний попередній рік**.
 *
 * Саме за повний рік, а не та середня, з якої будуються бази внесків: у
 * наборі їх дві, періоди різні, і взяти одну замість іншої означало б показати
 * поріг, якого закон не встановлював (`Pretpostavke`).
 */
const pragPlaveKarteZa = (
  mjesecnaBrutoPlaca: Money<'EUR'>,
  podloga: PodlogaDrugeDjelatnosti,
): PragPlaveKarte | undefined => {
  const prosjek = podloga.pretpostavke.prosjecnaPlacaPrethodneGodine
  if (prosjek === undefined) return undefined

  const mjesecniPrag = scale(eur(prosjek.value), podloga.plavaKarta.koeficijent.value)

  return {
    mjesecniPrag,
    dosegnut: !isGreaterThan(mjesecniPrag, mjesecnaBrutoPlaca),
    izvor: podloga.plavaKarta.koeficijent.source,
  }
}

/** Два платежі, яких цей калькулятор не рахує, — названі поіменно. */
const NEURACUNATA_DAVANJA: readonly NeuracunatoDavanje[] = [
  { naziv: NAZIVI_DAVANJA.clanarina, izvor: TURISTICKA_CLANARINA_DJELATNOSTI.source },
  { naziv: NAZIVI_DAVANJA.renta, izvor: IZVOR_RENTE_PO_POVRSINI },
  {
    naziv: NAZIVI_DAVANJA.indirektnaRenta,
    izvor: INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.source,
  },
]

/**
 * Сторона plaća.
 *
 * Нічого свого не рахує: `izracunajPlacu` уже вміє все, чого вимагає повна
 * достовірність, — `osobni odbitak`, утриманців, ставки одиниці, `olakšica za
 * mlade`. Тут лише вибір входів, які цей калькулятор не питає, і зведення до
 * рядка таблиці.
 */
const stranaPlace = (
  ulaz: UlazDrugeDjelatnosti,
  stope: ParStopa,
  podloga: PodlogaDrugeDjelatnosti,
): { readonly strana: StranaPlace; readonly izracun: IzracunPlace } => {
  const izracun = izracunajPlacu(
    {
      mjesecnaBrutoPlaca: mjesecnaOd(ulaz.godisnjaBrutoPlaca),
      stope,
      uzdrzavani: ulaz.uzdrzavani,
      dob: ulaz.dob,
      najnizaOsnovica: {
        mjesecniIznos: scale(
          eur(podloga.pretpostavke.prosjecnaPlaca.value),
          podloga.placa.koeficijentNajnizeOsnovice.value,
        ),
        izvor: podloga.placa.koeficijentNajnizeOsnovice.source,
      },
      // Роботодавець — чужа фірма: ZO понад plaća ніколи не був грошима цієї
      // людини, і в «віддано» він не входить (ADR-0005).
      vlastitiPoslodavac: false,
      // Три входи, яких форма не питає за домовленістю про обсяг. Нуль і
      // `false` тут — не припущення про людину, а типовий випадок: закон дає
      // стелі неоподаткованих виплат, а не обіцянки; `povratnik` стосується
      // громадян, які повернулися з-за кордону; `umanjenje za područje` —
      // мешканців одиниць I. skupine розвиненості.
      neoporeziviPrimici: zero('EUR'),
      prvoZaposlenje: false,
      umanjenjeZaPodrucje: false,
      povratnik: false,
    },
    podloga,
    podloga.placa,
  )

  const baza = izracun.godisnjaBrutoPlaca
  const odbijeno = subtract(baza, izracun.godisnjiNeto)

  return {
    strana: {
      naziv: NAZIVI.placa,
      baza,
      neto: izracun.godisnjiNeto,
      mjesecniNeto: mjesecniProsjek(izracun.godisnjiNeto),
      odbijeno,
      efektivnaStopa: efektivnaStopaZa(baza, odbijeno),
      mjesecnaBrutoPlaca: izracun.mjesecnaBrutoPlaca,
      porez: izracun.porez,
      povrat: izracun.ukupniPovrat,
      doprinosi: izracun.doprinosi,
      raspodjelaPoStopama: izracun.raspodjelaPoStopama,
    },
    izracun,
  }
}

/**
 * Сторона обрту.
 *
 * `izracunajPausalniObrt` дає тут три речі: перевірку порога, `razred` і
 * `paušalni porez` із `paušalni dohodak` цього розряду. Внески, які він
 * порахував заодно, свідомо відкидаються — вони побудовані з місячної
 * `osnovica` звичайного паушалу, а другій діяльності закон приписує іншу базу
 * й інші ставки (`čl. 185.`). Переписувати вибір розряду заради цього було б
 * дорожче: два місця знали б таблицю, і розійшлися б вони тихо.
 */
const stranaObrta = (
  ulaz: UlazDrugeDjelatnosti,
  podloga: PodlogaDrugeDjelatnosti,
): StranaObrta | RazlogNedostupnosti => {
  const ishod = izracunajPausalniObrt(ulaz.godisnjiPrimitakObrta, podloga)
  if (ishod.status === 'nedostupno') return ishod.razlog

  const { razred } = ishod.izracun
  // Порахований паушал без розряду — зламаний інваріант `pausalni-obrt.ts`, а
  // не становище платника: розряд там вибирається до всього іншого, і без
  // нього не було б із чого нарахувати податок. Тому виняток, як у
  // `jediniPorez`, а не `undefined` у типі, яким мусив би перейматися екран.
  if (razred === undefined) {
    throw new Error('Паушальний розрахунок повернувся без розряду')
  }
  const porez = jediniPorez(ishod.izracun)

  const doprinosi = doprinosiUzRadniOdnos(
    {
      // База другої діяльності — `paušalni dohodak` розряду, тобто рівно та
      // сума, з якої вже нарахований податок. Одне число на дві ролі, і взяте
      // воно з одного місця.
      vrsta: 'pausalni-dohodak',
      godisnjaOsnovica: porez.poreznaOsnovica,
    },
    podloga.drugaDjelatnost,
    podloga.pretpostavke,
  )

  // Внески, які `izracunajPausalniObrt` порахував за звичайними правилами,
  // тут не викидаються, а стають другим боком порівняння: це та сама сума на
  // тому самому вході, різниця лише в тому, чи є найм.
  const usteda = ustedaNaDoprinosima(ishod.izracun.doprinosi, doprinosi)

  const komorski = kaoDavanje(
    NAZIVI_DAVANJA.komorski,
    komorskiDoprinos({ uPrveDvijeGodine: ulaz.noviObrt }, podloga.komorskiDoprinos),
  )
  const iznosKomorskog = komorski.status === 'obračunato' ? komorski.godisnjiIznos : zero('EUR')

  const baza = ulaz.godisnjiPrimitakObrta
  // Усі три внески обрту виходять із кишені самої людини — на відміну від
  // plaća, тут другої сторони немає взагалі.
  const odbijeno = sum('EUR', [porez.godisnjiIznos, doprinosi.ukupnoGodisnje, iznosKomorskog])

  return {
    naziv: NAZIVI.obrt,
    baza,
    neto: subtract(baza, odbijeno),
    mjesecniNeto: mjesecniProsjek(subtract(baza, odbijeno)),
    odbijeno,
    efektivnaStopa: efektivnaStopaZa(baza, odbijeno),
    razred,
    porez,
    doprinosi,
    ustedaOdRadnogOdnosa: {
      bezRadnogOdnosa: ishod.izracun.doprinosi.ukupnoGodisnje,
      usteda,
    },
    komorskiDoprinos: komorski,
  }
}

/**
 * Розрахунок людини, яка працює за наймом і веде `paušalni obrt` поряд.
 *
 * Порядок дій має значення рівно в одному місці: `razred` обирається з
 * `primitak` обрту й тільки з нього. Plaća в цей вибір не входить — вона не є
 * `primitak` обрту, і додати її означало б підняти розряд чужими грошима.
 */
export const izracunajDrugaDjelatnost = (
  ulaz: UlazDrugeDjelatnosti,
  podloga: PodlogaDrugeDjelatnosti,
): IshodDrugeDjelatnosti => {
  const { stope } = ulaz
  if (stope === undefined) return { status: 'nedostupno', razlog: { kod: 'nema-jedinice' } }

  const obrt = stranaObrta(ulaz, podloga)
  if ('kod' in obrt) return { status: 'nedostupno', razlog: obrt }

  const { strana: placa, izracun: izracunPlace } = stranaPlace(ulaz, stope, podloga)

  const ukupnaBaza = add(placa.baza, obrt.baza)
  const ukupnoOdbijeno = add(placa.odbijeno, obrt.odbijeno)
  const prag = pragPlaveKarteZa(mjesecnaOd(ulaz.godisnjaBrutoPlaca), podloga)

  return {
    status: 'izracunato',
    izracun: {
      placa,
      obrt,
      ukupnoNeto: add(placa.neto, obrt.neto),
      ukupnoMjesecniNeto: mjesecniProsjek(add(placa.neto, obrt.neto)),
      ukupnoOdbijeno,
      ukupnaEfektivnaStopa: efektivnaStopaZa(ukupnaBaza, ukupnoOdbijeno),
      trosakZaPoslodavca: izracunPlace.trosakZaPoslodavca,
      pragPlaveKarte: prag,
      napomene: [
        ...izracunPlace.napomene,
        ...(obrt.neto.amount.isNegative()
          ? [
              {
                kod: 'obrt-kosta-vise-nego-donosi',
                manjak: subtract(obrt.odbijeno, obrt.baza),
              } as const,
            ]
          : []),
        { kod: 'racun-za-punu-godinu' },
        { kod: 'davanja-ovisna-o-djelatnosti-nisu-uracunata', stavke: NEURACUNATA_DAVANJA },
      ],
    },
  }
}
