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
  'porez na dohodak': 'progresivni porez na stvarni dohodak',
  'porez na dohodak iz poduzetničke plaće': 'porez na plaću koju vlasnik isplaćuje sam sebi',
  'porez na dobit': 'porez na dobit po načelu nastanka događaja',
  'porez na dohodak od kapitala pri isplati dobiti':
    'treći porez na isti novac — pri isplati dobiti vlasniku',
  'MO — I. stup': 'mirovinsko, generacijska solidarnost',
  'MO — II. stup': 'mirovinsko, individualna kapitalizirana štednja',
  ZO: 'zdravstveno osiguranje',
  'prosječna plaća': 'prosječna mjesečna bruto plaća',
  'komorski doprinos': 'obvezni doprinos Hrvatskoj obrtničkoj komori',
  'turistička članarina': 'članarina turističkoj zajednici',
  'spomenička renta': 'renta po korisnoj površini u kulturnom dobru',
  'indirektna spomenička renta': 'renta po ukupnom prihodu za propisane NKD',
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
    izdaciNaslov: 'Izdaci godišnje',
    okolnostiNaslov: 'Vaše okolnosti',
    okolnostiPrijevod: 'o njima ovise stope i olakšice',
    izdaciPrijevod:
      'Utječu na obrt na dohodak i obrt na dobit: ondje se porez uzima iz razlike primitaka i ' +
      'izdataka, pa svaki uneseni euro smanjuje osnovicu. Na paušalni obrt ne utječu uopće — ' +
      'ondje izdatak pretpostavlja zakon, bez obzira na stvarni. Računaju se po načelu ' +
      'blagajne: u godini u kojoj je novac stvarno izašao.',
    izdaciPrimjer:
      'Primjer: najamnina 3 600 € i hosting s pretplatama 1 200 € čine 4 800 € u „ostalo”. ' +
      'Ručak s klijentom od 200 € ide u „reprezentaciju”, a zakon priznaje samo 100 €.',
    ostalo: 'Ostali izdaci',
    reprezentacija: 'Reprezentacija',
    osobnoVozilo: 'Osobno vozilo',
    polovicno: 'priznaje se 50 %',
    traziGrad: 'Pretraži među 556 jedinica',
    grad: 'Grad ili općina',
    gradPrijevod: 'jedinica lokalne samouprave — njezina odluka propisuje stope poreza na dohodak',
    gradNijeOdabran: 'nije odabrano',
    gradNijeNaden: (upit: string) => `Za upit „${upit}” nije pronađena nijedna jedinica.`,
    brojMjeseci: (mjeseci: string) =>
      `${mjeseci} mj. djelatnosti: broje se puni mjeseci plus posljednji, pa otvaranje ` +
      '15. kolovoza daje pet mjeseci, a ne četiri.',
    uzRadniOdnos: 'Obrt vodim uz radni odnos',
    uzRadniOdnosPrijevod: 'druga djelatnost — druga stopa doprinosa i godišnja osnovica',
    pocetak: 'Mjesec otvaranja obrta',
    pocetakPrijevod: 'u godini otvaranja granice razreda razmjerno se umanjuju',
    punaGodina: 'puna godina',
    noviObrt: 'Obrt je otvoren prije manje od dvije godine',
    noviObrtPrijevod: 'prve dvije godine komorski doprinos se ne obračunava',
    rucneStope: 'Ručno upiši stope poreza na dohodak',
    rucneStopePrijevod:
      'za slučaj da je imenik zastario ili je jedinica promijenila svoju odluku tijekom godine',
    nizaStopa: 'niža stopa, %',
    visaStopa: 'viša stopa, %',
    stopeIzvanGranica: (niza: string, visa: string) =>
      `Takav par nijedna jedinica nije mogla donijeti: zakon dopušta ${niza} za nižu stopu ` +
      `i ${visa} za višu. Dok je par izvan granica, izračun uzima stope iz odluke odabrane ` +
      'jedinice — vide se na kartici uz porez.',

    uzdrzavaniNaslov: 'Uzdržavani članovi',
    uzdrzavaniPrijevod:
      'Osobni odbitak zakon ne propisuje iznosom, nego konstrukcijom: jedinica za samog ' +
      'poreznog obveznika, koeficijent za svakog uzdržavanog člana i vlastiti koeficijent za ' +
      'svako dijete po redu. Dok su ovdje nule, porez plaćate kao da ne uzdržavate nikoga.',
    clanoviUzeObitelji: 'Uzdržavani članovi uže obitelji',
    clanoviPrijevod:
      'bračni drug, roditelji, punoljetna djeca nakon prvog zaposlenja. Djeca se ovdje ne ' +
      'broje: za njih vrijedi vlastita ljestvica.',
    djeca: 'Uzdržavana djeca',
    djecaPrijevod: 'svako sljedeće dijete nosi veći koeficijent od prethodnoga, a ne isti',

    djelatnostNaslov: 'Djelatnost i mjesto',
    djelatnostPrijevod:
      'O NKD-u ovise turistička članarina i spomenička renta — dva davanja kojih nema ni u ' +
      'jednom kalkulatoru uz porez.',
    nkd: 'NKD',
    nkdPrijevod: 'djelatnost onako kako je zakon ispisuje: 55, 50.1, 49.31 ili 47.111',
    nkdNeispravan: 'Ovo ne izgleda kao šifra NKD-a. Primjeri: 55, 50.1, 49.31, 47.111.',
    nkdOpseg: (koliko: string) =>
      `U prijedlogu su samo one ${koliko} šifre koje dva zakona o tim davanjima izrijekom ` +
      'navode. Ako vaše ondje nema, to znači točno jedno: nijedno od dvaju davanja po njoj ne nastaje.',
    turistickaZajednica: 'Na području djelatnosti postoji lokalna turistička zajednica',
    turistickaZajednicaPrijevod: 'bez nje obveza ne nastaje uopće, bez obzira na NKD',
    potpomognutoPodrucje: 'Mjesto djelatnosti je potpomognuto područje',
    potpomognutoPrijevod: (popust: string) => `umanjenje ${popust} % na turističku članarinu`,
    uKulturnomDobru: 'Prostor je u nepokretnom kulturnom dobru ili u njegovoj zoni',
    korisnaPovrsina: 'Korisna površina poslovnog prostora, m²',
    iznosPoM2: 'Mjesečni iznos po m², €',
    iznosPoM2Prijevod: (najmanje: string, najvise: string) =>
      `propisuje ga odluka grada ili općine u granicama ${najmanje} – ${najvise}`,
    pretezitoProizvodna: 'Pretežita djelatnost je prerađivačka ili proizvodna',
    pretezitoProizvodnaPrijevod: 'zakon takvu oslobađa spomeničke rente po površini — i samo nje',
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
    ustedaUzRadniOdnos: (usteda: string) => `${usteda} manje nego bez radnog odnosa`,
    osobnaStednja: 'osobna ušteđevina, a ne porez',
    nedostupno: 'nedostupno',

    davanjaRazlozi: {
      'novootvoreni-obrt': (godina: string) =>
        `Novootvoreni obrt oslobođen je prve ${godina} godine. Oslobođenje daje samo prvi upis ` +
        'u Obrtni registar — ponovno otvoreni obrt plaća od prvog dana.',
      'djelatnost-izvan-popisa': (nkd: string) =>
        `NKD ${nkd} nije u popisu djelatnosti po kojima to davanje nastaje.`,
      'izvan-podrucja-turisticke-zajednice':
        'Obveza nastaje samo na području lokalne turističke zajednice osnovane po zakonu.',
      'izvan-kulturnog-dobra':
        'Djelatnost se ne obavlja u nepokretnom kulturnom dobru ni na području ' +
        'kulturno-povijesne cjeline.',
      'pretezito-proizvodna-djelatnost':
        'Zakon oslobađa one čija je pretežita djelatnost prerađivačka ili proizvodna.',
      'djelatnost-nije-zadana':
        'Primjenu određuju NKD i mjesto djelatnosti, a obrazac ih još ne zna. Ispunite ih i ' +
        'vidjet ćete nastaje li davanje ili ne.',
    },

    davanjaNapomene: {
      'ogranicenje-nkd': (nkd: string, ogranicenje: string) =>
        `Zakon NKD ${nkd} ne uzima u cijelosti, nego samo u dijelu: „${ogranicenje}”. Iznos je ` +
        'obračunat uz pretpostavku da djelatnost obrta u taj dio spada.',
      'stopa-je-gornja-granica': (stopa: string) =>
        `${stopa} % zakonska je gornja granica, a ne donesena stopa: iznos treba čitati kao ` +
        'najviši mogući, dok HOK ne donese novu Odluku u tim granicama.',
      'stopu-utvrduje-jedinica':
        'Iznos po m² propisuje odluka grada, općine ili Grada Zagreba — zakon zadaje samo ' +
        'raspon, pa iznos ovisi o konkretnom mjestu.',
    },
  },

  obriv: {
    naslov: 'Granica razreda je pred vama',
    doGranice: (doGranice: string, granica: string) =>
      `Do granice ${granica} ostalo je ${doGranice} godišnjeg primitka.`,
    skok: (ukupno: string, porez: string, doprinosi: string) =>
      `Jedan euro preko nje stoji ${ukupno} godišnje: ${porez} poreza i ${doprinosi} doprinosa.`,
    retroaktivno: (mjeseci: string) =>
      `Doprinosi se preračunavaju za ${mjeseci} mjeseci unatrag. Koeficijent ovisi o razredu, ` +
      'pa prelazak granice u prosincu prepisuje cijelu godinu, a ne prosinac.',
    krajRezima: 'Iza te granice paušalnog režima nema uopće — dalje slijede poslovne knjige.',
  },

  preokret: {
    naslov: 'Gdje režimi mijenjaju mjesta',
    prijevod:
      'Kartica kaže koliko ostaje uz ovaj primitak. Ovo kaže dokle vaš izbor ostaje najpovoljniji.',
    doPrve: (primitak: string, rezim: string) => `Ispod ${primitak} najpovoljniji je ${rezim}.`,
    tocka: (primitak: string, dosadasnji: string, sljedeci: string) =>
      `Od ${primitak} mjesto najpovoljnijeg prelazi s ${dosadasnji} na ${sljedeci}.`,
    nema: 'Na cijelom rasponu najpovoljniji ostaje jedan režim — nema kamo prijeći.',
  },

  tablica: {
    naslov: 'Svi razredi odjednom',
    prijevod:
      'Unutar razreda iznos je nepromjenjiv — zato na granici plaćanje skoči bez skoka ' +
      'primitka. Ljestvica se tiče samo paušalnog obrta: ostali režimi razrede ne poznaju.',
    granica: 'gornja granica primitka',
    osnovica: 'paušalni dohodak',
    porez: 'paušalni porez',
    doprinosi: 'doprinosi',
    ukupno: 'ukupno godišnje',
    vas: 'vaš razred',
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
    tecaj: 'Vlastiti tečaj grivne za euro',
    tecajPrijevod: 'prazno — uzimamo tečaj NBU',
    tecajNaDan: 'Datum na koji tečaj vrijedi',
    tecajUcitavanje: 'Pitamo NBU za tečaj…',
    tecajPodrijetlo: {
      'nbu-live': 'živi tečaj NBU',
      'nbu-snapshot': 'snimka tečaja NBU u repozitoriju — živi upit nije uspio',
      manual: 'vaš tečaj',
    },
    tecajIzvor: (podrijetlo: string, datum: string) => `${podrijetlo}, na dan ${datum}`,
    tecajNeispravan: 'Tečaj mora biti pozitivan broj.',
    ukupno: 'Ukupno',
    ostaje: 'ostaje godišnje',
    prekoracenje: (limit: string, nadlimit: string) =>
      `Godišnji dohodak prelazi limit 3. skupine od ${limit} za ${nadlimit}. ` +
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
    premaZakonu: 'po zakonu',
    stavka: 'Stavka',
    bezInozemnih:
      'Inozemnih usluga uneseno je nula, pa je ulazna strana prazna. Upišite iznos i vidjet ' +
      'ćete koliko poreza gubite izvan sustava PDV-a i koliko vraća ulazak u njega.',
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
    razlika: (godina: string) =>
      `Razlika po godišnjem izvješću dospijeva tek ${godina}. U stabilnom stanju je nula — ` +
      'iznos se pojavljuje kad stvarni rezultat odstupi od predujmova.',
  },
  scenarij: {
    naslov: 'Skup pravila',
    'na-snazi': 'zakon na snazi',
    najava: 'najavljene izmjene',
    prognoza:
      'Najavljene izmjene još nisu donesene. Prosječna plaća za 2027. fizički ne postoji — ' +
      'objavljuje se za siječanj–kolovoz 2026. — pa su iznosi doprinosa ovdje prognoza.',
    samoPausal:
      'Od razreda paušala paket dira samo dva najviša, od 40 000 €. No isti paket snižava ' +
      'zakonsku gornju granicu komorskog doprinosa, a to se tiče svakog obrta na bilo kojem ' +
      'primitku — zato se kartice mijenjaju i ispod 40 000 €.',
    delta: (iznos: string) =>
      `Pravila paušala: razlika prema zakonu na snazi ${iznos} godišnje. Promjena komorskog ` +
      'doprinosa ovdje nije uračunata — jednaka je na cijelom rasponu i vidi se zasebnim retkom.',
    bezRazlike:
      'Na ovaj primitak pravila paušala ne mijenjaju ništa — niži je od 40 000 €. Redak ' +
      'komorskog doprinosa na kartici ipak je drugačiji.',
  },
  izvor: {
    provjereno: (datum: string) => `provjereno ${datum}`,
  },
}
