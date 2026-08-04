// Відносний шлях, а не пакетний імпорт: `index.ts` пакета даних до цієї гілки
// не належить. Після зведення гілок імпорт стане пакетним.
import {
  pretpostavke2026,
  pretpostavkeNajave2027,
  ruleset2026,
  rulesetNajave2027,
} from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import { add, eur, type Money, toCentString } from './money.ts'
import { blizuObriva, type Obriv, type ObrivRazreda, obrivZa, type PodlogaZa } from './obriv.ts'
import type { Izracun } from './types.ts'
import { usporediRezime } from './usporedba.ts'

/** Чинний закон: набір правил від `primitak` не залежить узагалі. */
const naSnazi: PodlogaZa = () => ({ ruleset: ruleset2026, pretpostavke: pretpostavke2026 })

/** Заплановані зміни на прогнозній `prosječna plaća` — так рахує HOK. */
const najava: PodlogaZa = (godisnjiPrimitak) => ({
  ruleset: rulesetNajave2027(godisnjiPrimitak.amount),
  pretpostavke: pretpostavkeNajave2027,
})

/**
 * Заплановані зміни на чинній `prosječna plaća`.
 *
 * Саме так порівнюються сценарії. Інакше різниця показувала б суму двох
 * зрушень — правил і припущення, — і нульова дельта нижче 40 000 € зникла б
 * не тому, що закон там щось міняє (ADR-0001).
 */
const najavaNaPlaciNaSnazi: PodlogaZa = (godisnjiPrimitak) => ({
  ruleset: rulesetNajave2027(godisnjiPrimitak.amount),
  pretpostavke: pretpostavke2026,
})

const pausal = (godisnjiPrimitak: Money<'EUR'>, podlogaZa: PodlogaZa): Izracun => {
  const { rezimi } = usporediRezime({ godisnjiPrimitak }, podlogaZa(godisnjiPrimitak))
  const ishod = rezimi.find((rezim) => rezim.id === 'pausalni-obrt')?.ishod
  if (ishod?.status !== 'izracunato') {
    throw new Error(`Паушал недоступний за primitak ${toCentString(godisnjiPrimitak)}`)
  }
  return ishod.izracun
}

/** Річна повинність режиму: податок і внески разом, до цента. */
const obveza = (godisnjiPrimitak: Money<'EUR'>, podlogaZa: PodlogaZa): string => {
  const { ukupanPorez, doprinosi } = pausal(godisnjiPrimitak, podlogaZa)
  return toCentString(add(ukupanPorez, doprinosi.ukupnoGodisnje))
}

/**
 * Обрив, який мусить бути. Кидає, коли його немає: мовчазний `return` у тесті
 * лишив би перевірку зеленою й порожньою.
 */
const obrivNa = (godisnjiPrimitak: Money<'EUR'>, podlogaZa: PodlogaZa): Obriv => {
  const obriv = obrivZa(godisnjiPrimitak, podlogaZa)
  if (obriv === undefined) {
    throw new Error(`Обриву немає за primitak ${toCentString(godisnjiPrimitak)}`)
  }
  return obriv
}

const obrivRazreda = (godisnjiPrimitak: Money<'EUR'>, podlogaZa: PodlogaZa): ObrivRazreda => {
  const obriv = obrivNa(godisnjiPrimitak, podlogaZa)
  if (obriv.vrsta !== 'razred') {
    throw new Error(`За primitak ${toCentString(godisnjiPrimitak)} попереду ${obriv.vrsta}`)
  }
  return obriv
}

const GRANICE = [11_300, 15_300, 19_900, 30_600, 40_000, 50_000, 60_000]

/** Сітка входів: рівний крок, межі розрядів і по центу з обох боків від них. */
const uzorak = (najvisi: number): readonly Money<'EUR'>[] => {
  const tocke = new Set<string>()
  for (let primitak = 0; primitak <= najvisi; primitak += 250) tocke.add(primitak.toFixed(2))
  for (const granica of GRANICE) {
    for (const tocka of [granica - 0.01, granica, granica + 0.01]) {
      if (tocka >= 0 && tocka <= najvisi) tocke.add(tocka.toFixed(2))
    }
  }
  return [...tocke].map((tocka) => eur(tocka))
}

