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
    izdaciNaslov: 'Expenses per year',
    okolnostiNaslov: 'Your circumstances',
    okolnostiPrijevod: 'these decide the rates and reliefs that apply',
    izdaciPrijevod:
      'These affect obrt na dohodak and obrt na dobit: there the tax is taken from the ' +
      'difference between receipts and expenditure, so every euro entered lowers the base. ' +
      'They do not affect paušalni obrt at all — there the law presumes the expenditure, ' +
      'whatever the real figure. Counted on a cash basis: in the year the money actually left.',
    izdaciPrimjer:
      'For example: 3 600 € of rent plus 1 200 € of hosting and subscriptions is 4 800 € under ' +
      '“ordinary”. A 200 € client lunch goes under “entertainment”, and the law recognises 100 €.',
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
    davanja: 'Mandatory levies',
    davanjaNema: 'not applicable',
    doprinosiUkupno: 'doprinosi in total',
    doprinosiOsnovica: (mjesecnaOsnovica: string) => `osnovica ${mjesecnaOsnovica} per month`,
    osobnaStednja: 'personal savings, not a tax',
    nedostupno: 'unavailable',
  },

  pojmovi,

  razlozi: {
    'iznad-praga-pausala': (primitak: string, prag: string) =>
      `An annual primitak of ${primitak} exceeds the ${prag} threshold up to which the law ` +
      'allows paušalno oporezivanje. Above it the obrt keeps books and enters the PDV system.',
    'nedosljedna-tablica-razreda': (primitak: string, prag: string) =>
      `The razred table does not cover a primitak of ${primitak}: the top razred ends below ` +
      `the ${prag} threshold. The rule set contradicts itself and cannot be computed from.`,
    'svedeni-primitak-izvan-tablice': (primitak: string, svedeni: string, mjeseci: string) =>
      `Over ${mjeseci} months of activity a primitak of ${primitak} annualises to ${svedeni}: ` +
      'the proportional rule multiplies the average monthly primitak by a full year. The ' +
      'razred table does not cover that annual figure.',
    'koeficijent-djeteta-nije-propisan': (dostupno: string, trazeno: string) =>
      `The law prints osobni odbitak coefficients only up to child ${dostupno}, and states ` +
      `the rule for each further child with an ellipsis. There is no coefficient for child ` +
      `${trazeno} in the text of the act, and inventing one would mean inventing a tax.`,
    'nema-izdataka':
      'This regime taxes dohodak — the difference between actual primitak and izdatak. ' +
      'Until izdatak is entered, any figure here would be invented.',
    'nema-jedinice':
      'The porez na dohodak rates are set by the jedinica lokalne samouprave and they differ. ' +
      'Pick a city or municipality — without one the rate is unknown.',
    'nema-izdataka-ni-jedinice':
      'This regime determines dobit as prihod less rashod on an accrual basis and lets the ' +
      'owner take a poduzetnička plaća. Without expenses and without the chosen unit’s rates ' +
      'there is nothing to compute from.',
    'nema-pravila': (pravila: string) => `The “${pravila}” rules are not part of this set.`,
    zaposlenik:
      'An employee does not choose a regime — their plaća is taxed by the employer. The input ' +
      'here would be an agreed gross salary rather than an annual primitak, so the card is ' +
      'waiting for a different input, not for more arithmetic.',
    doo:
      'A d.o.o. owner takes money out along two different routes — poduzetnička plaća and ' +
      'dividends — each taxed by its own rules. Until the form knows how the payout is split, ' +
      'any net figure would be arbitrary.',
  },

  pretpostavke: {
    naslov: 'Assumptions',
    godina: (godina: string) => `The rules are those in force for ${godina}.`,
    objasnjenje:
      'Contributions are computed from this figure. The law does not set it, it only refers ' +
      'to it, so it sits in a layer separate from the rules and can be overridden.',
  },

  krajina: {
    naslov: 'Compare with the Ukrainian FOP, group 3',
    rezidentnost:
      'This comparison shows what things would look like had you stayed a Ukrainian tax ' +
      'resident. A Croatian resident does not get that choice: more than 183 days or a centre ' +
      'of vital interests here, and Croatia taxes worldwide income — tax paid in Ukraine does ' +
      'not discharge the Croatian liability.',
    tecaj: 'Hryvnia per euro',
    tecajIzvor: (datum: string) => `official NBU rate, snapshot of ${datum}`,
    tecajNeispravan: 'The rate must be a positive number.',
    ukupno: 'Total',
    ostaje: 'left per year',
    prekoracenje: (limit: string, nadlimit: string) =>
      `Annual income exceeds the group-3 limit of ${limit} by ${nadlimit}. Above the ` +
      'limit a higher rate applies and the taxpayer moves to the general system — the ' +
      'calculator deliberately does not compute either, it only reports.',
  },
  pdv: {
    tipKlijenta: 'Where your clients are',
    tipKlijentaPrijevod: 'this decides whether your invoices carry PDV',
    klijenti: {
      'poslovni-eu': 'businesses in the EU',
      'poslovni-izvan-eu': 'businesses outside the EU',
      tuzemni: 'Croatian clients',
    },
    inozemneUsluge: 'Foreign services per year',
    inozemneUslugePrijevod: 'hosting, contractors, subscriptions — bought outside Croatia',
    status: (status: string) => `At this primitak the law imposes: ${status}.`,
    statusi: { 'izvan-sustava': 'outside the PDV system', 'u-sustavu': 'inside the PDV system' },
    premaZakonu: 'by law',
    stavka: 'Item',
    bezInozemnih:
      'Foreign services are set to zero, so the input side is empty. Enter an amount and you ' +
      'will see how much tax you lose outside the PDV system and how much entering it returns.',
    izlaz: 'PDV on your invoices',
    nepovratni: 'Non-deductible PDV on foreign services',
    uSustavuNepovratni: 'The same, were you inside the PDV system',
    usteda: (iznos: string) =>
      `Entering the PDV system removes ${iznos} a year of non-deductible tax. That is the ` +
      'inversion: the more foreign services you buy, the more staying below the threshold costs.',
    pdvId: 'A PDV ID is required — even below the registration threshold.',
  },
  kalendar: {
    naslov: 'Payment calendar',
    prijevod:
      'The annual figure says nothing about cash flow: paušalni porez is paid in quarterly ' +
      'advances, doprinosi monthly, and the year-end settlement only falls due the next year.',
    pomaknuto: 'the deadline fell on a non-working day — moved',
    razlika: (godina: string) =>
      `The year-end settlement only falls due in ${godina}. In a steady state it is zero — ` +
      'an amount appears when the actual result diverges from the advances.',
  },
  scenarij: {
    naslov: 'Rule set',
    'na-snazi': 'law in force',
    najava: 'announced changes',
    prognoza:
      'The announced changes are not enacted yet. The 2027 prosječna plaća does not exist ' +
      'physically — it is published from January–August 2026 data — so the contribution ' +
      'figures here are a forecast, not a calculation.',
    samoPausal:
      'The changes concern paušalni obrt only — and within it only the top two razredi, from ' +
      '40 000 €. The other regimes do not depend on them.',
    delta: (iznos: string) =>
      `Paušalni obrt: ${iznos} a year of difference against the law in force.`,
    bezRazlike: 'At this primitak the announced changes make no difference — it is below 40 000 €.',
  },
  izvor: {
    provjereno: (datum: string) => `checked on ${datum}`,
  },
}
