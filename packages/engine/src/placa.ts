/**
 * `plaća` (зарплата / salary) — розрахунок, спільний для всіх, кому податок
 * утримують із зарплати помісячно.
 *
 * Один модуль на трьох споживачів: найманого працівника, власника d.o.o. у
 * трудовому договорі й — потенційно — `poduzetnička plaća` обрту в системі
 * `porez na dobit`. Різняться вони не механікою, а тим, звідки береться сама
 * сума і яка законна підлога під базою внесків, тож підлога приходить
 * аргументом, а не живе всередині.
 *
 * Головне, що цей модуль знає і чого не знав жоден попередній: у плаћі
 * **дві сторони**. MO обох стовпів утримують із самої плаће — гроші людини.
 * ZO платить роботодавець понад плаћу — гроші, яких людина не бачила ніколи.
 * Обидва внески реальні, обидва оплачують її страхування, і обидва мусять
 * бути на картці; але відняти від «на руки» можна лише перший.
 */
import type { ParStopa, PlacaPravila } from '@hr-tax/data'
import Decimal from 'decimal.js'
import { doprinos, godisnje, MJESECI_U_GODINI, naTeretOsobe } from './doprinosi.ts'
import { add, eur, isGreaterThan, type Money, scale, subtract, sum, zero } from './money.ts'
import type { UzdrzavaniClanovi } from './obrt-na-dohodak.ts'
import type { Doprinosi, NapomenaRezima, Podloga, Porez } from './types.ts'

/** Ставки одиниць зберігаються в базисних пунктах: 2300 — це 23 %. */
const BAZNIH_BODOVA_U_JEDINICI = 10000

const udio = (bazniBodovi: number): Decimal =>
  new Decimal(bazniBodovi).div(BAZNIH_BODOVA_U_JEDINICI)

/** Нуль замість від'ємної суми: від'ємної бази оподаткування не буває. */
const bezMinusa = (iznos: Money<'EUR'>): Money<'EUR'> =>
  iznos.amount.isNegative() ? zero('EUR') : iznos

/**
 * Законна підлога місячної `osnovica` внесків.
 *
 * Приходить аргументом, бо підлог у законі кілька й обирає їх не цей модуль:
 * для звичайного трудового відношення це `prosječna plaća × 0,38`, а для
 * того, хто водночас є членом правління своєї фірми, — `× 0,65`. Різницю між
 * ними видно рівно в тому, скільки власник d.o.o. може собі не платити.
 */
export interface NajnizaOsnovica {
  readonly mjesecniIznos: Money<'EUR'>
  readonly izvor: import('@hr-tax/data').LegalReference
}

