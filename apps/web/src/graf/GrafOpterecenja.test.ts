// Відносний шлях, а не пакетний імпорт: `index.ts` пакета даних до цієї гілки
// не належить. Після зведення гілок імпорт стане пакетним.
import { pretpostavke2026, ruleset2026, rulesetNajave2027 } from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import {
  izgradiGraf,
  type ModelGrafa,
  oznakaTisuca,
  POLJE,
  primitakZaUdio,
  type ScenarijGrafa,
} from './GrafOpterecenja.tsx'

const NAJVISI_PRIMITAK = 70_000
const KORAK = 500

/**
 * Обидва сценарії на одній `prosječna plaća`.
 *
 * Інакше крива проєкту лежала б вище на всьому діапазоні — але через прогноз
 * середньої зарплати, а не через закон, і нульова різниця нижче 40 000 €
 * зникла б із графіка без жодної зміни в правилах (ADR-0001).
 */
const scenariji: readonly ScenarijGrafa[] = [
  {
    id: 'na-snazi',
    naziv: 'чинний закон',
    status: 'in-force',
    podlogaZa: () => ({ ruleset: ruleset2026, pretpostavke: pretpostavke2026 }),
  },
  {
    id: 'najava',
    naziv: 'заплановані зміни',
    status: 'draft',
    podlogaZa: (godisnjiPrimitak) => ({
      ruleset: rulesetNajave2027(godisnjiPrimitak.amount),
      pretpostavke: pretpostavke2026,
    }),
  },
]

const model: ModelGrafa = izgradiGraf({
  scenariji,
  najvisiPrimitak: NAJVISI_PRIMITAK,
  korak: KORAK,
})

const krivulja = (id: string) => {
  const nadena = model.krivulje.find((kandidat) => kandidat.id === id)
  if (nadena === undefined) throw new Error(`Немає кривої ${id}`)
  return nadena
}

const obvezaNa = (id: string, primitak: number): number | undefined => {
  const tocka = krivulja(id).tocke.find((kandidat) => kandidat.primitak === primitak)
  if (tocka === undefined) throw new Error(`Крива ${id} не має точки на ${primitak}`)
  return tocka.obveza
}

