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
    davanja: 'Obvezna davanja',
    davanjaNema: 'ne primjenjuje se',
    doprinosiUkupno: 'doprinosi ukupno',
    doprinosiOsnovica: (mjesecnaOsnovica: string) => `osnovica ${mjesecnaOsnovica} mjesečno`,
    osobnaStednja: 'osobna ušteđevina, a ne porez',
    nedostupno: 'nedostupno',
  },

  pojmovi,

  razlozi: {
    'iznad-praga-pausala': (primitak: string, prag: string) =>
      `Godišnji primitak ${primitak} prelazi prag ${prag} do kojega zakon dopušta paušalno ` +
      'oporezivanje. Iznad toga obrt vodi poslovne knjige i ulazi u sustav PDV-a.',
    'nedosljedna-tablica-razreda': (primitak: string, prag: string) =>
      `Tablica razreda ne pokriva primitak ${primitak}: najviši razred završava ispod praga ` +
      `${prag}. Skup pravila je proturječan i po njemu se ne može računati.`,
    'svedeni-primitak-izvan-tablice': (primitak: string, svedeni: string, mjeseci: string) =>
      `Uz ${mjeseci} mj. djelatnosti primitak ${primitak} odgovara godišnjem ${svedeni}: ` +
      'razmjerno svođenje množi prosječni mjesečni primitak s punom godinom. Takav godišnji ' +
      'primitak tablica razreda ne pokriva.',
    'koeficijent-djeteta-nije-propisan': (dostupno: string, trazeno: string) =>
      `Zakon propisuje koeficijente osobnog odbitka samo do ${dostupno}. djeteta, a pravilo ` +
      `za svako sljedeće navodi s izostavljanjem. Koeficijenta za ${trazeno}. dijete u tekstu ` +
      'akta nema, a izmisliti ga značilo bi izmisliti porez.',
    'nema-izdataka':
      'Režim oporezuje dohodak — razliku stvarnih primitaka i izdataka. Dok izdatak nije ' +
      'unesen, svaki bi broj ovdje bio izmišljen.',
    'nema-jedinice':
      'Stope poreza na dohodak propisuje jedinica lokalne samouprave i različite su. ' +
      'Odaberite grad ili općinu — bez toga stopa nije poznata.',
    'nema-izdataka-ni-jedinice':
      'Režim utvrđuje dobit kao razliku prihoda i rashoda po načelu nastanka događaja i ' +
      'dopušta vlasniku poduzetničku plaću. Bez izdataka i bez stopa odabrane jedinice ' +
      'nema se iz čega računati.',
    'nema-pravila': (pravila: string) => `Pravila „${pravila}” nisu uključena u ovaj skup.`,
    zaposlenik:
      'Zaposlenik ne bira režim — njegovu plaću oporezuje poslodavac. Ulaz bi ovdje bila ' +
      'ugovorena bruto plaća, a ne godišnji primitak, pa kartica čeka drugi ulaz, a ne ' +
      'dodatni izračun.',
    doo:
      'Vlasnik d.o.o.-a novac dobiva dvama različitim putovima — poduzetničkom plaćom i ' +
      'dividendom — i svaki se oporezuje po svojim pravilima. Dok obrazac ne zna kako je ' +
      'isplata podijeljena, svaki bi neto iznos bio proizvoljan.',
  },

  pretpostavke: {
    naslov: 'Pretpostavke',
    godina: (godina: string) => `Pravila su na snazi za ${godina}. godinu.`,
    objasnjenje:
      'Doprinosi se računaju iz te veličine. Zakon je ne propisuje, nego se na nju samo ' +
      'poziva, pa stoji u sloju odvojenom od pravila i može se nadomjestiti.',
  },

  krajina: {
    naslov: 'Usporedi s ukrajinskim FOP-om 3. skupine',
    rezidentnost:
      'Usporedba pokazuje što bi bilo da ste ostali porezni rezident Ukrajine. Za rezidenta ' +
      'Hrvatske tog izbora nema: više od 183 dana ili središte životnih interesa ovdje — i ' +
      'Hrvatska oporezuje svjetski dohodak, a porez plaćen u Ukrajini hrvatsku obvezu ne gasi.',
    tecaj: 'Tečaj grivne za euro',
    tecajIzvor: (datum: string) => `službeni tečaj NBU, snimka od ${datum}`,
    tecajNeispravan: 'Tečaj mora biti pozitivan broj.',
    ukupno: 'Ukupno',
    ostaje: 'ostaje godišnje',
    prekoracenje: (limit: string, nadlimit: string) =>
      `Godišnji dohodak prelazi limit 3. skupine od ${limit} ₴ za ${nadlimit} ₴. ` +
      'Iznad limita nastupa viša stopa i prelazak na opći sustav — kalkulator to namjerno ' +
      'ne računa, nego samo javlja.',
  },
  pdv: {
    tipKlijenta: 'Odakle su klijenti',
    tipKlijentaPrijevod: 'o tome ovisi hoće li na vašim računima biti PDV',
    klijenti: {
      'poslovni-eu': 'poslovni subjekti u EU',
      'poslovni-izvan-eu': 'poslovni subjekti izvan EU',
      tuzemni: 'tuzemni klijenti',
    },
    inozemneUsluge: 'Inozemne usluge godišnje',
    inozemneUslugePrijevod: 'hosting, podizvođači, pretplate — kupljeni izvan Hrvatske',
    status: (status: string) => `Zakon na ovaj primitak nameće stanje: ${status}.`,
    statusi: { 'izvan-sustava': 'izvan sustava PDV-a', 'u-sustavu': 'u sustavu PDV-a' },
    izlaz: 'PDV na vašim računima',
    nepovratni: 'Nepovratni PDV na inozemne usluge',
    uSustavuNepovratni: 'Isto, da ste u sustavu PDV-a',
    usteda: (iznos: string) =>
      `Ulazak u sustav PDV-a uklanja ${iznos} godišnje nepovratnog poreza. To je inverzija: ` +
      'što je više inozemnih usluga, to skuplje stoji život ispod praga.',
    pdvId: 'Potreban je PDV ID — i ispod praga ulaska u sustav.',
  },
  kalendar: {
    naslov: 'Kalendar plaćanja',
    prijevod:
      'Godišnji iznos ne govori ništa o novčanom toku: paušalni porez ide tromjesečnim ' +
      'predujmovima, doprinosi mjesečno, a razlika po godišnjem izvješću dolazi tek iduće godine.',
    pomaknuto: 'rok je pao na neradni dan — pomaknuto',
  },
  scenarij: {
    naslov: 'Skup pravila',
    'na-snazi': 'zakon na snazi',
    najava: 'najavljene izmjene',
    prognoza:
      'Najavljene izmjene još nisu donesene. Prosječna plaća za 2027. fizički ne postoji — ' +
      'objavljuje se za siječanj–kolovoz 2026. — pa su iznosi doprinosa ovdje prognoza.',
    delta: (iznos: string) => `Razlika prema zakonu na snazi: ${iznos} godišnje.`,
    bezRazlike: 'Na ovaj primitak najavljene izmjene ne mijenjaju ništa.',
  },
  izvor: {
    provjereno: (datum: string) => `provjereno ${datum}`,
  },
}
