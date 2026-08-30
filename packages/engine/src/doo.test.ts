import {
  clanUprave2026,
  obrtNaDobit2026,
  placa2026,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import {
  izracunajDooClanUprave,
  izracunajDooSPlacom,
  type PravilaDoo,
  type UlazDoo,
} from './doo.ts'
import { eur, toCentString } from './money.ts'
import { BEZ_UZDRZAVANIH } from './obrt-na-dohodak.ts'
import type { Podloga, Porez } from './types.ts'

const podloga: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

const pravila: PravilaDoo = {
  porezNaDobit: obrtNaDobit2026.porezNaDobit,
  stopaPorezaNaIsplatuDobiti: obrtNaDobit2026.stopaPorezaNaIsplatuDobiti,
  placa: placa2026,
  clanUprave: clanUprave2026,
}

/** Рівні ставки міста — щоб кожен крок можна було перевірити в голові. */
const STOPE = { niza: 2000, visa: 3000 } as const

const ulaz = (dopune: Partial<UlazDoo> = {}): UlazDoo => ({
  godisnjiPrihod: eur(100_000),
  godisnjiRashod: eur(0),
  stopePorezaNaDohodak: STOPE,
  uzdrzavani: BEZ_UZDRZAVANIH,
  dob: undefined,
  mjesecnaPlacaVlasnika: undefined,
  ...dopune,
})

const sPlacom = (dopune: Partial<UlazDoo> = {}) =>
  izracunajDooSPlacom(ulaz(dopune), podloga, pravila)
const clanUprave = (dopune: Partial<UlazDoo> = {}) =>
  izracunajDooClanUprave(ulaz(dopune), podloga, pravila)

const porezPoNazivu = (izlaz: { readonly porezi: readonly Porez[] }, hr: string): Porez => {
  const porez = izlaz.porezi.find((kandidat) => kandidat.naziv.hr === hr)
  if (porez === undefined) throw new Error(`Податку «${hr}» немає в розрахунку`)
  return porez
}

describe('d.o.o.', () => {
  describe('vlasnik u radnom odnosu', () => {
    it('бере законну підлогу plaća, а не мінімальну зарплату', () => {
      // 1 993 × 0,65 = 1 295,45 — підлога члена правління в трудовому
      // відношенні (`čl. 19.` Naredbe), а не minimalna plaća 1 050.
      expect(toCentString(sPlacom().doprinosi.mjesecnaOsnovica ?? eur(0))).toBe('1295.45')
    })

    it('не дає опустити базу нижче за підлогу, скільки б власник собі не призначив', () => {
      // Саме тут гине арбітраж «поставлю собі мінімалку, решту виведу
      // дивідендами»: закон однаково порахує внески з 1 295,45.
      const zadano = sPlacom({ mjesecnaPlacaVlasnika: eur(1050) })

      expect(toCentString(zadano.doprinosi.mjesecnaOsnovica ?? eur(0))).toBe('1295.45')
      expect(zadano.napomene.map((n) => n.kod)).toContain('placa-podignuta-na-najnizu-osnovicu')
    })

    it('вища за підлогу plaća береться як є, без застереження', () => {
      const zadano = sPlacom({ mjesecnaPlacaVlasnika: eur(3000) })

      expect(toCentString(zadano.doprinosi.mjesecnaOsnovica ?? eur(0))).toBe('3000.00')
      expect(zadano.napomene.map((n) => n.kod)).not.toContain('placa-podignuta-na-najnizu-osnovicu')
    })

    it('усі внески власної фірми — гроші самого власника', () => {
      // ZO тут теж його, бо виходить із тієї самої dobit, яку він інакше
      // забрав би дивідендами, — тож обидва підсумки збігаються.
      //
      // Підлога 1 295,45 стоїть **під** порогом 1 300, тож `čl. 21.a` дає
      // навіть їй тонку знижку 0,5 × (1 300 − 1 295,45) = 2,275, і база
      // MO I. stup падає до 1 293,175. Дрібниця, але саме такі дрібниці й
      // розходяться тихо.
      const { doprinosi } = sPlacom()

      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('5669.98')
      expect(toCentString(doprinosi.ukupnoGodisnjeNaTeretOsobe)).toBe('5669.98')
    })

    it('платить три податки: з plaća, з dobit і з виплати власнику', () => {
      const izlaz = sPlacom()

      expect(izlaz.porezi.map((porez) => porez.naziv.hr)).toEqual([
        'porez na dohodak iz plaće',
        'porez na dobit',
        'porez na dohodak od kapitala pri isplati dobiti',
      ])

      // (1 295,45 − 258,749 утриманих внесків − 600) × 12 = 5 240,415 × 20 %.
      expect(toCentString(porezPoNazivu(izlaz, 'porez na dohodak iz plaće').godisnjiIznos)).toBe(
        '1048.08',
      )
      // dobit = 100 000 − (15 545,40 + 2 564,99) = 81 889,61; × 10 %.
      expect(toCentString(porezPoNazivu(izlaz, 'porez na dobit').godisnjiIznos)).toBe('8188.96')
      // (81 889,61 − 8 188,96) × 12 %.
      expect(
        toCentString(
          porezPoNazivu(izlaz, 'porez na dohodak od kapitala pri isplati dobiti').godisnjiIznos,
        ),
      ).toBe('8844.08')
    })

    it('plaća разом із внеском понад неї зменшує базу porez na dobit', () => {
      // 15 545,40 брутто + 2 564,99 ZO. Обидва — витрата фірми.
      expect(toCentString(sPlacom().ukupniTrosakPlace)).toBe('18110.39')
    })

    it('olakšica za mlade доходить і сюди, бо plaća лишається plaća', () => {
      const mlad = sPlacom({ dob: 25 })

      expect(toCentString(mlad.povratPoreza)).toBe('1048.08')
      expect(toCentString(sPlacom().povratPoreza)).toBe('0.00')
    })
  })

  describe('vlasnik član uprave', () => {
    it('нараховує внески з приписаної osnovica, а не з plaća', () => {
      // 1 993 × 1,0 — коефіцієнт члена правління без трудового договору.
      expect(toCentString(clanUprave().doprinosi.mjesecnaOsnovica ?? eur(0))).toBe('1993.00')
      // 23 916 × 36,5 %.
      expect(toCentString(clanUprave().doprinosi.ukupnoGodisnje)).toBe('8729.34')
    })

    it('платить два податки, а не три: plaća немає, тож немає й податку з неї', () => {
      expect(clanUprave().porezi.map((porez) => porez.naziv.hr)).toEqual([
        'porez na dobit',
        'porez na dohodak od kapitala pri isplati dobiti',
      ])
    })

    it('внески члена правління — витрата фірми, тож база dobit на них менша', () => {
      // dobit = 100 000 − 8 729,34 = 91 270,66; × 10 %.
      expect(toCentString(porezPoNazivu(clanUprave(), 'porez na dobit').godisnjiIznos)).toBe(
        '9127.07',
      )
    })

    it('пільги для молоді тут немає взагалі: вона стосується доходу від несамостійної праці', () => {
      expect(toCentString(clanUprave({ dob: 25 }).povratPoreza)).toBe('0.00')
    })
  })

  describe('що два шляхи справді розводить', () => {
    it('відмова від трудового договору коштує БІЛЬШИХ внесків, а не менших', () => {
      // Головний висновок цієї пари режимів і найчастіше хибне очікування:
      // 1,0 проти 0,65 середньої зарплати. Виграш člana uprave — не в
      // внесках, а в тому, що з тих грошей не береться прогресивний податок.
      expect(
        clanUprave().doprinosi.ukupnoGodisnje.amount.greaterThan(
          sPlacom().doprinosi.ukupnoGodisnje.amount,
        ),
      ).toBe(true)
    })

    it('обидва шляхи ведуть до тієї самої ставки porez na dobit', () => {
      // Місто на porez na dobit не впливає, і спосіб виплати власнику теж:
      // різниця між режимами живе в базі, а не в ставці.
      expect(porezPoNazivu(sPlacom(), 'porez na dobit').stopa.toString()).toBe(
        porezPoNazivu(clanUprave(), 'porez na dobit').stopa.toString(),
      )
    })

    it('вища ставка porez na dobit міряється по prihod, а не по dobit', () => {
      // Мільйон prihod із нульовою dobit усе одно потрапляє під вищу ставку.
      const veliki = clanUprave({ godisnjiPrihod: eur(1_000_000) })

      expect(porezPoNazivu(veliki, 'porez na dobit').stopa.toString()).toBe('0.18')
    })
  })
})