export interface UlazPlace {
  /** Місячна брутто-плаћа — те число, яке стоїть у трудовому договорі. */
  readonly mjesecnaBrutoPlaca: Money<'EUR'>
  /**
   * Ставки `porez na dohodak` тієї `jedinica lokalne samouprave`, де живе
   * працівник. Плаћа оподатковується за місцем проживання, а не за місцем
   * роботи.
   */
  readonly stope: ParStopa
  readonly uzdrzavani: UzdrzavaniClanovi
  /**
   * Вік, який людина досягає протягом цього податкового періоду.
   * `undefined` — вік не введено, і `olakšica za mlade` не рахується взагалі:
   * припустити «понад 30» означало б тихо забрати пільгу в того, кому вона
   * належить.
   */
  readonly dob: number | undefined
  readonly najnizaOsnovica: NajnizaOsnovica
  /**
   * Річна сума `neoporezivi primici` — виплат, які роботодавець дає понад
   * плаћу без податку й без внесків.
   *
   * Приходить числом, а не виводиться зі стель закону: закон називає стелю,
   * а не зобов'язання, і підставити її означало б показати чужу щедрість як
   * норму. Нуль — це «не домовлено», і саме він типовий.
   *
   * У жодну базу сума не входить. Вона додається до «на руки» й рівно на
   * стільки ж до вартості для роботодавця — бо це гроші, які він таки
   * витратив.
   */
  readonly neoporeziviPrimici: Money<'EUR'>
  /**
   * Чи це перше працевлаштування за договором на неозначений час
   * (`čl. 7. t. 54.` ZoD).
   *
   * Не вік: вікове звільнення від внесків скасовано з 1 січня 2025 року. Це
   * інша, чинна норма, і вона знімає з роботодавця ZO — тобто здешевлює
   * плаћу фірмі на 16,5 %, не змінюючи «на руки» ані на цент.
   */
  readonly prvoZaposlenje: boolean
  /**
   * Чи людина живе в одиниці з I. skupine розвиненості або у Вуковарі
   * (`čl. 46. st. 1.`).
   *
   * Вирішує не цей модуль: список одиниць друкує `Odluka` Влади, а не
   * податковий закон, і зіставлення з довідником робить той, хто знає, яку
   * саме одиницю обрала людина.
   */
  readonly umanjenjeZaPodrucje: boolean
  /**
   * Чи людина підпадає під `čl. 46. st. 3.` — громадянин Хорватії, який
   * щонайменше два роки безперервно жив за кордоном і повернувся.
   *
   * Не додається до решти, а замінює їх: `st. 9.` прямо виключає обидва інші
   * зменшення. Тому прапорець, а не ще один доданок.
   */
  readonly povratnik: boolean
  /**
   * Чи роботодавцем є та сама людина — тобто чи це її власна фірма.
   *
   * Вирішує єдине, але важливе: чию кишеню порожнить ZO. У найманого
   * працівника чужої фірми ці гроші не були його ніколи. У власника d.o.o.
   * вони виходять із тієї самої `dobit`, яку він інакше забрав би собі
   * дивідендами, — тобто це його гроші, просто витрачені раніше.
   *
   * Та сама сума, та сама стаття, протилежна відповідь. Саме заради цієї
   * різниці `Doprinos.teretiOsobu` й існує.
   */
  readonly vlastitiPoslodavac: boolean
}

/**
 * `olakšica za mlade` (пільга для молоді / young-worker relief) — не менший
 * податок, а пізніші гроші.
 *
 * Протягом року `predujam` утримують повний. Пільга виводиться річним звітом
 * і повертається в наступному календарному році, тож у «на руки» за цей рік
 * вона входить, а в платіжці цього року її немає.
 */
export interface OlaksicaZaMlade {
  /** Частка податку, яка повертається: 1 — увесь, 0,5 — половина. */
  readonly udio: Decimal
  /**
   * Сума повернення за рік. Рахується лише з тієї частини податку, яку
   * нараховано **нижчою** ставкою: заробіток, що дійшов до вищої, не
   * повертається навіть тому, кому ще немає двадцяти п'яти.
   */
  readonly iznos: Money<'EUR'>
  readonly izvor: import('@hr-tax/data').LegalReference
}

/**
 * Зменшення річного податку, яке рахується від **усього** податку з плаће, а
 * не від частини за нижчою ставкою.
 *
 * Форма та сама, що в `OlaksicaZaMlade`, а поняття інше, і саме тому це
 * окремий тип: сплутати «половина всього податку» з «половина податку за
 * нижчою ставкою» легко, а різниця в грошах помітна вже на середній зарплаті.
 */
export interface UmanjenjeGodisnjegPoreza {
  readonly udio: Decimal
  readonly iznos: Money<'EUR'>
  readonly izvor: import('@hr-tax/data').LegalReference
}

