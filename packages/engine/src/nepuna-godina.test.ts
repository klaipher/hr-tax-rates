import { komorskiDoprinos, type LegalReference, pretpostavke2026, ruleset2026 } from '@hr-tax/data'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { eur, toCentString } from './money.ts'
import {
  brojMjeseciDjelatnosti,
  izracunajPausalniObrtZaRazdoblje,
  jePunoRazdoblje,
  type Mjesec,
  type PocetakDjelatnosti,
  type PravilaNepuneGodine,
  razdobljeZa,
  razmjernoRazdoblju,
} from './nepuna-godina.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import type { Izracun, Podloga } from './types.ts'

const podloga2026: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

/**
 * Норми неповного року приходять у рушій ззовні, як і решта правил (ADR-0001).
 * Тест підставляє власний акт навмисно: він перевіряє, що число на виході веде
 * саме до тієї статті, яку рушієві дали, а не до тієї, яку він міг би знати
 * напам'ять. За справжні номери статей відповідає тест правил у `@hr-tax/data`.
 */
const PROPIS_IZ_TESTA = {
  jurisdiction: 'HR',
  act: 'Propis iz testa',
  gazette: 'NN 1/26',
  url: 'https://primjer.test/propis',
  status: 'in-force',
  checkedOn: '2026-08-04',
} as const satisfies Omit<LegalReference, 'article'>

const pravilaIzTesta: PravilaNepuneGodine = {
  mjeseciUPunomRazdoblju: {
    value: 12,
    source: { ...PROPIS_IZ_TESTA, article: 'čl. 1. st. 1.' },
  },
  brojanjeMjeseci: { ...PROPIS_IZ_TESTA, article: 'čl. 1. st. 2.' },
}

const CLANAK_RAZMJERNOSTI = pravilaIzTesta.mjeseciUPunomRazdoblju.source.article

const PUNIH_MJESECI = 12

