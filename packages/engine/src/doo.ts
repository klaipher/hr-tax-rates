/**
 * `d.o.o.` (товариство з обмеженою відповідальністю / limited company) —
 * два режими, а не один.
 *
 * Власник дістає гроші двома взаємовиключними шляхами, і закон рахує їх
 * по-різному:
 *
 * 1. `doo-plaća` — власник у трудовому договорі з власною фірмою. Plaća
 *    оподатковується як будь-яка інша, іде у витрати й зменшує `dobit`; те,
 *    що лишилося, виходить дивідендами.
 * 2. `doo-član-uprave` — трудового договору немає. Plaća теж немає, тож немає
 *    і податку з неї; внески нараховуються на приписану законом `osnovica`, а
 *    всі гроші виходять дивідендами.
 *
 * Спокуса здається очевидною: поставити собі мінімальну зарплату й вивести
 * решту під 12% замість прогресивного податку. Закон її перекрив двічі —
 * `Naredba` не дає опустити базу внесків нижче за приписану ні в першому
 * шляху, ні в другому. Саме тому обидва режими стоять поруч: різниця між ними
 * не там, де її шукають.
 *
 * Жодного числа з закону модуль не знає (ADR-0001).
 */
import type {
  ClanUpravePravila,
  ParStopa,
  PlacaPravila,
  PorezNaDobitPravila,
  Sourced,
} from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { doprinosiOdMjesecneOsnovice } from './doprinosi.ts'
import { eur, type Money, scale, subtract, sum, zero } from './money.ts'
import { porezNaDobit, porezNaIsplatuDobiti } from './obrt-na-dobit.ts'
import type { UzdrzavaniClanovi } from './obrt-na-dohodak.ts'
import { izracunajPlacu } from './placa.ts'
import type { Doprinosi, NapomenaRezima, Podloga, Porez } from './types.ts'

/** Усе, що потрібно, щоб порахувати обидва режими d.o.o. */
export interface PravilaDoo {
  readonly porezNaDobit: PorezNaDobitPravila
  /** Ставка `porez na dohodak od kapitala` на виплату `dobit` власнику. */
  readonly stopaPorezaNaIsplatuDobiti: Sourced<Decimal>
  readonly placa: PlacaPravila
  readonly clanUprave: ClanUpravePravila
}

export interface UlazDoo {
  /**
   * Річний `prihod` (виручка за методом нарахування / revenue). Форма знає
   * касовий `primitak` і прирівнює одне до одного — припущення форми, а не
   * закону, назване на картці.
   */
  readonly godisnjiPrihod: Money<'EUR'>
  /** Річний `rashod` (витрати за методом нарахування / expenses). */
  readonly godisnjiRashod: Money<'EUR'>
  /** Ставки `porez na dohodak` одиниці, де живе власник. */
  readonly stopePorezaNaDohodak: ParStopa
  readonly uzdrzavani: UzdrzavaniClanovi
  readonly dob: number | undefined
  /**
   * Місячна plaća, яку власник призначив собі сам. Стосується лише
   * `doo-plaća`; не задано — береться законна підлога.
   */
  readonly mjesecnaPlacaVlasnika: Money<'EUR'> | undefined
}

/**
 * Спільна частина обох режимів: те, що лишається після витрат, обкладається
 * `porez na dobit`, а залишок — податком на виплату власнику.
 *
 * Рахується так, ніби всю `dobit` виплачено: інакше третій податок не настав
 * би, і сума на картці означала б гроші, що лежать у фірмі, а не в людини.
 */
interface IzlazDoo {
  readonly porezi: readonly Porez[]
  readonly doprinosi: Doprinosi
  readonly povratPoreza: Money<'EUR'>
  readonly napomene: readonly NapomenaRezima[]
  readonly efektivnaStopa: Decimal | undefined
  readonly ukupanPorez: Money<'EUR'>
}

const dovrsi = ({
  godisnjiPrihod,
  dobitPrijeOporezivanja,
  doprinosi,
  porezIzPlace,
  povratPoreza,
  napomene,
  pravila,
}: {
  readonly godisnjiPrihod: Money<'EUR'>
  readonly dobitPrijeOporezivanja: Money<'EUR'>
  readonly doprinosi: Doprinosi
  /** `undefined` у режимі без plaća: там першого податку просто немає. */
  readonly porezIzPlace: Porez | undefined
  readonly povratPoreza: Money<'EUR'>
  readonly napomene: readonly NapomenaRezima[]
  readonly pravila: PravilaDoo
}): IzlazDoo => {
  const naDobit = porezNaDobit(dobitPrijeOporezivanja, godisnjiPrihod, pravila.porezNaDobit)
  const naIsplatu = porezNaIsplatuDobiti(
    subtract(naDobit.poreznaOsnovica, naDobit.godisnjiIznos),
    pravila.stopaPorezaNaIsplatuDobiti,
  )

  const porezi =
    porezIzPlace === undefined ? [naDobit, naIsplatu] : [porezIzPlace, naDobit, naIsplatu]
  const ukupanPorez = sum(
    'EUR',
    porezi.map(({ godisnjiIznos }) => godisnjiIznos),
  )
  const obvezniPlacanja = subtract(
    sum('EUR', [ukupanPorez, doprinosi.ukupnoGodisnjeNaTeretOsobe]),
    povratPoreza,
  )

  return {
    porezi,
    doprinosi,
    povratPoreza,
    napomene,
    ukupanPorez,
    efektivnaStopa: godisnjiPrihod.amount.isZero()
      ? undefined
      : obvezniPlacanja.amount.div(godisnjiPrihod.amount),
  }
}

