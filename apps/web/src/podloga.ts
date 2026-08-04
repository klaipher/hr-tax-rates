import {
  drugaDjelatnost2026,
  obrtNaDobit2026,
  obrtNaDohodak2026,
  PRAVILA_NEPUNE_GODINE,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import type { PodlogaUsporedbe } from '@hr-tax/engine'

/**
 * Два шари даних, на яких стоїть застосунок: закон і статистика (ADR-0001).
 *
 * Живе окремим модулем, бо потрібне не лише формі: пояснення недоступності
 * режиму бере з `ruleset` поріг паушалу, і зашивати це юридичне число в
 * переклад було б порушенням ADR-0002.
 */
export const PODLOGA: PodlogaUsporedbe = {
  ruleset: ruleset2026,
  pretpostavke: pretpostavke2026,
  obrtNaDohodak: obrtNaDohodak2026,
  obrtNaDobit: obrtNaDobit2026,
  drugaDjelatnost: drugaDjelatnost2026,
  nepunaGodina: PRAVILA_NEPUNE_GODINE,
}
