/**
 * Уся драбина розрядів одразу: кожна межа зі своїм податком і своїми внесками.
 *
 * Картка показує тільки той розряд, у який людина потрапила, а графік — саму
 * форму кривої. Ані з одного, ані з другого не видно, що саме чекає на
 * сусідньому щаблі й скільки їх усього. Таблиця відповідає рівно на це.
 *
 * Числа рахує той самий `izracunajPausalniObrt`, що й картку: якби таблиця
 * множила ставку на межу самотужки, правило жило б у двох місцях і колись
 * розійшлося б.
 */
import type { LegalReference } from '@hr-tax/data'
import { eur, type Money } from './money.ts'
import type { PodlogaZa } from './obriv.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import { jediniPorez } from './types.ts'

/** Один щабель драбини — розряд разом із тим, чого він коштує за рік. */
export interface RedakRazreda {
  /** Порядковий номер розряду в таблиці акта. */
  readonly redniBroj: number
  /** `gornja granica razreda` — найбільший `primitak`, за якого розряд ще діє. */
  readonly gornjaGranica: Money<'EUR'>
  /**
   * `paušalni dohodak` розряду — база `paušalni porez`. Юридична фікція, яку
   * акт друкує готовою: не різниця `primitak` і `izdatak`.
   */
  readonly poreznaOsnovica: Money<'EUR'>
  /** Річний `paušalni porez` цього розряду. */
  readonly porez: Money<'EUR'>
  /**
   * Річні `doprinosi` цього розряду. За чинним законом однакові в усіх
   * розрядах, у запланованих змінах — ні: там `koeficijent` різний.
   */
  readonly doprinosi: Money<'EUR'>
  /** Податок і внески разом — річна повинність щабля. */
  readonly ukupno: Money<'EUR'>
  /** Чи саме в цьому розряді лежить `primitak`, про який спитали. */
  readonly primijenjen: boolean
  /** Стаття з таблицею розрядів. */
  readonly izvor: LegalReference
}

/**
 * Драбина розрядів для набору правил, узятого під кожен щабель окремо.
 *
 * `podlogaZa` — функція, а не готова підкладка: законопроєкт в'яже
 * `koeficijent` до розряду, тож правила шостого щабля не ті самі, що
 * першого, і питати їх треба на самому щаблі.
 *
 * Розряд, якого набір правил порахувати не може (таблиця, що переростає
 * власний поріг), у драбину не потрапляє — вигадувати для нього числа гірше,
 * ніж не показати рядка.
 */
export const tablicaRazreda = (
  godisnjiPrimitak: Money<'EUR'>,
  podlogaZa: PodlogaZa,
): readonly RedakRazreda[] => {
  const podloga = podlogaZa(godisnjiPrimitak)
  const { razredi } = podloga.ruleset.pausalniObrt
  const ishodTrenutnog = izracunajPausalniObrt(godisnjiPrimitak, podloga)
  const trenutni =
    ishodTrenutnog.status === 'izracunato' ? ishodTrenutnog.izracun.razred?.redniBroj : undefined

  return razredi.value.flatMap((razred): readonly RedakRazreda[] => {
    const gornjaGranica = eur(razred.gornjaGranica)
    const ishod = izracunajPausalniObrt(gornjaGranica, podlogaZa(gornjaGranica))
    if (ishod.status !== 'izracunato' || ishod.izracun.razred === undefined) return []

    const porez = jediniPorez(ishod.izracun)
    const doprinosi = ishod.izracun.doprinosi.ukupnoGodisnje

    return [
      {
        redniBroj: ishod.izracun.razred.redniBroj,
        gornjaGranica,
        poreznaOsnovica: porez.poreznaOsnovica,
        porez: porez.godisnjiIznos,
        doprinosi,
        ukupno: eur(porez.godisnjiIznos.amount.plus(doprinosi.amount)),
        primijenjen: ishod.izracun.razred.redniBroj === trenutni,
        izvor: ishod.izracun.razred.izvor,
      },
    ]
  })
}
