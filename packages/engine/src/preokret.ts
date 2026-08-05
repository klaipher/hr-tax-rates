/**
 * Точки перевороту: `primitak`, на якому найвигідніший режим стає іншим.
 *
 * Картка відповідає на питання «скільки лишиться за цього `primitak`», а не
 * «доки мій вибір лишається правильним». Друге питання ставлять частіше, і
 * відповідь на нього — не сума, а межа: доти вигідніший один режим, далі
 * інший. Знайти її оком по трьох картках не можна.
 *
 * Модуль чистий і живе в рушії, а не в показі: те, який режим лишає більше
 * грошей, визначає закон, а не верстка. Ту саму функцію можна спитати з
 * тесту, і саме це відрізняє межу пораховану від межі намальованої.
 */
import Decimal from 'decimal.js'
import { eur, isGreaterThan, type Money, subtract } from './money.ts'
import type { RezimId } from './types.ts'
import type { PodlogaUsporedbe, UnosUsporedbe } from './usporedba.ts'
import { usporediRezime } from './usporedba.ts'

/** Найменший крок, яким закон розводить розряди: межі задані до цента. */
const CENT = eur('0.01')

/**
 * Підкладка порівняння, взята під конкретний `primitak`.
 *
 * Функція, а не готова підкладка, з тієї самої причини, що й в обривах:
 * законопроєкт в'яже `koeficijent` і `priznati izdatak` до розряду, тож
 * правила треба питати по обидва боки від кожної межі, яку перевіряємо.
 */
export type PodlogaUsporedbeZa = (godisnjiPrimitak: Money<'EUR'>) => PodlogaUsporedbe

/**
 * Режим, що лишає найбільше на руки, або `undefined`, коли не рахується
 * жоден.
 *
 * `undefined` — не нуль і не «нічия»: за порогом паушалу без витрат і без
 * ставок обраної одиниці не рахується взагалі нічого, і назвати там лідера
 * означало б вигадати його. Рівні суми розводяться порядком режимів у
 * порівнянні, тож результат детермінований.
 */
export const najpovoljnijiRezim = (
  unos: UnosUsporedbe,
  podloga: PodlogaUsporedbe,
): RezimId | undefined => {
  let najbolji: RezimId | undefined
  let najvise: Decimal | undefined

  for (const rezim of usporediRezime(unos, podloga).rezimi) {
    if (rezim.ishod.status !== 'izracunato') continue

    const neto = rezim.ishod.izracun.netoZaOsobu.amount
    if (najvise === undefined || neto.greaterThan(najvise)) {
      najbolji = rezim.id
      najvise = neto
    }
  }

  return najbolji
}

/** Точка, у якій місце найвигіднішого режиму переходить до іншого. */
export interface TockaPreokreta {
  /** Найменший `primitak`, на якому лідер уже інший. */
  readonly primitak: Money<'EUR'>
  /** Хто був найвигіднішим до цієї точки. */
  readonly dosadasnji: RezimId
  /** Хто став найвигіднішим від неї. */
  readonly sljedeci: RezimId
}

/**
 * Де і як густо шукати.
 *
 * `korak` задає роздільність: два перевороти всередині одного кроку
 * зіллються в один, тож крок має бути дрібнішим за найкоротший інтервал, на
 * якому режим встигає побувати лідером. Дрібніший крок коштує рівно стільки
 * ж викликів рушія, скільки точок на сітці.
 */
export interface OpsegPreokreta {
  readonly najvisiPrimitak: Money<'EUR'>
  readonly korak: Money<'EUR'>
}

/**
 * Найменший `primitak` у `(lijevo, desno]`, на якому лідер уже не той, що
 * зліва, — половинним діленням до цента.
 *
 * Ділення передбачає, що всередині кроку переворот один. Якщо їх було два,
 * знайдеться перший — і межа лишиться точною, бо `dosadasnji` і `sljedeci`
 * питаються вже на самих сусідніх центах, а не беруться з країв кроку.
 */
const granicaPreokreta = (
  lijevo: Money<'EUR'>,
  desno: Money<'EUR'>,
  lider: (godisnjiPrimitak: Money<'EUR'>) => RezimId | undefined,
): Money<'EUR'> => {
  const pocetni = lider(lijevo)
  let dolje = lijevo
  let gore = desno

  while (isGreaterThan(subtract(gore, dolje), CENT)) {
    const sredina = eur(
      dolje.amount.plus(gore.amount).dividedBy(2).toDecimalPlaces(2, Decimal.ROUND_DOWN),
    )
    if (lider(sredina) === pocetni) dolje = sredina
    else gore = sredina
  }

  return gore
}

/**
 * Усі точки перевороту в діапазоні, за зростанням `primitak`.
 *
 * Поява й зникнення самої можливості рахувати переворотом не є: коли з
 * одного боку межі не порахувався жоден режим, місця лідера там немає, і
 * поступатися нема кому. Такі межі мовчки пропускаються.
 */
export const tockePreokreta = (
  unos: UnosUsporedbe,
  podlogaZa: PodlogaUsporedbeZa,
  opseg: OpsegPreokreta,
): readonly TockaPreokreta[] => {
  // Пам'ять на час одного виклику: половинне ділення повертається в ті самі
  // точки, а рушій — найдорожча частина пошуку.
  const zapamceno = new Map<string, RezimId | undefined>()
  const lider = (godisnjiPrimitak: Money<'EUR'>): RezimId | undefined => {
    const kljuc = godisnjiPrimitak.amount.toFixed(2)
    if (zapamceno.has(kljuc)) return zapamceno.get(kljuc)

    const rezim = najpovoljnijiRezim({ ...unos, godisnjiPrimitak }, podlogaZa(godisnjiPrimitak))
    zapamceno.set(kljuc, rezim)
    return rezim
  }

  const tocke: TockaPreokreta[] = []
  let lijevo = eur(0)

  while (isGreaterThan(opseg.najvisiPrimitak, lijevo)) {
    const kandidat = eur(lijevo.amount.plus(opseg.korak.amount))
    const desno = isGreaterThan(kandidat, opseg.najvisiPrimitak) ? opseg.najvisiPrimitak : kandidat

    if (lider(lijevo) !== lider(desno)) {
      const granica = granicaPreokreta(lijevo, desno, lider)
      const dosadasnji = lider(eur(granica.amount.minus(CENT.amount)))
      const sljedeci = lider(granica)

      if (dosadasnji !== undefined && sljedeci !== undefined && dosadasnji !== sljedeci) {
        tocke.push({ primitak: granica, dosadasnji, sljedeci })
      }
    }

    lijevo = desno
  }

  return tocke
}
