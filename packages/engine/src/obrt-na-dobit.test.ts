import {
  assertMatchesHok,
  type Divergence,
  type HokCellRef,
  hokCell,
  hokFormula,
  hokRawValue,
  type ParStopa,
  pretpostavke2026,
  ruleset2026,
  ZAKON_O_DOPRINOSIMA,
} from '@hr-tax/data'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
// Правила ще не проходять через `index.ts` пакета: барель належить злиттю
// гілок. Після нього імпорт стане пакетним, шлях — зникне.
import { obrtNaDobit2026 } from '../../data/src/rules/porez-na-dobit.ts'
import { eur, toCentString } from './money.ts'
import { izracunajObrtNaDobit, type UlazObrtNaDobit } from './obrt-na-dobit.ts'
import type { Podloga } from './types.ts'

/**
 * `obrt na dobit` — режим із трьома різними податками під двома законами.
 *
 * Тест тримає їх нарізно навмисно: `porez na dobit` рахується з `dobit` за
 * методом нарахування, податок із `poduzetnička plaća` — із плаће за
 * законом про `porez na dohodak`, а податок на виплату — з того, що
 * лишилося після перших двох. Зведені в одну суму, вони перестають
 * пояснювати, звідки взялися.
 */

const podloga2026: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

/** Ставки `porez na dohodak` Града Загреба — стеля дозволеного законом. */
const ZAGREB: ParStopa = { niza: 2300, visa: 3300 }

const izracunaj = (ulaz: Partial<UlazObrtNaDobit> = {}) =>
  izracunajObrtNaDobit(
    {
      godisnjiPrihod: eur('60000'),
      godisnjiRashod: eur('10000'),
      stopePorezaNaDohodak: ZAGREB,
      ...ulaz,
    },
    podloga2026,
    obrtNaDobit2026,
  )

const porez = (izracun: ReturnType<typeof izracunaj>, hr: string) => {
  const found = izracun.porezi.find((kandidat) => kandidat.naziv.hr === hr)
  if (found === undefined) throw new Error(`У розбивці немає податку «${hr}»`)
  return found
}

