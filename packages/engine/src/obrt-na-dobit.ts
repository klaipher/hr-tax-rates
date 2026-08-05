// Правила ще не проходять через `index.ts` пакета: барель належить злиттю
// гілок. Після нього імпорт стане пакетним, шлях — зникне.
import type {
  LegalReference,
  ObrtNaDobitPravila,
  ParStopa,
  PorezNaDobitPravila,
  Sourced,
} from '@hr-tax/data'
import Decimal from 'decimal.js'
import { doprinosiOdMjesecneOsnovice, godisnje, MJESECI_U_GODINI } from './doprinosi.ts'
import { add, eur, isGreaterThan, type Money, scale, subtract, sum, zero } from './money.ts'
import type { Doprinosi, Podloga, Porez } from './types.ts'

/**
 * `obrt na dobit` (обрт у системі porez na dobit).
 *
 * Механіка ближча до d.o.o., ніж до інших обртів, і саме тому дорога до
 * грошей власника тут триступенева:
 *
 * 1. `poduzetnička plaća` — власник призначає собі зарплату. З неї
 *    утримуються внески (`čl. 81. t. 1.` ZoD), понад неї обрт платить ZO
 *    (`t. 2.`), а сама плаћа оподатковується як плаћа за законом про
 *    `porez na dohodak` і водночас іде у витрати (`čl. 21. st. 1. t. 2.`).
 * 2. `porez na dobit` — з того, що лишилося після витрат разом із плаћою.
 * 3. `porez na dohodak od kapitala` — коли власник забирає `dobit` собі.
 *
 * Три податки, два закони, і в розбивці вони не зливаються: перший
 * рахується з плаће, другий із `dobit` за методом нарахування, третій — із
 * залишку після другого.
 */

/** Ставка міста зберігається в базисних пунктах — сотих частках відсотка. */
const BAZNIH_BODOVA_U_JEDINICI = 10000

/**
 * Місячна частка річної суми. Річні суми тут — завжди дванадцять однакових
 * місячних, тож ділення нічого не втрачає.
 */
const mjesecno = (godisnji: Money<'EUR'>): Money<'EUR'> =>
  eur(godisnji.amount.div(MJESECI_U_GODINI))

const udio = (bazniBodovi: number): Decimal =>
  new Decimal(bazniBodovi).div(BAZNIH_BODOVA_U_JEDINICI)

/** Нуль замість від'ємної суми: збиток не є ані базою, ані виплатою. */
const bezMinusa = (iznos: Money<'EUR'>): Money<'EUR'> =>
  iznos.amount.isNegative() ? zero('EUR') : iznos

export interface UlazObrtNaDobit {
  /**
   * Річний `prihod` (виручка за методом нарахування / revenue).
   *
   * Саме `prihod`, а не `primitak`: `dobit` визнається в момент
   * виставлення рахунку, а не отримання грошей, і поріг ставки
   * `porez na dobit` міряється теж по ньому. Форма, яка знає лише касовий
   * `primitak`, прирівнює одне до одного — і це припущення форми, а не
   * закону.
   */
  readonly godisnjiPrihod: Money<'EUR'>
  /** Річний `rashod` (витрати за методом нарахування / expenses). */
  readonly godisnjiRashod: Money<'EUR'>
  /**
   * Нижча й вища ставки `porez na dohodak` тієї `jedinica lokalne
   * samouprave`, де живе власник: ними оподатковується `poduzetnička
   * plaća`. На сам `porez na dobit` місто не впливає ніяк.
   */
  readonly stopePorezaNaDohodak: ParStopa
  /**
   * Місячна `poduzetnička plaća`, яку власник призначив собі сам.
   *
   * Не задано — береться найнижча дозволена. Нижче за неї розрахунок не
   * опускається й тоді, коли задано менше: закон однаково нарахує внески
   * від найнижчої `osnovica` (`čl. 82. st. 2.` ZoD).
   */
  readonly mjesecnaPoduzetnickaPlaca?: Money<'EUR'> | undefined
}

