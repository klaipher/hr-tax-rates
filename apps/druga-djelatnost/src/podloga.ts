import {
  drugaDjelatnost2026,
  KOMORSKI_DOPRINOS_U_SNAZI,
  placa2026,
  plavaKarta2026,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import type { PodlogaDrugeDjelatnosti } from '@hr-tax/engine'

/**
 * Два шари даних, на яких стоїть застосунок: закон і статистика (ADR-0001).
 *
 * Вужча за підкладку порівняння: тут немає ані `obrt na dobit`, ані правил
 * `član uprave`, ані неповного року — цей застосунок про один режим поряд із
 * наймом, і правила, яких він не питає, не мають лежати в нього в кишені.
 */
export const PODLOGA: PodlogaDrugeDjelatnosti = {
  ruleset: ruleset2026,
  pretpostavke: pretpostavke2026,
  placa: placa2026,
  drugaDjelatnost: drugaDjelatnost2026,
  plavaKarta: plavaKarta2026,
  komorskiDoprinos: KOMORSKI_DOPRINOS_U_SNAZI,
}