/**
 * `doo-plaća`: власник працевлаштований у власній фірмі.
 *
 * Підлога plaća тут — не `minimalna plaća`, як здається, а окрема, вища:
 * той, хто водночас є членом правління й працює на повний час, не може мати
 * базу внесків нижчу за приписану (`čl. 19.` Naredbe). Саме цим d.o.o.
 * відрізняється від найму в чужій фірмі, де підлога значно нижча.
 */
export const izracunajDooSPlacom = (
  ulaz: UlazDoo,
  podloga: Podloga,
  pravila: PravilaDoo,
): IzlazDoo & { readonly ukupniTrosakPlace: Money<'EUR'> } => {
  const najnizaMjesecna = scale(
    eur(podloga.pretpostavke.prosjecnaPlaca.value),
    pravila.clanUprave.koeficijentNajnizeOsnovicePlace.value,
  )
  // Не задано — беремо саму підлогу. Задано менше — лишаємо як задано:
  // підлога стосується бази внесків, а не plaća. Власник справді може
  // виплатити собі менше, і закон однаково нарахує внески з приписаної
  // `osnovica`, а податок — із того, що він таки виплатив. Підвести plaća
  // тут означало б показати зарплату, якої ніхто не призначав.
  const mjesecnaBrutoPlaca = ulaz.mjesecnaPlacaVlasnika ?? najnizaMjesecna

  const placa = izracunajPlacu(
    {
      mjesecnaBrutoPlaca,
      stope: ulaz.stopePorezaNaDohodak,
      uzdrzavani: ulaz.uzdrzavani,
      dob: ulaz.dob,
      najnizaOsnovica: {
        mjesecniIznos: najnizaMjesecna,
        izvor: pravila.clanUprave.koeficijentNajnizeOsnovicePlace.source,
      },
      // Роботодавцем є та сама людина: ZO виходить із тієї самої `dobit`,
      // яку вона інакше забрала б дивідендами.
      vlastitiPoslodavac: true,
      // Чотири входи, які ревізія plaća завела для найманого, тут навмисно
      // стоять на нулі й `false`.
      //
      // Не тому, що закон їх власникові d.o.o. не дає: він працівник за
      // `čl. 21. st. 1. t. 1. podt. d)`, і зменшення за місцем проживання чи
      // за поверненням з-за кордону належать йому так само. Тому, що ревізія
      // перевіряла найманого в чужій фірмі, і провести ці норми крізь d.o.o.
      // без такої самої звірки означало б додати числа, яких ніхто не читав
      // у тексті акта саме для цього випадку.
      //
      // `prvo zaposlenje` — окремий випадок: воно вимагає, щоб людина ніколи
      // не мала договору на неозначений час, а власник, що наймає сам себе,
      // майже завжди його вже мав. Тут `false` — не заглушка, а типова правда.
      neoporeziviPrimici: zero('EUR'),
      prvoZaposlenje: false,
      umanjenjeZaPodrucje: false,
      povratnik: false,
    },
    podloga,
    pravila.placa,
  )

  // Plaća разом із внесками на неї — рівно те, на що зменшується база
  // `porez na dobit` (`čl. 21. st. 1. t. 2.` ZoPD).
  const ukupniTrosakPlace = placa.trosakZaPoslodavca

  return {
    ...dovrsi({
      godisnjiPrihod: ulaz.godisnjiPrihod,
      dobitPrijeOporezivanja: subtract(
        subtract(ulaz.godisnjiPrihod, ulaz.godisnjiRashod),
        ukupniTrosakPlace,
      ),
      doprinosi: placa.doprinosi,
      porezIzPlace: placa.porez,
      povratPoreza: placa.olaksicaZaMlade?.iznos ?? zero('EUR'),
      napomene: placa.napomene,
      pravila,
    }),
    ukupniTrosakPlace,
  }
}

/**
 * `doo-član-uprave`: трудового договору немає.
 *
 * Plaća немає, тож немає ані податку з неї, ані `osobni odbitak`, ані
 * `olakšica za mlade` — усе це стосується доходу від несамостійної праці, а
 * його тут не виникає. Лишаються внески з приписаної `osnovica`, які фірма
 * несе як витрату, і два податки на шляху грошей до власника.
 *
 * `osnovica` тут вища за підлогу трудового шляху: 1,0 проти 0,65 середньої
 * зарплати. Тобто відмова від трудового договору коштує **більших** внесків,
 * а виграє лише тим, що з тих грошей не береться прогресивний податок.
 */
export const izracunajDooClanUprave = (
  ulaz: UlazDoo,
  podloga: Podloga,
  pravila: PravilaDoo,
): IzlazDoo => {
  const mjesecnaOsnovica = scale(
    eur(podloga.pretpostavke.prosjecnaPlaca.value),
    pravila.clanUprave.koeficijentOsnovice.value,
  )
  // Усі три внески несе та сама людина: фірма її власна, і кожен сплачений
  // цент — це цент, який інакше вийшов би дивідендами.
  const doprinosi = doprinosiOdMjesecneOsnovice(mjesecnaOsnovica, podloga.ruleset)

  return dovrsi({
    godisnjiPrihod: ulaz.godisnjiPrihod,
    // Внески члена правління — витрата фірми, тож база `porez na dobit`
    // зменшується на них так само, як зменшилася б на plaća.
    dobitPrijeOporezivanja: subtract(
      subtract(ulaz.godisnjiPrihod, ulaz.godisnjiRashod),
      doprinosi.ukupnoGodisnje,
    ),
    doprinosi,
    porezIzPlace: undefined,
    povratPoreza: zero('EUR'),
    napomene: [],
    pravila,
  })
}