describe('графік навантаження', () => {
  describe('вибірка точок', () => {
    it('має точку рівно на кожній межі розряду і на цент вище', () => {
      // Без цих двох точок обрив розмазався б у похилу лінію між сусідніми
      // кроками сітки — саме те, чого графік має не приховувати.
      const primici = new Set(krivulja('najava').tocke.map((tocka) => tocka.primitak))

      for (const granica of [11_300, 15_300, 19_900, 30_600, 40_000, 50_000, 60_000]) {
        expect([granica, primici.has(granica), primici.has(granica + 0.01)]).toEqual([
          granica,
          true,
          true,
        ])
      }
    })

    it('точки впорядковані за зростанням primitak', () => {
      const primici = krivulja('najava').tocke.map((tocka) => tocka.primitak)

      expect(primici).toEqual([...primici].sort((a, b) => a - b))
    })

    it('за порогом паушалу навантаження не показане взагалі', () => {
      // Нуль на графіку не відрізнити від порахованого нуля, тому крива там
      // просто уривається.
      expect(obvezaNa('najava', 60_000.01)).toBeUndefined()
      expect(obvezaNa('najava', 70_000)).toBeUndefined()
      expect(obvezaNa('najava', 60_000)).toBeDefined()
    })
  })

  describe('дві криві', () => {
    it('нижче 40 000 € криві збігаються точка в точку', () => {
      const razlike = krivulja('na-snazi')
        .tocke.filter((tocka) => tocka.primitak <= 40_000)
        .filter((tocka) => tocka.obveza !== obvezaNa('najava', tocka.primitak))

      expect(razlike.map((tocka) => tocka.primitak)).toEqual([])
    })

    it('вище 40 000 € криві розходяться', () => {
      // Сторож: якби сценарії схлопнулися в один, перевірка вище лишилася б
      // зеленою й порожньою.
      for (const primitak of [40_000.01, 45_000, 50_000.01, 60_000]) {
        expect([primitak, obvezaNa('na-snazi', primitak) === obvezaNa('najava', primitak)]).toEqual(
          [primitak, false],
        )
      }
    })

    it('на межі 40 000 € крива проєкту робить сходинку, а не підйом', () => {
      // Один цент primitak коштує 1 516,47 €: податок 1 080 € плюс внески
      // 436,47 € за всі дванадцять місяців. Обидва сценарії тут стоять на
      // чинній prosječna plaća, тож стрибок — це саме зміна правил.
      const prije = obvezaNa('najava', 40_000) ?? 0
      const poslije = obvezaNa('najava', 40_000.01) ?? 0

      expect((poslije - prije).toFixed(2)).toBe('1516.47')
    })
  })

  describe('координати', () => {
    it('обриви стоять на межах розрядів і йдуть зліва направо', () => {
      expect(model.obrivi.map((obriv) => obriv.primitak)).toEqual([
        11_300, 15_300, 19_900, 30_600, 40_000, 50_000, 60_000,
      ])

      const iksi = model.obrivi.map((obriv) => obriv.x)
      expect(iksi).toEqual([...iksi].sort((a, b) => a - b))
    })

    it('найбільше навантаження лежить під верхнім краєм поля, нуль — на нижньому', () => {
      const najvisa = Math.max(
        ...model.krivulje.flatMap((kriva) =>
          kriva.tocke.flatMap((tocka) => (tocka.obveza === undefined ? [] : [tocka.obveza])),
        ),
      )

      expect(model.najvisaObveza).toBeCloseTo(najvisa, 6)
      expect(model.y(najvisa)).toBeCloseTo(POLJE.gore, 6)
      expect(model.y(0)).toBeCloseTo(POLJE.dolje, 6)
    })

    it('нульовий primitak стоїть на лівому краю поля, найвищий — на правому', () => {
      expect([model.x(0), model.x(NAJVISI_PRIMITAK)]).toEqual([POLJE.lijevo, POLJE.desno])
    })
  })

  describe('ламана', () => {
    it('починається командою переносу і не містить NaN', () => {
      for (const kriva of model.krivulje) {
        expect([kriva.id, kriva.putanja.startsWith('M'), kriva.putanja.includes('NaN')]).toEqual([
          kriva.id,
          true,
          false,
        ])
      }
    })

    it('розривається там, де режиму немає, а не тягне лінію в нуль', () => {
      // Крива уривається на 60 000 €, тож другого переносу після неї бути не
      // може: за порогом немає жодної порахованої точки.
      const pocetci = krivulja('najava').putanja.match(/M/g) ?? []

      expect(pocetci).toHaveLength(1)
    })
  })

  describe('підписи меж', () => {
    it.each([
      [11_300, '11,3'],
      [40_000, '40'],
      [60_000, '60'],
    ])('%i € підписано як %s', (iznos, oznaka) => {
      expect(oznakaTisuca(iznos)).toBe(oznaka)
    })
  })

  describe('клік по графіку', () => {
    it('лівий край дає нуль, правий — найвищий primitak', () => {
      expect([primitakZaUdio(model, 0), primitakZaUdio(model, 1)]).toEqual([0, NAJVISI_PRIMITAK])
    })

    it('середина поля дає середину діапазону', () => {
      const udioSredine = (POLJE.lijevo + (POLJE.desno - POLJE.lijevo) / 2) / model.sirina

      expect(primitakZaUdio(model, udioSredine)).toBe(NAJVISI_PRIMITAK / 2)
    })

    it('за краями поля тримається діапазону', () => {
      expect([primitakZaUdio(model, -1), primitakZaUdio(model, 2)]).toEqual([0, NAJVISI_PRIMITAK])
    })

    it('повертає цілі євро — стільки, скільки приймає форма', () => {
      const primitak = primitakZaUdio(model, 0.37)

      expect(Number.isInteger(primitak)).toBe(true)
    })
  })
})