/** `poduzetnička plaća` (підприємницька зарплата / owner's salary) за рік. */
export interface PoduzetnickaPlaca {
  /** Місячна брутто-сума — вона ж `osnovica` внесків (`čl. 82. st. 1.`). */
  readonly mjesecniIznos: Money<'EUR'>
  readonly godisnjiIznos: Money<'EUR'>
  /**
   * Внески «з osnovica» (`čl. 81. t. 1.`) — MO обох стовпів. Утримуються
   * з самої плаће, тобто зменшують те, що власник отримає на руки.
   */
  readonly doprinosiIzPlace: Money<'EUR'>
  /**
   * Внески «на osnovicu» (`čl. 81. t. 2.`) — ZO. Обрт платить їх понад
   * плаћу, тож на руки вони не впливають, зате збільшують витрати.
   */
  readonly doprinosiNaPlacu: Money<'EUR'>
  /** `porez na dohodak` із плаће — перший із трьох податків режиму. */
  readonly porez: Porez
  /** Скільки з плаће справді дійде до власника за рік. */
  readonly godisnjiNeto: Money<'EUR'>
  /**
   * Скільки плаћа коштує обрту: брутто разом із внесками на неї. Рівно на
   * цю суму зменшується база `porez na dobit`.
   */
  readonly trosakZaObrt: Money<'EUR'>
  /** Стаття, що робить плаћу `osnovica` внесків. */
  readonly izvor: LegalReference
}

/**
 * Розрахунок режиму.
 *
 * Формою збігається зі спільним `Izracun` усюди, крім податкової частини:
 * там, де інші режими мають один `porez`, тут їх три, і зводити їх в одну
 * суму не можна — вони настають на різних щаблях і з різних баз.
 */
export interface IzracunObrtNaDobit {
  readonly poduzetnickaPlaca: PoduzetnickaPlaca
  /** `dobit` до оподаткування: `prihod − rashod −` вартість плаће. */
  readonly dobitPrijeOporezivanja: Money<'EUR'>
  /**
   * Три податки в порядку, у якому вони настають: із плаће, з `dobit`, з
   * виплати власнику. Перший — той самий об'єкт, що `poduzetnickaPlaca.porez`.
   */
  readonly porezi: readonly Porez[]
  /** `doprinosi` (внески / social contributions), розбиті на складові. */
  readonly doprinosi: Doprinosi
  /**
   * Скільки лишається людині за рік. Рахується так, ніби всю `dobit`
   * виплачено власнику: інакше третій податок не настав би, а сума на
   * картці означала б гроші, які лежать у бізнесі, а не в людини.
   */
  readonly netoZaOsobu: Money<'EUR'>
  /** Частка `prihod`, яку забирають усі обов'язкові платежі разом. */
  readonly efektivnaStopa: Decimal | undefined
}

/**
 * Внески з `poduzetnička plaća`.
 *
 * Ставки ті самі, що й у решти режимів, — різниця в `osnovica`: тут вона
 * дорівнює самій плаћі (`čl. 82. st. 1.`), а не добутку `prosječna plaća`
 * і коефіцієнта розряду.
 */
const doprinosiZa = (mjesecnaOsnovica: Money<'EUR'>, { ruleset }: Podloga): Doprinosi =>
  doprinosiOdMjesecneOsnovice(mjesecnaOsnovica, ruleset)

/**
 * `porez na dohodak` із `poduzetnička plaća`.
 *
 * Рахується помісячно, як `predujam` (`čl. 24.`): з плаће віднімаються
 * внески, утримані з неї, і місячний `osobni odbitak`, а далі нижча
 * ставка діє до 5 000 € бази на місяць і вища — понад них.
 *
 * `Porez.stopa` показує фактичну частку, а не ставку із закону: закон дав
 * дві ставки, а поле одне. Поки база не переступила місячний поріг, обидві
 * величини збігаються.
 */
