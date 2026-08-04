import type { Dictionary } from '../dictionary.ts'

/**
 * Хорватська.
 *
 * Пояснення поруч із терміном тут не переклад, а коротке тлумачення: сам
 * термін хорват уже читає, а от що саме за ним стоїть — ні. Тому `pojmovi`
 * розкривають зміст, а не повторюють назву.
 */
const pojmovi: Record<string, string> = {
  'paušalni obrt': 'obrt s paušalno utvrđenim dohotkom',
  'obrt na dohodak': 'obrt koji vodi poslovne knjige',
  'obrt na dobit': 'obrt u sustavu poreza na dobit',
  zaposlenik: 'radnik u radnom odnosu',
  'd.o.o.': 'društvo s ograničenom odgovornošću',
  'paušalni porez': 'porez na paušalni dohodak',
  'MO — I. stup': 'mirovinsko, generacijska solidarnost',
  'MO — II. stup': 'mirovinsko, individualna kapitalizirana štednja',
  ZO: 'zdravstveno osiguranje',
  'prosječna plaća': 'prosječna mjesečna bruto plaća',
}

export const hr: Dictionary = {
  dokument: {
    opis:
      'Usporedba poreznih režima u Hrvatskoj: paušalni obrt, obrt na dohodak i ' +
      'obrt na dobit, uz poveznicu na članak zakona iza svakog broja.',
  },

  zaglavlje: {
    naslov: 'Porezni režimi u Hrvatskoj',
    podnaslov:
      'Jedan godišnji primitak — svi režimi odjednom, uz poveznicu na članak zakona iza ' +
      'svakog broja.',
  },

  jezik: {
    oznaka: 'Jezik sučelja',
    promjena: (jezik: string) => `Jezik sučelja: ${jezik}`,
  },

  unos: {
    oznaka: 'Godišnji primitak',
    prijevod: 'primici od djelatnosti po načelu blagajne',
    izdaciNaslov: 'Godišnji izdatak',
    izdaciPrijevod: 'izdaci po načelu blagajne — bez njih se režimi s knjigama ne računaju',
    ostalo: 'Ostali izdaci',
    reprezentacija: 'Reprezentacija',
    osobnoVozilo: 'Osobno vozilo',
    polovicno: 'priznaje se 50 %',
    grad: 'Grad ili općina',
    gradPrijevod: 'jedinica lokalne samouprave — njezina odluka propisuje stope poreza na dohodak',
    gradNijeOdabran: 'nije odabrano',
    uzRadniOdnos: 'Obrt vodim uz radni odnos',
    uzRadniOdnosPrijevod: 'druga djelatnost — druga stopa doprinosa i godišnja osnovica',
    pocetak: 'Mjesec otvaranja obrta',
    pocetakPrijevod: 'u godini otvaranja granice razreda razmjerno se umanjuju',
    punaGodina: 'puna godina',
  },

  kartica: {
    ostaje: 'ostaje godišnje, prije stvarnog izdatka',
    efektivnaStopa: 'efektivna stopa',
    razredPrijevod: (gornjaGranica: string) => `gornja granica ${gornjaGranica}`,
    udioOsnovice: (stopa: string) => `${stopa} osnovice`,
    udioPoreza: (stopa: string, poreznaOsnovica: string) => `${stopa} od ${poreznaOsnovica}`,
    doprinosiUkupno: 'doprinosi ukupno',
    doprinosiOsnovica: (mjesecnaOsnovica: string) => `osnovica ${mjesecnaOsnovica} mjesečno`,
    osobnaStednja: 'osobna ušteđevina, a ne porez',
    nedostupno: 'nedostupno',
  },

  pojmovi,

  razlozi: {
    'pausalni-obrt': (prag: string) =>
      `Godišnji primitak prelazi prag od ${prag} do kojega zakon dopušta paušalno ` +
      'oporezivanje. Iznad tog praga obrt vodi poslovne knjige i ulazi u sustav PDV-a.',
    'obrt-na-dohodak':
      'Režim utvrđuje dohodak kao razliku stvarnih primitaka i izdataka, a porez na dohodak ' +
      'obračunava po nižoj i višoj stopi koje propisuje jedinica lokalne samouprave. Ni ' +
      'izdatak ni jedinica još nisu ulazi ovog obrasca, pa bi svaki broj ovdje bio izmišljen.',
    'obrt-na-dobit':
      'Režim utvrđuje dobit po načelu nastanka poslovnog događaja, a ne po naplati, i ' +
      'dopušta vlasniku poduzetničku plaću, koja se i sama oporezuje kao plaća. Ni obračunsko ' +
      'računovodstvo ni poduzetnička plaća još nisu dio ovog presjeka.',
    zaposlenik:
      'Radnik ne bira režim — njegovu plaću oporezuje poslodavac. Ulaz bi ovdje bila ' +
      'ugovorena bruto plaća, a ne godišnji primitak, pa kartica čeka drugi ulaz, a ne ' +
      'dodatni izračun.',
    doo:
      'Vlasnik d.o.o.-a novac uzima na dva različita načina — poduzetničkom plaćom i ' +
      'dividendom — i svaki se oporezuje po svojim pravilima. Dok obrazac ne zna kako je ' +
      'isplata podijeljena, svaki iznos na ruke bio bi proizvoljan.',
  },

  pretpostavke: {
    naslov: 'Pretpostavke',
    godina: (godina: string) => `Pravila su na snazi za ${godina}. godinu.`,
    objasnjenje:
      'Doprinosi se računaju iz te veličine. Zakon je ne propisuje, nego se na nju samo ' +
      'poziva, pa stoji u sloju odvojenom od pravila i može se nadomjestiti.',
  },

  izvor: {
    provjereno: (datum: string) => `provjereno ${datum}`,
  },
}