/** Розрахунок плаће за рік. */
export interface IzracunPlace {
  readonly mjesecnaBrutoPlaca: Money<'EUR'>
  readonly godisnjaBrutoPlaca: Money<'EUR'>
  /**
   * Місячна `osnovica` внесків — сама плаћа, підведена до законної підлоги,
   * якщо вона нижча.
   */
  readonly mjesecnaOsnovicaDoprinosa: Money<'EUR'>
  /** Внески з розбивкою за видами страхування і за тим, чия це кишеня. */
  readonly doprinosi: Doprinosi
  /** `predujam poreza na dohodak` за рік — до будь-якої пільги. */
  readonly porez: Porez
  /** `undefined`, коли вік не введено або людині вже понад тридцять. */
  readonly olaksicaZaMlade: OlaksicaZaMlade | undefined
  /**
   * `čl. 46. st. 1.` — половина річного податку мешканцеві одиниці з I. skupine
   * розвиненості або Вуковара. `undefined`, коли підстави немає.
   *
   * Рахується з того, що лишилося **після** молодіжного зменшення: `st. 7.`
   * ставить їх саме в цьому порядку, і зворотний дав би іншу суму.
   */
  readonly umanjenjeZaPodrucje: UmanjenjeGodisnjegPoreza | undefined
  /**
   * `čl. 46. st. 3.` — увесь річний податок із плаће поверненцеві з-за
   * кордону. `undefined`, коли підстави немає.
   *
   * Коли воно є, обидва інші зменшення — `undefined`, і це не помилка
   * розрахунку, а `st. 9.`: закон дає одне замість двох, а не три разом.
   */
  readonly umanjenjeZaPovratnika: UmanjenjeGodisnjegPoreza | undefined
  /**
   * Скільки податку повертається річним звітом — усі зменшення разом.
   *
   * Окремим полем, а не складанням на картці: доданків троє, взаємні
   * виключення між ними задає закон, і скласти їх правильно може лише той,
   * хто ці виключення застосував.
   */
  readonly ukupniPovrat: Money<'EUR'>
  /**
   * Скільки з плаће справді лишається людині за рік: брутто без утриманих
   * внесків, без податку і з поверненням пільги.
   */
  readonly godisnjiNeto: Money<'EUR'>
  /**
   * Скільки плаћа коштує роботодавцю: брутто разом із внесками, які він
   * платить понад неї.
   *
   * Головне число для порівняння з обртом: клієнт обрту платить рівно
   * `primitak`, а роботодавець найманого — оцю суму.
   */
  readonly trosakZaPoslodavca: Money<'EUR'>
  readonly napomene: readonly NapomenaRezima[]
}

/**
 * Внески з плаће: MO обох стовпів із неї, ZO — понад неї.
 *
 * Ставки ті самі, що в решти режимів, — різниця в тому, хто платить. Саме
 * тут `teretiOsobu` вперше стає `false`, і саме заради цього поле існує.
 */