const porezNaPlacu = ({
  mjesecnaPlaca,
  mjesecniDoprinosiIzPlace,
  stope,
  pravila,
}: {
  readonly mjesecnaPlaca: Money<'EUR'>
  readonly mjesecniDoprinosiIzPlace: Money<'EUR'>
  readonly stope: ParStopa
  readonly pravila: ObrtNaDobitPravila
}): Porez => {
  const { osnovniOsobniOdbitak, mjesecniPragViseStope } = pravila.poduzetnickaPlaca
  const nizaStopa = udio(stope.niza)

  // `poreznaOsnovica`, а не `osnovica`: `osnovica` в цьому глосарії значить
  // базу внесків і будується з `prosječna plaća`, а тут база оподаткування
  // — інший закон і інша величина (CONTEXT.md).
  const mjesecnaPoreznaOsnovica = bezMinusa(
    subtract(subtract(mjesecnaPlaca, mjesecniDoprinosiIzPlace), eur(osnovniOsobniOdbitak.value)),
  )
  const prag = eur(mjesecniPragViseStope.value)
  const iznadPraga = bezMinusa(subtract(mjesecnaPoreznaOsnovica, prag))
  const doPraga = subtract(mjesecnaPoreznaOsnovica, iznadPraga)

  const poreznaOsnovica = godisnje(mjesecnaPoreznaOsnovica)
  const godisnjiIznos = godisnje(
    add(scale(doPraga, nizaStopa), scale(iznadPraga, udio(stope.visa))),
  )

  return {
    naziv: {
      hr: 'porez na dohodak iz poduzetničke plaće',
      uk: 'податок на дохідок із підприємницької зарплати',
    },
    poreznaOsnovica,
    stopa: poreznaOsnovica.amount.isZero()
      ? nizaStopa
      : godisnjiIznos.amount.div(poreznaOsnovica.amount),
    godisnjiIznos,
    izvor: mjesecniPragViseStope.source,
  }
}

/**
 * `porez na dobit`.
 *
 * Ставку визначає річний `prihod`, а не `dobit`: закон каже «jednaki ili
 * veći», тож рівно на порозі діє вже вища ставка. Збиток базою не стає —
 * від'ємного податку не буває.
 */
/**
 *  Спільне з d.o.o.: обидва режими платять той самий податок за
 * тією самою статтею, і дві копії цієї функції розійшлися б тихо.
 */
export const porezNaDobit = (
  dobit: Money<'EUR'>,
  godisnjiPrihod: Money<'EUR'>,
  pravila: PorezNaDobitPravila,
): Porez => {
  const stopa = isGreaterThan(eur(pravila.pragPrihoda.value), godisnjiPrihod)
    ? pravila.nizaStopa
    : pravila.visaStopa
  const poreznaOsnovica = bezMinusa(dobit)

  return {
    naziv: { hr: 'porez na dobit', uk: 'податок на прибуток' },
    poreznaOsnovica,
    stopa: stopa.value,
    godisnjiIznos: scale(poreznaOsnovica, stopa.value),
    izvor: stopa.source,
  }
}

/**
 * `porez na dohodak od kapitala` при виплаті `dobit` власнику.
 *
 * База — `dobit`, що лишилася після `porez na dobit`. Це третій податок
 * на ті самі гроші й головна різниця з обртом на дохідок, де другого
 * податку при виплаті немає взагалі.
 */
/**
 *  Спільне з d.o.o. з тієї самої причини, що й `porezNaDobit`.
 */
export const porezNaIsplatuDobiti = (
  dobitNakonPoreza: Money<'EUR'>,
  stopa: Sourced<Decimal>,
): Porez => {
  const poreznaOsnovica = bezMinusa(dobitNakonPoreza)

  return {
    naziv: {
      hr: 'porez na dohodak od kapitala pri isplati dobiti',
      uk: 'податок на дохідок від капіталу при виплаті прибутку',
    },
    poreznaOsnovica,
    stopa: stopa.value,
    godisnjiIznos: scale(poreznaOsnovica, stopa.value),
    izvor: stopa.source,
  }
}

/**
 * `poduzetnička plaća` разом із внесками з неї та податком із неї.
 *
 * Плаћа не може бути нижчою за `prosječna plaća × koeficijent`: закон
 * рахує внески від тієї суми незалежно від того, скільки власник собі
 * виплатив, тож нижче за неї розрахунок і не спускається.
 *
 * Внески повертаються поруч, а не всередині: `Doprinosi` розбиває їх за
 * видами страхування (MO, ZO), а плаћа — за тим, чия це кишеня («з
 * osnovica» чи «на osnovicu»). Два різні розрізи тих самих грошей, і
 * підсумок в обох однаковий.
 */