const SVI_MJESECI: readonly Mjesec[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const razdoblje = (pocetak: PocetakDjelatnosti) => razdobljeZa(pravilaIzTesta, pocetak)

const mjeseci = (pocetak: PocetakDjelatnosti): number => razdoblje(pocetak).brojMjeseci

const ishodZa = (primitak: string, pocetak: PocetakDjelatnosti, podloga: Podloga = podloga2026) =>
  izracunajPausalniObrtZaRazdoblje(eur(primitak), razdoblje(pocetak), podloga)

/** Розрахунок за неповний період або виняток, якщо режим недоступний. */
const pausal = (
  primitak: string,
  pocetak: PocetakDjelatnosti,
  podloga: Podloga = podloga2026,
): Izracun => {
  const ishod = ishodZa(primitak, pocetak, podloga)
  if (ishod.status !== 'izracunato') {
    throw new Error(`Паушал недоступний за primitak ${primitak}: ${ishod.razlog}`)
  }
  return ishod.izracun
}

const razlogNedostupnosti = (primitak: string, pocetak: PocetakDjelatnosti): string => {
  const ishod = ishodZa(primitak, pocetak)
  if (ishod.status !== 'nedostupno')
    throw new Error(`Паушал за ${primitak} несподівано порахований`)
  return ishod.razlog
}

/** Порядковий номер розряду або `undefined`, якщо режим недоступний. */
const razredZa = (primitak: string, pocetak: PocetakDjelatnosti): number | undefined => {
  const ishod = ishodZa(primitak, pocetak)
  return ishod.status === 'izracunato' ? ishod.izracun.razred?.redniBroj : undefined
}

/** Те саме за повний рік — річним розрахунком, якого цей модуль не чіпає. */
const godisnjiRazredZa = (godisnjiPrimitak: Decimal): number | undefined => {
  const ishod = izracunajPausalniObrt(eur(godisnjiPrimitak), podloga2026)
  return ishod.status === 'izracunato' ? ishod.izracun.razred?.redniBroj : undefined
}

/** Сітка `primitak`, що навмисно стоїть на межах розрядів і поруч із ними. */
const PRIMITCI = [
  '0',
  '1',
  '900',
  '1000',
  '5650',
  '5650.01',
  '6591.66',
  '6591.67',
  '8291.66',
  '8291.67',
  '11300',
  '11300.01',
  '12000',
  '19900',
  '19900.01',
  '25000',
  '30600',
  '40000',
  '50000',
  '59999.99',
  '60000',
  '60000.01',
] as const

describe('неповний податковий період', () => {
  describe('broj mjeseci obavljanja djelatnosti', () => {
    it('обрт, відкритий першого січня, дає повні дванадцять місяців', () => {
      expect(mjeseci({ mjesec: 1 })).toBe(12)
    })

    it('обрт, відкритий першого серпня, дає п’ять місяців', () => {
      expect(mjeseci({ mjesec: 8 })).toBe(5)
    })

    it('обрт, відкритий першого грудня, дає один місяць', () => {
      expect(mjeseci({ mjesec: 12 })).toBe(1)
    })

    it('перший неповний місяць не рахується взагалі', () => {
      // Норма рахує кожен **повний** календарний місяць діяльності. Обрт,
      // відкритий усередині серпня, серпня не має — його період починається
      // з вересня, тож місяців чотири, а не п’ять.
      expect(mjeseci({ mjesec: 8, dan: 'tijekom-mjeseca' })).toBe(4)
      expect(mjeseci({ mjesec: 1, dan: 'tijekom-mjeseca' })).toBe(11)
    })

    it('останній місяць рахується попри кількість днів у ньому', () => {
      // Інакше обрт, відкритий усередині грудня, мав би нуль місяців — і
      // ділення на нуль замість розрахунку.
      expect(mjeseci({ mjesec: 12, dan: 'tijekom-mjeseca' })).toBe(1)
    })

    it.each(SVI_MJESECI)('місяць %i дає період від одного до дванадцяти місяців', (mjesec) => {
      for (const dan of ['prvi-dan-mjeseca', 'tijekom-mjeseca'] as const) {
        const brojMjeseci = mjeseci({ mjesec, dan })

        expect(brojMjeseci).toBeGreaterThanOrEqual(1)
        expect(brojMjeseci).toBeLessThanOrEqual(PUNIH_MJESECI)
      }
    })

    it('місяць поза календарем не компілюється', () => {
      // @ts-expect-error — тринадцятого місяця немає, і тип цього не дозволяє.
      expect(() => razdoblje({ mjesec: 13 })).not.toThrow()
    })

    it('без місяця відкриття період — повний рік', () => {
      // Неповний рік лишається окремим випадком, який називають явно: обрт,
      // відкритий раніше, працює всі дванадцять місяців.
      expect(razdobljeZa(pravilaIzTesta).brojMjeseci).toBe(PUNIH_MJESECI)
      expect(jePunoRazdoblje(razdobljeZa(pravilaIzTesta))).toBe(true)
      expect(jePunoRazdoblje(razdoblje({ mjesec: 8 }))).toBe(false)
    })

    it('період за замовчуванням рахує так само, як відкриття в січні', () => {
      expect(
        izracunajPausalniObrtZaRazdoblje(eur('12000'), razdobljeZa(pravilaIzTesta), podloga2026),
      ).toEqual(ishodZa('12000', { mjesec: 1 }))
    })

    it('веде саму кількість місяців до статті, за якою її пораховано', () => {
      // Що місяців п’ять, а не чотири — висновок норми, а не календаря: на
      // ньому стоїть увесь розрахунок, тож і він мусить вести до статті.
      const brojMjeseci = brojMjeseciDjelatnosti(razdoblje({ mjesec: 8 }))

      expect(brojMjeseci.value).toBe(5)
      expect(brojMjeseci.source.article).toBe(pravilaIzTesta.brojanjeMjeseci.article)
      // Норма підрахунку місяців — не та сама, що норма розмірності.
      expect(brojMjeseci.source.article).not.toBe(CLANAK_RAZMJERNOSTI)
    })
  })

  describe('межі розрядів масштабуються', () => {
    it('той самий primitak потрапляє у вищий razred, коли рік неповний', () => {
      // 12 000 € за повний рік — другий розряд зі стелею 15 300 €. Ті самі
      // 12 000 € за п’ять місяців дають середній місячний 2 400 €, тобто
      // річний 28 800 €, — це вже четвертий розряд, бо його стеля за п’ять
      // місяців становить 12 750 €.
      expect(razredZa('12000', { mjesec: 1 })).toBe(2)
      expect(razredZa('12000', { mjesec: 8 })).toBe(4)
    })

    it('зсув розряду видно і в грудні, де період найкоротший', () => {
      expect(razredZa('1000', { mjesec: 1 })).toBe(1)
      expect(razredZa('1000', { mjesec: 12 })).toBe(2)
    })

    it('масштабована межа стоїть там, де її ставить розмірність', () => {
      // Розряд 1 за півроку: 11 300 € × 6/12 = 5 650,00 €.
      expect(toCentString(pausal('5650', { mjesec: 7 }).razred?.gornjaGranica ?? eur(0))).toBe(
        '5650.00',
      )
      expect(razredZa('5650', { mjesec: 7 })).toBe(1)
      expect(razredZa('5650.01', { mjesec: 7 })).toBe(2)
    })

    it('розряд неповного року рухає сам податок, а не лише ділить річний', () => {
      // Якби межі не масштабувалися, платник лишився б у другому розряді і
      // податок за п’ять місяців був би 2 295 € × 5/12 × 12% = 114,75 €.
      // Масштабування переносить його в четвертий: 4 590 € × 5/12 × 12%.
      expect(toCentString(pausal('12000', { mjesec: 8 }).porez.godisnjiIznos)).toBe('229.50')
      expect(toCentString(pausal('12000', { mjesec: 8 }).porez.poreznaOsnovica)).toBe('1912.50')
    })

    it.each(SVI_MJESECI)(
      'розряд за масштабованою межею збігається з розрядом за річним primitak акта (місяць %i)',
      (mjesec) => {
        // Акт формулює правило навпаки: бере середній місячний primitak і
        // множить його на 12, щоб дістати річний, за яким шукає розряд.
        // Масштабування межі — те саме порівняння, і ця рівність його доводить.
        const brojMjeseci = mjeseci({ mjesec })

        for (const primitak of PRIMITCI) {
          const godisnji = new Decimal(primitak).div(brojMjeseci).times(PUNIH_MJESECI)

          expect([primitak, razredZa(primitak, { mjesec })]).toEqual([
            primitak,
            godisnjiRazredZa(godisnji),
          ])
        }
      },
    )

    it('веде масштабовану межу до статті про розмірність, а не до таблиці розрядів', () => {
      // Число 12 750 € у таблиці акта не надруковане — його дала розмірність.
      // Посилання на таблицю тут збрехало б про походження числа (ADR-0002).
      expect(pausal('12000', { mjesec: 8 }).razred?.izvor.article).toBe(CLANAK_RAZMJERNOSTI)
    })

    it('за повний рік межа лишається статтею з таблицею розрядів', () => {
      expect(pausal('12000', { mjesec: 1 }).razred?.izvor.article).toBe(
        ruleset2026.pausalniObrt.razredi.source.article,
      )
    })
  })

  describe('податок і doprinosi за фактичний період', () => {
    it('рахує doprinosi за місяцями діяльності, а не за роком', () => {
      // 797,20 € × 36,5% × 5 місяців.
      const { moPrviStup, moDrugiStup, zo, ukupnoGodisnje } = pausal('12000', {
        mjesec: 8,
      }).doprinosi

      expect(toCentString(moPrviStup.godisnjiIznos)).toBe('597.90')
      expect(toCentString(moDrugiStup.godisnjiIznos)).toBe('199.30')
      expect(toCentString(zo.godisnjiIznos)).toBe('657.69')
      expect(toCentString(ukupnoGodisnje)).toBe('1454.89')
    })

    it('не чіпає місячну osnovica: ділиться кількість місяців, а не база', () => {
      // Розмірність скорочує період, а не базу нарахування. Порахована на
      // місяць osnovica мусить лишитися тією самою, що й за повний рік, —
      // інакше картка показувала б вигадану місячну суму.
      expect(toCentString(pausal('12000', { mjesec: 8 }).doprinosi.mjesecnaOsnovica)).toBe('797.20')
      expect(toCentString(pausal('900', { mjesec: 12 }).doprinosi.mjesecnaOsnovica)).toBe('797.20')
    })

    it('у рік відкриття komorski doprinos ділити немає чого', () => {
      // Єдиний обов’язковий платіж, який платить кожен `obrt` незалежно від
      // режиму, у рік відкриття не нараховується взагалі: новий `obrt`
      // звільнений на перші два роки. Розмірне ділення тут не потрібне — і
      // застосувати його означало б показати суму там, де закон її не бере.
      // Поза звільненням цей платіж ділиться не на місяці, а на 365 днів
      // (čl. 9. Odluke), тож `razmjernoRazdoblju` до нього не прикладається.
      expect(komorskiDoprinos({ uPrveDvijeGodine: true }).kind).toBe('not-applicable')
    })

    it('лишає людині primitak без податку і без внесків за той самий період', () => {
      // 12 000,00 − 229,50 − 1 454,89.
      expect(toCentString(pausal('12000', { mjesec: 8 }).netoZaOsobu)).toBe('10315.61')
    })

    it('рахує ефективну ставку від платежів того самого періоду', () => {
      // (229,50 + 1 454,89) / 12 000.
      expect(pausal('12000', { mjesec: 8 }).efektivnaStopa?.toFixed(8)).toBe('0.14036583')
    })

    it('зводить будь-яку річну суму до фактичного періоду', () => {
      // Тим самим множником рахуються обов’язкові платежі поза податками
      // та внесками, які закон установлює на повний рік.
      expect(toCentString(razmjernoRazdoblju(eur('1200'), razdoblje({ mjesec: 8 })))).toBe('500.00')
      expect(toCentString(razmjernoRazdoblju(eur('1200'), razdoblje({ mjesec: 12 })))).toBe(
        '100.00',
      )
      expect(toCentString(razmjernoRazdoblju(eur('1200'), razdobljeZa(pravilaIzTesta)))).toBe(
        '1200.00',
      )
    })
  })

  describe('відкриття в січні', () => {
    it.each(PRIMITCI)(
      'primitak %s дає той самий результат, що й річний розрахунок, до останнього поля',
      (primitak) => {
        // Січень — це і є повний рік. Рівність перевіряється глибоко, а не за
        // однією сумою: розійтися можуть і ставка, і джерело, і ефективна
        // ставка, і кожна складова doprinosi.
        expect(ishodZa(primitak, { mjesec: 1 })).toEqual(
          izracunajPausalniObrt(eur(primitak), podloga2026),
        )
      },
    )

    it('однаково відмовляє рахувати на суперечливому наборі правил', () => {
      const bezVrhaTablice: Podloga = {
        ruleset: {
          ...ruleset2026,
          pausalniObrt: {
            ...ruleset2026.pausalniObrt,
            razredi: {
              ...ruleset2026.pausalniObrt.razredi,
              value: ruleset2026.pausalniObrt.razredi.value.slice(0, -1),
            },
          },
        },
        pretpostavke: pretpostavke2026,
      }

      expect(ishodZa('55000', { mjesec: 1 }, bezVrhaTablice)).toEqual(
        izracunajPausalniObrt(eur('55000'), bezVrhaTablice),
      )
    })
  })

  describe('відкриття в грудні', () => {
    it('рахує один місяць податку і один місяць внесків', () => {
      const { porez, doprinosi, netoZaOsobu } = pausal('900', { mjesec: 12 })

      // 1 695 € × 1/12 = 141,25 € × 12%.
      expect(toCentString(porez.poreznaOsnovica)).toBe('141.25')
      expect(toCentString(porez.godisnjiIznos)).toBe('16.95')
      // 797,20 € × 36,5% × 1 місяць.
      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('290.98')
      // 900,00 − 16,95 − 290,978.
      expect(toCentString(netoZaOsobu)).toBe('592.07')
    })

    it('дає рівно дванадцяту частину річного платежу за тим самим розрядом', () => {
      const godisnji = izracunajPausalniObrt(eur('11300'), podloga2026)
      if (godisnji.status !== 'izracunato') throw new Error('Річний розряд мав би порахуватися')

      // 900 € за грудень і 11 300 € за рік — обидва в першому розряді, тож
      // грудневий податок мусить бути рівно дванадцятою частиною річного.
      expect(toCentString(pausal('900', { mjesec: 12 }).porez.godisnjiIznos)).toBe(
        toCentString(eur(godisnji.izracun.porez.godisnjiIznos.amount.div(PUNIH_MJESECI))),
      )
    })
  })

  describe('недоступність', () => {
    it('понад поріг паушалу відмовляє тим самим поясненням, що й річний розрахунок', () => {
      // Поріг міряється за календарний рік, а не за періодом діяльності, тож
      // і пояснення тут те саме — переписувати його наново означало б дати
      // двом текстам розійтися.
      expect(ishodZa('60000.01', { mjesec: 8 })).toEqual(
        izracunajPausalniObrt(eur('60000.01'), podloga2026),
      )
    })

    it('річний primitak поза таблицею розрядів пояснює саме розмірність', () => {
      // 30 000 € за п’ять місяців — це 72 000 € річних, і такого розряду
      // таблиця не має. Мовчки взяти верхній розряд означало б занизити
      // податок, не сказавши про це.
      const razlog = razlogNedostupnosti('30000', { mjesec: 8 })

      expect(razlog).toContain('72 000,00 €')
      expect(razlog).toContain('30 000,00 €')
      expect(razlog).toContain(CLANAK_RAZMJERNOSTI)
    })
  })

  describe('чистота', () => {
    it('на однакових входах дає однаковий результат і нічого не запам’ятовує', () => {
      expect(ishodZa('12000', { mjesec: 8 })).toEqual(ishodZa('12000', { mjesec: 8 }))
    })

    it('не питає в системи, який сьогодні місяць: період приходить входом', () => {
      // Той самий вхід за будь-якого стану годинника дає той самий розряд.
      // Якби модуль брав «зараз» із `new Date()`, ця рівність трималася б
      // лише в межах одного місяця.
      expect(razredZa('12000', { mjesec: 8 })).not.toBe(razredZa('12000', { mjesec: 12 }))
      expect(razredZa('12000', { mjesec: 8 })).toBe(4)
    })
  })
})
