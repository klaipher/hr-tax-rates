import { describe, expect, it } from 'vitest'
import { pretpostavke2026 } from './hr-2026.ts'
import {
  prosjecnaPlacaZa,
  SLUZBENE_PROSJECNE_PLACE,
  sProsjecnomPlacom,
  ZADANA_PROSJECNA_PLACA,
} from './izbor-prosjecne-place.ts'
import { pretpostavkeNajave2027 } from './najava-2027.ts'

describe('prosjecnaPlacaZa', () => {
  it('офіційне число зберігає своє джерело', () => {
    const odabrana = prosjecnaPlacaZa(1993)

    expect(odabrana).toBe(pretpostavke2026.prosjecnaPlaca)
  })

  it('прогноз HOK теж лишається собою, а не стає вбитим руками', () => {
    const odabrana = prosjecnaPlacaZa(2180)

    expect(odabrana).toBe(pretpostavkeNajave2027.prosjecnaPlaca)
  })

  it('будь-яке інше число джерела не отримує', () => {
    const vlastita = prosjecnaPlacaZa(2050)

    expect(vlastita.source).toEqual({ status: 'rucno' })
    expect(vlastita.value.toFixed(2)).toBe('2050.00')
  })

  it('збіг рахується за величиною, а не за формою запису', () => {
    // «1993.00», «1993» і 1993 — те саме число, і джерело в них те саме.
    expect(prosjecnaPlacaZa('1993.00')).toBe(pretpostavke2026.prosjecnaPlaca)
    expect(prosjecnaPlacaZa('1993')).toBe(pretpostavke2026.prosjecnaPlaca)
  })

  it('за замовчуванням стоїть опубліковане, а не прогнозне', () => {
    expect(ZADANA_PROSJECNA_PLACA.source.status).toBe('published')
  })

  it('обидва офіційні числа лишаються доступними', () => {
    expect(SLUZBENE_PROSJECNE_PLACE.map((p) => p.value.toFixed(2))).toEqual(['1993.00', '2180.00'])
  })
})

describe('sProsjecnomPlacom', () => {
  it('міняє лише `prosječna plaća`, лишаючи решту припущень на місці', () => {
    // Сторож проти помилки, яку зробив застосунок і не спіймали ані тип, ані
    // тести: він будував `pretpostavke` заново з одного поля, і середня за
    // повний попередній рік зникала разом із порогом `EU plava karta`.
    const zamijenjene = sProsjecnomPlacom(pretpostavke2026, 2500)

    expect(zamijenjene.prosjecnaPlaca.value.toString()).toBe('2500')
    expect(zamijenjene.prosjecnaPlacaPrethodneGodine).toBe(
      pretpostavke2026.prosjecnaPlacaPrethodneGodine,
    )
  })

  it('лишає всі поля набору, скільки б їх не додали', () => {
    // Не перелік полів, а їхня кількість: нове припущення, забуте в цій
    // функції, впаде тут, а не тихо зникне з екрана.
    expect(Object.keys(sProsjecnomPlacom(pretpostavke2026, 2500)).sort()).toEqual(
      Object.keys(pretpostavke2026).sort(),
    )
  })
})
