import Decimal from 'decimal.js'
import { ZAKON_O_DOPRINOSIMA, ZAKON_O_POREZU_NA_DOHODAK } from '../legal.ts'
import { sourced } from '../sourced.ts'
import { PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU, ZAKON_O_PDV } from './akti.ts'
import type { Pretpostavke, Razred, Ruleset } from './types.ts'

const CHECKED_ON = '2026-08-04' as const

/**
 * Стаття, що друкує таблицю розрядів разом із поясненням, звідки береться
 * `paušalni dohodak`: різниця між `gornja granica razreda` і визнаними
 * видатками у 85%. Тому і таблиця, і сама частка мають одне джерело.
 */
const RAZREDI_I_IZDATAK = {
  ...PRAVILNIK_O_PAUSALNOM_OPOREZIVANJU,
  article: 'čl. 3. st. 1.',
  checkedOn: CHECKED_ON,
} as const

/**
 * Таблиця розрядів паушального обрту.
 *
 * `godisnjiPausalniDohodak` переписаний з акта, а не порахований: акт друкує
 * його явно для кожного розряду. Що він таки дорівнює `gornja granica razreda`
 * без 85% визнаних видатків — перевіряє тест, і саме тому обидва числа
 * зберігаються поруч.
 */
const razredi: readonly Razred[] = [
  {
    redniBroj: 1,
    gornjaGranica: new Decimal('11300'),
    godisnjiPausalniDohodak: new Decimal('1695'),
  },
  {
    redniBroj: 2,
    gornjaGranica: new Decimal('15300'),
    godisnjiPausalniDohodak: new Decimal('2295'),
  },
  {
    redniBroj: 3,
    gornjaGranica: new Decimal('19900'),
    godisnjiPausalniDohodak: new Decimal('2985'),
  },
  {
    redniBroj: 4,
    gornjaGranica: new Decimal('30600'),
    godisnjiPausalniDohodak: new Decimal('4590'),
  },
  {
    redniBroj: 5,
    gornjaGranica: new Decimal('40000'),
    godisnjiPausalniDohodak: new Decimal('6000'),
  },
  {
    redniBroj: 6,
    gornjaGranica: new Decimal('50000'),
    godisnjiPausalniDohodak: new Decimal('7500'),
  },
  {
    redniBroj: 7,
    gornjaGranica: new Decimal('60000'),
    godisnjiPausalniDohodak: new Decimal('9000'),
  },
]

/** Чинні правила на 2026 рік. */
export const ruleset2026: Ruleset = {
  godina: 2026,
  pausalniObrt: {
    razredi: sourced(razredi, RAZREDI_I_IZDATAK),
    priznatiIzdatak: sourced(new Decimal('0.85'), RAZREDI_I_IZDATAK),
    // Ставка паушалу живе в законі про porez na dohodak, а не в čl. 19: čl. 19
    // задає нижчу й вищу ставки звичайного оподаткування, які встановлює
    // місто. Паушал їх не знає — у нього одна ставка на всю країну.
    stopaPoreza: sourced(new Decimal('0.12'), {
      ...ZAKON_O_POREZU_NA_DOHODAK,
      article: 'čl. 82. st. 6.',
      checkedOn: CHECKED_ON,
    }),
    koeficijent: sourced(new Decimal('0.4'), {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 70.',
      checkedOn: CHECKED_ON,
    }),
    // Закон про porez na dohodak (čl. 82. st. 1.) робить паушал доступним
    // тому, хто не переступив поріг обов'язкового входу в систему PDV, але
    // самого числа не називає. Число — у законі про PDV.
    pragPrimitka: sourced(new Decimal('60000'), {
      ...ZAKON_O_PDV,
      article: 'čl. 90. st. 1.',
      checkedOn: CHECKED_ON,
    }),
  },
  doprinosi: {
    stopaMoPrviStup: sourced(new Decimal('0.15'), {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 13. st. 1. t. 1.2.',
      checkedOn: CHECKED_ON,
    }),
    stopaMoDrugiStup: sourced(new Decimal('0.05'), {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 17. st. 1. t. 1.',
      checkedOn: CHECKED_ON,
    }),
    stopaZo: sourced(new Decimal('0.165'), {
      ...ZAKON_O_DOPRINOSIMA,
      article: 'čl. 14. st. 1. t. 1.',
      checkedOn: CHECKED_ON,
    }),
  },
}

/**
 * Припущення на 2026 рік.
 *
 * `prosječna plaća` тут, а не в `ruleset`, хоча закон і будує на ній
 * `osnovica`: закон її не встановлює, а лише посилається на публікацію
 * статистики (ADR-0001).
 */
export const pretpostavke2026: Pretpostavke = {
  prosjecnaPlaca: {
    value: new Decimal('1993.00'),
    source: {
      publisher: 'Državni zavod za statistiku',
      period: 'siječanj – kolovoz 2025.',
      publication: 'NN 133/25',
      url: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2025_10_133_1955.html',
      status: 'published',
      checkedOn: CHECKED_ON,
    },
  },
  prosjecnaPlacaPrethodneGodine: {
    value: new Decimal('2016.00'),
    source: {
      publisher: 'Državni zavod za statistiku',
      period: 'siječanj – prosinac 2025.',
      publication: 'RAD-2025-1-1, Prosječne mjesečne neto i bruto plaće zaposlenih',
      url: 'https://podaci.dzs.hr/2025/hr/97037',
      status: 'published',
      checkedOn: '2026-08-05',
    },
  },
}
