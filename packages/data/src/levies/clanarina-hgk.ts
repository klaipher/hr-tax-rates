import Decimal from 'decimal.js'
import { type Sourced, sourced } from '../sourced.ts'
import { type ActReference, type LevyResult, levyNotApplicable } from './levy.ts'

/**
 * `članarina HGK` (членський внесок Господарської палати / chamber membership fee).
 *
 * Пара до `komorski doprinos`, але з протилежним висновком, і саме тому цей
 * модуль існує. Обртницька палата бере внесок із кожного обрту безумовно;
 * Господарська палата ділить членів на три скупини за розміром — і перша,
 * куди потрапляє будь-яка одноосібна фірма, обов'язковим платником **не є**.
 *
 * Тобто d.o.o. палаті не платить нічого, тоді як обрт платить завжди. Це
 * реальна асиметрія двох правових форм, і показати її нулем не можна: нуль
 * читався б як «порахували й вийшло нічого», а тут — «обов'язку немає».
 */

const CHECKED_ON = '2026-08-05' as const

const ZAKON_O_HGK = {
  jurisdiction: 'HR',
  act: 'Zakon o Hrvatskoj gospodarskoj komori',
  gazette: 'NN 66/23',
  url: 'https://www.zakon.hr/z/531/zakon-o-hrvatskoj-gospodarskoj-komori',
  status: 'in-force',
} as const satisfies ActReference

const ODLUKA_O_FINANCIRANJU_HGK = {
  jurisdiction: 'HR',
  act: 'Odluka o financiranju Hrvatske gospodarske komore',
  gazette: 'NN 6/25',
  url: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2025_01_6_42.html',
  status: 'in-force',
} as const satisfies ActReference

/**
 * Критерії однієї скупини.
 *
 * Закон розводить скупини не однією величиною, а трьома, і бере два з трьох:
 * член належить до скупини, поки не переступив **двох** її меж. Тому це
 * структура, а не число: перевірити можна лише всі три разом.
 */
export interface KriterijiSkupine {
  /** Верхня межа сукупних активів, у євро. */
  readonly ukupnaAktiva: Decimal
  /** Верхня межа річних `prihod`, у євро. */
  readonly ukupniPrihodi: Decimal
  /** Верхня межа кількості зайнятих. */
  readonly brojZaposlenih: number
}

export interface ClanarinaHgkPravila {
  /** Межі першої скупини — єдині, які цей розрахунок уміє перевірити. */
  readonly prvaSkupina: Sourced<KriterijiSkupine>
  /**
   * Місячний внесок першої скупини. Не обов'язок: перша скупина платить його
   * добровільно, за заявою, і саме тому число тут — не сума до сплати, а
   * розмір добровільного внеску.
   */
  readonly dobrovoljniMjesecniIznosPrveSkupine: Sourced<Decimal>
}

/** Чинні правила на 2026 рік. */
export const CLANARINA_HGK_U_SNAZI: ClanarinaHgkPravila = {
  prvaSkupina: sourced(
    {
      ukupnaAktiva: new Decimal('995421.06'),
      ukupniPrihodi: new Decimal('1990842.13'),
      brojZaposlenih: 50,
    },
    { ...ODLUKA_O_FINANCIRANJU_HGK, article: 'čl. 3.', checkedOn: CHECKED_ON },
  ),
  dobrovoljniMjesecniIznosPrveSkupine: sourced(new Decimal('20.00'), {
    ...ODLUKA_O_FINANCIRANJU_HGK,
    article: 'čl. 4. t. 1.',
    checkedOn: CHECKED_ON,
  }),
}

/**
 * Обов'язок членства сам по собі. Числа не несе — але без нього незрозуміло,
 * чому фірма взагалі опиняється в палаті, не вступаючи до неї.
 */
export const OBVEZNO_CLANSTVO_U_HGK = {
  ...ZAKON_O_HGK,
  article: 'čl. 3. st. 1.',
  checkedOn: CHECKED_ON,
} as const

export interface ClanarinaHgkUlaz {
  /** Річний `prihod` (виручка за методом нарахування / revenue) у євро. */
  readonly godisnjiPrihod: Decimal
  /**
   * Кількість зайнятих. Калькулятор моделює діяльність однієї людини, тож
   * тут завжди одиниця — але число лишається входом, бо саме воно є одним із
   * трьох критеріїв закону, і зашити його означало б сховати правило.
   */
  readonly brojZaposlenih: number
}

/**
 * Річна `članarina HGK`.
 *
 * Повертає `not-applicable` частіше, ніж `due`, і це не заглушка: перша
 * скупина справді нічого не винна. Коли ж `prihodi` переступили її межу,
 * розрахунок не вгадує скупину — активів форма не знає, а без них двох
 * критеріїв із трьох не перевірити.
 */
export const clanarinaHgk = (
  ulaz: ClanarinaHgkUlaz,
  pravila: ClanarinaHgkPravila = CLANARINA_HGK_U_SNAZI,
): LevyResult => {
  const { prvaSkupina, dobrovoljniMjesecniIznosPrveSkupine } = pravila
  const granice = prvaSkupina.value

  // Закон бере «не перевищує двох із трьох». `prihodi` й кількість зайнятих
  // ми знаємо; активів — ні. Тому висновок можливий лише тоді, коли ці двоє
  // вже дають потрібні дві межі.
  const uGranicamaPrihoda = ulaz.godisnjiPrihod.lessThanOrEqualTo(granice.ukupniPrihodi)
  const uGranicamaZaposlenih = ulaz.brojZaposlenih <= granice.brojZaposlenih

  if (uGranicamaPrihoda && uGranicamaZaposlenih) {
    return levyNotApplicable(
      {
        kod: 'prva-skupina-nije-obveznik',
        dobrovoljniMjesecniIznos: dobrovoljniMjesecniIznosPrveSkupine.value.toFixed(2),
      },
      prvaSkupina.source,
    )
  }

  return levyNotApplicable({ kod: 'velicina-nije-odrediva' }, prvaSkupina.source)
}
