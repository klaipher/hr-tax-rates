import {
  assertMatchesHok,
  type HokCellRef,
  hokFormula,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
// Правила ще не проходять через `index.ts` пакета: барель належить злиттю
// гілок. Після нього імпорт стане пакетним, шлях — зникне.
import { drugaDjelatnost2026 } from '../../data/src/rules/doprinosi-druge-djelatnosti.ts'
import { eur, subtract, toCentString } from './money.ts'
import { izracunajPausalniObrt } from './pausalni-obrt.ts'
import type { Podloga } from './types.ts'
import { doprinosiUzRadniOdnos, ustedaNaDoprinosima } from './uz-radni-odnos.ts'

/**
 * Модифікатор «поряд із роботою за наймом».
 *
 * Не режим, а правило над числами режиму: воно бере річну базу, яку режим
 * уже порахував, і рахує з неї внески за іншими ставками. Тому тут немає
 * ані `primitak`, ані розрядів — лише база, ставки і стеля.
 */

const podloga2026: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

const uzRadDohodak = (godisnjiDohodak: Decimal.Value) =>
  doprinosiUzRadniOdnos(
    { vrsta: 'dohodak', godisnjaOsnovica: eur(godisnjiDohodak) },
    drugaDjelatnost2026,
    pretpostavke2026,
  )

const uzRadPausal = (godisnjiPausalniDohodak: Decimal.Value) =>
  doprinosiUzRadniOdnos(
    { vrsta: 'pausalni-dohodak', godisnjaOsnovica: eur(godisnjiPausalniDohodak) },
    drugaDjelatnost2026,
    pretpostavke2026,
  )

/** `paušalni dohodak` розряду — база, яку модифікатор бере в паушалу. */
const pausalniDohodak = (godisnjiPrimitak: Decimal.Value) => {
  const ishod = izracunajPausalniObrt(eur(godisnjiPrimitak), podloga2026)
  if (ishod.status !== 'izracunato') throw new Error('Паушал недоступний')
  return ishod.izracun.porez.poreznaOsnovica
}

describe('doprinosiUzRadniOdnos', () => {
  describe('база', () => {
    it('рахує внески з річного dohodak, а не з osnovica за prosječna plaća', () => {
      // 10 000,00 × 17,5%. Звичайний обрт на дохідок платив би 1 295,45 ×
      // 36,5% × 12 = 5 674,07 незалежно від того, скільки заробив.
      const doprinosi = uzRadDohodak('10000')

      expect(toCentString(doprinosi.godisnjaOsnovica)).toBe('10000.00')
      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('1750.00')
    })

    it('за нульового dohodak внесків немає взагалі', () => {
      // Найгостріша різниця з режимом без найму: там внески є завжди.
      expect(toCentString(uzRadDohodak('0').ukupnoGodisnje)).toBe('0.00')
    })

    it('на збитку не рахує від’ємних внесків', () => {
      // Закон бере `dohodak ostvaren u poreznom razdoblju`: збиток базою не
      // стає. Від'ємний внесок означав би, що держава доплачує обртнику.
      const doprinosi = uzRadDohodak('-5000')

      expect(toCentString(doprinosi.godisnjaOsnovica)).toBe('0.00')
      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('0.00')
    })

    it('веде базу з dohodak до своєї статті, а базу з паушалу — до своєї', () => {
      expect(uzRadDohodak('10000').izvorOsnovice.article).toBe('čl. 185. st. 1.')
      expect(uzRadPausal('1695').izvorOsnovice.article).toBe('čl. 185. st. 3.')
    })
  })

  describe('стеля річної osnovica', () => {
    it('зрізає базу з dohodak до prosječna plaća × 0,65 × 12', () => {
      // 1 993,00 × 0,65 × 12 = 15 545,40 — та сама сума, що її друкує
      // Naredba (NN 150/25, čl. 12.).
      const doprinosi = uzRadDohodak('30000')

      expect(toCentString(doprinosi.gornjaGranica?.iznos ?? eur(0))).toBe('15545.40')
      expect(doprinosi.gornjaGranica?.primijenjena).toBe(true)
      expect(toCentString(doprinosi.godisnjaOsnovica)).toBe('15545.40')
      // 15 545,40 × 17,5%.
      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('2720.45')
    })

    it('рівно на стелі ще не зрізає', () => {
      const doprinosi = uzRadDohodak('15545.40')

      expect(doprinosi.gornjaGranica?.primijenjena).toBe(false)
      expect(toCentString(doprinosi.godisnjaOsnovica)).toBe('15545.40')
    })

    it('нижче стелі лишає базу як є і показує саму стелю', () => {
      const doprinosi = uzRadDohodak('10000')

      expect(doprinosi.gornjaGranica?.primijenjena).toBe(false)
      expect(toCentString(doprinosi.gornjaGranica?.iznos ?? eur(0))).toBe('15545.40')
    })

    it('веде стелю до статті, яка її встановлює', () => {
      expect(uzRadDohodak('30000').gornjaGranica?.izvor.article).toBe('čl. 186. st. 5.')
    })

    it('до паушальної бази стелі не застосовує — закон її для неї не встановлює', () => {
      // `čl. 186. st. 5.` називає лише `st. 1.` і `st. 2.` статті 185.
      // Паушальна база — це `st. 3.`, і стелі в неї немає. Практично вона
      // й не потрібна: найвищий `paušalni dohodak` — 9 000 €.
      const doprinosi = uzRadPausal('9000')

      expect(doprinosi.gornjaGranica).toBeUndefined()
      expect(toCentString(doprinosi.godisnjaOsnovica)).toBe('9000.00')
    })

    it('не бере стелю з HOK: там вона порахована зі старої prosječna plaća', () => {
      // Розбіжність уже в реєстрі (`stale-contribution-cap-for-second-activity`),
      // і поки формула HOK така, наше число мусить бути іншим — інакше ми
      // успадкували б чужу помилку (ADR-0003).
      const formula = hokFormula({
        scenario: 'in-force-2026',
        sheet: 'PREGLED MOGUĆNOSTI ',
        cell: 'E20',
      })

      expect(formula).toContain('14024.4')
      expect(toCentString(uzRadDohodak('30000').gornjaGranica?.iznos ?? eur(0))).not.toBe(
        '14024.40',
      )
    })
  })

  describe('складові', () => {
    it('розбиває внески на MO I. stup, MO II. stup і ZO', () => {
      const { moPrviStup, moDrugiStup, zo } = uzRadDohodak('10000')

      expect(toCentString(moPrviStup.godisnjiIznos)).toBe('750.00')
      expect(toCentString(moDrugiStup.godisnjiIznos)).toBe('250.00')
      expect(toCentString(zo.godisnjiIznos)).toBe('750.00')
    })

    it('позначає II. stup як персональні відкладені кошти, а решту — ні', () => {
      const { moPrviStup, moDrugiStup, zo } = uzRadDohodak('10000')

      expect(moDrugiStup.osobnaStednja).toBe(true)
      expect(moPrviStup.osobnaStednja).toBe(false)
      expect(zo.osobnaStednja).toBe(false)
    })

    it('веде кожну складову до статті-винятку, а не до загальної ставки', () => {
      const { moPrviStup, moDrugiStup, zo } = uzRadDohodak('10000')

      expect(moPrviStup.izvor.article).toBe('čl. 13. st. 3. t. 2.')
      expect(moDrugiStup.izvor.article).toBe('čl. 17. st. 2.')
      expect(zo.izvor.article).toBe('čl. 14. st. 2.')
    })
  })

  describe('наскільки менше платить той, хто працює за наймом', () => {
    it('рахує різницю зі звичайними внесками режиму', () => {
      const ishod = izracunajPausalniObrt(eur('20000'), podloga2026)
      if (ishod.status !== 'izracunato') throw new Error('Паушал недоступний')
      const { doprinosi, porez } = ishod.izracun

      const uzRad = doprinosiUzRadniOdnos(
        { vrsta: 'pausalni-dohodak', godisnjaOsnovica: porez.poreznaOsnovica },
        drugaDjelatnost2026,
        pretpostavke2026,
      )

      // 3 491,736 звичайних проти 4 590,00 × 17,5% = 803,25.
      expect(toCentString(ustedaNaDoprinosima(doprinosi, uzRad))).toBe('2688.49')
    })

    it('лишається виграшем навіть на верхньому розряді паушалу', () => {
      // Паушал платить ті самі внески в кожному розряді, а друга
      // діяльність — відсоток від бази. Зрівнялися б вони аж на
      // `paušalni dohodak` 19 952,78 €, а найвищий розряд дає 9 000 €,
      // тож із наймом внески менші завжди — питання лише наскільки.
      const ishod = izracunajPausalniObrt(eur('60000'), podloga2026)
      if (ishod.status !== 'izracunato') throw new Error('Паушал недоступний')
      const { doprinosi, porez } = ishod.izracun

      const uzRad = doprinosiUzRadniOdnos(
        { vrsta: 'pausalni-dohodak', godisnjaOsnovica: porez.poreznaOsnovica },
        drugaDjelatnost2026,
        pretpostavke2026,
      )

      // 3 491,736 − 9 000,00 × 17,5%.
      expect(toCentString(ustedaNaDoprinosima(doprinosi, uzRad))).toBe('1916.74')
    })
  })

  describe('проти калькулятора HOK 2026', () => {
    /**
     * Звірка одного числа з коміркою книги.
     *
     * `assertMatchesHok`, а не `checkAgainstHok`: перший валить виклик на
     * незареєстрованій розбіжності, другий лише повертає статус (ADR-0003).
     * Реєстр — справжній: жодна комірка стовпця F у ньому не стоїть, тож
     * твердження про `match` ловить і появу там запису.
     */
    const uHok = (cell: string, actual: Decimal) => {
      const ref: HokCellRef = { scenario: 'in-force-2026', sheet: 'PREGLED MOGUĆNOSTI ', cell }
      return assertMatchesHok({ ...ref, actual: actual.toString() })
    }

    /**
     * Стовпець F — «Obrt izbor paušalno oporezivanje uz rad». У збереженій
     * книзі всі входи нульові, тож розряд перший: `paušalni dohodak`
     * 1 695,00 €.
     */
    const pausalUzRad = doprinosiUzRadniOdnos(
      { vrsta: 'pausalni-dohodak', godisnjaOsnovica: pausalniDohodak(0) },
      drugaDjelatnost2026,
      pretpostavke2026,
    )

    it('річні внески паушалу з наймом сходяться (F20)', () => {
      // 1 695,00 × 17,5% = 296,625 → 296,63.
      expect(uHok('F20', pausalUzRad.ukupnoGodisnje.amount).status).toBe('match')
    })

    it('сума, що лишається обртнику за рік, сходиться (F21)', () => {
      const ishod = izracunajPausalniObrt(eur(0), podloga2026)
      if (ishod.status !== 'izracunato') throw new Error('Паушал недоступний')

      const netoZaOsobu = subtract(
        subtract(eur(0), ishod.izracun.porez.godisnjiIznos),
        pausalUzRad.ukupnoGodisnje,
      )

      expect(uHok('F21', netoZaOsobu.amount).status).toBe('match')
    })
  })
})
