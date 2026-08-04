import type Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import type { Sourced } from '../sourced.ts'
import { drugaDjelatnost2026 } from './doprinosi-druge-djelatnosti.ts'
import { pretpostavke2026, ruleset2026 } from './hr-2026.ts'

/**
 * Правила внесків для `druga djelatnost` (друга діяльність / second activity)
 * — обрту, який ведуть поряд із роботою за наймом.
 *
 * Це не окремий режим, а інший набір ставок і власна база: закон рахує їх
 * від річного `dohodak`, а не від `osnovica`, побудованої з `prosječna plaća`.
 */

const sveStope: readonly (readonly [string, Sourced<Decimal>])[] = [
  ['stopaMoPrviStup', drugaDjelatnost2026.stopaMoPrviStup],
  ['stopaMoDrugiStup', drugaDjelatnost2026.stopaMoDrugiStup],
  ['stopaZo', drugaDjelatnost2026.stopaZo],
  ['koeficijentNajviseOsnovice', drugaDjelatnost2026.koeficijentNajviseOsnovice],
]

describe('правила внесків другої діяльності на 2026', () => {
  it('дає разом 17,5% — менше за 36,5% звичайного обрту', () => {
    const { stopaMoPrviStup, stopaMoDrugiStup, stopaZo } = drugaDjelatnost2026
    const ukupno = stopaMoPrviStup.value.plus(stopaMoDrugiStup.value).plus(stopaZo.value)

    expect(ukupno.toString()).toBe('0.175')
  })

  it('розбиває 17,5% на ті самі три складові, що й звичайні внески', () => {
    const { stopaMoPrviStup, stopaMoDrugiStup, stopaZo } = drugaDjelatnost2026

    expect(stopaMoPrviStup.value.toString()).toBe('0.075')
    expect(stopaMoDrugiStup.value.toString()).toBe('0.025')
    expect(stopaZo.value.toString()).toBe('0.075')
  })

  it('бере кожну ставку з винятку у своїй статті, а не зі загального правила', () => {
    // Ставки другої діяльності записані саме як винятки з `st. 1.` тих
    // самих статей, що дають 15%, 5% і 16,5%. Послатися на загальне
    // правило означало б процитувати статтю, яка каже протилежне.
    const { stopaMoPrviStup, stopaMoDrugiStup, stopaZo } = drugaDjelatnost2026

    expect(stopaMoPrviStup.source.article).toBe('čl. 13. st. 3. t. 2.')
    expect(stopaMoDrugiStup.source.article).toBe('čl. 17. st. 2.')
    expect(stopaZo.source.article).toBe('čl. 14. st. 2.')
  })

  it('ставки другої діяльності нижчі за звичайні в кожній складовій', () => {
    const redovni = ruleset2026.doprinosi

    expect(drugaDjelatnost2026.stopaMoPrviStup.value.lessThan(redovni.stopaMoPrviStup.value)).toBe(
      true,
    )
    expect(
      drugaDjelatnost2026.stopaMoDrugiStup.value.lessThan(redovni.stopaMoDrugiStup.value),
    ).toBe(true)
    expect(drugaDjelatnost2026.stopaZo.value.lessThan(redovni.stopaZo.value)).toBe(true)
  })

  it('несе koeficijent стелі річної osnovica зі статті про стелю', () => {
    const { koeficijentNajviseOsnovice } = drugaDjelatnost2026

    expect(koeficijentNajviseOsnovice.value.toString()).toBe('0.65')
    expect(koeficijentNajviseOsnovice.source.article).toBe('čl. 186. st. 5.')
  })

  it('дає ту саму стелю, що й опублікована Naredba на 2026', () => {
    // Naredba o iznosima osnovica za 2026. (NN 150/25, čl. 12.) друкує
    // 15 545,40 €. Число не переписане: воно виходить із prosječna plaća
    // зі статистики й koeficijenta із закону (ADR-0001). Саме тут видно,
    // що стеля HOK у 14 024,40 € порахована зі середньої зарплати
    // позаминулого року — див. реєстр розбіжностей.
    const MJESECI = 12
    const stelja = pretpostavke2026.prosjecnaPlaca.value
      .times(drugaDjelatnost2026.koeficijentNajviseOsnovice.value)
      .times(MJESECI)

    expect(stelja.toFixed(2)).toBe('15545.40')
  })

  it('веде кожен вид бази до своєї статті', () => {
    // Дві бази — дві різні норми в одній статті, і сплутати їх означало б
    // послатися на стелю там, де її немає.
    const { dohodak, pausalniDohodak } = drugaDjelatnost2026.izvorOsnovice

    expect(dohodak.article).toBe('čl. 185. st. 1.')
    expect(pausalniDohodak.article).toBe('čl. 185. st. 3.')
    expect(dohodak.act).toBe('Zakon o doprinosima')
    expect(pausalniDohodak.status).toBe('in-force')
  })

  it('кожне число веде до чинної статті закону про внески', () => {
    for (const [naziv, stopa] of sveStope) {
      expect(stopa.source.act, naziv).toBe('Zakon o doprinosima')
      expect(stopa.source.url, naziv).toMatch(/^https:\/\//)
      expect(stopa.source.status, naziv).toBe('in-force')
      expect(stopa.source.checkedOn, naziv).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })
})
