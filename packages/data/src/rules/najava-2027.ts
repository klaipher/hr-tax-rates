/**
 * Набір правил запланованих змін на 2027 рік.
 *
 * Змінюються рівно два розряди: `priznati izdatak` падає з 85% до 70% і 55%,
 * а `koeficijent` для `doprinosi` росте з 0,40 до 0,45 і 0,50. Нижче 40 000 €
 * не змінюється нічого.
 *
 * Зміни розкидані по двох законопроєктах, які на день звірки лежать у
 * публічному обговоренні й мали б набути чинності 1 січня 2027 року. Ухвалені
 * вони ще не є, тому кожне їхнє число носить джерело зі статусом `draft`:
 * показати неухвалену цифру як закон — рівно те, чого це поле не дає зробити
 * (ADR-0002). Числа, яких проєкти не чіпають — поріг паушалу і ставки внесків,
 * — лишаються при своїх чинних статтях: підписати чинну норму проєктом було б
 * такою самою неправдою, тільки в інший бік.
 */

import Decimal from 'decimal.js'
import { sourced } from '../sourced.ts'
import { ruleset2026 } from './hr-2026.ts'
import type { Pretpostavke, Razred, Ruleset } from './types.ts'

const CHECKED_ON = '2026-08-04' as const

/**
 * Законопроєкт, що переносить таблицю розрядів із підзаконного акта в сам
 * закон і зменшує `priznati izdatak` у двох найвищих розрядах.
 *
 * `gazette` — не номер NN: неухвалений текст у «Народних новинах» не виходить,
 * і його єдине офіційне оприлюднення — картка публічного обговорення.
 */
const NACRT_ZAKONA_O_POREZU_NA_DOHODAK = {
  jurisdiction: 'HR',
  act: 'Nacrt prijedloga zakona o izmjenama i dopunama Zakona o porezu na dohodak',
  gazette: 'e-Savjetovanja 10200',
  url: 'https://esavjetovanja.gov.hr/Econ/10200',
  status: 'draft',
} as const

/** Законопроєкт, що прив'язує `koeficijent` до розряду паушалу. */
const NACRT_ZAKONA_O_DOPRINOSIMA = {
  jurisdiction: 'HR',
  act: 'Nacrt prijedloga zakona o izmjenama i dopunama Zakona o doprinosima',
  gazette: 'e-Savjetovanja 10198',
  url: 'https://esavjetovanja.gov.hr/Econ/10198',
  status: 'draft',
} as const

/**
 * Стаття, що додає до закону новий čl. 82.a: таблиця розрядів разом із часткою
 * визнаних видатків у кожному з них. Одна стаття — одне джерело на обидва
 * стовпці, як і в чинному наборі.
 */
const RAZREDI_I_IZDATAK = {
  ...NACRT_ZAKONA_O_POREZU_NA_DOHODAK,
  article: 'čl. 10. (novi čl. 82.a st. 1.)',
  checkedOn: CHECKED_ON,
} as const

/**
 * Ставка `paušalni porez` живе в тому ж новому čl. 82.a, тільки в іншому
 * пункті. Зі старого čl. 82. st. 6. слова про ставку 12% проєкт викреслює
 * (čl. 9.), тож посилатися далі на нього означало б цитувати порожнє місце.
 */
const STOPA_POREZA = {
  ...NACRT_ZAKONA_O_POREZU_NA_DOHODAK,
  article: 'čl. 10. (novi čl. 82.a st. 4.)',
  checkedOn: CHECKED_ON,
} as const

/**
 * `koeficijent` приходить з іншого акта, ніж таблиця розрядів, — тому й
 * джерело окреме. Проєкт переписує čl. 70. цілком: замість однієї величини
 * на всіх з'являються три, прив'язані до розряду.
 */
const KOEFICIJENT = {
  ...NACRT_ZAKONA_O_DOPRINOSIMA,
  article: 'čl. 5. (novi čl. 70. st. 1.)',
  checkedOn: CHECKED_ON,
} as const