const poduzetnickaPlacaZa = (
  ulaz: UlazObrtNaDobit,
  podloga: Podloga,
  pravila: ObrtNaDobitPravila,
): { readonly placa: PoduzetnickaPlaca; readonly doprinosi: Doprinosi } => {
  const najnizaOsnovica = eur(
    podloga.pretpostavke.prosjecnaPlaca.value.times(pravila.poduzetnickaPlaca.koeficijent.value),
  )
  const mjesecniIznos =
    ulaz.mjesecnaPoduzetnickaPlaca !== undefined &&
    isGreaterThan(ulaz.mjesecnaPoduzetnickaPlaca, najnizaOsnovica)
      ? ulaz.mjesecnaPoduzetnickaPlaca
      : najnizaOsnovica

  const doprinosi = doprinosiZa(mjesecniIznos, podloga)
  const doprinosiIzPlace = add(
    doprinosi.moPrviStup.godisnjiIznos,
    doprinosi.moDrugiStup.godisnjiIznos,
  )
  const doprinosiNaPlacu = doprinosi.zo.godisnjiIznos

  const porez = porezNaPlacu({
    mjesecnaPlaca: mjesecniIznos,
    mjesecniDoprinosiIzPlace: mjesecno(doprinosiIzPlace),
    stope: ulaz.stopePorezaNaDohodak,
    pravila,
  })

  const godisnjiIznos = godisnje(mjesecniIznos)

  return {
    placa: {
      mjesecniIznos,
      godisnjiIznos,
      doprinosiIzPlace,
      doprinosiNaPlacu,
      porez,
      godisnjiNeto: subtract(subtract(godisnjiIznos, doprinosiIzPlace), porez.godisnjiIznos),
      trosakZaObrt: add(godisnjiIznos, doprinosiNaPlacu),
      izvor: pravila.poduzetnickaPlaca.izvorOsnovice,
    },
    doprinosi,
  }
}

/**
 * Розрахунок `obrt na dobit`.
 *
 * `pravila` приходять окремим аргументом, а не всередині `podloga`: набір
 * правил належить іншому файлу, і поки він не знає про цей режим, рушій
 * дістає його правила ззовні. Жодного числа із закону тут немає (ADR-0001).
 */
export const izracunajObrtNaDobit = (
  ulaz: UlazObrtNaDobit,
  podloga: Podloga,
  pravila: ObrtNaDobitPravila,
): IzracunObrtNaDobit => {
  const { placa: poduzetnickaPlaca, doprinosi } = poduzetnickaPlacaZa(ulaz, podloga, pravila)

  const dobitPrijeOporezivanja = subtract(
    subtract(ulaz.godisnjiPrihod, ulaz.godisnjiRashod),
    poduzetnickaPlaca.trosakZaObrt,
  )
  const naDobit = porezNaDobit(dobitPrijeOporezivanja, ulaz.godisnjiPrihod, pravila.porezNaDobit)
  const naIsplatu = porezNaIsplatuDobiti(
    subtract(naDobit.poreznaOsnovica, naDobit.godisnjiIznos),
    pravila.stopaPorezaNaIsplatuDobiti,
  )

  const porezi = [poduzetnickaPlaca.porez, naDobit, naIsplatu]
  const obvezniPlacanja = sum('EUR', [
    doprinosi.ukupnoGodisnje,
    ...porezi.map(({ godisnjiIznos: iznos }) => iznos),
  ])

  return {
    poduzetnickaPlaca,
    dobitPrijeOporezivanja,
    porezi,
    doprinosi,
    netoZaOsobu: subtract(subtract(ulaz.godisnjiPrihod, ulaz.godisnjiRashod), obvezniPlacanja),
    efektivnaStopa: ulaz.godisnjiPrihod.amount.isZero()
      ? undefined
      : obvezniPlacanja.amount.div(ulaz.godisnjiPrihod.amount),
  }
}