const doprinosiZa = (
  mjesecnaOsnovica: Money<'EUR'>,
  umanjenjePrvogStupa: Money<'EUR'>,
  { ruleset }: Podloga,
  vlastitiPoslodavac: boolean,
  prvoZaposlenje: boolean,
): Doprinosi => {
  const godisnjaOsnovica = godisnje(mjesecnaOsnovica)

  const moPrviStup = doprinos({
    naziv: { hr: 'MO — I. stup', uk: 'пенсійне, генераційна солідарність' },
    stopa: ruleset.doprinosi.stopaMoPrviStup,
    // Єдиний внесок, чия база менша за решту: `čl. 21.a` знижує саме її й
    // тільки її. Застосувати знижку до трьох внесків означало б занизити
    // платіж і не помітити цього.
    godisnjaOsnovica: bezMinusa(subtract(godisnjaOsnovica, godisnje(umanjenjePrvogStupa))),
    osobnaStednja: false,
  })
  const moDrugiStup = doprinos({
    naziv: { hr: 'MO — II. stup', uk: 'пенсійне, індивідуальна капіталізована ощадність' },
    stopa: ruleset.doprinosi.stopaMoDrugiStup,
    godisnjaOsnovica,
    osobnaStednja: true,
  })
  const zo = doprinos({
    naziv: { hr: 'ZO', uk: 'медичне страхування' },
    stopa: ruleset.doprinosi.stopaZo,
    // `čl. 20. st. 2.` ZoD: за того, хто вперше працевлаштовується, з бази
    // нараховують **лише** внески «iz osnovice» — обидва стовпи MO. ZO не
    // нараховують узагалі, тож тут нульова база, а не нульова ставка: ставка
    // лишається законними 16,5 %, і застереження поруч каже, чому сума нульова.
    godisnjaOsnovica: prvoZaposlenje ? zero('EUR') : godisnjaOsnovica,
    osobnaStednja: false,
    // Внесок «na osnovicu» (`čl. 81. t. 2.` ZoD): роботодавець платить його
    // понад плаћу. Чиї це гроші — залежить від того, хто роботодавець. У
    // чужій фірмі вони не були працівниковими ніколи; у власній вони
    // виходять із тієї самої `dobit`, яку власник забрав би дивідендами.
    teretiOsobu: vlastitiPoslodavac,
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
    ukupnoGodisnjeNaTeretOsobe: naTeretOsobe([moPrviStup, moDrugiStup, zo]),
    ustedaUzRadniOdnos: undefined,
  }
}

/**
 * `umanjenje osnovice` для MO I. stup — знижка бази, яку `čl. 21.a` дає
 * невисоким зарплатам.
 *
 * Поріг міряється по **фактичній** плаћі, а не по базі після законної
 * підлоги: це два різні числа, і працівник на пів ставки може мати підняту
 * базу й водночас знижку від неї.
 *
 * Нуль повертається, коли плаћа переступила верхню межу, — і це справді
 * нуль, а не відсутність: знижка порахована й вийшла нульовою.
 */
const umanjenjeZa = (
  mjesecnaBrutoPlaca: Money<'EUR'>,
  pravila: PlacaPravila['umanjenjeOsnovicePrvogStupa'],
): Money<'EUR'> => {
  const gornja = eur(pravila.gornjaGranicaPlace.value)
  if (
    !isGreaterThan(gornja, mjesecnaBrutoPlaca) &&
    !gornja.amount.equals(mjesecnaBrutoPlaca.amount)
  )
    return zero('EUR')

  // Нижче за нижню межу знижка стала: закон не дає їй рости далі.
  return isGreaterThan(eur(pravila.granicaPunogIznosa.value), mjesecnaBrutoPlaca)
    ? eur(pravila.puniIznos.value)
    : scale(subtract(gornja, mjesecnaBrutoPlaca), pravila.koeficijent.value)
}

/** Місячний `osobni odbitak`: основний розмір на суму коефіцієнтів. */
const mjesecniOsobniOdbitak = (
  { clanoviUzeObitelji, djeca, sInvaliditetom, sPotpunimInvaliditetom }: UzdrzavaniClanovi,
  pravila: PlacaPravila['osobniOdbitak'],
): Money<'EUR'> => {
  const zaPlatnikaIUzdrzavane = new Decimal(1).plus(
    pravila.koeficijentUzdrzavanogClana.value.times(clanoviUzeObitelji),
  )
  const zaDjecu = pravila.koeficijentiDjece.value
    .slice(0, djeca)
    .reduce((zbroj, koeficijent) => zbroj.plus(koeficijent), zaPlatnikaIUzdrzavane)

  // Обидва рядки множаться на кількість **людей**, а не додаються по разу:
  // акт дає коефіцієнт «на платника, на кожного утриманця й на кожну
  // утримувану дитину». Що одна людина не може стояти в обох рядках, стереже
  // не ця функція, а поле форми: два незалежні лічильники осіб.
  const ukupniKoeficijent = zaDjecu
    .plus(pravila.koeficijentInvalidnosti.value.times(sInvaliditetom))
    .plus(pravila.koeficijentPotpuneInvalidnosti.value.times(sPotpunimInvaliditetom))

  return scale(eur(pravila.osnovni.value), ukupniKoeficijent)
}

/**
 * Річний податок із плаће, розведений за ставками.
 *
 * Розведений навмисно, а не заради краси: `olakšica za mlade` повертає лише
 * ту частину, яку нараховано нижчою ставкою (`čl. 46. st. 2.`). Схлопнути
 * обидві в одну суму означало б утратити саме те число, з якого пільга
 * рахується.
 */
interface PorezPoStopama {
  readonly poreznaOsnovica: Money<'EUR'>
  readonly poNizojStopi: Money<'EUR'>
  readonly poVisojStopi: Money<'EUR'>
}

/**
 * `predujam poreza` рахується помісячно (`čl. 24.`): з плаће віднімаються
 * утримані з неї внески й місячний `osobni odbitak`, а далі нижча ставка діє
 * до місячного порога і вища — понад нього.
 *
 * Помісячно, а не з річної бази: пороги в законі місячні, і той, хто за рік
 * заробив стільки ж, але нерівномірно, заплатить інакше.
 */
const porezPoStopama = ({
  mjesecnaBrutoPlaca,
  mjesecniDoprinosiIzPlace,
  mjesecniOdbitak,
  stope,
  pravila,
}: {
  readonly mjesecnaBrutoPlaca: Money<'EUR'>
  readonly mjesecniDoprinosiIzPlace: Money<'EUR'>
  readonly mjesecniOdbitak: Money<'EUR'>
  readonly stope: ParStopa
  readonly pravila: PlacaPravila
}): PorezPoStopama => {
  const mjesecnaPoreznaOsnovica = bezMinusa(
    subtract(subtract(mjesecnaBrutoPlaca, mjesecniDoprinosiIzPlace), mjesecniOdbitak),
  )
  const prag = eur(pravila.mjesecniPragViseStope.value)
  const iznadPraga = bezMinusa(subtract(mjesecnaPoreznaOsnovica, prag))
  const doPraga = subtract(mjesecnaPoreznaOsnovica, iznadPraga)

  return {
    poreznaOsnovica: godisnje(mjesecnaPoreznaOsnovica),
    poNizojStopi: godisnje(scale(doPraga, udio(stope.niza))),
    poVisojStopi: godisnje(scale(iznadPraga, udio(stope.visa))),
  }
}

/**
 * Щабель `olakšica za mlade`, який дістається цьому вікові.
 *
 * Щаблі перевіряються згори вниз: перший, чию межу вік іще не переступив, і
 * застосовується. Понад останню межу пільги немає — і це не нуль, а
 * відсутність: нуль на картці не відрізнити від порахованої пільги в нуль
 * євро для того, хто податку взагалі не платить.
 */
const olaksicaZa = (
  dob: number | undefined,
  porez: PorezPoStopama,
  pravila: PlacaPravila,
): OlaksicaZaMlade | undefined => {
  if (dob === undefined) return undefined

  const { razredi } = pravila.olaksicaZaMlade
  const razred = razredi.value.find(({ doNavrsenihGodina }) => dob <= doNavrsenihGodina)
  if (razred === undefined) return undefined

  return {
    udio: razred.udio,
    iznos: scale(porez.poNizojStopi, razred.udio),
    izvor: razredi.source,
  }
}

/** Усі три зменшення річного податку разом із їхньою сумою. */
interface Umanjenja {
  readonly olaksicaZaMlade: OlaksicaZaMlade | undefined
  readonly zaPodrucje: UmanjenjeGodisnjegPoreza | undefined
  readonly zaPovratnika: UmanjenjeGodisnjegPoreza | undefined
  readonly ukupno: Money<'EUR'>
}

/**
 * Зменшення річного податку — усі, які дає `čl. 46.`, у порядку, який вимагає
 * сама стаття.
 *
 * Порядок тут не стилістичний. `st. 9.` робить зменшення для поверненця
 * заміною, а не додачею: коли воно є, двох інших немає взагалі. `st. 7.`
 * вимагає порахувати молодіжне **перед** територіальним, тож половина
 * береться вже від залишку, а не від початкового податку. Переставити ці два
 * кроки — значить видати іншу суму, яка все одно виглядатиме правдоподібно.
 */
const umanjenjaZa = ({
  dob,
  poStopama,
  godisnjiPorez,
  umanjenjeZaPodrucje,
  povratnik,
  pravila,
}: {
  readonly dob: number | undefined
  readonly poStopama: PorezPoStopama
  readonly godisnjiPorez: Money<'EUR'>
  readonly umanjenjeZaPodrucje: boolean
  readonly povratnik: boolean
  readonly pravila: PlacaPravila
}): Umanjenja => {
  const { zaPodrucje, zaPovratnika } = pravila.umanjenjaGodisnjegPoreza

  if (povratnik) {
    const iznos = scale(godisnjiPorez, zaPovratnika.value)
    return {
      olaksicaZaMlade: undefined,
      zaPodrucje: undefined,
      zaPovratnika: { udio: zaPovratnika.value, iznos, izvor: zaPovratnika.source },
      ukupno: iznos,
    }
  }

  const olaksicaZaMlade = olaksicaZa(dob, poStopama, pravila)
  const nakonMladih = subtract(godisnjiPorez, olaksicaZaMlade?.iznos ?? zero('EUR'))
  const podrucje = umanjenjeZaPodrucje
    ? {
        udio: zaPodrucje.value,
        iznos: scale(nakonMladih, zaPodrucje.value),
        izvor: zaPodrucje.source,
      }
    : undefined

  return {
    olaksicaZaMlade,
    zaPodrucje: podrucje,
    zaPovratnika: undefined,
    ukupno: sum('EUR', [olaksicaZaMlade?.iznos ?? zero('EUR'), podrucje?.iznos ?? zero('EUR')]),
  }
}

/**
 * Застереження, які закон додає до цього розрахунку.
 *
 * Складаються тут, а не в картці: чи спрацювала підлога бази й чи бруто
 * нижче за мінімальну — це наслідки застосування норми, і вирішує їх закон.
 */
const napomeneZa = ({
  mjesecnaBrutoPlaca,
  mjesecnaOsnovicaDoprinosa,
  umanjenja,
  najnizaOsnovica,
  umanjenjePrvogStupa,
  neoporeziviPrimici,
  ustedaNaZo,
  pravila,
}: {
  readonly mjesecnaBrutoPlaca: Money<'EUR'>
  readonly mjesecnaOsnovicaDoprinosa: Money<'EUR'>
  readonly umanjenja: Umanjenja
  readonly najnizaOsnovica: NajnizaOsnovica
  readonly umanjenjePrvogStupa: Money<'EUR'>
  readonly neoporeziviPrimici: Money<'EUR'>
  /** Скільки ZO не нараховано за `prvo zaposlenje`; `undefined` — норма не діє. */
  readonly ustedaNaZo: Money<'EUR'> | undefined
  readonly pravila: PlacaPravila
}): readonly NapomenaRezima[] => {
  // Про прочитання слайдера цей модуль не знає нічого: він отримав місячну
  // плаћу й нічого не припускав. Застереження про вісь додає той режим, який
  // справді прирівняв одне до одного.
  //
  // Порожнє поле неоподаткованих і введений нуль — це те саме: жодних таких
  // виплат у розрахунку немає. Але мовчати про них не можна, бо їх стелі
  // закон таки дає, тож застереження стоїть завжди — тільки різними словами.
  const napomene: NapomenaRezima[] = neoporeziviPrimici.amount.isZero()
    ? [{ kod: 'neoporezivi-primici-nisu-uracunati', stavke: pravila.neoporeziviPrimici.stavke }]
    : [
        {
          kod: 'neoporezivi-primici-uracunati',
          iznos: neoporeziviPrimici,
          stavke: pravila.neoporeziviPrimici.stavke,
        },
      ]

  if (ustedaNaZo !== undefined) {
    napomene.push({
      kod: 'oslobodenje-za-prvo-zaposlenje',
      usteda: ustedaNaZo,
      izvor: pravila.prvoZaposlenje.izvorOslobodenja,
      izvorDefinicije: pravila.prvoZaposlenje.izvorDefinicije,
    })
  }

  const minimalna = eur(pravila.minimalnaPlaca.value)
  if (isGreaterThan(minimalna, mjesecnaBrutoPlaca)) {
    napomene.push({
      kod: 'ispod-minimalne-place',
      minimalna,
      izvor: pravila.minimalnaPlaca.source,
    })
  }

  if (isGreaterThan(mjesecnaOsnovicaDoprinosa, mjesecnaBrutoPlaca)) {
    napomene.push({
      kod: 'placa-podignuta-na-najnizu-osnovicu',
      trazena: mjesecnaBrutoPlaca,
      primijenjena: mjesecnaOsnovicaDoprinosa,
      izvor: najnizaOsnovica.izvor,
    })
  }

  if (!umanjenjePrvogStupa.amount.isZero()) {
    napomene.push({
      kod: 'umanjena-osnovica-prvog-stupa',
      umanjenje: umanjenjePrvogStupa,
      izvor: pravila.umanjenjeOsnovicePrvogStupa.gornjaGranicaPlace.source,
    })
  }

  if (umanjenja.olaksicaZaMlade !== undefined) {
    napomene.push({
      kod: 'olaksica-za-mlade-kao-povrat',
      iznos: umanjenja.olaksicaZaMlade.iznos,
      izvor: umanjenja.olaksicaZaMlade.izvor,
    })
  }

  if (umanjenja.zaPodrucje !== undefined) {
    napomene.push({
      kod: 'umanjenje-za-podrucje',
      iznos: umanjenja.zaPodrucje.iznos,
      izvor: umanjenja.zaPodrucje.izvor,
    })
  }

  if (umanjenja.zaPovratnika !== undefined) {
    napomene.push({
      kod: 'umanjenje-za-povratnika',
      iznos: umanjenja.zaPovratnika.iznos,
      godina: pravila.umanjenjaGodisnjegPoreza.trajanjePovratnikaGodina,
      izvor: umanjenja.zaPovratnika.izvor,
      izvorIskljucenja: pravila.umanjenjaGodisnjegPoreza.izvorIskljucenja,
    })
  }

  return napomene
}

/**
 * Розрахунок плаће за рік.
 *
 * Жодного числа з закону модуль не знає: правила приходять аргументом, а
 * підлога бази — окремо від них, бо її обирає той, хто знає, ким саме є ця
 * людина у своїй фірмі (ADR-0001).
 */
export const izracunajPlacu = (
  ulaz: UlazPlace,
  podloga: Podloga,
  pravila: PlacaPravila,
): IzracunPlace => {
  // Підлога стосується бази внесків, а не самої плаће: працівник на пів
  // ставки отримує менше, ніж підлога, але внески закон однаково нарахує з
  // неї. Податок при цьому лишається на справжній плаћі.
  const mjesecnaOsnovicaDoprinosa = isGreaterThan(
    ulaz.najnizaOsnovica.mjesecniIznos,
    ulaz.mjesecnaBrutoPlaca,
  )
    ? ulaz.najnizaOsnovica.mjesecniIznos
    : ulaz.mjesecnaBrutoPlaca

  const umanjenjePrvogStupa = umanjenjeZa(
    ulaz.mjesecnaBrutoPlaca,
    pravila.umanjenjeOsnovicePrvogStupa,
  )
  const doprinosi = doprinosiZa(
    mjesecnaOsnovicaDoprinosa,
    umanjenjePrvogStupa,
    podloga,
    ulaz.vlastitiPoslodavac,
    ulaz.prvoZaposlenje,
  )

  // Скільки саме ZO не нараховано — рахується як різниця з тим самим внеском
  // без пільги, а не множенням ставки на базу вдруге: інакше два місця знали
  // б формулу внеску, і розійшлися б вони тихо.
  const ustedaNaZo = ulaz.prvoZaposlenje
    ? doprinosiZa(
        mjesecnaOsnovicaDoprinosa,
        umanjenjePrvogStupa,
        podloga,
        ulaz.vlastitiPoslodavac,
        false,
      ).zo.godisnjiIznos
    : undefined

  // Утримується з плаће лише MO обох стовпів — незалежно від того, чия це
  // фірма. `ukupnoGodisnjeNaTeretOsobe` для власної фірми включає ще й ZO,
  // тож брати його тут означало б відняти ZO з плаће, якої він не торкався.
  const godisnjiDoprinosiIzPlace = add(
    doprinosi.moPrviStup.godisnjiIznos,
    doprinosi.moDrugiStup.godisnjiIznos,
  )

  const poStopama = porezPoStopama({
    mjesecnaBrutoPlaca: ulaz.mjesecnaBrutoPlaca,
    mjesecniDoprinosiIzPlace: eur(godisnjiDoprinosiIzPlace.amount.div(MJESECI_U_GODINI)),
    mjesecniOdbitak: mjesecniOsobniOdbitak(ulaz.uzdrzavani, pravila.osobniOdbitak),
    stope: ulaz.stope,
    pravila,
  })

  const godisnjiPorez = add(poStopama.poNizojStopi, poStopama.poVisojStopi)
  const umanjenja = umanjenjaZa({
    dob: ulaz.dob,
    poStopama,
    godisnjiPorez,
    umanjenjeZaPodrucje: ulaz.umanjenjeZaPodrucje,
    povratnik: ulaz.povratnik,
    pravila,
  })

  const porez: Porez = {
    naziv: {
      hr: 'porez na dohodak iz plaće',
      uk: 'податок на дохідок із зарплати',
    },
    poreznaOsnovica: poStopama.poreznaOsnovica,
    // Ставок дві, а поле одне — тож тут ефективна частка на базу. Рівність
    // «база × ставка = сума» лишається правдивою.
    stopa: poStopama.poreznaOsnovica.amount.isZero()
      ? udio(ulaz.stope.niza)
      : godisnjiPorez.amount.div(poStopama.poreznaOsnovica.amount),
    godisnjiIznos: godisnjiPorez,
    izvor: pravila.mjesecniPragViseStope.source,
  }

  const godisnjaBrutoPlaca = godisnje(ulaz.mjesecnaBrutoPlaca)
  // Неоподатковані виплати входять сюди тією самою сумою, якою входять у «на
  // руки»: податку з них немає, але гроші роботодавець таки віддав. Порахувати
  // їх лише в «на руки» означало б показати найманого дешевшим за себе
  // справжнього — і саме на цьому числі його порівнюють із обртом.
  const trosakZaPoslodavca = sum('EUR', [
    godisnjaBrutoPlaca,
    subtract(doprinosi.ukupnoGodisnje, godisnjiDoprinosiIzPlace),
    ulaz.neoporeziviPrimici,
  ])

  return {
    mjesecnaBrutoPlaca: ulaz.mjesecnaBrutoPlaca,
    godisnjaBrutoPlaca,
    mjesecnaOsnovicaDoprinosa,
    doprinosi,
    porez,
    olaksicaZaMlade: umanjenja.olaksicaZaMlade,
    umanjenjeZaPodrucje: umanjenja.zaPodrucje,
    umanjenjeZaPovratnika: umanjenja.zaPovratnika,
    ukupniPovrat: umanjenja.ukupno,
    // Повернення пільги входить у річний результат, хоч і надійде наступного
    // року: рік рахується цілком, а не за платіжками. Що гроші прийдуть
    // пізніше, каже окреме застереження.
    //
    // `neoporezivi primici` додаються тут востаннє й лише тут: у бази вони не
    // входили, податку з них не було, внесків теж — тому вони не «зменшують
    // навантаження», а просто приходять.
    godisnjiNeto: sum('EUR', [
      subtract(subtract(godisnjaBrutoPlaca, godisnjiDoprinosiIzPlace), godisnjiPorez),
      umanjenja.ukupno,
      ulaz.neoporeziviPrimici,
    ]),
    trosakZaPoslodavca,
    napomene: napomeneZa({
      mjesecnaBrutoPlaca: ulaz.mjesecnaBrutoPlaca,
      mjesecnaOsnovicaDoprinosa,
      umanjenja,
      najnizaOsnovica: ulaz.najnizaOsnovica,
      umanjenjePrvogStupa,
      neoporeziviPrimici: ulaz.neoporeziviPrimici,
      ustedaNaZo,
      pravila,
    }),
  }
}
