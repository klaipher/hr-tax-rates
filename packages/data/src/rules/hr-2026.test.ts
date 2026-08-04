import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import type { Sourced } from '../sourced.ts'
import { pretpostavke2026, ruleset2026 } from './hr-2026.ts'
import type { Ruleset } from './types.ts'

const { pausalniObrt, doprinosi } = ruleset2026
const razredi = pausalniObrt.razredi.value

/** Кожне юридичне число набору разом зі своєю назвою — для обходу джерел. */
const pravniBrojevi: readonly (readonly [string, Sourced<unknown>])[] = [
  ['razredi', pausalniObrt.razredi],
  ['priznatiIzdatak', pausalniObrt.priznatiIzdatak],
  ['stopaPoreza', pausalniObrt.stopaPoreza],
  ['koeficijent', pausalniObrt.koeficijent],
  ['pragPrimitka', pausalniObrt.pragPrimitka],
  ['stopaMoPrviStup', doprinosi.stopaMoPrviStup],
  ['stopaMoDrugiStup', doprinosi.stopaMoDrugiStup],
  ['stopaZo', doprinosi.stopaZo],
]

describe('ruleset 2026', () => {
  describe('таблиця розрядів', () => {
    it('має сім розрядів, пронумерованих підряд', () => {
      expect(razredi.map((razred) => razred.redniBroj)).toEqual([1, 2, 3, 4, 5, 6, 7])
    })

    it('межі розрядів зростають', () => {
      const granice = razredi.map((razred) => razred.gornjaGranica.toNumber())

      expect(granice).toEqual([...granice].sort((a, b) => a - b))
      expect(new Set(granice).size).toBe(granice.length)
    })

    it('paušalni dohodak кожного розряду — це його стеля без визнаних видатків', () => {
      // Акт друкує обидва стовпці окремо, і переписані вони теж окремо. Якщо
      // хоч в одному числі описка — ця рівність її й покаже. Саме так ловиться
      // друкарська помилка «19 000» замість «19 900»: 15% від 19 000 дає
      // 2 850, а не 2 985, які надруковані поруч.
      const udioDohotka = new Decimal(1).minus(pausalniObrt.priznatiIzdatak.value)

      for (const { redniBroj, gornjaGranica, godisnjiPausalniDohodak } of razredi) {
        expect([redniBroj, godisnjiPausalniDohodak.toFixed(2)]).toEqual([
          redniBroj,
          gornjaGranica.times(udioDohotka).toFixed(2),
        ])
      }
    })

    it('закінчується рівно на порозі паушального оподаткування', () => {
      // Таблиця обривається там, де закон забирає сам режим. Якби вона тяглася
      // далі або обривалася раніше, у порозі й таблиці була б діра.
      expect(razredi.at(-1)?.gornjaGranica.toFixed(2)).toBe(
        pausalniObrt.pragPrimitka.value.toFixed(2),
      )
    })
  })

  describe('ставки', () => {
    it('MO разом дає 20%', () => {
      expect(
        doprinosi.stopaMoPrviStup.value.plus(doprinosi.stopaMoDrugiStup.value).toFixed(2),
      ).toBe('0.20')
    })

    it('MO і ZO разом дають 36,5%', () => {
      const ukupno = doprinosi.stopaMoPrviStup.value
        .plus(doprinosi.stopaMoDrugiStup.value)
        .plus(doprinosi.stopaZo.value)

      expect(ukupno.toFixed(3)).toBe('0.365')
    })
  })

  describe('шари даних', () => {
    it('prosječna plaća не зашита в ruleset', () => {
      // ADR-0001: правила і припущення — окремі шари. Найдешевший спосіб це
      // зламати — покласти 1 993 € у ruleset «щоб було під рукою».
      const serijalizirano = JSON.stringify(ruleset2026)

      // Спершу доводимо, що пошук взагалі щось бачить: якби Decimal перестав
      // серіалізуватися в рядок із цифрами, «немає 1993» стало б правдою з
      // хибної причини, і тест мовчки перетворився б на декорацію.
      expect(serijalizirano).toContain('11300')
      expect(serijalizirano).not.toContain('1993')
    })

    it('osnovica з двох шарів збігається з тією, яку друкує Naredba', () => {
      // Naredba o iznosima osnovica za obračun doprinosa za obvezna osiguranja
      // za 2026. godinu (NN 150/25), čl. 7, шифра 0102: 797,20 €. Число ми не
      // зберігаємо — воно має вийти саме, з prosječna plaća та koeficijent.
      const osnovica = pretpostavke2026.prosjecnaPlaca.value.times(pausalniObrt.koeficijent.value)

      expect(osnovica.toFixed(2)).toBe('797.20')
    })

    it('prosječna plaća має джерело статистики, а не правове', () => {
      const { source } = pretpostavke2026.prosjecnaPlaca

      expect(source.publisher).toBe('Državni zavod za statistiku')
      expect(source.status).toBe('published')
      expect(source.period).toContain('2025')
    })
  })

  describe('джерела', () => {
    it.each(pravniBrojevi)('%s веде до статті чинного акта', (_naziv, { source }) => {
      expect(source.article).toMatch(/^čl\. \d/)
      expect(source.gazette).toMatch(/^NN \d/)
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.status).toBe('in-force')
      expect(Number.isNaN(Date.parse(source.checkedOn))).toBe(false)
    })

    it('юридичне число без джерела не компілюється', () => {
      // Перевіркою є сама директива: якщо `Sourced` колись ослабне і голе
      // число почне підходити, tsc повідомить про невикористану директиву
      // й білд впаде. ADR-0002 тримається саме на цьому.
      const bezIzvora: Ruleset = {
        ...ruleset2026,
        pausalniObrt: {
          ...pausalniObrt,
          // @ts-expect-error — ставка без посилання на акт не є Sourced<Decimal>.
          stopaPoreza: new Decimal('0.12'),
        },
      }

      expect(bezIzvora.godina).toBe(2026)
    })
  })
})