describe('izracunajObrtNaDobit', () => {
  describe('poduzetnička plaća', () => {
    it('бере osnovica з prosječna plaća та koeficijent 1,1, коли плаћу не задано', () => {
      // 1 993,00 × 1,1 = 2 192,30 — та сама сума, що її друкує Naredba.
      const { poduzetnickaPlaca } = izracunaj()

      expect(toCentString(poduzetnickaPlaca.mjesecniIznos)).toBe('2192.30')
      expect(toCentString(poduzetnickaPlaca.godisnjiIznos)).toBe('26307.60')
    })

    it('не дає опуститися нижче за найнижчу osnovica', () => {
      // Закон не забороняє виплатити собі менше — але внески однаково
      // рахує від найнижчої osnovica, тож нижче за неї модель не йде.
      const { poduzetnickaPlaca } = izracunaj({ mjesecnaPoduzetnickaPlaca: eur('1000') })

      expect(toCentString(poduzetnickaPlaca.mjesecniIznos)).toBe('2192.30')
    })

    it('приймає вищу плаћу, коли власник її призначив', () => {
      const { poduzetnickaPlaca } = izracunaj({ mjesecnaPoduzetnickaPlaca: eur('5000') })

      expect(toCentString(poduzetnickaPlaca.mjesecniIznos)).toBe('5000.00')
      expect(toCentString(poduzetnickaPlaca.godisnjiIznos)).toBe('60000.00')
    })

    it('розводить внески з плаће і на плаћу — це різні кишені', () => {
      // 20% MO утримуються з плаће самого власника, 16,5% ZO обрт платить
      // понад неї. Разом ті самі 36,5%, але зменшують вони різне.
      const { poduzetnickaPlaca } = izracunaj()

      expect(toCentString(poduzetnickaPlaca.doprinosiIzPlace)).toBe('5261.52')
      expect(toCentString(poduzetnickaPlaca.doprinosiNaPlacu)).toBe('4340.75')
    })

    it('обидві кишені разом дають рівно ті самі внески, що й розбивка за видами', () => {
      // Два розрізи тих самих грошей: за кишенею і за видом страхування.
      // Розійтися вони не мають права — інакше десь загубився або
      // подвоївся внесок.
      const { poduzetnickaPlaca, doprinosi } = izracunaj({
        mjesecnaPoduzetnickaPlaca: eur('3333.33'),
      })
      const poKisenjama = poduzetnickaPlaca.doprinosiIzPlace.amount.plus(
        poduzetnickaPlaca.doprinosiNaPlacu.amount,
      )

      expect(poKisenjama.toFixed(2)).toBe(toCentString(doprinosi.ukupnoGodisnje))
    })

    it('веде плаћу до статті, що робить її osnovica внесків', () => {
      expect(izracunaj().poduzetnickaPlaca.izvor.article).toBe('čl. 82.')
    })

    it('оподатковує плаћу як плаћу: мінус внески з неї, мінус osobni odbitak', () => {
      // (2 192,30 − 438,46 − 600,00) × 23% × 12.
      const porezPlace = izracunaj().poduzetnickaPlaca.porez

      expect(toCentString(porezPlace.poreznaOsnovica)).toBe('13846.08')
      expect(toCentString(porezPlace.godisnjiIznos)).toBe('3184.60')
      expect(porezPlace.stopa.toString()).toBe('0.23')
    })

    it('бере вищу ставку лише понад місячний поріг 5 000 €', () => {
      // 7 500 − 1 500 − 600 = 5 400 на місяць: 5 000 за нижчою, 400 за вищою.
      const porezPlace = izracunaj({ mjesecnaPoduzetnickaPlaca: eur('7500') }).poduzetnickaPlaca
        .porez

      // (5 000 × 23% + 400 × 33%) × 12.
      expect(toCentString(porezPlace.godisnjiIznos)).toBe('15384.00')
      // Ставка в розбивці — фактична: закон дав дві, показати можна одну.
      expect(porezPlace.stopa.toFixed(6)).toBe('0.237407')
    })

    it('лишає власнику нето плаће після внесків із неї та податку', () => {
      // 26 307,60 − 5 261,52 − 3 184,5984.
      expect(toCentString(izracunaj().poduzetnickaPlaca.godisnjiNeto)).toBe('17861.48')
    })

    it('зменшує базу porez na dobit на брутто плаћу разом із внесками на неї', () => {
      const { poduzetnickaPlaca, dobitPrijeOporezivanja } = izracunaj()

      // 26 307,60 + 4 340,754 — податок і внески з плаће вже всередині брутто.
      expect(toCentString(poduzetnickaPlaca.trosakZaObrt)).toBe('30648.35')
      // 60 000 − 10 000 − 30 648,354.
      expect(toCentString(dobitPrijeOporezivanja)).toBe('19351.65')
    })
  })

  describe('porez na dobit', () => {
    it('бере нижчу ставку, поки prihodi не дійшли до порога', () => {
      const porezNaDobit = porez(izracunaj(), 'porez na dobit')

      expect(porezNaDobit.stopa.toString()).toBe('0.1')
      expect(toCentString(porezNaDobit.poreznaOsnovica)).toBe('19351.65')
      expect(toCentString(porezNaDobit.godisnjiIznos)).toBe('1935.16')
    })

    it('на порозі prihoda ставка вже вища', () => {
      // «jednaki ili veći od 1.000.000,00» — рівно мільйон уже за 18%.
      const naPragu = porez(izracunaj({ godisnjiPrihod: eur('1000000') }), 'porez na dobit')
      const centIspod = porez(izracunaj({ godisnjiPrihod: eur('999999.99') }), 'porez na dobit')

      expect(naPragu.stopa.toString()).toBe('0.18')
      expect(centIspod.stopa.toString()).toBe('0.1')
    })

    it('ставку рухає prihod, а не dobit', () => {
      // Мільйонна виручка з видатками під нуль прибутку — ставка все одно вища.
      const porezNaDobit = porez(
        izracunaj({ godisnjiPrihod: eur('1000000'), godisnjiRashod: eur('960000') }),
        'porez na dobit',
      )

      expect(porezNaDobit.stopa.toString()).toBe('0.18')
    })

    it('на збитку не нараховує нічого замість того, щоб рахувати від’ємний податок', () => {
      const izracun = izracunaj({ godisnjiPrihod: eur('10000'), godisnjiRashod: eur('0') })
      const porezNaDobit = porez(izracun, 'porez na dobit')

      expect(izracun.dobitPrijeOporezivanja.amount.isNegative()).toBe(true)
      expect(toCentString(porezNaDobit.poreznaOsnovica)).toBe('0.00')
      expect(toCentString(porezNaDobit.godisnjiIznos)).toBe('0.00')
    })

    it('веде податок до статті про ставку', () => {
      expect(porez(izracunaj(), 'porez na dobit').izvor.article).toBe('čl. 28. t. 1.')
      expect(
        porez(izracunaj({ godisnjiPrihod: eur('1000000') }), 'porez na dobit').izvor.article,
      ).toBe('čl. 28. t. 2.')
    })
  })

  describe('податок на виплату dobit власнику', () => {
    it('рахує 12% із прибутку, що лишився після porez na dobit', () => {
      const isplata = porez(izracunaj(), 'porez na dohodak od kapitala pri isplati dobiti')

      // 19 351,646 − 1 935,1646.
      expect(toCentString(isplata.poreznaOsnovica)).toBe('17416.48')
      expect(toCentString(isplata.godisnjiIznos)).toBe('2089.98')
      expect(isplata.stopa.toString()).toBe('0.12')
      expect(isplata.izvor.article).toBe('čl. 70. st. 19.')
    })

    it('на збитку нічого не нараховує — виплачувати немає чого', () => {
      const isplata = porez(
        izracunaj({ godisnjiPrihod: eur('10000'), godisnjiRashod: eur('0') }),
        'porez na dohodak od kapitala pri isplati dobiti',
      )

      expect(toCentString(isplata.godisnjiIznos)).toBe('0.00')
    })
  })

  describe('розбивка', () => {
    it('тримає три податки нарізно і в порядку, у якому вони настають', () => {
      expect(izracunaj().porezi.map(({ naziv }) => naziv.hr)).toEqual([
        'porez na dohodak iz poduzetničke plaće',
        'porez na dobit',
        'porez na dohodak od kapitala pri isplati dobiti',
      ])
    })

    it('називає кожен податок хорватською з українським перекладом поруч', () => {
      for (const { naziv } of izracunaj().porezi) {
        expect(naziv.hr.length).toBeGreaterThan(0)
        expect(naziv.uk.length).toBeGreaterThan(0)
      }
    })

    it('цитує два закони: один на dobit, другий на обидва dohodak', () => {
      expect(izracunaj().porezi.map(({ izvor }) => izvor.act)).toEqual([
        'Zakon o porezu na dohodak',
        'Zakon o porezu na dobit',
        'Zakon o porezu na dohodak',
      ])
    })

    it('розбиває внески на MO I. stup, MO II. stup і ZO від osnovica плаће', () => {
      const { doprinosi } = izracunaj()

      expect(toCentString(doprinosi.mjesecnaOsnovica)).toBe('2192.30')
      expect(toCentString(doprinosi.moPrviStup.godisnjiIznos)).toBe('3946.14')
      expect(toCentString(doprinosi.moDrugiStup.godisnjiIznos)).toBe('1315.38')
      expect(toCentString(doprinosi.zo.godisnjiIznos)).toBe('4340.75')
      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('9602.27')
    })
  })

  describe('на руки та ефективна ставка', () => {
    it('лишає людині prihod без rashod, без внесків і без усіх трьох податків', () => {
      // 60 000 − 10 000 − 9 602,274 − 3 184,5984 − 1 935,1646 − 2 089,977768.
      expect(toCentString(izracunaj().netoZaOsobu)).toBe('33187.99')
    })

    it('те саме число виходить і з розбивки: dobit плюс нето плаће мінус податки', () => {
      // Сторож від подвійного рахунку: брутто плаће вже сидить у витратах,
      // тож додати її ще раз означало б показати людині чужі гроші.
      const { dobitPrijeOporezivanja, poduzetnickaPlaca, porezi, netoZaOsobu } = izracunaj()
      const porezNaDobitIIsplata = porezi
        .filter(({ naziv }) => naziv.hr !== 'porez na dohodak iz poduzetničke plaće')
        .reduce((zbroj, { godisnjiIznos }) => zbroj.plus(godisnjiIznos.amount), new Decimal(0))

      const izRazbivke = dobitPrijeOporezivanja.amount
        .plus(poduzetnickaPlaca.godisnjiNeto.amount)
        .minus(porezNaDobitIIsplata)

      expect(izRazbivke.toFixed(2)).toBe(toCentString(netoZaOsobu))
    })

    it('рахує ефективну ставку від усіх обов’язкових платежів', () => {
      // (9 602,274 + 3 184,5984 + 1 935,1646 + 2 089,977768) / 60 000.
      expect(izracunaj().efektivnaStopa?.toFixed(6)).toBe('0.280200')
    })

    it('не має ефективної ставки за нульового prihod — ділити немає на що', () => {
      expect(izracunaj({ godisnjiPrihod: eur('0'), godisnjiRashod: eur('0') }).efektivnaStopa).toBe(
        undefined,
      )
    })
  })

  describe('чистота', () => {
    it('на однакових входах дає однаковий результат і нічого не запам’ятовує', () => {
      expect(izracunaj()).toEqual(izracunaj())
    })
  })

  describe('проти калькулятора HOK 2026', () => {
    const SCENARIO = 'in-force-2026' as const
    const PREGLED = 'PREGLED MOGUĆNOSTI '
    const BAZNIH_BODOVA_U_JEDINICI = 10000

    /** Ставки міста беруться з самої книги, а не вписані сюди руками. */
    const hokStope: ParStopa = {
      niza: new Decimal(
        hokRawValue({ scenario: SCENARIO, sheet: 'PRVO UNESITE PODATKE', cell: 'C20' }),
      )
        .times(BAZNIH_BODOVA_U_JEDINICI)
        .toNumber(),
      visa: new Decimal(
        hokRawValue({ scenario: SCENARIO, sheet: 'PRVO UNESITE PODATKE', cell: 'C21' }),
      )
        .times(BAZNIH_BODOVA_U_JEDINICI)
        .toNumber(),
    }

    /**
     * Розбіжності, які я вніс би до реєстру, якби він був у межах цієї
     * зміни (`packages/data/src/hok/divergences.ts` належить іншому файлу).
     *
     * Причина одна на всі три: місячні внески HOK рахує як
     * `2192.3*(0.2+0.165)+0.01`. Того цента немає в жодній статті — це
     * підгонка під красиве «800,20», і вона протікає в річні внески, у
     * `dobit` і в підсумок «лишається обртнику». Оракулом лишається закон
     * (ADR-0003), тож наші числа менші рівно на цей цент.
     */
    const PRIJEDLOG_REGISTRA: readonly Divergence[] = [
      {
        kind: 'formula',
        id: 'phantom-cent-in-poduzetnicka-placa-contributions',
        scenarios: ['in-force-2026'],
        sheet: PREGLED,
        cells: ['D5'],
        formulaContains: '+0.01',
        reason:
          'Місячні doprinosi obrta na dobit пораховані як osnovica × 36,5% плюс один цент, якого закон не знає. Zakon o doprinosima (čl. 82. st. 2.) робить osnovica добутком prosječna plaća і koeficijenta 1,1, а čl. 81. велить нарахувати на неї внески за ставками з čl. 13., 14. і 17. — жодного доданка понад це немає. Цент протікає в річні внески, у dobit і в підсумок.',
        reference: { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 82. st. 2.', checkedOn: '2026-08-04' },
      },
      {
        kind: 'value',
        id: 'phantom-cent-in-annual-contributions',
        scenarios: ['in-force-2026'],
        sheet: PREGLED,
        cell: 'D6',
        hokValue: '9602.39',
        ourValue: '9602.27',
        reason:
          'Річні doprinosi — це місячні × 12, тож фантомний цент із D5 виріс до 12 центів. Джерело помилки — формула D5.',
        reference: { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 82. st. 2.', checkedOn: '2026-08-04' },
      },
      {
        kind: 'value',
        id: 'phantom-cent-in-owner-net',
        scenarios: ['in-force-2026'],
        sheet: PREGLED,
        cell: 'D21',
        hokValue: '-12786.99',
        ourValue: '-12786.87',
        reason:
          'Сума, що лишається власнику, менша в HOK рівно на ті самі 12 центів завищених внесків із D5.',
        reference: { ...ZAKON_O_DOPRINOSIMA, article: 'čl. 82. st. 2.', checkedOn: '2026-08-04' },
      },
    ]

    /**
     * У збереженій книзі всі входи нульові: `prihod` і `rashod` — нулі, а
     * `poduzetnička plaća` — найнижча дозволена. Ставки міста беруться з
     * тієї самої книги.
     */
    const izracun = izracunajObrtNaDobit(
      { godisnjiPrihod: eur(0), godisnjiRashod: eur(0), stopePorezaNaDohodak: hokStope },
      podloga2026,
      obrtNaDobit2026,
    )

    const uHok = (cell: string, actual: Decimal, registar?: readonly Divergence[]) => {
      const ref: HokCellRef = { scenario: SCENARIO, sheet: PREGLED, cell }
      const usporedba = { ...ref, actual: actual.toString() }
      return registar === undefined
        ? assertMatchesHok(usporedba)
        : assertMatchesHok(usporedba, registar)
    }

    /**
     * У збереженій книзі всі входи нульові, тож кешовані значення D12–D19
     * — це нулі, і збіг із ними сам по собі нічого не доводить. Тому
     * ставки й `osnovica` звіряються з текстом формул: там числа HOK видно
     * незалежно від входів. Очікуване збирається з наших величин, а не
     * вписане рядком, інакше тест перевіряв би сам себе.
     */
    describe('числа з формул, а не з кешованих нулів', () => {
      /**
       * Витягує число з формули цілком, а не шукає підрядок: `*0.1`
       * знайшлося б і всередині `*0.12`, і тест мовчки пропустив би чужу
       * ставку.
       */
      const brojIzFormule = (cell: string, uzorak: RegExp): Decimal => {
        const [, broj] = uzorak.exec(hokFormula({ scenario: SCENARIO, sheet: PREGLED, cell })) ?? []
        if (broj === undefined)
          throw new Error(`У формулі ${cell} немає числа за ${String(uzorak)}`)
        return new Decimal(broj)
      }

      it('osnovica внесків збігається з тією, що вшита у формулу HOK (D5)', () => {
        expect(brojIzFormule('D5', /^([\d.]+)\*/).toString()).toBe(
          izracun.doprinosi.mjesecnaOsnovica.amount.toString(),
        )
      })

      it('ставка porez na dobit збігається зі ставкою у формулі HOK (D13)', () => {
        const stopaHok = brojIzFormule('D13', /D12\*([\d.]+)%/).div(100)

        expect(stopaHok.toString()).toBe(porez(izracun, 'porez na dobit').stopa.toString())
      })

      it('ставка податку на виплату збігається зі ставкою у формулі HOK (D18)', () => {
        const isplata = porez(izracun, 'porez na dohodak od kapitala pri isplati dobiti')

        expect(brojIzFormule('D18', /\)\*([\d.]+),/).toString()).toBe(isplata.stopa.toString())
      })
    })

    it('податок із poduzetnička plaća сходиться (D7)', () => {
      expect(uHok('D7', izracun.poduzetnickaPlaca.porez.godisnjiIznos.amount).status).toBe('match')
    })

    it('нето плаће за рік сходиться (D8)', () => {
      expect(uHok('D8', izracun.poduzetnickaPlaca.godisnjiNeto.amount).status).toBe('match')
    })

    it('база porez na dobit на збитку зрізана до нуля (D12)', () => {
      expect(uHok('D12', porez(izracun, 'porez na dobit').poreznaOsnovica.amount).status).toBe(
        'match',
      )
    })

    it('porez na dobit сходиться (D13)', () => {
      expect(uHok('D13', porez(izracun, 'porez na dobit').godisnjiIznos.amount).status).toBe(
        'match',
      )
    })

    it('податок на виплату dobit сходиться (D18)', () => {
      const isplata = porez(izracun, 'porez na dohodak od kapitala pri isplati dobiti')

      expect(uHok('D18', isplata.godisnjiIznos.amount).status).toBe('match')
    })

    it('річна податкова повинність режиму сходиться (D19)', () => {
      // D19 в HOK — це porez na dobit разом із податком на виплату; податок
      // із плаће туди не входить, він уже врахований у витратах.
      const ukupno = izracun.porezi
        .filter(({ naziv }) => naziv.hr !== 'porez na dohodak iz poduzetničke plaće')
        .reduce((zbroj, { godisnjiIznos }) => zbroj.plus(godisnjiIznos.amount), new Decimal(0))

      expect(uHok('D19', ukupno).status).toBe('match')
    })

    it('фантомний цент у внесках HOK досі в файлі', () => {
      // Сторож від застарілої пропозиції: якщо HOK виправить формулу, три
      // записи нижче стануть непотрібними і мають зникнути (ADR-0003).
      expect(hokCell({ scenario: SCENARIO, sheet: PREGLED, cell: 'D5' }).formula).toContain('+0.01')
    })

    it('річні doprinosi відрізняються рівно на фантомні 12 центів (D6)', () => {
      const provjera = uHok('D6', izracun.doprinosi.ukupnoGodisnje.amount, PRIJEDLOG_REGISTRA)

      expect(provjera.status).toBe('registered-divergence')
      expect(new Decimal(provjera.hok).minus(provjera.actual).toFixed(2)).toBe('0.12')
    })

    it('сума, що лишається власнику, відрізняється на ті самі 12 центів (D21)', () => {
      const provjera = uHok('D21', izracun.netoZaOsobu.amount, PRIJEDLOG_REGISTRA)

      expect(provjera.status).toBe('registered-divergence')
      expect(new Decimal(provjera.actual).minus(provjera.hok).toFixed(2)).toBe('0.12')
    })
  })
})