describe('обрив розряду', () => {
  describe('нижче 40 000 € сценарії не розходяться', () => {
    it('дельта дорівнює нулю на всьому діапазоні до 40 000 €', () => {
      const razlike = uzorak(40_000).filter(
        (primitak) => obveza(primitak, naSnazi) !== obveza(primitak, najavaNaPlaciNaSnazi),
      )

      expect(razlike.map(toCentString)).toEqual([])
    })

    it('сітка справді покриває діапазон, а не порожня', () => {
      // Сторож від зеленого з хибної причини: перевірка вище — це фільтр,
      // а порожній фільтр порожнього списку теж зелений.
      expect(uzorak(40_000).length).toBeGreaterThan(160)
    })

    it('вище 40 000 € дельта таки з’являється', () => {
      // Другий сторож: якби обидва сценарії десь схлопнулися в один набір
      // правил, нульова дельта нижче 40 000 € нічого б не доводила.
      for (const primitak of [eur('40000.01'), eur(45_000), eur('50000.01'), eur(60_000)]) {
        expect([
          toCentString(primitak),
          obveza(primitak, naSnazi) === obveza(primitak, najavaNaPlaciNaSnazi),
        ]).toEqual([toCentString(primitak), false])
      }
    })
  })

  describe('відстань до межі й розмір стрибка', () => {
    it('за чинним законом на межі 40 000 € стрибає лише податок', () => {
      const obriv = obrivRazreda(eur(39_000), naSnazi)

      expect({
        granica: toCentString(obriv.granica),
        doGranice: toCentString(obriv.doGranice),
        redniBroj: obriv.redniBroj,
        sljedeciRedniBroj: obriv.sljedeciRedniBroj,
        porez: toCentString(obriv.skok.porez),
        doprinosi: toCentString(obriv.skok.doprinosi),
        ukupno: toCentString(obriv.skok.ukupno),
        retroaktivnihMjeseci: obriv.skok.retroaktivnihMjeseci,
      }).toEqual({
        granica: '40000.00',
        doGranice: '1000.00',
        redniBroj: 5,
        sljedeciRedniBroj: 6,
        porez: '180.00',
        doprinosi: '0.00',
        ukupno: '180.00',
        retroaktivnihMjeseci: 0,
      })
    })

    it('у запланованих змінах на тій самій межі стрибають і внески', () => {
      // koeficijent 0,40 → 0,45 на prosječna plaća 2 180 € додає до osnovica
      // 109 € на місяць; 36,5% від них за дванадцять місяців — 477,42 €.
      const obriv = obrivRazreda(eur(39_000), najava)

      expect({
        porez: toCentString(obriv.skok.porez),
        doprinosi: toCentString(obriv.skok.doprinosi),
        ukupno: toCentString(obriv.skok.ukupno),
        retroaktivnihMjeseci: obriv.skok.retroaktivnihMjeseci,
      }).toEqual({
        porez: '1080.00',
        doprinosi: '477.42',
        ukupno: '1557.42',
        retroaktivnihMjeseci: 12,
      })
    })

    it('на межі 50 000 € стрибок ще різкіший', () => {
      const obriv = obrivRazreda(eur(45_000), najava)

      expect({
        granica: toCentString(obriv.granica),
        doGranice: toCentString(obriv.doGranice),
        porez: toCentString(obriv.skok.porez),
        doprinosi: toCentString(obriv.skok.doprinosi),
      }).toEqual({
        granica: '50000.00',
        doGranice: '5000.00',
        porez: '1440.00',
        doprinosi: '477.42',
      })
    })

    it('на самій межі відстань нульова, а стрибок нікуди не дівається', () => {
      const obriv = obrivRazreda(eur(40_000), najava)

      expect([toCentString(obriv.doGranice), toCentString(obriv.skok.ukupno)]).toEqual([
        '0.00',
        '1557.42',
      ])
    })
  })

  describe('ретроактивність внесків', () => {
    it.each([11_000, 39_000, 45_000])(
      'за чинним законом перетин межі з %i € не чіпає жодного місяця внесків',
      (primitak) => {
        // koeficijent 0,40 в усіх розрядах: перетнути межу в грудні коштує
        // у внесках рівно нічого — уся різниця сидить у податку.
        const obriv = obrivRazreda(eur(primitak), naSnazi)

        expect([toCentString(obriv.skok.doprinosi), obriv.skok.retroaktivnihMjeseci]).toEqual([
          '0.00',
          0,
        ])
      },
    )

    it('у запланованих змінах перетин межі перераховує всі дванадцять місяців', () => {
      // Внески за рік — одна величина на всі дванадцять місяців, і залежить
      // вона від розряду. Один євро в грудні переписує весь рік, а не грудень.
      const obriv = obrivRazreda(eur('49999.99'), najava)
      const mjesecno = obriv.skok.doprinosi.amount.div(obriv.skok.retroaktivnihMjeseci)

      expect([obriv.skok.retroaktivnihMjeseci, mjesecno.toFixed(2)]).toEqual([12, '39.79'])
    })

    it('нижче 40 000 € внески не стрибають навіть у запланованих змінах', () => {
      const obriv = obrivRazreda(eur(11_000), najava)

      expect([toCentString(obriv.skok.doprinosi), obriv.skok.retroaktivnihMjeseci]).toEqual([
        '0.00',
        0,
      ])
    })
  })

  describe('кінець режиму', () => {
    it('в останньому розряді попереду не наступний розряд, а вихід із режиму', () => {
      const obriv = obrivNa(eur(55_000), najava)

      expect(obriv.vrsta).toBe('kraj-rezima')
      if (obriv.vrsta !== 'kraj-rezima') throw new Error('очікувався кінець режиму')

      expect([toCentString(obriv.granica), toCentString(obriv.doGranice), obriv.redniBroj]).toEqual(
        ['60000.00', '5000.00', 7],
      )
      expect(obriv.razlog).toContain('PDV')
    })

    it('за порогом обриву вже немає — режиму теж', () => {
      expect(obrivZa(eur('60000.01'), najava)).toBeUndefined()
    })
  })

  describe('коли попереджати', () => {
    it('попереджає, коли до межі лишилося менше, ніж коштує її перетнути', () => {
      expect([
        blizuObriva(obrivNa(eur(39_000), naSnazi)),
        blizuObriva(obrivNa(eur(39_900), naSnazi)),
      ]).toEqual([false, true])
    })

    it('у запланованих змінах небезпечна зона ширша, бо стрибок більший', () => {
      expect(blizuObriva(obrivNa(eur(39_000), najava))).toBe(true)
    })

    it('в останньому розряді попереджає завжди', () => {
      // Порівнювати відстань немає з чим: за межею режиму немає взагалі.
      expect(blizuObriva(obrivNa(eur(51_000), najava))).toBe(true)
    })
  })

  describe('розряд, що застосувався', () => {
    it.each([
      ['0', '0.4'],
      ['40000', '0.4'],
      ['40000.01', '0.45'],
      ['50000', '0.45'],
      ['50000.01', '0.5'],
      ['60000', '0.5'],
    ])('за primitak %s € рушій рахує osnovica з koeficijent %s', (primitak, koeficijent) => {
      // Розряд обирають двічі: набір правил — щоб підставити koeficijent,
      // рушій — щоб узяти paušalni dohodak. Якби ці два вибори розійшлися,
      // внески рахувалися б за одним розрядом, а податок за іншим.
      const izracun = pausal(eur(primitak), najava)
      const primijenjeni = izracun.doprinosi.mjesecnaOsnovica.amount.div(
        pretpostavkeNajave2027.prosjecnaPlaca.value,
      )

      expect(primijenjeni.toString()).toBe(koeficijent)
    })
  })
})
