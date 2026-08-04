import type { Dictionary } from '../dictionary.ts'

/**
 * Англійська.
 *
 * Хорватський термін лишається хорватським і тут: англійська тягне `primitak`,
 * `izdatak`, `dohodak` і `dobit` в одне «income», а це чотири різні поняття
 * (CONTEXT.md). Тому в тексті стоїть термін, а поруч — пояснення.
 */
const pojmovi: Record<string, string> = {
  'paušalni obrt': 'lump-sum sole trader',
  'obrt na dohodak': 'books-based sole trader',
  'obrt na dobit': 'profit-taxed sole trader',
  zaposlenik: 'employee',
  'd.o.o.': 'limited liability company',
  'paušalni porez': 'lump-sum tax',
  'MO — I. stup': 'pension, pay-as-you-go pillar',
  'MO — II. stup': 'pension, funded pillar',
  ZO: 'health insurance',
  'prosječna plaća': 'average gross salary',
}

export const en: Dictionary = {
  dokument: {
    opis:
      'A comparison of Croatian tax regimes: paušalni obrt (lump-sum sole trader), ' +
      'obrt na dohodak (books-based sole trader), obrt na dobit (profit-taxed sole trader).',
  },

  zaglavlje: {
    naslov: 'Croatian tax regimes',
    podnaslov:
      'One annual primitak — every regime at once, with a link to the article of law behind ' +
      'each number.',
  },

  jezik: {
    oznaka: 'Interface language',
    promjena: (jezik: string) => `Interface language: ${jezik}`,
  },

  unos: {
    oznaka: 'Annual primitak',
    prijevod: 'receipts from the activity, on a cash basis',
    izdaciNaslov: 'Annual izdatak',
    izdaciPrijevod:
      'expenditure on a cash basis — the book-keeping regimes cannot be computed without it',
    ostalo: 'Ordinary expenditure',
    reprezentacija: 'Entertainment',
    osobnoVozilo: 'Personal vehicle',
    polovicno: 'recognised at 50%',
    grad: 'City or municipality',
    gradPrijevod: 'jedinica lokalne samouprave — its odluka sets the porez na dohodak rates',
    gradNijeOdabran: 'not selected',
    uzRadniOdnos: 'I run the obrt alongside employment',
    uzRadniOdnosPrijevod: 'druga djelatnost — a different contribution rate and an annual base',
    pocetak: 'Month the obrt opened',
    pocetakPrijevod: 'in the opening year the razred boundaries scale proportionally',
    punaGodina: 'full year',
  },

  kartica: {
    ostaje: 'left over per year, before the actual izdatak',
    efektivnaStopa: 'effective rate',
    razredPrijevod: (gornjaGranica: string) => `bracket · cap ${gornjaGranica}`,
    udioOsnovice: (stopa: string) => `${stopa} of the osnovica`,
    udioPoreza: (stopa: string, poreznaOsnovica: string) => `${stopa} of ${poreznaOsnovica}`,
    doprinosiUkupno: 'doprinosi in total',
    doprinosiOsnovica: (mjesecnaOsnovica: string) => `osnovica ${mjesecnaOsnovica} per month`,
    osobnaStednja: 'personal savings, not a tax',
    nedostupno: 'unavailable',
  },

  pojmovi,

  razlozi: {
    'pausalni-obrt': (prag: string) =>
      `The annual primitak exceeds the ${prag} threshold up to which the law allows lump-sum ` +
      'taxation. Above it an obrt keeps books and enters the PDV system.',
    'obrt-na-dohodak':
      'This regime derives dohodak as the difference between the actual primitak and izdatak, ' +
      'and charges porez na dohodak at the lower and higher rates set by the jedinica lokalne ' +
      'samouprave. Neither izdatak nor the jedinica is an input of this form yet, so any ' +
      'number here would be invented.',
    'obrt-na-dobit':
      'This regime determines dobit on an accrual basis rather than a cash one, and lets the ' +
      'owner draw a poduzetnička plaća, which is itself taxed as a salary. This slice knows ' +
      'neither accrual accounting nor poduzetnička plaća yet.',
    zaposlenik:
      'An employee does not pick a regime — the employer taxes their plaća. The input here ' +
      'would be an agreed gross salary rather than an annual primitak, so this card is ' +
      'waiting for a different input, not for more arithmetic.',
    doo:
      'The owner of a d.o.o. takes money out along two different paths — poduzetnička plaća ' +
      'and dividends — and each is taxed by its own rules. Until the form knows how the ' +
      'payout is split, any take-home figure would be arbitrary.',
  },

  pretpostavke: {
    naslov: 'Assumptions',
    godina: (godina: string) => `The rules are those in force for ${godina}.`,
    objasnjenje:
      'Contributions are computed from this figure. The law does not set it, it only refers ' +
      'to it, so it sits in a layer separate from the rules and can be overridden.',
  },

  izvor: {
    provjereno: (datum: string) => `checked on ${datum}`,
  },
}
