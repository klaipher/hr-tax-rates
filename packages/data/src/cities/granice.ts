/**
 * Межі, у яких місцева одиниця має право рухати свої ставки
 * `porez na dohodak`, і перевірка ставок проти них.
 */
import { ZAKON_O_POREZU_NA_DOHODAK } from '../legal.ts'
import { sourced } from '../sourced.ts'
import type { BazniBodovi, GraniceStopa, ParStopa, RasponStopa, VrstaJedinice } from './types.ts'

/**
 * `čl. 19.a st. 2.` — межі за видами одиниць. Що більша одиниця, то вище їй
 * дозволено підняти обидві ставки; знизу межа для всіх однакова.
 */
export const graniceStopa = sourced<Readonly<Record<VrstaJedinice, GraniceStopa>>>(
  {
    // «općina − nižu stopu u granicama od 15 % do 20 % te višu stopu u
    // granicama od 25 % do 30 %»
    opcina: { niza: { min: 1500, max: 2000 }, visa: { min: 2500, max: 3000 } },
    // «grad − … od 15 % do 21 % … od 25 % do 31 %»
    grad: { niza: { min: 1500, max: 2100 }, visa: { min: 2500, max: 3100 } },
    // «veliki grad i grad sjedište županije − … od 15 % do 22 % … od 25 % do 32 %»
    'veliki-grad': { niza: { min: 1500, max: 2200 }, visa: { min: 2500, max: 3200 } },
    // «Grad Zagreb − … od 15 % do 23 % … od 25 % do 33 %»
    'grad-zagreb': { niza: { min: 1500, max: 2300 }, visa: { min: 2500, max: 3300 } },
  },
  { ...ZAKON_O_POREZU_NA_DOHODAK, article: 'čl. 19.a st. 2.', checkedOn: '2026-08-04' },
)

const rasponUnija = (rasponi: readonly RasponStopa[]): RasponStopa => ({
  min: Math.min(...rasponi.map(({ min }) => min)),
  max: Math.max(...rasponi.map(({ max }) => max)),
})

const sveVrste = Object.values(graniceStopa.value)

/**
 * Об'єднання меж усіх видів одиниць.
 *
 * Ширша за будь-яку окрему, і це навмисно: таблиця Porezna uprava не каже,
 * котра одиниця `općina`, а котра `veliki grad`, тож вужчу межу застосувати
 * до конкретної ставки нема на чому. Виводиться з `graniceStopa`, а не
 * вписана числами, щоб стеля 23 % не стала магічною константою без джерела.
 */
export const najsireGranice: GraniceStopa = {
  niza: rasponUnija(sveVrste.map(({ niza }) => niza)),
  visa: rasponUnija(sveVrste.map(({ visa }) => visa)),
}

const uRasponu = (stopa: BazniBodovi, { min, max }: RasponStopa): boolean =>
  stopa >= min && stopa <= max

/**
 * Чи пара ставок узагалі законна — за найширшими межами.
 *
 * Пропускає й таку пару, яку конкретній `općina` закон не дозволив би: без
 * виду одиниці суворіше сказати не можна. Тобто «так» тут означає «не
 * очевидно незаконно», а не «саме ця одиниця має право».
 */
export const uGranicama = ({ niza, visa }: ParStopa): boolean =>
  uRasponu(niza, najsireGranice.niza) && uRasponu(visa, najsireGranice.visa)
