import type { LegalReference } from '../legal.ts'
import { sourced } from '../sourced.ts'
import { PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU } from './akti.ts'

/**
 * Норми, за якими паушальний обрт рахується за неповний податковий період —
 * коли `obrt` відкрито не з початку календарного року.
 *
 * Обидві норми живуть у čl. 3. Pravilnika, але це різні стави з різними
 * правилами, тож і посилання в них різні (ADR-0002).
 */

const CHECKED_ON = '2026-08-04' as const

/**
 * čl. 3. st. 4. — розмірне зведення до місяців діяльності.
 *
 * Стаття робить дві різні речі одним реченням, і плутати їх не можна:
 * `godišnji paušalni dohodak ... utvrđuje se razmjerno broju mjeseci
 * obavljanja djelatnosti` — це ділення готової річної суми; а от
 * `dohodovni razred utvrđuje se na način da se od prosječnog primitka ...
 * (ukupni primitak podijeljen s brojem mjeseci obavljanja djelatnosti)
 * utvrđuje godišnji primitak množenjem prosječnog primitka s 12 mjeseci` —
 * це навпаки, **збільшення** фактичного `primitak` до річного, і саме воно
 * може перенести платника у **вищий** розряд, ніж дав би той самий
 * `primitak` за повний рік.
 */
const RAZMJERNO_BROJU_MJESECI: LegalReference = {
  ...PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU,
  article: 'čl. 3. st. 4.',
  checkedOn: CHECKED_ON,
}

/**
 * čl. 3. st. 6. — що саме входить у `broj mjeseci obavljanja djelatnosti`.
 *
 * `računa se svaki puni (cijeli) kalendarski mjesec u kojemu je obveznik
 * obavljao samostalnu djelatnost i posljednji mjesec bez obzira na broj dana
 * obavljanja samostalne djelatnosti u tom mjesecu`. Тобто перший місяць
 * рахується лише тоді, коли `obrt` відкрито першого його дня; окрема згадка
 * останнього місяця потрібна саме тому, що загальне правило вимагає повного.
 */
const BROJANJE_MJESECI_DJELATNOSTI: LegalReference = {
  ...PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU,
  article: 'čl. 3. st. 6.',
  checkedOn: CHECKED_ON,
}

/**
 * Правила неповного податкового періоду, чинні на 2026 рік.
 *
 * Форму цього запису задає рушій (`PravilaNepuneGodine` у `@hr-tax/engine`):
 * закон живе тут, а арифметику над ним робить рушій (ADR-0001). Власного
 * інтерфейсу тут немає навмисно — два описи однієї форми в двох пакетах
 * розійшлися б мовчки.
 */
export const PRAVILA_NEPUNE_GODINE = {
  /**
   * Скільки місяців має повний податковий період. Число не декоративне: саме
   * на нього čl. 3. st. 4. множить середній місячний `primitak`, щоб дістати
   * річний, за яким визначається `razred`.
   */
  mjeseciUPunomRazdoblju: sourced(12, RAZMJERNO_BROJU_MJESECI),
  /** Норма підрахунку місяців діяльності. Числа не має — має правило. */
  brojanjeMjeseci: BROJANJE_MJESECI_DJELATNOSTI,
} as const
