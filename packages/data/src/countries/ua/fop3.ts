import Decimal from 'decimal.js'
import { sourced } from '../../sourced.ts'
import type {
  HomeCountry,
  HomeCountryCharge,
  HomeCountryLimitBreach,
  HomeCountryResult,
} from '../home-country.ts'
import {
  CHECKED_ON,
  DERZHAVNYI_BIUDZHET_2026,
  PODATKOVYI_KODEKS,
  ZAKON_PRO_YEDYNYI_VNESOK,
} from './references.ts'

/**
 * `FOP 3. skupine` — український режим-референс: `єдиний податок`,
 * `військовий збір` і `ЄСВ`.
 *
 * Три числа з трьох різних місць права, і жодне з них не виводиться з інших:
 * два перші — відсотки від доходу, третє від доходу не залежить узагалі.
 */

/**
 * `ruleset`: те, що написано в законі і змінюється лише його ухваленням.
 */
const RULES = {
  /** Ставка `єдиного податку` третьої групи, коли ПДВ входить до складу податку. */
  yedynyiPodatok: sourced(new Decimal('0.05'), {
    ...PODATKOVYI_KODEKS,
    article: 'пп. 2 п. 293.3 ст. 293',
    checkedOn: CHECKED_ON,
  }),
  /**
   * Ставка `військового збору` для платників єдиного податку третьої групи.
   *
   * Живе не в основному тексті кодексу, а в перехідних положеннях: збір
   * тимчасовий і діє з 1 січня 2025 року до кінця третього календарного року
   * після скасування воєнного стану.
   */
  viiskovyiZbir: sourced(new Decimal('0.01'), {
    ...PODATKOVYI_KODEKS,
    article: 'пп. 3 пп. 1.3 п. 16-1 підрозд. 10 розд. XX',
    checkedOn: CHECKED_ON,
  }),
  /**
   * Ставка `ЄСВ`. База для ФОП на спрощеній системі — сума, яку платник
   * визначає сам, але внесок не може бути меншим за мінімальний страховий
   * (п. 3 ч. 1 ст. 7 того самого закону), тобто на практиці для більшості
   * це рівно 22% мінімальної зарплати.
   */
  yesv: sourced(new Decimal('0.22'), {
    ...ZAKON_PRO_YEDYNYI_VNESOK,
    article: 'ч. 5 ст. 8',
    checkedOn: CHECKED_ON,
  }),
  /** Річний ліміт доходу третьої групи, виражений у мінімальних зарплатах. */
  limitDokhoduVMinimalnykhZarplatakh: sourced(new Decimal(1167), {
    ...PODATKOVYI_KODEKS,
    article: 'пп. 3 п. 291.4 ст. 291',
    checkedOn: CHECKED_ON,
  }),
}

/**
 * `pretpostavke`: величина, до якої відсилають і ліміт, і `ЄСВ`, але яку сам
 * кодекс не встановлює — її щороку задає закон про державний бюджет.
 *
 * На відміну від хорватської `prosječna plaća`, це не статистика, а число з
 * закону, тому джерело в нього правове. Шар усе одно окремий: він змінюється
 * щороку, незалежно від правил, які на нього посилаються (ADR-0001).
 */
const PRETPOSTAVKE = {
  /** Мінімальна заробітна плата станом на 1 січня 2026 року, ₴/місяць. */
  minimalnaZarplata: sourced(new Decimal(8647), {
    ...DERZHAVNYI_BIUDZHET_2026,
    article: 'ст. 8',
    checkedOn: CHECKED_ON,
  }),
}

const MONTHS_IN_YEAR = 12
const KOPECKS = 2

/** Округлення до копійки. Half-up — те саме правило, що в податкових розрахунках. */
const round = (amount: Decimal): Decimal => amount.toDecimalPlaces(KOPECKS, Decimal.ROUND_HALF_UP)

/**
 * `ЄСВ` за рік: 1 902,34 ₴ × 12 = 22 828,08 ₴.
 *
 * Округлення щомісячне, а не річне, бо внесок підлягає сплаті щомісяця
 * (п. 5 ч. 1 ст. 1 закону про єдиний внесок), і рік — це сума дванадцяти
 * місячних платежів, а не одне ділення.
 *
 * Право не сплачувати `ЄСВ` за себе під час воєнного стану (п. 9-19 розд. VIII
 * того самого закону) на 2026 рік зупинено законом про держбюджет, тож внесок
 * рахується без застережень.
 */
const YESV_ANNUAL = round(PRETPOSTAVKE.minimalnaZarplata.value.times(RULES.yesv.value)).times(
  MONTHS_IN_YEAR,
)

/** Річний ліміт доходу третьої групи: 1167 × 8 647 ₴ = 10 091 049 ₴. */
const INCOME_LIMIT = PRETPOSTAVKE.minimalnaZarplata.value.times(
  RULES.limitDokhoduVMinimalnykhZarplatakh.value,
)

/**
 * Перевищення ліміту повідомляється, а не перераховується.
 *
 * За межею починаються інші правила: 15% на суму перевищення
 * (пп. 1 п. 293.4 ст. 293) і перехід на загальну систему. Ні того, ні того
 * тут не реалізовано — референсне порівняння показує межу, а не веде людину
 * загальною системою України.
 */
const breachesOf = (annualIncome: Decimal): readonly HomeCountryLimitBreach[] => {
  if (annualIncome.lessThanOrEqualTo(INCOME_LIMIT)) return []

  return [
    {
      id: 'annual-income-limit',
      limit: INCOME_LIMIT,
      excess: annualIncome.minus(INCOME_LIMIT),
      references: [
        RULES.limitDokhoduVMinimalnykhZarplatakh.source,
        PRETPOSTAVKE.minimalnaZarplata.source,
      ],
    },
  ]
}

const calculate = (input: Decimal.Value): HomeCountryResult => {
  const annualIncome = new Decimal(input)

  const charges: readonly HomeCountryCharge[] = [
    {
      id: 'yedynyi-podatok',
      annual: round(annualIncome.times(RULES.yedynyiPodatok.value)),
      references: [RULES.yedynyiPodatok.source],
    },
    {
      id: 'viiskovyi-zbir',
      annual: round(annualIncome.times(RULES.viiskovyiZbir.value)),
      references: [RULES.viiskovyiZbir.source],
    },
    {
      id: 'yesv',
      annual: YESV_ANNUAL,
      references: [RULES.yesv.source, PRETPOSTAVKE.minimalnaZarplata.source],
    },
  ]

  const totalCharges = charges.reduce((acc, charge) => acc.plus(charge.annual), new Decimal(0))

  return {
    country: 'UA',
    currency: 'UAH',
    annualIncome,
    charges,
    totalCharges,
    // Від'ємне значення тут не помилка: `ЄСВ` не залежить від доходу, тож за
    // нульового доходу на руках лишається мінус внесок.
    net: annualIncome.minus(totalCharges),
    effectiveRate: annualIncome.isZero() ? new Decimal(0) : totalCharges.div(annualIncome),
    breaches: breachesOf(annualIncome),
  }
}

export const FOP_3_SKUPINE: HomeCountry = {
  code: 'UA',
  currency: 'UAH',
  calculate,
}
