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
  'd.o.o. — vlasnik u radnom odnosu':
    'društvo s ograničenom odgovornošću u kojem je vlasnik u radnom odnosu s vlastitom tvrtkom',
  'd.o.o. — vlasnik član uprave':
    'društvo s ograničenom odgovornošću u kojem vlasnik upravlja bez ugovora o radu',
  'paušalni porez': 'porez na paušalni dohodak',
  'porez na dohodak': 'progresivni porez na stvarni dohodak',
  'porez na dohodak iz plaće': 'porez na dohodak koji se ustegne iz plaće',
  'porez na dohodak iz poduzetničke plaće': 'porez na plaću koju vlasnik isplaćuje sam sebi',
  'porez na dobit': 'porez na dobit po načelu nastanka događaja',
  'porez na dohodak od kapitala pri isplati dobiti':
    'treći porez na isti novac — pri isplati dobiti vlasniku',
  'MO — I. stup': 'mirovinsko, generacijska solidarnost',
  'MO — II. stup': 'mirovinsko, individualna kapitalizirana štednja',
  ZO: 'zdravstveno osiguranje',
  'prosječna plaća': 'prosječna mjesečna bruto plaća',
  'komorski doprinos': 'obvezni doprinos Hrvatskoj obrtničkoj komori',
  'članarina HGK': 'članarina Hrvatskoj gospodarskoj komori',
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
    osobnoVoziloObjasnjenje:
      'Ovdje idu godišnji izdaci za vlastito ili unajmljeno vozilo kojim vozite i poslovno i ' +
      'privatno: gorivo, leasing ili najam, servis, gume, parkiranje. Zakon ne pita koliko je ' +
      'kilometara poslovno — polovicu odbija unaprijed (čl. 33. st. 1. t. 5.), a cijeli iznos ' +
      'priznaje samo ako se po osnovi korištenja utvrđuje plaća. Primjer: 3 000 € godišnje ' +
      'smanjuje osnovicu za 1 500 €. Osiguranje ne upisujte ovdje — čl. 33. st. 2. priznaje ga ' +
      'u cijelosti, pa ide u „ostalo”.',
    traziGrad: 'Pretraži po nazivu',
    nadenoJedinica: (nadeno: string, ukupno: string) =>
      `pronađeno ${nadeno} od ${ukupno} — popis ispod je već sužen`,
    grad: 'Grad ili općina',
    gradPrijevod: 'jedinica lokalne samouprave — njezina odluka propisuje stope poreza na dohodak',
    gradNijeOdabran: 'nije odabrano',
    gradNijeNaden: (upit: string) => `Za upit „${upit}” nije pronađena nijedna jedinica.`,
    brojMjeseci: (mjeseci: string) =>
      `${mjeseci} mj. djelatnosti: broje se puni mjeseci plus posljednji, pa otvaranje ` +
      '15. kolovoza daje pet mjeseci, a ne četiri.',
    uzRadniOdnos: 'Obrt vodim uz radni odnos',
    uzRadniOdnosPrijevod: 'druga djelatnost — druga stopa doprinosa i godišnja osnovica',
    olaksicaMladih: 'Olakšica za mlade',
    olaksicaMladihPrijevod: 'vraća se godišnjim obračunom sljedeće godine, a ne u platnoj listi',
    olaksicaMladihIzbor: {
      nema: '30 i više — nema umanjenja',
      'do-25': 'do 25 uključivo — vraća se cijeli porez po nižoj stopi',
      'od-26-do-30': 'od 26 do 30 — vraća se polovica',
    },
    osobeSInvaliditetom: 'Osobe s invaliditetom',
    osobeSInvaliditetomPrijevod:
      'obveznik, uzdržavani članovi i djeca — po zapisu na osobu; svaka stoji na popisu točno jednom',
    stupanjInvaliditeta: (broj: string) => `Stupanj invaliditeta, osoba ${broj}`,
    stupanjDjelomicna: 'invalidnost ili tjelesno oštećenje — koeficijent 0,3',
    stupanjPotpuna: '100 % po jednoj osnovi ili doplatak za pomoć i njegu — koeficijent 1,0',
    dodajOsobu: '+ dodaj osobu',
    ukloniOsobu: 'ukloni',
    podstaviStelju: (iznos: string) => `Postavi zakonsku gornju granicu — ${iznos}`,
    razbivkaIzdataka: 'Stavke koje se priznaju samo upola',
    placaVlasnika: 'Vlastita mjesečna plaća u vlastitom d.o.o.-u, €',
    placaVlasnikaPrijevod: 'prazno — uzima se zakonska najniža osnovica',
    neoporeziviPrimici: 'Neoporezivi primici, € godišnje',
    neoporeziviPrimiciPrijevod:
      'prazno — nije dogovoreno. Granice za 2026.: nagrada za radne rezultate 1.200, prigodne ' +
      'nagrade 700, prehrana 1.200 paušalno ili 1.800 uz dokumentaciju, usluge odmora 400, ' +
      'dopunsko zdravstveno 500, rad od kuće 70 mjesečno, dar djetetu 140, prijevoz prema izdacima',
    prvoZaposlenje: 'Prvo zaposlenje na neodređeno vrijeme',
    prvoZaposlenjePrijevod:
      'nikada prije niste imali ugovor o radu na neodređeno — ugovori na određeno, studentski ' +
      'poslovi i vlastiti obrt tome ne smetaju. Tada poslodavac do godine dana ne plaća ZO: ' +
      'plaća ga stoji 16,5 % manje, a neto se ne mijenja. Dobne olakšice »do 30« više nema — ' +
      'ukinuta je od 2025.',
    povratnik: 'Povratak iz inozemstva (čl. 46. st. 3.)',
    povratnikPrijevod:
      'državljanstvo RH plus najmanje dvije godine neprekidno u inozemstvu. Tada se pet godina ' +
      'vraća cijeli porez iz plaće — ali umjesto olakšice za mlade i umanjenja prema ' +
      'prebivalištu, a ne zajedno s njima',
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
    nkdPrijevod: 'djelatnost — odaberite s popisa ili upišite svoju šifru',
    nkdNeispravan: 'Ovo ne izgleda kao šifra NKD-a. Primjeri: 55, 50.1, 49.31, 47.111.',
    nkdOpseg: (koliko: string) =>
      `Na popisu su samo one ${koliko} šifre koje dva zakona o tim davanjima izrijekom ` +
      'navode. Ako vaše ondje nema, to znači točno jedno: nijedno od dvaju davanja po njoj ne nastaje.',
    nkdNijeOdabran: 'nije s popisa — nijedno od dvaju davanja ne nastaje',
    nkdRucnoUnesi: 'druga šifra — upisat ću je sam',
    nkdRucnoOznaka: 'Šifra NKD-a',
    nkdRucnoPrijevod:
      'i peteroznamenkasti podrazred NKD-a 2025. je u redu: davanje određuje najtočniji ' +
      'pogodak, pa se 47.111 svodi na područje 47',
    skupineNkd: {
      'turisticka-prva': 'turistička članarina · prva skupina (najviša stopa)',
      'turisticka-druga': 'turistička članarina · druga skupina',
      'turisticka-treca': 'turistička članarina · treća skupina',
      'turisticka-cetvrta': 'turistička članarina · četvrta skupina',
      'turisticka-peta': 'turistička članarina · peta skupina (najniža stopa)',
      spomenicka: 'spomenička renta — drugi zakon, zaseban popis',
    },
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
    mjesecno: (iznos: string) => `≈ ${iznos} mjesečno`,
    ukupnoObveze: 'odnose porezi i doprinosi',
    ukupnoOpterecenje: (iznos: string, postotak: string, trosak: string) =>
      `zajedno s doprinosom poslodavca — ${iznos}, odnosno ${postotak} od ${trosak} koliko ` +
      'poslodavca stojite. Upravo je taj postotak usporediv sa stopom obrta',
    efektivnaStopaKratko: (postotak: string) => `${postotak} od primitka`,
    efektivnaStopa: 'efektivna stopa',
    razredPrijevod: (gornjaGranica: string) => `gornja granica ${gornjaGranica}`,
    udioOsnovice: (stopa: string) => `${stopa} osnovice`,
    udioPoreza: (stopa: string, poreznaOsnovica: string) => `${stopa} od ${poreznaOsnovica}`,
    davanja: 'Obvezna davanja',
    davanjaNema: 'ne primjenjuje se',
    neprimjenjivo: (koliko: string) => `ne primjenjuje se: ${koliko}`,
    doprinosiUkupno: 'doprinosi ukupno',
    doprinosiOsnovica: (mjesecnaOsnovica: string) => `osnovica ${mjesecnaOsnovica} mjesečno`,
    ustedaUzRadniOdnos: (usteda: string) => `${usteda} manje nego bez radnog odnosa`,
    naTeretOsobe: (svoje: string, tude: string) =>
      `iz vašeg novca — ${svoje}; preostalih ${tude} poslodavac plaća povrh plaće, pa se od ` +
      'neta ne odbija',
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
      'nije-obrt':
        'Komorski doprinos plaća obrt. Trgovačko društvo nije član te komore — to nije ' +
        'oslobođenje, nego drugi pravni oblik.',
      'nije-trgovacko-drustvo':
        'Članstvo u Hrvatskoj gospodarskoj komori odnosi se na trgovačka društva. Obrt ' +
        'pripada obrtničkoj komori i doprinos plaća njoj.',
      'nema-samostalne-djelatnosti':
        'Radnik u radnom odnosu ne obavlja samostalnu djelatnost, pa davanja vezana uz NKD i ' +
        'mjesto do njega uopće ne dolaze.',
      'prva-skupina-nije-obveznik':
        'Prva skupina nije obveznik plaćanja: po veličini tvrtka u nju spada, a članstvo je ' +
        'dobrovoljno, na temelju Izjave. Upravo se tu d.o.o. i obrt razilaze: obrt svojoj ' +
        'komori plaća uvijek.',
      'velicina-nije-odrediva':
        'Prihodi su prešli granicu prve skupine, a ostale kriterije — aktivu i broj zaposlenih ' +
        '— obrazac ne zna. Bez njih se skupina ne može odrediti, a nagađati članarinu ne ide.',
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

    napomeneRezima: {
      'bruto-placa-nije-primitak': (trosak: string, doprinosi: string) =>
        `Ovdje je uneseni iznos pročitan kao bruto plaća, a ne kao primitak. Razlika nije ` +
        `kozmetička: klijent obrta isplaćuje točno taj iznos, a poslodavca ista osoba ` +
        `stoji ${trosak} godišnje — sama plaća plus ${doprinosi} doprinosa koje plaća ` +
        'povrh nje. Upravo te dvije cijene vrijedi usporediti međusobno.',
      'neoporezivi-primici-nisu-uracunati':
        'Božićnica, prehrana, prijevoz i ostali neoporezivi primici nisu uračunati: njih daje ' +
        'volja poslodavca, a ne zakon. U praksi dosežu nekoliko tisuća eura godišnje, pa ' +
        'stvarni radni odnos može biti izdašniji od ove kartice.',
      'umanjena-osnovica-prvog-stupa': (umanjenje: string) =>
        `Osnovicu doprinosa za MO I. stup zakon je umanjio za ${umanjenje} mjesečno — i samo ` +
        'nju: II. stup i ZO računaju se od pune. Zato se u retku MO — I. stup stopa od 15 % ne ' +
        'poklapa s iznosom: zakon je umanjio osnovicu, a ne stopu.',
      'ispod-minimalne-place': (minimalna: string) =>
        `To je ispod minimalne plaće od ${minimalna} mjesečno. Prekršaja nema: minimalna je ` +
        'propisana za puno radno vrijeme, pa takav iznos znači nepuno.',
      'placa-podignuta-na-najnizu-osnovicu': (trazena: string, primijenjena: string) =>
        `Zadali ste ${trazena} mjesečno, ali doprinosi su obračunati od ${primijenjena}: ispod ` +
        'te osnovice zakon ne dopušta obračun. Zato „stavit ću si minimalac, ostalo izvući ' +
        'dividendom” radi slabije nego što se čini.',
      'prag-plave-karte-dosegnut': (prag: string) =>
        `Za EU plavu kartu potrebna je bruto plaća od ${prag} mjesečno — ovaj iznos taj prag ` +
        'prelazi. To je uvjet izdavanja dozvole, a ne porezno pravilo: na iznose u ovoj ' +
        'kartici ne utječe nikako.',
      'prag-plave-karte-nedosegnut': (prag: string) =>
        `Za EU plavu kartu potrebna je bruto plaća od ${prag} mjesečno — ovaj iznos taj prag ` +
        'ne doseže. To je uvjet izdavanja dozvole, a ne porezno pravilo: na iznose u ovoj ' +
        'kartici ne utječe nikako.',
      'olaksica-za-mlade-kao-povrat': (iznos: string) =>
        `${iznos} tog poreza vratit će vam se kao olakšica za mlade — ali ne u platnoj listi. ` +
        'Tijekom godine predujam se ustegne u cijelosti, a olakšicu Porezna uprava utvrđuje ' +
        'godišnjim obračunom i vraća tek iduće kalendarske godine.',
      'olaksica-za-mlade-nepovratni-dio': (nepovratno: string) =>
        `Ali ne iz cijelog poreza: olakšica uzima samo ono što je obračunato po nižoj ` +
        `stopi. Zarada koja je dosegnula višu stopu ne vraća se uopće — ove godine to je ` +
        `${nepovratno}. Ispod 7.000 € bruto mjesečno više stope nema, pa se tada doista ` +
        'vraća cijeli porez.',
      'neoporezivi-primici-uracunati': (iznos: string) =>
        `Uračunato je ${iznos} godišnje neoporezivih primitaka: ne ulaze ni u osnovicu doprinosa ` +
        'ni u poreznu osnovicu, pa stižu cijeli — i za točno toliko poskupljuju poslodavcu.',
      'oslobodenje-za-prvo-zaposlenje': (usteda: string) =>
        `Za prvo zaposlenje na neodređeno vrijeme poslodavac do godine dana ne plaća ZO — ` +
        `${usteda} godišnje. Na neto to ne utječe ni za cent: taj novac ionako nikad nije bio vaš. ` +
        'Dobnog oslobođenja »do 30 godina« više nema — ukinuto je od 2025.',
      'umanjenje-za-podrucje': (iznos: string) =>
        `Polovica godišnjeg poreza — ${iznos} — vraća se prema prebivalištu: vaša je jedinica u ` +
        'I. skupini po razvijenosti ili je riječ o Vukovaru. Stiže godišnjim obračunom, a ne ' +
        'platnom listom, i računa se nakon olakšice za mlade, a ne zajedno s njom.',
      'umanjenje-za-povratnika': (iznos: string, godina: string) =>
        `Cijeli porez iz plaće — ${iznos} — vraća se kao povratniku iz inozemstva, i to ${godina} ` +
        'godina zaredom. To je zamjena, a ne dodatak: zakon time izričito isključuje i olakšicu ' +
        'za mlade i umanjenje prema prebivalištu.',
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
    'vec-u-radnom-odnosu':
      'Označili ste da već radite u radnom odnosu, i obrtni su režimi izračunati s tim. Ova ' +
      'kartica postavlja drugo pitanje — što ako samo radni odnos, bez djelatnosti. Oba ' +
      'odgovora odjednom značila bi da se isti broj lijevo čita kao plaća plus primitak, a ' +
      'desno kao sama plaća. Maknite oznaku da vidite radni odnos zasebno.',
  },

  pretpostavke: {
    objasnjenjeNaslov: 'Odakle taj iznos i zašto stoji odvojeno od pravila',
    naslov: 'Pretpostavke',
    godina: (godina: string) => `Pravila su na snazi za ${godina}. godinu.`,
    objasnjenje:
      'Doprinosi se računaju iz te veličine: osnovica = prosječna plaća × koeficijent, a onda ' +
      '36,5 % od nje. Zakon je ne propisuje, nego se na nju samo poziva, pa stoji u sloju ' +
      'odvojenom od pravila — prekidač scenarija je ne dira. Upravo zbog nje dva službena ' +
      'izračuna za 2027. daju različite iznose doprinosa uz iste stope: obrazloženje ' +
      'prijedloga zakona računa od važećih 1 993 €, kalkulator HOK-a od prognoziranih 2 180 €.',
    placaPrijevod: 'prosječna mjesečna bruto plaća iz koje zakon izvodi osnovicu',
    mjesecno: '€ mjesečno',
    objavljena: 'objavljeno',
    prognoza: 'prognoza',
    rucnoZadano: 'ručno upisano — ta brojka izvora nema',
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
  sekcije: {
    mjesto: 'Mjesto i stope',
    mjestoPrijevod: 'plaća se oporezuje prema prebivalištu, a ne prema mjestu rada',
    obitelj: 'Obitelj i odbici',
    obiteljPrijevod: 'osobni odbitak — smanjuje poreznu osnovicu u svim režimima osim paušala',
    zaposlenik: 'Ako ste zaposlenik',
    zaposlenikPrijevod: 'utječe samo na karticu zaposlenik; na obrt ne utječe ničim',
    obrt: 'Ako vodite obrt',
    obrtPrijevod: 'izdaci, nepuna godina i djelatnost — sve što zaposlenik nema',
    doo: 'Ako otvarate d.o.o.',
    dooPrijevod: 'koliko vlasnik odredi sam sebi — ostatak izlazi dividendama',
    pdv: 'PDV',
    nista: 'ništa nije navedeno',
    utrimanih: (broj: string) => `${broj} uzdržavanih`,
    djece: (broj: string) => `${broj} djece`,
    sInvaliditetom: (broj: string) => `${broj} s invaliditetom`,
    neoporezivi: (iznos: string) => `neoporezivi primici ${iznos}`,
    prvoZaposlenje: 'prvo zaposlenje',
    povratnik: 'povratak iz inozemstva',
    punaGodina: 'puna godina',
    mjeseci: (broj: string) => `${broj} mjeseci`,
    izdaci: (iznos: string) => `izdaci ${iznos}`,
    bezIzdataka: 'nema izdataka',
    nkdNije: 'NKD nije odabran',
    uzRadniOdnos: 'uz radni odnos',
    placaPodloga: 'plaća — zakonska najniža osnovica',
    placaMjesecno: (iznos: string) => `${iznos} mjesečno`,
    inozemneUsluge: (iznos: string) => `inozemne usluge ${iznos}`,
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
    detaljiNaslov: 'Što točno mijenja paket',
    naslov: 'Skup pravila',
    'na-snazi': 'zakon na snazi',
    najava: 'najavljene izmjene',
    prognoza:
      'Najavljene izmjene još nisu donesene. Prosječna plaća za 2027. fizički ne postoji — ' +
      'objavljuje se za siječanj–kolovoz 2026. — pa su iznosi doprinosa ovdje prognoza.',
    samoPausal:
      'Paket dira jednu karticu od šest — paušalni obrt, i u njemu samo dva gornja razreda, ' +
      'od 40.000 €. Ostali se režimi ne mijenjaju uopće. Jedina iznimka je zakonska gornja ' +
      'granica komorskog doprinosa: ona je niža za svaki obrt na bilo kojem primitku.',
    delta: (iznos: string) =>
      `paušalni obrt: ${iznos} godišnje u odnosu na važeći zakon. Ostalih pet kartica miruje. ` +
      'Promjena komorskog doprinosa nije uključena — jednaka je na cijelom rasponu i vidi se ' +
      'zasebnim retkom na kartici.',
    bezRazlike:
      'Nijedna se kartica ne mijenja: na ovom primitku paket ne dira ništa — niži je od ' +
      '40.000 €. Redak komorskog doprinosa na kartici obrta ionako je drukčiji.',
  },
  izvor: {
    provjereno: (datum: string) => `provjereno ${datum}`,
  },
}
