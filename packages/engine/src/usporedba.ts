import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import type { Naziv, Podloga, Rezim, RezimId, Unos, Usporedba } from './types.ts'

/**
 * Режими, яких цей зріз ще не рахує.
 *
 * Причина в кожного своя і названа конкретно: недоступність — це теж
 * відповідь, і людина має розуміти, чого саме бракує, а не бачити порожню
 * картку. Числа тут немає жодного — порожній розрахунок із нулями на картці
 * не відрізнити від порахованого.
 */
const NEMODELIRANI_REZIMI: readonly {
  readonly id: RezimId
  readonly naziv: Naziv
  readonly razlog: string
}[] = [
  {
    id: 'obrt-na-dohodak',
    naziv: { hr: 'obrt na dohodak', uk: 'обрт на дохідок' },
    razlog:
      'Режим рахує dohodak як різницю фактичних primitak і izdatak, а porez na dohodak бере ' +
      'за нижчою і вищою ставками, які встановлює місто чи община. Ані izdatak, ані місто ще ' +
      'не є входами цієї форми, тож будь-яке число тут було б вигаданим.',
  },
  {
    id: 'obrt-na-dobit',
    naziv: { hr: 'obrt na dobit', uk: 'обрт у системі porez na dobit' },
    razlog:
      'Режим визначає dobit за методом нарахування, а не за касовим, і дозволяє власнику ' +
      'poduzetnička plaća, яка сама оподатковується як зарплата. Ні обліку нарахувань, ні ' +
      'poduzetnička plaća цей зріз ще не знає.',
  },
  {
    id: 'zaposlenik',
    naziv: { hr: 'zaposlenik', uk: 'найманий працівник' },
    razlog:
      'Найманий працівник режиму не обирає — його plaća оподатковується роботодавцем. Входом ' +
      'тут була б домовлена брутто-зарплата, а не річний primitak, тож картка чекає на інший ' +
      'вхід, а не на дорахування.',
  },
  {
    id: 'doo',
    naziv: { hr: 'd.o.o.', uk: 'товариство з обмеженою відповідальністю' },
    razlog:
      'Власник d.o.o. дістає гроші двома різними шляхами — poduzetnička plaća і дивіденди, — ' +
      'і кожен оподатковується за своїми правилами. Поки форма не знає, як саме поділено ' +
      'виплату, будь-яка сума на руки була б довільною.',
  },
]

/**
 * Єдина публічна функція рушія: чиста, синхронна, повертає всі режими одразу.
 *
 * Усі режими повертаються завжди і в незмінному порядку, з однаковою
 * структурою результату — саме на ній тримається зіставність, заради якої
 * калькулятор і існує. Жодного числа з закону рушій не знає: правила й
 * припущення приходять у `podloga` (ADR-0001).
 */
export const usporediRezime = (unos: Unos, podloga: Podloga): Usporedba => {
  const pausalniObrt: Rezim = {
    id: 'pausalni-obrt',
    naziv: { hr: 'paušalni obrt', uk: 'паушальний обрт' },
    ishod: izracunajPausalniObrt(unos.godisnjiPrimitak, podloga),
  }

  return {
    godina: podloga.ruleset.godina,
    rezimi: [
      pausalniObrt,
      ...NEMODELIRANI_REZIMI.map(
        ({ id, naziv, razlog }): Rezim => ({ id, naziv, ishod: { status: 'nedostupno', razlog } }),
      ),
    ],
  }
}