/**
 * Розряд у запланованих змінах.
 *
 * Чинний закон знає одну частку визнаних видатків і один коефіцієнт на всю
 * таблицю, тому в `Razred` їх немає — вони лежать поруч із таблицею. Проєкт
 * робить обидві величини різними за розрядами, і зберігати їх деінде, крім
 * самого рядка, означало б розводити по файлу те, що закон друкує одним рядком.
 */
export interface RazredNajave extends Razred {
  /**
   * `priznati izdatak` (визнані видатки / deemed expense ratio) цього розряду.
   * Джерело — спільне з таблицею: обидва числа друкує та сама стаття.
   */
  readonly priznatiIzdatak: Decimal
  /**
   * `koeficijent` (коефіцієнт / contribution coefficient) цього розряду.
   * Джерело — `KOEFICIJENT`: це вже інший акт, ніж таблиця.
   */
  readonly koeficijent: Decimal
}

const IZDATAK_BEZ_PROMJENE = new Decimal('0.85')
const KOEFICIJENT_BEZ_PROMJENE = new Decimal('0.4')

/**
 * Таблиця розрядів запланованих змін.
 *
 * Нижче 40 000 € не змінюється нічого: перші п'ять рядків повторюють чинні,
 * і саме це дає безкоштовну перевірку — різниця між сценаріями на всьому
 * діапазоні до 40 000 € мусить бути рівно нульова.
 *
 * `godisnjiPausalniDohodak` переписаний із законопроєкту, а не порахований:
 * проєкт друкує його явно для кожного розряду. Що він таки дорівнює
 * `gornja granica razreda` без визнаних видатків — перевіряє тест.
 */
export const razrediNajave2027: readonly RazredNajave[] = [
  {
    redniBroj: 1,
    gornjaGranica: new Decimal('11300'),
    godisnjiPausalniDohodak: new Decimal('1695'),
    priznatiIzdatak: IZDATAK_BEZ_PROMJENE,
    koeficijent: KOEFICIJENT_BEZ_PROMJENE,
  },
  {
    redniBroj: 2,
    gornjaGranica: new Decimal('15300'),
    godisnjiPausalniDohodak: new Decimal('2295'),
    priznatiIzdatak: IZDATAK_BEZ_PROMJENE,
    koeficijent: KOEFICIJENT_BEZ_PROMJENE,
  },
  {
    redniBroj: 3,
    gornjaGranica: new Decimal('19900'),
    godisnjiPausalniDohodak: new Decimal('2985'),
    priznatiIzdatak: IZDATAK_BEZ_PROMJENE,
    koeficijent: KOEFICIJENT_BEZ_PROMJENE,
  },
  {
    redniBroj: 4,
    gornjaGranica: new Decimal('30600'),
    godisnjiPausalniDohodak: new Decimal('4590'),
    priznatiIzdatak: IZDATAK_BEZ_PROMJENE,
    koeficijent: KOEFICIJENT_BEZ_PROMJENE,
  },
  {
    redniBroj: 5,
    gornjaGranica: new Decimal('40000'),
    godisnjiPausalniDohodak: new Decimal('6000'),
    priznatiIzdatak: IZDATAK_BEZ_PROMJENE,
    koeficijent: KOEFICIJENT_BEZ_PROMJENE,
  },
  {
    redniBroj: 6,
    gornjaGranica: new Decimal('50000'),
    godisnjiPausalniDohodak: new Decimal('15000'),
    priznatiIzdatak: new Decimal('0.7'),
    koeficijent: new Decimal('0.45'),
  },
  {
    redniBroj: 7,
    gornjaGranica: new Decimal('60000'),
    godisnjiPausalniDohodak: new Decimal('27000'),
    priznatiIzdatak: new Decimal('0.55'),
    koeficijent: new Decimal('0.5'),
  },
]

