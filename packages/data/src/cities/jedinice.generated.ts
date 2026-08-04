// ЗГЕНЕРОВАНО `node scripts/fetch-city-rates.ts` — не редагувати руками.
//
// Річні ставки `porez na dohodak` усіх міст і общин (grad/općina) зі зведеної
// таблиці Porezna uprava. Ставки в базисних пунктах: 2050 — це 20,5 %.
//
// Джерело: https://porezna-uprava.gov.hr/UserDocsImages/Portal_porezne_konkurentnosti/Odluke_JLS/Porezne%20stope%20godi%C5%A1njeg%20poreza%20na%20dohodak/Tablica%20poreznih%20stopa%20godi%C5%A1njeg%20poreza%20na%20dohodak%20za%202026%20godinu.xlsx
// Розмір 56713 байт, sha256 87733f3eb50a39650813a4ea7a6efbb8c556d4bf9c119ece9ea411f37e6f1592

import type { Sourced } from '../sourced.ts'
import type { JedinicaLokalneSamouprave } from './types.ts'

export const jediniceLokalneSamouprave = {
  value: [
    {
      sifra: '19',
      ime: 'ANDRIJAŠEVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '27',
      ime: 'ANTUNOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '35',
      ime: 'BABINA GREDA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '43',
      ime: 'BAKAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '51',
      ime: 'BALE - VALLE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '60',
      ime: 'BARBAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '78',
      ime: 'BARILOVIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '86',
      ime: 'BAŠKA',
      stope: {
        niza: 1500,
        visa: 2500,
        narodneNovine: ['143/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '94',
      ime: 'BAŠKA VODA',
      stope: {
        niza: 1700,
        visa: 2700,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '108',
      ime: 'BEBRINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '116',
      ime: 'BEDEKOVČINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5509',
      ime: 'BEDENICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['8/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '124',
      ime: 'BEDNJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '132',
      ime: 'BELI MANASTIR',
      stope: {
        niza: 2100,
        visa: 2700,
        narodneNovine: ['150/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '159',
      ime: 'BELICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '167',
      ime: 'BELIŠĆE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '175',
      ime: 'BENKOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '183',
      ime: 'BEREK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '191',
      ime: 'BERETINEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '205',
      ime: 'BIBINJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6211',
      ime: 'BILICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['143/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '213',
      ime: 'BILJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '221',
      ime: 'BIOGRAD NA MORU',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3107',
      ime: 'BISKUPIJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5479',
      ime: 'BISTRA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '230',
      ime: 'BIZOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['145/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '248',
      ime: 'BJELOVAR',
      stope: {
        niza: 1800,
        visa: 2500,
        narodneNovine: ['143/23', '75/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '256',
      ime: 'BLATO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '264',
      ime: 'BOGDANOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '272',
      ime: 'BOL',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '299',
      ime: 'BOROVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '302',
      ime: 'BOSILJEVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '329',
      ime: 'BOŠNJACI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '337',
      ime: 'BRCKOVLJANI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '345',
      ime: 'BRDOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '779',
      ime: 'BRELA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '353',
      ime: 'BRESTOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '361',
      ime: 'BREZNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['30/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1511',
      ime: 'BREZNIČKI HUM',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '370',
      ime: 'BRINJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '388',
      ime: 'BROD MORAVICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '396',
      ime: 'BRODSKI STUPNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['158/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '400',
      ime: 'BRTONIGLA - VERTENEGLIO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '418',
      ime: 'BUDINŠČINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '426',
      ime: 'BUJE - BUIE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5673',
      ime: 'BUKOVLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '434',
      ime: 'BUZET',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '442',
      ime: 'CERNA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '469',
      ime: 'CERNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '477',
      ime: 'CEROVLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '485',
      ime: 'CESTICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '493',
      ime: 'CETINGRAD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '507',
      ime: 'CISTA PROVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '515',
      ime: 'CIVLJANE',
      stope: {
        niza: 1500,
        visa: 2500,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '523',
      ime: 'CRES',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '531',
      ime: 'CRIKVENICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '540',
      ime: 'CRNAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['141/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '558',
      ime: 'ČABAR',
      stope: {
        niza: 1900,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '566',
      ime: 'ČAČINCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '574',
      ime: 'ČAĐAVICA',
      stope: {
        niza: 2000,
        visa: 2500,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '582',
      ime: 'ČAGLIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '604',
      ime: 'ČAKOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '612',
      ime: 'ČAVLE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '639',
      ime: 'ČAZMA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '647',
      ime: 'ČEMINAC',
      stope: {
        niza: 2000,
        visa: 2500,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '655',
      ime: 'ČEPIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['16/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '663',
      ime: 'DARDA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '671',
      ime: 'DARUVAR',
      stope: {
        niza: 2100,
        visa: 3000,
        narodneNovine: ['129/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '680',
      ime: 'DAVOR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6033',
      ime: 'DEKANOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '698',
      ime: 'DELNICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '701',
      ime: 'DESINIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '710',
      ime: 'DEŽANOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['6/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '728',
      ime: 'DICMO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['144/23', '33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '744',
      ime: 'DOBRINJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '752',
      ime: 'DOMAŠINEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '787',
      ime: 'DONJA DUBRAVA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5762',
      ime: 'DONJA MOTIČINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '795',
      ime: 'DONJA STUBICA',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '809',
      ime: 'DONJA VOĆA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '817',
      ime: 'DONJI ANDRIJEVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['55/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '825',
      ime: 'DONJI KRALJEVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '833',
      ime: 'DONJI KUKURUZARI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '841',
      ime: 'DONJI LAPAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '868',
      ime: 'DONJI MIHOLJAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '892',
      ime: 'DONJI VIDOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5681',
      ime: 'DRAGALIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '906',
      ime: 'DRAGANIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['6/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '914',
      ime: 'DRAŽ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '922',
      ime: 'DRENOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '949',
      ime: 'DRENJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '957',
      ime: 'DRNIŠ',
      stope: {
        niza: 2000,
        visa: 2500,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '965',
      ime: 'DRNJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '973',
      ime: 'DUBRAVA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5495',
      ime: 'DUBRAVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5983',
      ime: 'DUBROVAČKO PRIMORJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '981',
      ime: 'DUBROVNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '990',
      ime: 'DUGA RESA',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['6/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1007',
      ime: 'DUGI RAT',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1015',
      ime: 'DUGO SELO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5851',
      ime: 'DUGOPOLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1023',
      ime: 'DVOR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1031',
      ime: 'ĐAKOVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1040',
      ime: 'ĐELEKOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1058',
      ime: 'ĐULOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1066',
      ime: 'ĐURĐENOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1074',
      ime: 'ĐURĐEVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1082',
      ime: 'ĐURMANEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1104',
      ime: 'ERDUT',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1112',
      ime: 'ERNESTINOVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['145/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1139',
      ime: 'ERVENIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1147',
      ime: 'FARKAŠEVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6190',
      ime: 'FAŽANA - FASANA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1155',
      ime: 'FERDINANDOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1163',
      ime: 'FERIČANCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6297',
      ime: 'FUNTANA - FONTANE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1171',
      ime: 'FUŽINE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5711',
      ime: 'GALOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1180',
      ime: 'GARČIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1198',
      ime: 'GAREŠNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1201',
      ime: 'GENERALSKI STOL',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1210',
      ime: 'GLINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1228',
      ime: 'GOLA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1236',
      ime: 'GORIČAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1244',
      ime: 'GORJANI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6181',
      ime: 'GORNJA RIJEKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1252',
      ime: 'GORNJA STUBICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5690',
      ime: 'GORNJA VRBA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1279',
      ime: 'GORNJI BOGIĆEVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1295',
      ime: 'GORNJI KNEGINEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6041',
      ime: 'GORNJI MIHALJEVEC',
      stope: {
        niza: 1700,
        visa: 2700,
        narodneNovine: ['6/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1309',
      ime: 'GOSPIĆ',
      stope: {
        niza: 2200,
        visa: 3200,
        narodneNovine: ['154/23', '34/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1317',
      ime: 'GRAČAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1325',
      ime: 'GRAČIŠĆE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1341',
      ime: 'GRADAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1350',
      ime: 'GRADEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1368',
      ime: 'GRADINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1376',
      ime: 'GRADIŠTE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1384',
      ime: 'GROŽNJAN - GRISIGNANA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1392',
      ime: 'GRUBIŠNO POLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['144/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1406',
      ime: 'GUNDINCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1414',
      ime: 'GUNJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5100',
      ime: 'GVOZD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1449',
      ime: 'HERCEGOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1457',
      ime: 'HLEBINE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1465',
      ime: 'HRAŠĆINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['138/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1481',
      ime: 'HRVACE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1490',
      ime: 'HRVATSKA DUBICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1503',
      ime: 'HRVATSKA KOSTAJNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1520',
      ime: 'HUM NA SUTLI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1538',
      ime: 'HVAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1546',
      ime: 'ILOK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1554',
      ime: 'IMOTSKI',
      stope: {
        niza: 2000,
        visa: 2500,
        narodneNovine: ['156/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1562',
      ime: 'IVANEC',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['145/23', '28/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1589',
      ime: 'IVANIĆ-GRAD',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['149/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '1597',
      ime: 'IVANKOVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1619',
      ime: 'IVANSKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6092',
      ime: 'JAGODNJAK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1635',
      ime: 'JAKOVLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1643',
      ime: 'JAKŠIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1651',
      ime: 'JALŽABET',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5991',
      ime: 'JANJINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1660',
      ime: 'JARMINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1678',
      ime: 'JASENICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1686',
      ime: 'JASENOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['143/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1694',
      ime: 'JASTREBARSKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1708',
      ime: 'JELENJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1716',
      ime: 'JELSA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5525',
      ime: 'JESENJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1724',
      ime: 'JOSIPDOL',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1732',
      ime: 'KALI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5592',
      ime: 'KALINOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5606',
      ime: 'KALNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6238',
      ime: 'KAMANJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['5/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1759',
      ime: 'KANFANAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1767',
      ime: 'KAPELA',
      stope: {
        niza: 1500,
        visa: 2500,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1775',
      ime: 'KAPTOL',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['145/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1783',
      ime: 'KARLOBAG',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1791',
      ime: 'KARLOVAC',
      stope: {
        niza: 1900,
        visa: 2900,
        narodneNovine: ['147/23', '141/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '5967',
      ime: 'KAROJBA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1805',
      ime: 'KASTAV',
      stope: {
        niza: 2000,
        visa: 3100,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1813',
      ime: 'KAŠTELA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5975',
      ime: 'KAŠTELIR-LABINCI - CASTELLIERE-S. DOMENICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1830',
      ime: 'KIJEVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['142/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1848',
      ime: 'KISTANJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1856',
      ime: 'KLAKAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1864',
      ime: 'KLANA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1872',
      ime: 'KLANJEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1899',
      ime: 'KLENOVNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '1902',
      ime: 'KLINČA SELA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['144/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1929',
      ime: 'KLIS',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['155/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '1937',
      ime: 'KLOŠTAR IVANIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1945',
      ime: 'KLOŠTAR PODRAVSKI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1953',
      ime: 'KNEŽEVI VINOGRADI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1961',
      ime: 'KNIN',
      stope: {
        niza: 2100,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '6220',
      ime: 'KOLAN',
      stope: {
        niza: 1500,
        visa: 2500,
        narodneNovine: ['117/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '1970',
      ime: 'KOMIŽA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['156/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1988',
      ime: 'KONAVLE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1996',
      ime: 'KONČANICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2003',
      ime: 'KONJŠČINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2011',
      ime: 'KOPRIVNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2020',
      ime: 'KOPRIVNIČKI BREGI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2038',
      ime: 'KOPRIVNIČKI IVANEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2046',
      ime: 'KORČULA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5380',
      ime: 'KOSTRENA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2054',
      ime: 'KOŠKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2062',
      ime: 'KOTORIBA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2089',
      ime: 'KRALJEVEC NA SUTLI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2097',
      ime: 'KRALJEVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2119',
      ime: 'KRAPINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2127',
      ime: 'KRAPINSKE TOPLICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5339',
      ime: 'KRAŠIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5452',
      ime: 'KRAVARSKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2135',
      ime: 'KRIŽ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2143',
      ime: 'KRIŽEVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['156/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2151',
      ime: 'KRK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2160',
      ime: 'KRNJAK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2178',
      ime: 'KRŠAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5720',
      ime: 'KUKLJICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2194',
      ime: 'KULA NORINSKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5533',
      ime: 'KUMROVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2208',
      ime: 'KUTINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2216',
      ime: 'KUTJEVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2224',
      ime: 'LABIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2232',
      ime: 'LANIŠĆE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2259',
      ime: 'LASINJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['138/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '2267',
      ime: 'LASTOVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5860',
      ime: 'LEĆEVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2275',
      ime: 'LEGRAD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2283',
      ime: 'LEKENIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['144/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2291',
      ime: 'LEPOGLAVA',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['145/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2305',
      ime: 'LEVANJSKA VAROŠ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2313',
      ime: 'LIPIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2321',
      ime: 'LIPOVLJANI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2348',
      ime: 'LIŠANE OSTROVIČKE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2356',
      ime: 'LIŽNJAN - LISIGNANO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2364',
      ime: 'LOBOR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2372',
      ime: 'LOKVE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5878',
      ime: 'LOKVIČIĆI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6246',
      ime: 'LOPAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2399',
      ime: 'LOVAS',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2402',
      ime: 'LOVINAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '2429',
      ime: 'LOVRAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2437',
      ime: 'LOVREĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2445',
      ime: 'LUDBREG',
      stope: {
        niza: 2000,
        visa: 3100,
        narodneNovine: ['138/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '5487',
      ime: 'LUKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2453',
      ime: 'LUKAČ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['145/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6009',
      ime: 'LUMBARDA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2461',
      ime: 'LUPOGLAV',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2470',
      ime: 'LJUBEŠĆICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2488',
      ime: 'MAČE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5789',
      ime: 'MAGADENOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5550',
      ime: 'MAJUR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2496',
      ime: 'MAKARSKA',
      stope: {
        niza: 1800,
        visa: 3100,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2500',
      ime: 'MALA SUBOTICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2518',
      ime: 'MALI BUKOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['145/23', '153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2526',
      ime: 'MALI LOŠINJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2534',
      ime: 'MALINSKA-DUBAŠNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2542',
      ime: 'MARČANA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2569',
      ime: 'MARIJA BISTRICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5398',
      ime: 'MARIJA GORICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2577',
      ime: 'MARIJANCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2585',
      ime: 'MARINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6106',
      ime: 'MARKUŠICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '850',
      ime: 'MARTIJANEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '2593',
      ime: 'MARTINSKA VES',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2607',
      ime: 'MARUŠEVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2615',
      ime: 'MATULJI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2631',
      ime: 'MEDULIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2640',
      ime: 'METKOVIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2658',
      ime: 'MIHOVLJAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2666',
      ime: 'MIKLEUŠ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2674',
      ime: 'MILNA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2682',
      ime: 'MLJET',
      stope: {
        niza: 2000,
        visa: 2700,
        narodneNovine: ['30/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2704',
      ime: 'MOLVE',
      stope: {
        niza: 1500,
        visa: 2500,
        narodneNovine: ['141/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2739',
      ime: 'MOŠĆENIČKA DRAGA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2747',
      ime: 'MOTOVUN - MONTONA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2755',
      ime: 'MRKOPALJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '876',
      ime: 'MUĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2763',
      ime: 'MURSKO SREDIŠĆE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6173',
      ime: 'MURTER - KORNATI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2780',
      ime: 'NAŠICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2798',
      ime: 'NEDELIŠĆE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6122',
      ime: 'NEGOSLAVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2801',
      ime: 'NEREŽIŠĆA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2810',
      ime: 'NETRETIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2950',
      ime: 'NIJEMCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2828',
      ime: 'NIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['158/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2836',
      ime: 'NOVA BUKOVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2844',
      ime: 'NOVA GRADIŠKA',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2852',
      ime: 'NOVA KAPELA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2879',
      ime: 'NOVA RAČA',
      stope: {
        niza: 1700,
        visa: 2700,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '2887',
      ime: 'NOVALJA',
      stope: {
        niza: 1500,
        visa: 2500,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '5541',
      ime: 'NOVI GOLUBOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2895',
      ime: 'NOVI MAROF',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23', '156/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2909',
      ime: 'NOVI VINODOLSKI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5371',
      ime: 'NOVIGRAD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2917',
      ime: 'NOVIGRAD - CITTANOVA',
      stope: {
        niza: 2000,
        visa: 3100,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '2925',
      ime: 'NOVIGRAD PODRAVSKI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5614',
      ime: 'NOVO VIRJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2933',
      ime: 'NOVSKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2941',
      ime: 'NUŠTAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2968',
      ime: 'OBROVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2976',
      ime: 'OGULIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5886',
      ime: 'OKRUG',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2992',
      ime: 'OKUČANI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['139/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '3000',
      ime: 'OMIŠ',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '3018',
      ime: 'OMIŠALJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3026',
      ime: 'OPATIJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3034',
      ime: 'OPRISAVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3042',
      ime: 'OPRTALJ - PORTOLE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3069',
      ime: 'OPUZEN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3077',
      ime: 'ORAHOVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3085',
      ime: 'OREBIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6050',
      ime: 'OREHOVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3093',
      ime: 'ORIOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['138/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '5428',
      ime: 'ORLE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3115',
      ime: 'OROSLAVJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/23', '114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3123',
      ime: 'OSIJEK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3131',
      ime: 'OTOČAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3140',
      ime: 'OTOK',
      stope: {
        niza: 1700,
        visa: 2700,
        narodneNovine: ['148/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '5355',
      ime: 'OTOK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3158',
      ime: 'OZALJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3166',
      ime: 'PAG',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3174',
      ime: 'PAKOŠTANE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3182',
      ime: 'PAKRAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3204',
      ime: 'PAŠMAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3212',
      ime: 'PAZIN',
      stope: {
        niza: 2200,
        visa: 3000,
        narodneNovine: ['143/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3239',
      ime: 'PERUŠIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3247',
      ime: 'PETERANEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3255',
      ime: 'PETLOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3263',
      ime: 'PETRIJANEC',
      stope: {
        niza: 2000,
        visa: 2700,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '3271',
      ime: 'PETRIJEVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3280',
      ime: 'PETRINJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['155/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3298',
      ime: 'PETROVSKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3301',
      ime: 'PIĆAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5819',
      ime: 'PIROVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3310',
      ime: 'PISAROVINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3328',
      ime: 'PITOMAČA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['131/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3336',
      ime: 'PLAŠKI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3344',
      ime: 'PLETERNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4553',
      ime: 'PLITVIČKA JEZERA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '3352',
      ime: 'PLOČE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3379',
      ime: 'PODBABLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3387',
      ime: 'PODCRKAVLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3395',
      ime: 'PODGORA',
      stope: {
        niza: 1800,
        visa: 3000,
        narodneNovine: ['158/23', '35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '3409',
      ime: 'PODGORAČ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2712',
      ime: 'PODRAVSKA MOSLAVINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6165',
      ime: 'PODRAVSKE SESVETE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3417',
      ime: 'PODSTRANA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3425',
      ime: 'PODTUREN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3433',
      ime: 'POJEZERJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5444',
      ime: 'POKUPSKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '3441',
      ime: 'POLAČA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3450',
      ime: 'POLIČNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3468',
      ime: 'POPOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3476',
      ime: 'POPOVAČA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3484',
      ime: 'POREČ - PARENZO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3492',
      ime: 'POSEDARJE',
      stope: {
        niza: 1800,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '3506',
      ime: 'POSTIRA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5738',
      ime: 'POVLJANA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['149/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '3514',
      ime: 'POŽEGA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['156/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3522',
      ime: 'PREGRADA',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['24/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '3549',
      ime: 'PREKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3557',
      ime: 'PRELOG',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3565',
      ime: 'PRESEKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5894',
      ime: 'PRGOMET',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6203',
      ime: 'PRIBISLAVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5908',
      ime: 'PRIMORSKI DOLAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3573',
      ime: 'PRIMOŠTEN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5835',
      ime: 'PRIVLAKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5746',
      ime: 'PRIVLAKA',
      stope: {
        niza: 1700,
        visa: 3000,
        narodneNovine: ['108/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '884',
      ime: 'PROLOŽAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '2984',
      ime: 'PROMINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3581',
      ime: 'PUČIŠĆA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3590',
      ime: 'PULA - POLA',
      stope: {
        niza: 2200,
        visa: 3200,
        narodneNovine: ['154/23', '148/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '3603',
      ime: 'PUNAT',
      stope: {
        niza: 1500,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3611',
      ime: 'PUNITOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3620',
      ime: 'PUŠĆA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3638',
      ime: 'RAB',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3646',
      ime: 'RADOBOJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23', '35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5363',
      ime: 'RAKOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3654',
      ime: 'RAKOVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3662',
      ime: 'RASINJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3689',
      ime: 'RAŠA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3697',
      ime: 'RAVNA GORA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3719',
      ime: 'RAŽANAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3727',
      ime: 'REŠETARI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['143/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '5568',
      ime: 'RIBNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '3735',
      ime: 'RIJEKA',
      stope: {
        niza: 2000,
        visa: 2500,
        narodneNovine: ['149/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '5827',
      ime: 'ROGOZNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3743',
      ime: 'ROVINJ - ROVIGNO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['144/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3751',
      ime: 'ROVIŠĆE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3760',
      ime: 'RUGVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5916',
      ime: 'RUNOVIĆI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3778',
      ime: 'RUŽIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3786',
      ime: 'SABORSKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3794',
      ime: 'SALI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3808',
      ime: 'SAMOBOR',
      stope: {
        niza: 1800,
        visa: 2700,
        narodneNovine: ['147/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3816',
      ime: 'SATNICA ĐAKOVAČKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3824',
      ime: 'SEGET',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3832',
      ime: 'SELCA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3859',
      ime: 'SELNICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3867',
      ime: 'SEMELJCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3875',
      ime: 'SENJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5622',
      ime: 'SEVERIN',
      stope: {
        niza: 1800,
        visa: 2800,
        narodneNovine: ['138/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3883',
      ime: 'SIBINJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5703',
      ime: 'SIKIREVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3891',
      ime: 'SINJ',
      stope: {
        niza: 1800,
        visa: 3000,
        narodneNovine: ['152/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3905',
      ime: 'SIRAČ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3913',
      ime: 'SISAK',
      stope: {
        niza: 2160,
        visa: 3160,
        narodneNovine: ['152/23', '151/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '3930',
      ime: 'SKRAD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3948',
      ime: 'SKRADIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3956',
      ime: 'SLATINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3964',
      ime: 'SLAVONSKI BROD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3972',
      ime: 'SLAVONSKI ŠAMAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '3999',
      ime: 'SLIVNO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4006',
      ime: 'SLUNJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4022',
      ime: 'SMOKVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4057',
      ime: 'SOKOLOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4065',
      ime: 'SOLIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4073',
      ime: 'SOPJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4090',
      ime: 'SPLIT',
      stope: {
        niza: 2150,
        visa: 3200,
        narodneNovine: ['150/23', '35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '4103',
      ime: 'SRAČINEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['28/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '4111',
      ime: 'STANKOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['140/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4120',
      ime: 'STARA GRADIŠKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23', '157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4138',
      ime: 'STARI GRAD',
      stope: {
        niza: 2000,
        visa: 3100,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '4146',
      ime: 'STARI JANKOVCI',
      stope: {
        niza: 1500,
        visa: 2500,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4154',
      ime: 'STARI MIKANOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4162',
      ime: 'STARIGRAD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4189',
      ime: 'STARO PETROVO SELO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4197',
      ime: 'STON',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '6068',
      ime: 'STRAHONINEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4219',
      ime: 'STRIZIVOJNA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4227',
      ime: 'STUBIČKE TOPLICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5517',
      ime: 'STUPNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4235',
      ime: 'SUĆURAJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4243',
      ime: 'SUHOPOLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4251',
      ime: 'SUKOŠAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4260',
      ime: 'SUNJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4278',
      ime: 'SUPETAR',
      stope: {
        niza: 2050,
        visa: 3100,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5924',
      ime: 'SUTIVAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '6076',
      ime: 'SVETA MARIJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4324',
      ime: 'SVETA NEDELJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4367',
      ime: 'SVETA NEDELJA',
      stope: {
        niza: 1800,
        visa: 2800,
        narodneNovine: ['150/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4375',
      ime: 'SVETI ĐURĐ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4286',
      ime: 'SVETI FILIP I JAKOV',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4383',
      ime: 'SVETI ILIJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['145/23', '157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4294',
      ime: 'SVETI IVAN ZELINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4391',
      ime: 'SVETI IVAN ŽABNO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4405',
      ime: 'SVETI JURAJ NA BREGU',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4308',
      ime: 'SVETI KRIŽ ZAČRETJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4316',
      ime: 'SVETI LOVREČ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '4413',
      ime: 'SVETI MARTIN NA MURI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4421',
      ime: 'SVETI PETAR OREHOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4332',
      ime: 'SVETI PETAR U ŠUMI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4359',
      ime: 'SVETVINČENAT',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '5649',
      ime: 'ŠANDROVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '6084',
      ime: 'ŠENKOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4430',
      ime: 'ŠESTANOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4448',
      ime: 'ŠIBENIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4456',
      ime: 'ŠKABRNJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6149',
      ime: 'ŠODOLOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4472',
      ime: 'ŠOLTA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4499',
      ime: 'ŠPIŠIĆ BUKOVICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4502',
      ime: 'ŠTEFANJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6289',
      ime: 'ŠTITAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/24'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '4529',
      ime: 'ŠTRIGOVA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6319',
      ime: 'TAR-VABRIGA - TORRE-ABREGA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['143/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4537',
      ime: 'TINJAN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '4545',
      ime: 'TISNO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5754',
      ime: 'TKON',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4561',
      ime: 'TOMPOJEVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4570',
      ime: 'TOPUSKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4588',
      ime: 'TORDINCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5576',
      ime: 'TOUNJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4596',
      ime: 'TOVARNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6262',
      ime: 'TRIBUNJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4600',
      ime: 'TRILJ',
      stope: {
        niza: 1500,
        visa: 3000,
        narodneNovine: ['141/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '4618',
      ime: 'TRNAVA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4626',
      ime: 'TRNOVEC BARTOLOVEČKI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25', '146/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '4634',
      ime: 'TROGIR',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '6017',
      ime: 'TRPANJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['140/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4642',
      ime: 'TRPINJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5932',
      ime: 'TUČEPI',
      stope: {
        niza: 1700,
        visa: 3000,
        narodneNovine: ['148/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '4669',
      ime: 'TUHELJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4677',
      ime: 'UDBINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4685',
      ime: 'UMAG - UMAGO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4693',
      ime: 'UNEŠIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4715',
      ime: 'VALPOVO',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '4723',
      ime: 'VARAŽDIN',
      stope: {
        niza: 2100,
        visa: 3200,
        narodneNovine: ['147/23', '151/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '4731',
      ime: 'VARAŽDINSKE TOPLICE',
      stope: {
        niza: 2100,
        visa: 3000,
        narodneNovine: ['138/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '4740',
      ime: 'VELA LUKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4758',
      ime: 'VELIKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5410',
      ime: 'VELIKA GORICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4766',
      ime: 'VELIKA KOPANICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4774',
      ime: 'VELIKA LUDINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4782',
      ime: 'VELIKA PISANICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5657',
      ime: 'VELIKA TRNOVITICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5584',
      ime: 'VELIKI BUKOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '4804',
      ime: 'VELIKI GRĐEVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4812',
      ime: 'VELIKO TRGOVIŠĆE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['141/23', '33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '4839',
      ime: 'VELIKO TROJSTVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['146/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '4847',
      ime: 'VIDOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['140/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4855',
      ime: 'VILJEVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4863',
      ime: 'VINICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['141/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4871',
      ime: 'VINKOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4880',
      ime: 'VINODOLSKA OPĆINA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4898',
      ime: 'VIR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4901',
      ime: 'VIRJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4910',
      ime: 'VIROVITICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['152/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4928',
      ime: 'VIS',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4936',
      ime: 'VISOKO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4944',
      ime: 'VIŠKOVCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4952',
      ime: 'VIŠKOVO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4979',
      ime: 'VIŠNJAN - VISIGNANO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4987',
      ime: 'VIŽINADA - VISINADA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5797',
      ime: 'VLADISLAVCI',
      stope: {
        niza: 2000,
        visa: 2500,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '4995',
      ime: 'VOĆIN',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5002',
      ime: 'VODICE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['131/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5029',
      ime: 'VODNJAN - DIGNANO',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5843',
      ime: 'VOĐINCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['153/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5037',
      ime: 'VOJNIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['157/23', '4/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5045',
      ime: 'VRATIŠINEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5053',
      ime: 'VRBANJA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['158/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5061',
      ime: 'VRBJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5070',
      ime: 'VRBNIK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5088',
      ime: 'VRBOVEC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5096',
      ime: 'VRBOVSKO',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5118',
      ime: 'VRGORAC',
      stope: {
        niza: 2100,
        visa: 2500,
        narodneNovine: ['34/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5126',
      ime: 'VRHOVINE',
      stope: {
        niza: 1800,
        visa: 3000,
        narodneNovine: ['146/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5134',
      ime: 'VRLIKA',
      stope: {
        niza: 1800,
        visa: 2800,
        narodneNovine: ['144/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '5142',
      ime: 'VRPOLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5169',
      ime: 'VRSAR - ORSERA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['111/25', '149/25'],
        stupanjeNaSnagu: '2026-01-01',
      },
    },
    {
      sifra: '6254',
      ime: 'VRSI',
      stope: {
        niza: 1500,
        visa: 3000,
        narodneNovine: ['148/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5177',
      ime: 'VUKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5185',
      ime: 'VUKOVAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5193',
      ime: 'ZABOK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5207',
      ime: 'ZADAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5959',
      ime: 'ZADVARJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5215',
      ime: 'ZAGORSKA SELA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '1333',
      ime: 'ZAGREB',
      stope: {
        niza: 2300,
        visa: 3300,
        narodneNovine: ['28/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5223',
      ime: 'ZAGVOZD',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5436',
      ime: 'ZAPREŠIĆ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5231',
      ime: 'ZAŽABLJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5240',
      ime: 'ZDENCI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['154/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5258',
      ime: 'ZEMUNIK DONJI',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5266',
      ime: 'ZLATAR',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5274',
      ime: 'ZLATAR BISTRICA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5282',
      ime: 'ZMIJAVCI',
      stope: {
        niza: 2000,
        visa: 2500,
        narodneNovine: ['136/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
    {
      sifra: '5665',
      ime: 'ZRINSKI TOPOLOVAC',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5304',
      ime: 'ŽAKANJE',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['33/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5312',
      ime: 'ŽMINJ',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['35/25'],
        stupanjeNaSnagu: '2025-03-01',
      },
    },
    {
      sifra: '5401',
      ime: 'ŽUMBERAK',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['151/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '6025',
      ime: 'ŽUPA DUBROVAČKA',
      stope: {
        niza: 2000,
        visa: 3000,
        narodneNovine: ['114/23'],
        stupanjeNaSnagu: '2024-01-01',
      },
    },
    {
      sifra: '5347',
      ime: 'ŽUPANJA',
      stope: {
        niza: 2100,
        visa: 3100,
        narodneNovine: ['153/24'],
        stupanjeNaSnagu: '2025-01-01',
      },
    },
  ],
  source: {
    jurisdiction: 'HR',
    act: 'Zakon o porezu na dohodak',
    gazette: 'NN 115/16, 106/18, 121/19, 32/20, 138/20, 151/22, 114/23, 152/24',
    url: 'https://porezna-uprava.gov.hr/hr/stope-godisnjeg-poreza-na-dohodak-za-2026-godinu/8166',
    status: 'in-force',
    article: 'čl. 19.a st. 4.',
    checkedOn: '2026-08-04',
  },
} as const satisfies Sourced<readonly JedinicaLokalneSamouprave[]>
