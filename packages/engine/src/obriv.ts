import { add, eur, isGreaterThan, type Money, subtract } from './money.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import type { Izracun, Podloga } from './types.ts'

/**
 * Обриви розрядів: скільки лишилося до межі і чого коштує її перетнути.
 *
 * Усередині розряду сума фіксована, тому на межі платіж стрибає без стрибка
 * `primitak` — і найдорожчий євро в році стоїть рівно на цьому центі.
 */

/** Найменший крок, яким закон розводить розряди: межі задані до цента. */
const CENT = eur('0.01')

const MJESECI_U_GODINI = 12

/**
 * Підкладка розрахунку, взята під конкретний `primitak`.
 *
 * Чинний закон знає один `koeficijent` на всі розряди, тож для нього це стала
 * функція. Законопроєкт прив'язує `koeficijent` до розряду, і тоді набір
 * правил не можна зафіксувати, поки `primitak` невідомий. Обрив мусить уміти
 * питати правила по обидва боки межі, тому й бере функцію, а не готову
 * підкладку.
 */
export type PodlogaZa = (godisnjiPrimitak: Money<'EUR'>) => Podloga

/** Наскільки зросте річна повинність, якщо перетнути межу розряду. */
export interface Skok {
  /** Приріст річного `paušalni porez`. */
  readonly porez: Money<'EUR'>
  /**
   * Приріст річних `doprinosi`. Це вже сума за всі дванадцять місяців: річна
   * `osnovica` одна на весь рік, тож інакшої «частини року» тут не буває.
   */
  readonly doprinosi: Money<'EUR'>
  /** Податок і внески разом — те, чого коштує один євро понад межу. */
  readonly ukupno: Money<'EUR'>
  /**
   * Скільки місяців `doprinosi` перераховуються назад: дванадцять, коли
   * перетин межі змінює `koeficijent`, і нуль, коли не змінює.
   *
   * За чинним законом `koeficijent` однаковий у всіх розрядах, тому перетин
   * межі у внесках не коштує нічого. Законопроєкт робить його різним за
   * розрядами (čl. 5. проєкту, новий čl. 70. st. 1.), і тоді річна сума
   * внесків міняється цілком — грудневий євро переписує весь рік, а не
   * грудень. Самі дванадцять місяців за čl. 70. st. 2. проєкту припадають на
   * наступний рік: `koeficijent` беруть із торішнього обліку `primitak`.
   */
  readonly retroaktivnihMjeseci: number
}

/** Попереду наступний розряд: платіж стрибне, режим лишиться. */
export interface ObrivRazreda {
  readonly vrsta: 'razred'
  /** Розряд, у якому `primitak` зараз. */
  readonly redniBroj: number
  /** Розряд, у який його переведе перетин межі. */
  readonly sljedeciRedniBroj: number
  /** `gornja granica razreda` — сама межа. */
  readonly granica: Money<'EUR'>
  /** Скільки `primitak` лишилося до межі. Нуль, коли він рівно на ній. */
  readonly doGranice: Money<'EUR'>
  readonly skok: Skok
}

/**
 * Попереду не наступний розряд, а вихід із режиму.
 *
 * Останній розряд закінчується там, де закон забирає паушал узагалі, тож
 * стрибка, з яким можна порівняти відстань, за цією межею немає — там немає
 * чого рахувати цими правилами.
 */
export interface KrajRezima {
  readonly vrsta: 'kraj-rezima'
  readonly redniBroj: number
  readonly granica: Money<'EUR'>
  readonly doGranice: Money<'EUR'>
  /** Чому за межею режиму немає — словами рушія, а не переказом. */
  readonly razlog: string
}

export type Obriv = ObrivRazreda | KrajRezima

const obveza = ({ ukupanPorez, doprinosi }: Izracun): Money<'EUR'> =>
  add(ukupanPorez, doprinosi.ukupnoGodisnje)

/**
 * Обрив, до якого йде цей `primitak`.
 *
 * `undefined` означає, що обриву попереду немає: або режим за цим `primitak`
 * уже недоступний — за порогом паушалу попереджати нема про що, туди вже
 * прийшли, — або набір правил не знає розрядів, і тоді межі, з якої можна
 * впасти, просто не існує.
 */
export const obrivZa = (
  godisnjiPrimitak: Money<'EUR'>,
  podlogaZa: PodlogaZa,
): Obriv | undefined => {
  const ishod = izracunajPausalniObrt(godisnjiPrimitak, podlogaZa(godisnjiPrimitak))
  if (ishod.status !== 'izracunato') return undefined

  const razred = ishod.izracun.razred
  if (razred === undefined) return undefined

  const granica = razred.gornjaGranica
  const doGranice = subtract(granica, godisnjiPrimitak)

  const zaGranicom = add(granica, CENT)
  const ishodZaGranicom = izracunajPausalniObrt(zaGranicom, podlogaZa(zaGranicom))

  if (ishodZaGranicom.status !== 'izracunato') {
    return {
      vrsta: 'kraj-rezima',
      redniBroj: razred.redniBroj,
      granica,
      doGranice,
      razlog: ishodZaGranicom.razlog,
    }
  }

  const prije = ishod.izracun
  const poslije = ishodZaGranicom.izracun
  // Номер наступного розряду береться з рушія, а не як «поточний плюс один»:
  // вигадане число дивилося б на людину так само впевнено, як пораховане.
  const sljedeci = poslije.razred
  if (sljedeci === undefined) return undefined

  const doprinosi = subtract(poslije.doprinosi.ukupnoGodisnje, prije.doprinosi.ukupnoGodisnje)

  return {
    vrsta: 'razred',
    redniBroj: razred.redniBroj,
    sljedeciRedniBroj: sljedeci.redniBroj,
    granica,
    doGranice,
    skok: {
      porez: subtract(poslije.ukupanPorez, prije.ukupanPorez),
      doprinosi,
      ukupno: subtract(obveza(poslije), obveza(prije)),
      retroaktivnihMjeseci: doprinosi.amount.isZero() ? 0 : MJESECI_U_GODINI,
    },
  }
}

/**
 * Чи варто попереджати про обрив.
 *
 * Мірою близькості є сам стрибок: попереджати треба тоді, коли лишилося
 * заробити в розряді менше, ніж коштуватиме вийти за нього. Довільного порогу
 * на кшталт «за тисячу євро» тут немає — він однаково брехав би і в
 * найнижчому розряді, і в найвищому, бо стрибки в них різняться вдесятеро.
 *
 * Останній розряд — окремий випадок: за його межею режиму немає взагалі, і
 * порівнювати відстань немає з чим, тож попередження стоїть на всій довжині.
 */
export const blizuObriva = (obriv: Obriv): boolean =>
  obriv.vrsta === 'kraj-rezima' || !isGreaterThan(obriv.doGranice, obriv.skok.ukupno)
