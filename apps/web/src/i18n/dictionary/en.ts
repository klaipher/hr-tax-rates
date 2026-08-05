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
  'd.o.o. — vlasnik u radnom odnosu':
    'limited liability company whose owner is employed by their own company',
  'd.o.o. — vlasnik član uprave':
    'limited liability company whose owner runs it without an employment contract',
  'paušalni porez': 'lump-sum tax',
  'porez na dohodak': 'progressive tax on actual taxable income',
  'porez na dohodak iz plaće': 'income tax withheld from a salary',
  'porez na dohodak iz poduzetničke plaće': 'tax on the salary the owner pays themselves',
  'porez na dobit': 'profit tax, on an accrual basis',
  'porez na dohodak od kapitala pri isplati dobiti':
    'a third tax on the same money — on paying the profit out to the owner',
  'MO — I. stup': 'pension, pay-as-you-go pillar',
  'MO — II. stup': 'pension, funded pillar',
  ZO: 'health insurance',
  'prosječna plaća': 'average gross salary',
  'komorski doprinos': 'chamber levy, payable by every obrt',
  'članarina HGK': 'Croatian Chamber of Economy membership fee',
  'turistička članarina': 'tourist board levy',
  'spomenička renta': 'monument levy on floor area in a cultural monument',
  'indirektna spomenička renta': 'monument levy on total revenue, for listed NKD codes',
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
    osobnoVoziloObjasnjenje:
      'This is the yearly cost of a car you own or rent and drive both for work and privately: ' +
      'fuel, leasing or rent, servicing, tyres, parking. The law does not ask how many of those ' +
      'kilometres were business — it cuts half up front (čl. 33. st. 1. t. 5.) and recognises ' +
      'the cost in full only when the use is charged as plaća (salary). For example: 3 000 € a ' +
      'year lowers the base by 1 500 €. Do not enter insurance here — čl. 33. st. 2. recognises ' +
      'it in full, so it belongs under “ordinary”.',
    traziGrad: 'Search by name',
    nadenoJedinica: (nadeno: string, ukupno: string) =>
      `showing ${nadeno} of ${ukupno} — the list below is already narrowed`,
    grad: 'City or municipality',
    gradPrijevod: 'jedinica lokalne samouprave — its odluka sets the porez na dohodak rates',
    gradNijeOdabran: 'not selected',
    gradNijeNaden: (upit: string) => `No unit matches “${upit}”.`,
    brojMjeseci: (mjeseci: string) =>
      `${mjeseci} months of activity: full months plus the last one count, so opening on ` +
      '15 August gives five months, not four.',
    uzRadniOdnos: 'I run the obrt alongside employment',
    uzRadniOdnosPrijevod: 'druga djelatnost — a different contribution rate and an annual base',
    dob: 'Age you reach this year',
    dobPrijevod: 'empty — the young-worker relief is not applied',
    placaVlasnika: 'Your own monthly salary in your own d.o.o., €',
    placaVlasnikaPrijevod: 'empty — the statutory floor is used',
    pocetak: 'Month the obrt opened',
    pocetakPrijevod: 'in the opening year the razred boundaries scale proportionally',
    punaGodina: 'full year',
    noviObrt: 'The obrt opened less than two years ago',
    noviObrtPrijevod: 'no komorski doprinos is charged for the first two years',
    rucneStope: 'Enter the porez na dohodak rates by hand',
    rucneStopePrijevod: 'for when the directory is stale or the unit changed its odluka mid-year',
    nizaStopa: 'niža stopa, %',
    visaStopa: 'viša stopa, %',
    stopeIzvanGranica: (niza: string, visa: string) =>
      `No unit could have adopted that pair: the law allows ${niza} for the lower rate and ` +
      `${visa} for the higher one. While the pair is out of bounds, the calculation uses the ` +
      'rates from the selected unit’s odluka — they are shown on the card next to the tax.',

    uzdrzavaniNaslov: 'Dependants',
    uzdrzavaniPrijevod:
      'The law states the osobni odbitak as a construction, not a sum: one unit for the ' +
      'taxpayer, a coefficient for each dependant and a separate coefficient for each child in ' +
      'order. While these are zero, you are taxed as if you supported nobody.',
    clanoviUzeObitelji: 'Dependants in the immediate family',
    clanoviPrijevod:
      'uzdržavani članovi uže obitelji — spouse, parents, adult children after their first ' +
      'job. Children are not counted here: they have their own scale.',
    djeca: 'Dependent children',
    djecaPrijevod:
      'uzdržavana djeca — each further child carries a larger coefficient, not the same one',

    djelatnostNaslov: 'Activity and location',
    djelatnostPrijevod:
      'The NKD decides turistička članarina and spomenička renta — two levies no other ' +
      'calculator shows next to the tax.',
    nkd: 'NKD',
    nkdPrijevod: 'your activity — pick it from the list or enter your own code',
    nkdNeispravan: 'That does not look like an NKD code. Examples: 55, 50.1, 49.31, 47.111.',
    nkdOpseg: (koliko: string) =>
      `The list holds only the ${koliko} codes the two statutes name verbatim. If yours ` +
      'is not there, that means exactly one thing: neither levy arises for it.',
    nkdNijeOdabran: 'not on the list — neither levy arises',
    nkdRucnoUnesi: 'another code — I will type it',
    nkdRucnoOznaka: 'NKD code',
    nkdRucnoPrijevod:
      'a five-digit NKD 2025 subclass is fine too: the levy follows the closest match, ' +
      'so 47.111 falls back to division 47',
    skupineNkd: {
      'turisticka-prva': 'turistička članarina · prva skupina (highest rate)',
      'turisticka-druga': 'turistička članarina · druga skupina',
      'turisticka-treca': 'turistička članarina · treća skupina',
      'turisticka-cetvrta': 'turistička članarina · četvrta skupina',
      'turisticka-peta': 'turistička članarina · peta skupina (lowest rate)',
      spomenicka: 'spomenička renta — a different statute, its own list',
    },
    turistickaZajednica: 'A local turistička zajednica covers the place of activity',
    turistickaZajednicaPrijevod: 'without one no obligation arises at all, whatever the NKD',
    potpomognutoPodrucje: 'The place of activity is a potpomognuto područje',
    potpomognutoPrijevod: (popust: string) => `a ${popust}% reduction on the turistička članarina`,
    uKulturnomDobru: 'The premises are in an immovable cultural monument or its zone',
    korisnaPovrsina: 'Usable floor area of the premises, m²',
    iznosPoM2: 'Monthly amount per m², €',
    iznosPoM2Prijevod: (najmanje: string, najvise: string) =>
      `set by the odluka of the city or municipality, within ${najmanje} – ${najvise}`,
    pretezitoProizvodna: 'The predominant activity is manufacturing or production',
    pretezitoProizvodnaPrijevod:
      'the law exempts such activity from the floor-area spomenička renta — and from that one only',
  },

  kartica: {
    ostaje: 'left over per year, before the actual izdatak',
    efektivnaStopa: 'effective rate',
    razredPrijevod: (gornjaGranica: string) => `bracket · cap ${gornjaGranica}`,
    udioOsnovice: (stopa: string) => `${stopa} of the osnovica`,
    udioPoreza: (stopa: string, poreznaOsnovica: string) => `${stopa} of ${poreznaOsnovica}`,
    davanja: 'Mandatory levies',
    davanjaNema: 'not applicable',
    neprimjenjivo: (koliko: string) => `not applicable: ${koliko}`,
    doprinosiUkupno: 'doprinosi in total',
    doprinosiOsnovica: (mjesecnaOsnovica: string) => `osnovica ${mjesecnaOsnovica} per month`,
    ustedaUzRadniOdnos: (usteda: string) => `${usteda} less than without employment`,
    naTeretOsobe: (svoje: string, tude: string) =>
      `${svoje} out of your own money; the remaining ${tude} the employer pays on top of the ` +
      'salary, so it is not deducted from what you keep',
    osobnaStednja: 'personal savings, not a tax',
    nedostupno: 'unavailable',

    davanjaRazlozi: {
      'novootvoreni-obrt': (godina: string) =>
        `A newly opened obrt is exempt for its first ${godina} years. Only the first entry in ` +
        'the Obrtni registar grants the exemption — a reopened obrt pays from day one.',
      'djelatnost-izvan-popisa': (nkd: string) =>
        `NKD ${nkd} is not in the list of activities that give rise to this levy.`,
      'izvan-podrucja-turisticke-zajednice':
        'The obligation arises only on the territory of a local turistička zajednica ' +
        'established under the act.',
      'izvan-kulturnog-dobra':
        'The activity is not carried out in an immovable cultural monument or in a ' +
        'historic-cultural zone.',
      'pretezito-proizvodna-djelatnost':
        'The law exempts those whose predominant activity is manufacturing or production.',
      'djelatnost-nije-zadana':
        'The NKD and the place of activity decide whether this applies, and the form does not ' +
        'know them yet. Fill them in and you will see whether the levy arises.',
      'nije-obrt':
        'The komorski doprinos is paid by an obrt. A company is not a member of that chamber — ' +
        'this is not an exemption but a different legal form.',
      'nije-trgovacko-drustvo':
        'Membership of the Croatian Chamber of Economy applies to companies. An obrt belongs ' +
        'to the crafts chamber and pays its levy there.',
      'nema-samostalne-djelatnosti':
        'An employee carries out no self-employed activity, so levies tied to an NKD and a ' +
        'place never reach them at all.',
      'prva-skupina-nije-obveznik':
        'The first group is not liable: by size the company falls into it, and membership ' +
        'there is voluntary, on a declaration. This is exactly where a d.o.o. and an obrt ' +
        'part ways: an obrt always pays its own chamber.',
      'velicina-nije-odrediva':
        'Revenue has crossed the first group’s threshold, and the form does not know the other ' +
        'criteria — total assets and headcount. Without them the group cannot be determined, ' +
        'and guessing the fee is not an option.',
    },

    davanjaNapomene: {
      'ogranicenje-nkd': (nkd: string, ogranicenje: string) =>
        `The law does not take NKD ${nkd} whole, only the part reading “${ogranicenje}”. The ` +
        'amount assumes the obrt’s activity falls within it.',
      'stopa-je-gornja-granica': (stopa: string) =>
        `${stopa}% is the statutory ceiling, not an adopted rate: read the amount as a maximum ` +
        'until HOK adopts a new Odluka within those bounds.',
      'stopu-utvrduje-jedinica':
        'The amount per m² is set by the odluka of the city, the municipality or the City of ' +
        'Zagreb — the law fixes only the range, so the sum depends on the exact place.',
    },

    napomeneRezima: {
      'bruto-placa-nije-primitak': (trosak: string) =>
        `Here the figure you entered is read as a gross salary, not as a primitak. The ` +
        `difference is not cosmetic: an obrt’s client pays exactly that sum, whereas an ` +
        `employee costs their employer ${trosak} a year — for contributions paid on top of ` +
        'the salary.',
      'neoporezivi-primici-nisu-uracunati':
        'Christmas bonuses, meal and travel allowances and other tax-free payments are not ' +
        'included: they come from an employer’s discretion, not from the law. In practice they ' +
        'reach a few thousand euro a year, so real employment can be more generous than this card.',
      'umanjena-osnovica-prvog-stupa': (umanjenje: string) =>
        `The law reduced the MO I. stup contribution base by ${umanjenje} a month — and only ` +
        'that one: II. stup and ZO are computed from the full base. That is why the 15% rate on ' +
        'the MO — I. stup row does not match its amount: the law cut the base, not the rate.',
      'ispod-minimalne-place': (minimalna: string) =>
        `This is below the minimalna plaća of ${minimalna} a month. Nothing is being broken: ` +
        'the minimum is set for full-time work, so such a figure means part-time.',
      'placa-podignuta-na-najnizu-osnovicu': (trazena: string, primijenjena: string) =>
        `You set ${trazena} a month, but contributions were computed from ${primijenjena}: the ` +
        'law does not allow a lower osnovica. That is why “pay myself the minimum wage and take ' +
        'the rest as dividends” works far less well than it sounds.',
      'prag-plave-karte-dosegnut': (prag: string) =>
        `An EU Blue Card requires a gross salary from ${prag} a month — this figure clears it. ` +
        'That is a condition for issuing the permit, not a tax rule: it changes none of the ' +
        'figures on this card.',
      'prag-plave-karte-nedosegnut': (prag: string) =>
        `An EU Blue Card requires a gross salary from ${prag} a month — this figure falls ` +
        'short. That is a condition for issuing the permit, not a tax rule: it changes none of ' +
        'the figures on this card.',
      'olaksica-za-mlade-kao-povrat': (iznos: string) =>
        `${iznos} of this tax comes back to you as the young-worker relief — but not in your ` +
        'payslip. The advance is withheld in full during the year, and the tax authority grants ' +
        'the relief in the annual assessment, paying it out the following calendar year.',
    },
  },

  obriv: {
    naslov: 'A razred boundary lies ahead',
    doGranice: (doGranice: string, granica: string) =>
      `${doGranice} of annual primitak left before the ${granica} boundary.`,
    skok: (ukupno: string, porez: string, doprinosi: string) =>
      `One euro past it costs ${ukupno} a year: ${porez} of tax and ${doprinosi} of contributions.`,
    retroaktivno: (mjeseci: string) =>
      `Contributions are recomputed ${mjeseci} months back. The koeficijent depends on the ` +
      'razred, so crossing the boundary in December rewrites the whole year, not December.',
    krajRezima: 'Past this boundary the paušalni regime does not exist at all — books follow.',
  },

  preokret: {
    naslov: 'Where the regimes change places',
    prijevod:
      'The card says how much is left at this primitak. This says how far your choice stays ' +
      'the cheapest one.',
    doPrve: (primitak: string, rezim: string) => `Below ${primitak} the best is ${rezim}.`,
    tocka: (primitak: string, dosadasnji: string, sljedeci: string) =>
      `From ${primitak} the lead passes from ${dosadasnji} to ${sljedeci}.`,
    nema: 'One regime stays the cheapest across the whole range — there is nowhere to switch.',
  },

  tablica: {
    naslov: 'Every razred at once',
    prijevod:
      'Inside a razred the amount is fixed — which is why the payment jumps at the boundary ' +
      'without a jump in primitak. The ladder concerns paušalni obrt only: the other regimes ' +
      'know no razredi.',
    granica: 'primitak cap',
    osnovica: 'paušalni dohodak',
    porez: 'paušalni porez',
    doprinosi: 'doprinosi',
    ukupno: 'total per year',
    vas: 'your razred',
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
    'vec-u-radnom-odnosu':
      'You marked that you already work as an employee, and the obrt regimes were computed ' +
      'with that in mind. This card asks a different question — what if employment alone, with ' +
      'no activity. Both answers at once would mean the same figure reads as plaća plus ' +
      'primitak on the left and as plaća alone on the right. Clear the checkbox to see ' +
      'employment on its own.',
  },

  pretpostavke: {
    naslov: 'Assumptions',
    godina: (godina: string) => `The rules are those in force for ${godina}.`,
    objasnjenje:
      'Contributions are computed from this figure: osnovica = prosječna plaća × koeficijent, ' +
      'then 36.5% of that. The law does not set it, it only refers to it, so it sits in a layer ' +
      'separate from the rules — the scenario switch leaves it alone. It is also why the two ' +
      'official 2027 calculations differ on contributions while agreeing on the rates: the ' +
      'bill’s impact assessment works from the current 1 993 €, the HOK calculator from a ' +
      'forecast 2 180 €.',
    placaPrijevod: 'the average monthly gross salary the law derives the osnovica from',
    mjesecno: '€ per month',
    objavljena: 'published',
    prognoza: 'forecast',
    rucnoZadano: 'entered by hand — this figure has no source',
  },

  krajina: {
    naslov: 'Compare with the Ukrainian FOP, group 3',
    rezidentnost:
      'This comparison shows what things would look like had you stayed a Ukrainian tax ' +
      'resident. A Croatian resident does not get that choice: more than 183 days or a centre ' +
      'of vital interests here, and Croatia taxes worldwide income — tax paid in Ukraine does ' +
      'not discharge the Croatian liability.',
    tecaj: 'Your own hryvnia-per-euro rate',
    tecajPrijevod: 'leave empty and we take the NBU rate',
    tecajNaDan: 'Date the rate is valid for',
    tecajUcitavanje: 'Asking the NBU for the rate…',
    tecajPodrijetlo: {
      'nbu-live': 'live NBU rate',
      'nbu-snapshot': 'NBU snapshot stored in the repository — the live request failed',
      manual: 'your rate',
    },
    tecajIzvor: (podrijetlo: string, datum: string) => `${podrijetlo}, as of ${datum}`,
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
      'Of the paušal razredi the package touches only the top two, from 40 000 €. But the same ' +
      'package lowers the statutory ceiling of the komorski doprinos, and that concerns every ' +
      'obrt at any primitak — which is why the cards move below 40 000 € too.',
    delta: (iznos: string) =>
      `Paušal rules: ${iznos} a year of difference against the law in force. The change to the ` +
      'komorski doprinos is not counted here — it is the same across the range and shows as its ' +
      'own line on the card.',
    bezRazlike:
      'At this primitak the paušal rules make no difference — it is below 40 000 €. The ' +
      'komorski doprinos line on the card differs all the same.',
  },
  izvor: {
    provjereno: (datum: string) => `checked on ${datum}`,
  },
}
