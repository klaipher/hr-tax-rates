// TODO(злиття): замінити на `@hr-tax/data`, коли `packages/data/src/index.ts`
// експортуватиме модуль. Файл індексу належить злиттю гілок, а не цьому
// тікету, тож поки що правила доводиться діставати шляхом.
import {
  assertMatchesHok,
  type HokCellRef,
  hokFormula,
  hokRawValue,
  jedinicaBySifra,
  obrtNaDohodak2026,
  type ParStopa,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { eur, type Money, toCentString } from './money.ts'
import {
  type IzdaciPoStavkama,
  izracunajObrtNaDohodak,
  type PodlogaObrtaNaDohodak,
  type UnosObrtaNaDohodak,
} from './obrt-na-dohodak.ts'
import type { Izracun } from './types.ts'
import { jediniPorez } from './types.ts'

/**
 * Місячна `osnovica` там, де закон її має. У діяльності поряд із наймом її
 * немає — тест, який туди зазирає, помиляється в припущенні, тож падає.
 */
const mjesecnaOsnovicaIliPad = (doprinosi: {
  readonly mjesecnaOsnovica: Money<'EUR'> | undefined
}): Money<'EUR'> => {
  const { mjesecnaOsnovica } = doprinosi
  if (mjesecnaOsnovica === undefined) throw new Error('Цей режим не має місячної osnovica')
  return mjesecnaOsnovica
}

const MJESECI_U_GODINI = 12

const podloga: PodlogaObrtaNaDohodak = {
  ruleset: ruleset2026,
  pretpostavke: pretpostavke2026,
  obrtNaDohodak: obrtNaDohodak2026,
}

/**
 * Ставки за замовчуванням у тестах: 23 % і 33 % — стеля, яку закон дозволяє
 * лише Загребу, і саме їх припускає калькулятор HOK.
 *
 * Літералом, а не з довідника: тут перевіряється арифметика прогресії, і
 * очікування не мають розсипатися від того, що якась одиниця ухвалила нову
 * `odluka`. Що довідник справді доходить до розрахунку — окремий тест нижче.
 */
const STOPE: ParStopa = { niza: 2300, visa: 3300 }

const BEZ_IZDATAKA: IzdaciPoStavkama = {
  najamnina: eur(0),
  nabavkaRobe: eur(0),
  nabavkaUsluga: eur(0),
  placeRadnika: eur(0),
  troskoviBanke: eur(0),
  reprezentacija: eur(0),
  osobnoVozilo: eur(0),
  ostalo: eur(0),
}

interface Argumenti {
  readonly primitak?: Decimal.Value
  readonly izdaci?: Partial<IzdaciPoStavkama>
  readonly clanoviUzeObitelji?: number
  readonly djeca?: number
  readonly stope?: ParStopa
}

const unos = ({
  primitak = 0,
  izdaci = {},
  clanoviUzeObitelji = 0,
  djeca = 0,
  stope = STOPE,
}: Argumenti = {}): UnosObrtaNaDohodak => ({
  godisnjiPrimitak: eur(primitak),
  godisnjiIzdaci: { ...BEZ_IZDATAKA, ...izdaci },
  uzdrzavani: { clanoviUzeObitelji, djeca },
  stope,
})

const izracunaj = (argumenti: Argumenti = {}): Izracun => {
  const ishod = izracunajObrtNaDohodak(unos(argumenti), podloga)
  if (ishod.status !== 'izracunato') {
    throw new Error(`Режим недоступний: ${ishod.razlog}`)
  }
  return ishod.izracun
}

/** Річні `doprinosi` за коефіцієнтом 0,65: 1 993 × 0,65 × 36,5 % × 12. */
const GODISNJI_DOPRINOSI = new Decimal('5674.071')

/** Річний `osobni odbitak` без утриманців: 600 × 12. */
const GODISNJI_ODBITAK_BEZ_UZDRZAVANIH = new Decimal('7200')

/**
 * `primitak`, за якого `porezna osnovica` лишається під порогом вищої ставки.
 *
 * Навмисно не 60 000: там стоять аж два різні пороги — стеля паушалу по
 * `primitak` і поріг вищої ставки по `porezna osnovica`, — і збіг чисел у
 * тесті читався б як зв'язок, якого немає.
 */
const PRIMITAK_POD_PRAGOM = 70000

/**
 * `porezna osnovica` (база оподаткування) розрахунку.
 *
 * Не `osnovica`: у цьому глосарії так зветься база нарахування внесків, і вона
 * тут інша — `doprinosi.mjesecnaOsnovica` (CONTEXT.md).
 */
const poreznaOsnovicaZa = (argumenti: Argumenti): Decimal =>
  jediniPorez(izracunaj(argumenti)).poreznaOsnovica.amount

describe('obrt na dohodak', () => {
  describe('izdaci за статтями', () => {
    const referentnaPoreznaOsnovica = poreznaOsnovicaZa({ primitak: PRIMITAK_POD_PRAGOM })

    const smanjenjePorezneOsnovice = (izdaci: Partial<IzdaciPoStavkama>): string =>
      referentnaPoreznaOsnovica
        .minus(poreznaOsnovicaZa({ primitak: PRIMITAK_POD_PRAGOM, izdaci }))
        .toFixed(2)

    it('статті без обмеження зменшують базу повністю', () => {
      expect(smanjenjePorezneOsnovice({ najamnina: eur(4000), nabavkaRobe: eur(6000) })).toBe(
        '10000.00',
      )
    })

    it('reprezentacija визнається наполовину', () => {
      expect(smanjenjePorezneOsnovice({ reprezentacija: eur(10000) })).toBe('5000.00')
    })

    it('витрати на особистий автомобіль визнаються наполовину', () => {
      expect(smanjenjePorezneOsnovice({ osobnoVozilo: eur(10000) })).toBe('5000.00')
    })

    it('вантажний автомобіль обмеження не має — він не «особистий»', () => {
      // Стаття HOK «ostali troškovi (uključivo troškovi teretnog vozila)»
      // існує саме тому, що čl. 33. st. 1. t. 5. говорить про засоби
      // особистого перевезення, а не про будь-який транспорт.
      expect(smanjenjePorezneOsnovice({ ostalo: eur(10000) })).toBe('10000.00')
    })

    it.each([
      ['najamnina', { najamnina: eur(1000) }],
      ['nabavkaRobe', { nabavkaRobe: eur(1000) }],
      ['nabavkaUsluga', { nabavkaUsluga: eur(1000) }],
      ['placeRadnika', { placeRadnika: eur(1000) }],
      ['troskoviBanke', { troskoviBanke: eur(1000) }],
      ['ostalo', { ostalo: eur(1000) }],
    ] as const)('стаття %s доходить до розрахунку, а не губиться', (_naziv, izdaci) => {
      expect(smanjenjePorezneOsnovice(izdaci)).toBe('1000.00')
    })

    it('doprinosi самі є визнаним izdatak і зменшують dohodak', () => {
      // čl. 32. st. 6.: сплачені обов'язкові внески входять у poslovni izdaci.
      // Без цього база була б завищена на всю річну суму внесків.
      expect(referentnaPoreznaOsnovica.toFixed(2)).toBe(
        new Decimal(PRIMITAK_POD_PRAGOM)
          .minus(GODISNJI_DOPRINOSI)
          .minus(GODISNJI_ODBITAK_BEZ_UZDRZAVANIH)
          .toFixed(2),
      )
    })
  })

  describe('osobni odbitak', () => {
    it('утриманець із близької родини додає половину основного розміру', () => {
      // 600 × 0,5 × 12 = 3 600 €
      const bez = poreznaOsnovicaZa({ primitak: PRIMITAK_POD_PRAGOM })
      const zJednim = poreznaOsnovicaZa({ primitak: PRIMITAK_POD_PRAGOM, clanoviUzeObitelji: 1 })

      expect(bez.minus(zJednim).toFixed(2)).toBe('3600.00')
    })

    it('утриманець і двоє дітей рахуються за своїми коефіцієнтами', () => {
      // 600 × (1 + 0,5 + 0,5 + 0,7) × 12 = 19 440 €
      const poreznaOsnovica = poreznaOsnovicaZa({
        primitak: PRIMITAK_POD_PRAGOM,
        clanoviUzeObitelji: 1,
        djeca: 2,
      })

      expect(poreznaOsnovica.toFixed(2)).toBe(
        new Decimal(PRIMITAK_POD_PRAGOM)
          .minus(GODISNJI_DOPRINOSI)
          .minus(new Decimal('19440'))
          .toFixed(2),
      )
    })

    it('кожна наступна дитина додає більше за попередню', () => {
      // Коефіцієнти 0,5 / 0,7 / 1,0 за рік: 3 600, 5 040, 7 200 €. Саме тут
      // видно, що шкала прогресивна, а не «стільки ж за кожну дитину».
      const osnovice = [0, 1, 2, 3].map((djeca) => poreznaOsnovicaZa({ primitak: 200000, djeca }))
      const smanjenja = osnovice.slice(1).map((poreznaOsnovica, index) => {
        const prethodna = osnovice[index]
        return prethodna === undefined ? '—' : prethodna.minus(poreznaOsnovica).toFixed(2)
      })

      expect(smanjenja).toEqual(['3600.00', '5040.00', '7200.00'])
    })

    it('на десятій дитині режим чесно каже, що рахувати нема з чого', () => {
      const ishod = izracunajObrtNaDohodak(
        unos({ primitak: PRIMITAK_POD_PRAGOM, djeca: 10 }),
        podloga,
      )

      expect(ishod.status).toBe('nedostupno')
      if (ishod.status !== 'nedostupno') return
      expect(ishod.razlog).toContain('čl. 14. st. 3.')
    })

    it("дев'ятеро дітей ще рахуються", () => {
      expect(
        izracunajObrtNaDohodak(unos({ primitak: PRIMITAK_POD_PRAGOM, djeca: 9 }), podloga).status,
      ).toBe('izracunato')
    })

    it.each([
      ["від'ємна кількість дітей", { djeca: -1 }],
      ['дробова кількість дітей', { djeca: 1.5 }],
      ["від'ємна кількість утриманців", { clanoviUzeObitelji: -1 }],
      ['дробова кількість утриманців', { clanoviUzeObitelji: 0.5 }],
    ] as const)('%s — це не відповідь, а помилка виклику', (_naziv, argumenti) => {
      expect(() => izracunajObrtNaDohodak(unos(argumenti), podloga)).toThrow()
    })
  })

  describe('прогресія', () => {
    it('нижча ставка застосовується до всієї бази під порогом', () => {
      const porez = jediniPorez(izracunaj({ primitak: PRIMITAK_POD_PRAGOM }))

      expect(porez.poreznaOsnovica.amount.lessThan(60000)).toBe(true)
      expect(toCentString(porez.godisnjiIznos)).toBe(
        porez.poreznaOsnovica.amount.times('0.23').toFixed(2),
      )
    })

    it('вища ставка бере лише перевищення над порогом', () => {
      const porez = jediniPorez(izracunaj({ primitak: 150000 }))
      const poreznaOsnovica = porez.poreznaOsnovica.amount

      expect(poreznaOsnovica.greaterThan(60000)).toBe(true)
      expect(toCentString(porez.godisnjiIznos)).toBe(
        new Decimal(60000)
          .times('0.23')
          .plus(poreznaOsnovica.minus(60000).times('0.33'))
          .toFixed(2),
      )
    })

    it('на самому порозі вища ставка ще не нараховується', () => {
      // Поріг належить нижчій ставці: čl. 19. каже «na poreznu osnovicu do
      // visine 60.000,00 eura», а вища йде на «dio koji prelazi».
      const naPragu = new Decimal(60000)
        .plus(GODISNJI_DOPRINOSI)
        .plus(GODISNJI_ODBITAK_BEZ_UZDRZAVANIH)
      const porez = jediniPorez(izracunaj({ primitak: naPragu }))

      expect(toCentString(porez.poreznaOsnovica)).toBe('60000.00')
      expect(toCentString(porez.godisnjiIznos)).toBe('13800.00')
    })

    it('на євро понад поріг вища ставка вмикається', () => {
      const iznadPraga = new Decimal(60001)
        .plus(GODISNJI_DOPRINOSI)
        .plus(GODISNJI_ODBITAK_BEZ_UZDRZAVANIH)
      const porez = jediniPorez(izracunaj({ primitak: iznadPraga }))

      expect(toCentString(porez.poreznaOsnovica)).toBe('60001.00')
      expect(toCentString(porez.godisnjiIznos)).toBe('13800.33')
    })

    it('нижча ставка міста рухає лише податок, а не базу', () => {
      const najniza: ParStopa = { niza: 1500, visa: 2500 }
      const uOpcini = jediniPorez(izracunaj({ primitak: PRIMITAK_POD_PRAGOM, stope: najniza }))
      const uZagrebu = jediniPorez(izracunaj({ primitak: PRIMITAK_POD_PRAGOM }))

      expect(toCentString(uOpcini.poreznaOsnovica)).toBe(toCentString(uZagrebu.poreznaOsnovica))
      expect(toCentString(uOpcini.godisnjiIznos)).toBe(
        uOpcini.poreznaOsnovica.amount.times('0.15').toFixed(2),
      )
      expect(toCentString(uZagrebu.godisnjiIznos)).not.toBe(toCentString(uOpcini.godisnjiIznos))
    })

    it('ставки справжньої одиниці з довідника доходять до розрахунку', () => {
      // Тут перевіряється саме шов із довідником 556 одиниць, а не арифметика:
      // очікування виводиться зі ставки самої одиниці, тож нова `odluka`
      // Загреба тест не зламає — зламає його лише втрачений шов.
      const zagreb = jedinicaBySifra('1333')
      if (zagreb === undefined) throw new Error('У довіднику немає одиниці з шифрою 1333 (ZAGREB)')

      const porez = jediniPorez(izracunaj({ primitak: PRIMITAK_POD_PRAGOM, stope: zagreb.stope }))

      expect(porez.poreznaOsnovica.amount.lessThan(60000)).toBe(true)
      expect(toCentString(porez.godisnjiIznos)).toBe(
        porez.poreznaOsnovica.amount.times(new Decimal(zagreb.stope.niza).div(10000)).toFixed(2),
      )
    })

    it("база не буває від'ємною — збиток не породжує від'ємного податку", () => {
      const porez = jediniPorez(izracunaj({ primitak: 1000 }))

      expect(toCentString(porez.poreznaOsnovica)).toBe('0.00')
      expect(toCentString(porez.godisnjiIznos)).toBe('0.00')
    })

    it('показана ставка помножена на базу дає рівно суму податку', () => {
      // `Porez.stopa` — одне число, а ставок у режимі дві. Тому там лежить
      // ефективна ставка на базу, і ця рівність — її визначення.
      for (const primitak of [PRIMITAK_POD_PRAGOM, 150000, 400000]) {
        const porez = jediniPorez(izracunaj({ primitak }))

        expect(porez.poreznaOsnovica.amount.times(porez.stopa).toFixed(2)).toBe(
          toCentString(porez.godisnjiIznos),
        )
      }
    })

    it('ефективна ставка лежить між нижчою і вищою, коли працюють обидві', () => {
      const { stopa } = jediniPorez(izracunaj({ primitak: 150000 }))

      expect(stopa.greaterThan('0.23')).toBe(true)
      expect(stopa.lessThan('0.33')).toBe(true)
    })
  })

  describe('структура картки', () => {
    it('розрядів режим не знає', () => {
      expect(izracunaj({ primitak: PRIMITAK_POD_PRAGOM }).razred).toBeUndefined()
    })

    it('doprinosi розкладені на три складові, з яких лише II. stup персональний', () => {
      const { doprinosi } = izracunaj({ primitak: PRIMITAK_POD_PRAGOM })

      expect(toCentString(mjesecnaOsnovicaIliPad(doprinosi))).toBe('1295.45')
      expect([
        doprinosi.moPrviStup.osobnaStednja,
        doprinosi.moDrugiStup.osobnaStednja,
        doprinosi.zo.osobnaStednja,
      ]).toEqual([false, true, false])
      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe(GODISNJI_DOPRINOSI.toFixed(2))
    })

    it('податок зветься так, як його зве закон', () => {
      expect(jediniPorez(izracunaj({ primitak: PRIMITAK_POD_PRAGOM })).naziv).toEqual({
        hr: 'porez na dohodak',
        uk: 'податок на дохідок',
      })
    })

    it('податок веде до čl. 19., звідки закон бере обидві ставки', () => {
      const { izvor } = jediniPorez(izracunaj({ primitak: PRIMITAK_POD_PRAGOM }))

      expect(izvor.act).toBe('Zakon o porezu na dohodak')
      expect(izvor.article).toBe('čl. 19.')
    })

    it("efektivna stopa рахує всі обов'язкові платежі разом", () => {
      const izracunZaTest = izracunaj({ primitak: PRIMITAK_POD_PRAGOM })
      const { doprinosi, efektivnaStopa } = izracunZaTest
      const porez = jediniPorez(izracunZaTest)

      expect(efektivnaStopa?.toFixed(6)).toBe(
        porez.godisnjiIznos.amount
          .plus(doprinosi.ukupnoGodisnje.amount)
          .div(PRIMITAK_POD_PRAGOM)
          .toFixed(6),
      )
    })

    it('за нульового primitak ділити немає на що', () => {
      expect(izracunaj().efektivnaStopa).toBeUndefined()
    })

    it('на руки лишається dohodak без податку', () => {
      const izracunZaTest = izracunaj({
        primitak: PRIMITAK_POD_PRAGOM,
        izdaci: { najamnina: eur(4000) },
      })
      const { doprinosi, netoZaOsobu } = izracunZaTest
      const porez = jediniPorez(izracunZaTest)

      expect(toCentString(netoZaOsobu)).toBe(
        new Decimal(PRIMITAK_POD_PRAGOM)
          .minus(4000)
          .minus(doprinosi.ukupnoGodisnje.amount)
          .minus(porez.godisnjiIznos.amount)
          .toFixed(2),
      )
    })
  })

  describe('голден-тести проти калькулятора HOK 2026', () => {
    /**
     * Стовпець B аркуша HOK — «OBRT obveznik poreza na dohodak».
     *
     * У збережених книгах усі входи нульові, тож кешовані значення комірок —
     * це розрахунок за `primitak` 0 і `izdatak` 0. Звірка йде через
     * `assertMatchesHok`, який валить виклик на будь-якій розбіжності, не
     * внесеній у реєстр (ADR-0003); твердження про `match` іде понад те —
     * поява запису про ці комірки має стати видимою, а не мовчки пройти.
     */
    const dohodovnaCelija = (cell: string): HokCellRef => ({
      scenario: 'in-force-2026',
      sheet: 'PREGLED MOGUĆNOSTI ',
      cell,
    })

    const uHok = (cell: string, actual: Money<'EUR'>) =>
      assertMatchesHok({ ...dohodovnaCelija(cell), actual: toCentString(actual) })

    const izracun = izracunaj()

    it('стовпець B — це справді обрт на дохідок', () => {
      // Сторож від зсуву фікстури: якби стовпці роз'їхалися, тести нижче
      // мовчки звіряли б нас із паушалом або з обртом у системі porez na dobit.
      expect(hokRawValue(dohodovnaCelija('B2'))).toBe('OBRT obveznik poreza na dohodak')
    })

    it('місячні doprinosi сходяться (B5)', () => {
      const mjesecno = eur(izracun.doprinosi.ukupnoGodisnje.amount.div(MJESECI_U_GODINI))

      expect(uHok('B5', mjesecno).status).toBe('match')
    })

    it('річні doprinosi сходяться (B6)', () => {
      expect(uHok('B6', izracun.doprinosi.ukupnoGodisnje).status).toBe('match')
    })

    it('база оподаткування сходиться (B12)', () => {
      expect(uHok('B12', jediniPorez(izracun).poreznaOsnovica).status).toBe('match')
    })

    it('річна податкова повинність сходиться (B19)', () => {
      expect(uHok('B19', izracun.ukupanPorez).status).toBe('match')
    })

    it('сума, що лишається обртнику за рік, сходиться (B21)', () => {
      expect(uHok('B21', izracun.netoZaOsobu).status).toBe('match')
    })

    it('вища ставка нараховується там, де формула HOK повертає нуль (B15)', () => {
      // Єдине місце, де ми навмисно розходимося з палатою. Її формула порівнює
      // всю базу з добутком 60 000 × перевищення і не має гілки «інакше», тож
      // повертає 0 за будь-яких входів; розбіжність зареєстрована як
      // `higher-rate-formula-always-zero` із посиланням на čl. 19 (ADR-0003).
      // Значенням її не зловити — у книзі всі входи нульові, і там нуль правда.
      expect(hokFormula(dohodovnaCelija('B15'))).toContain('>=60000*((')

      const porez = jediniPorez(izracunaj({ primitak: 150000 }))
      const samoNizom = porez.poreznaOsnovica.amount.times('0.23')

      expect(porez.godisnjiIznos.amount.greaterThan(samoNizom)).toBe(true)
    })
  })
})