/** Джерело таблиці розрядів — одне на всю таблицю, як і в чинному наборі. */
const razredi = sourced(razrediNajave2027, RAZREDI_I_IZDATAK)

/**
 * Розряд, у який потрапляє `primitak` — перший, чия `gornja granica` його не
 * менша. Той самий вибір, що робить рушій; понад останню межу лишається
 * найвищий розряд, бо режим там уже недоступний і правила потрібні лише для
 * того, щоб відмова була визначеною.
 */
const razredZa = (godisnjiPrimitak: Decimal): RazredNajave => {
  const razred =
    razrediNajave2027.find((kandidat) =>
      kandidat.gornjaGranica.greaterThanOrEqualTo(godisnjiPrimitak),
    ) ?? razrediNajave2027.at(-1)
  if (razred === undefined) throw new Error('Таблиця розрядів порожня')
  return razred
}

/**
 * Правила запланованих змін, матеріалізовані під конкретний річний `primitak`.
 *
 * Чому функція, а не константа: проєкт робить `priznati izdatak` і
 * `koeficijent` різними за розрядами, тоді як `Ruleset` знає по одній величині
 * на набір — стільки, скільки знає чинний закон. Розряд визначає сам
 * `primitak`, тож набір правил для нього і будується. Таблиця розрядів,
 * ставка й поріг від `primitak` не залежать.
 *
 * `prosječna plaća` сюди не входить: закон її не встановлює, а лише на неї
 * посилається (ADR-0001). Вона живе в `pretpostavkeNajave2027`.
 */
export const rulesetNajave2027 = (godisnjiPrimitak: Decimal.Value): Ruleset => {
  const razred = razredZa(new Decimal(godisnjiPrimitak))

  return {
    godina: 2027,
    pausalniObrt: {
      razredi,
      priznatiIzdatak: sourced(razred.priznatiIzdatak, RAZREDI_I_IZDATAK),
      stopaPoreza: sourced(new Decimal('0.12'), STOPA_POREZA),
      koeficijent: sourced(razred.koeficijent, KOEFICIJENT),
      // Поріг паушалу законопроєкти не чіпають: він лишається порогом
      // обов'язкового входу в систему PDV, і стаття за ним — чинна.
      // Підписати чинну норму проєктом було б такою самою неправдою, як
      // підписати неухвалену цифру чинним законом.
      pragPrimitka: ruleset2026.pausalniObrt.pragPrimitka,
    },
    // Ставки внесків обидва законопроєкти лишають без змін — 36,5% разом.
    // Змінюється тільки те, до чого їх застосовують: сама `osnovica`.
    doprinosi: ruleset2026.doprinosi,
  }
}

/**
 * Припущення до запланованих змін.
 *
 * `prosječna plaća` на 2027 рік не існує: її рахують за січень–серпень 2026
 * і публікують восени. Тому тут прогноз, і він так і позначений — видати
 * прогнозну суму внесків за розраховану за законом не можна (ADR-0001).
 *
 * Число взяте з калькулятора HOK на 2027: саме на ньому побудовані суми, які
 * ходять пресою. Обґрунтування законопроєкту рахує ті самі правила з чинних
 * 1 993 € і дає інші суми внесків — різниця між двома офіційними числами
 * лежить рівно тут, у припущенні, а не в правилах.
 */
export const pretpostavkeNajave2027: Pretpostavke = {
  prosjecnaPlaca: {
    value: new Decimal('2180.00'),
    source: {
      publisher: 'Hrvatska obrtnička komora',
      period: 'prognoza za siječanj – kolovoz 2026.',
      publication: 'Kalkulator «Dobro je biti obrtnik» za 2027.',
      url: 'https://www.hok.hr/gospodarstvo-i-savjetovanje/obrtnicka-pocetnica/kalkulator-dobro-je-biti-obrtnik-0',
      status: 'forecast',
      checkedOn: CHECKED_ON,
    },
  },
}
