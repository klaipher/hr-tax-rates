import { describe, expect, it } from 'vitest'
import { jeOblikNkd, najtocnijiPogodak, nazivNkd, nkdDirektorij, normalizirajNkd } from './nkd.ts'
import { INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI } from './spomenicka-renta.ts'
import { TURISTICKA_CLANARINA_DJELATNOSTI } from './turisticka-clanarina.ts'

describe('довідник NKD', () => {
  it('нормалізує код до цифр і приймає розділ, групу, клас і підклас', () => {
    expect(normalizirajNkd('55')).toBe('55')
    expect(normalizirajNkd('50.1')).toBe('501')
    expect(normalizirajNkd('49.31')).toBe('4931')
    // NKD 2025 додав п'ятизначні підкласи — довідник має їх приймати.
    expect(normalizirajNkd('47.111')).toBe('47111')
  })

  it('відкидає те, що взагалі не є кодом NKD', () => {
    expect(() => normalizirajNkd('')).toThrow(/NKD/)
    expect(() => normalizirajNkd('5')).toThrow(/NKD/)
    expect(() => normalizirajNkd('ugostiteljstvo')).toThrow(/NKD/)
    expect(() => normalizirajNkd('49.')).toThrow(/NKD/)
  })

  it('форму коду можна спитати наперед, не ловлячи винятку', () => {
    // Форма мусить знати про хибний ввід до розрахунку: `normalizirajNkd`
    // на «abc» кидає, і ловити виняток замість питання — гірше за питання.
    expect(['55', '50.1', '49.31', '47.111', ' 56 '].map(jeOblikNkd)).toEqual([
      true,
      true,
      true,
      true,
      true,
    ])
    expect(['', '5', 'ugostiteljstvo', '49.', '49.3111'].map(jeOblikNkd)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ])
  })

  it('код поза довідником — це відповідь «жоден із двох платежів», а не хибний ввід', () => {
    // 62.01 має правильну форму, але жоден із двох законів його не називає.
    // Тому форма його приймає, а розрахунок каже «не застосовується».
    expect(jeOblikNkd('62.01')).toBe(true)
    expect(najtocnijiPogodak('62.01', nkdDirektorij)).toBeUndefined()
  })

  it('серед перекривних записів обирає найточніший, а не перший-ліпший', () => {
    // Реальний конфлікт із čl. 5. Zakona o članarinama: 45.20 названо окремо
    // у `treća skupina`, а весь розділ 45 — у `peta`. Виграє довший префікс.
    const unosi = [
      { sifra: '45', oznaka: 'peta' },
      { sifra: '45.20', oznaka: 'treca' },
      { sifra: '45.1', oznaka: 'cetvrta' },
    ]
    expect(najtocnijiPogodak('45.20', unosi)?.oznaka).toBe('treca')
    expect(najtocnijiPogodak('45.11', unosi)?.oznaka).toBe('cetvrta')
    expect(najtocnijiPogodak('45.31', unosi)?.oznaka).toBe('peta')
  })

  it('розділ покриває свої класи, але не сусідні розділи', () => {
    const unosi = [{ sifra: '56', oznaka: 'ugostiteljstvo' }]
    expect(najtocnijiPogodak('56.10', unosi)?.oznaka).toBe('ugostiteljstvo')
    expect(najtocnijiPogodak('56.1', unosi)?.oznaka).toBe('ugostiteljstvo')
    expect(najtocnijiPogodak('55.10', unosi)).toBeUndefined()
  })

  it('група не захоплює сусідню групу того самого розділу', () => {
    const unosi = [{ sifra: '50.1', oznaka: 'prva' }]
    expect(najtocnijiPogodak('50.10', unosi)?.oznaka).toBe('prva')
    expect(najtocnijiPogodak('50.30', unosi)).toBeUndefined()
  })

  it('нічого не знайшлося — це undefined, а не мовчазний перший запис', () => {
    expect(najtocnijiPogodak('62.01', [{ sifra: '55', oznaka: 'x' }])).toBeUndefined()
  })

  it('кожен код довідника унікальний', () => {
    const sifre = nkdDirektorij.map((s) => s.sifra)
    expect(new Set(sifre).size).toBe(sifre.length)
  })

  it('кожен запис має назву хорватською, як її друкує закон', () => {
    for (const stavka of nkdDirektorij) {
      expect(stavka.sifra, JSON.stringify(stavka)).toMatch(/^\d{2}(\.\d{1,3})?$/)
      expect(stavka.naziv.length, stavka.sifra).toBeGreaterThan(0)
    }
  })

  it('довідник не більший за свою межу: кожен його код називає один із двох законів', () => {
    // Зворотний бік перевірок «кожен код закону є в довіднику». Разом вони
    // тримають межу покриття чесною: довідник не заростає кодами, яких
    // жоден із двох платежів не потребує, і не губить потрібних.
    const izZakona = new Set([
      ...TURISTICKA_CLANARINA_DJELATNOSTI.value.map((d) => normalizirajNkd(d.sifra)),
      ...INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.value.map((d) => normalizirajNkd(d.sifra)),
    ])

    for (const stavka of nkdDirektorij) {
      expect(izZakona.has(normalizirajNkd(stavka.sifra)), stavka.sifra).toBe(true)
    }
    expect(nkdDirektorij).toHaveLength(izZakona.size)
  })

  it('назву можна дістати за кодом, а невідомий код кидає виняток', () => {
    expect(nazivNkd('56')).toBe('Djelatnosti pripreme i usluživanja hrane i pića')
    expect(() => nazivNkd('62.01')).toThrow(/довідник/)
  })
})
