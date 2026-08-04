// ЗГЕНЕРОВАНО `pnpm run fixtures:extract` — не редагувати руками.
//
// Вміст Excel-калькуляторів Hrvatska obrtnička komora (HOK). Формули й кешовані
// значення збережені сирими рядками, щоб дрейф float у джерелі лишався видимим.

import type { HokWorkbooks } from './types.ts'

export const hokWorkbooks = {
  'in-force-2026': {
    sourceFile: 'Kalkulator_DOBRO JE BITI OBRTNIK 2026..xlsx',
    sheets: {
      List1: {
        A1: {
          value: '2192.3000000000002',
        },
        A2: {
          formula: 'A1*0.2',
          value: '438.46000000000004',
        },
        A3: {
          formula: 'A1-A2',
          value: '1753.8400000000001',
        },
        A4: {
          formula: "'PRVO UNESITE PODATKE'!C18+'PRVO UNESITE PODATKE'!C19",
          value: '600',
        },
        A5: {
          formula: 'A3-A4',
          value: '1153.8400000000001',
        },
        A6: {
          formula: "A5*'PRVO UNESITE PODATKE'!C20",
          value: '265.38320000000004',
        },
        A8: {
          formula: 'A3-A6-A7',
          value: '1488.4568000000002',
        },
      },
      'PRVO UNESITE PODATKE': {
        B2: {
          value: 'INFORMATIVNI KALKULATOR DOBRO JE BITI OBRTNIK',
        },
        B6: {
          value: 'Molimo, unesite OČEKIVANE podatke u bijela polja tablice',
        },
        G6: {
          value: 'osobni odbitak',
        },
        G7: {
          value: 'osnovni osobni odbitak',
        },
        I7: {
          value: '600',
        },
        B8: {
          value: 'mjesečni primitak BEZ PDVa',
        },
        C8: {
          value: '0',
        },
        G8: {
          value: 'uzdržavani član',
        },
        I8: {
          formula: '0.5*I7',
          value: '300',
        },
        B9: {
          value: 'mjesečni izdatak BEZ PDVa',
        },
        C9: {
          formula: 'SUM(C10:C17)',
          value: '0',
        },
        G9: {
          value: 'prvo dijete',
        },
        I9: {
          formula: '0.5*I7',
          value: '300',
        },
        B10: {
          value: 'najamnina',
        },
        C10: {
          value: '0',
        },
        G10: {
          value: 'drugo dijete',
        },
        I10: {
          formula: '0.7*I7',
          value: '420',
        },
        B11: {
          value: 'nabavka robe',
        },
        C11: {
          value: '0',
        },
        G11: {
          value: 'treće dijete',
        },
        I11: {
          formula: '1*I7',
          value: '600',
        },
        B12: {
          value: 'nabavka usluga',
        },
        C12: {
          value: '0',
        },
        G12: {
          value: 'četvrto dijete',
        },
        I12: {
          formula: '1.4*I7',
          value: '840',
        },
        B13: {
          value: 'ukupno plaće radnika (bez Vaših doprinosa!!)',
        },
        C13: {
          value: '0',
        },
        G13: {
          value: 'peto dijete',
        },
        I13: {
          formula: '1.9*I7',
          value: '1140',
        },
        B14: {
          value: 'troškovi banke',
        },
        C14: {
          value: '0',
        },
        G14: {
          value: 'šesto dijete',
        },
        I14: {
          formula: '2.5*I7',
          value: '1500',
        },
        B15: {
          value: '100% troška reprezentacije',
        },
        C15: {
          value: '0',
        },
        G15: {
          value: 'sedmo dijete',
        },
        I15: {
          formula: '3.2*I7',
          value: '1920',
        },
        B16: {
          value: '100% troška osobnog vozila',
        },
        C16: {
          value: '0',
        },
        B17: {
          value: 'ostali troškovi (uključivo troškovi teretnog vozila)',
        },
        C17: {
          value: '0',
        },
        B18: {
          value: 'osobni odbitak ',
        },
        C18: {
          value: '600',
        },
        B19: {
          value: 'dodatni odbitak (ZBROJ za uzdržavanog člana ili za djecu)',
        },
        C19: {
          value: '0',
        },
        B20: {
          value: 'NIŽA STOPA POREZA u Vašem gradu/mjestu',
        },
        C20: {
          value: '0.23',
        },
        B21: {
          value: 'VIŠA STOPA POREZA u Vašem gradu/mjestu',
        },
        C21: {
          value: '0.33',
        },
        B22: {
          value: 'IZNOS ZA UMANJENJE OSNOVICE OPOREZIVANJA',
        },
        C22: {
          formula: 'C23+C24',
          value: '0',
        },
        B23: {
          value: '80% troškova za izobrazbu',
        },
        C23: {
          value: '0',
        },
        B24: {
          value: '100% troškova za novozaposlene (umanjeno za osobe koje nisu u radnom odnosu)',
        },
        C24: {
          value: '0',
        },
        B25: {
          value: 'broj naučnika tijekom godine',
        },
        C25: {
          value: '0',
        },
        B28: {
          value: 'NAKON ŠTO UNESETE PODATKE, KLIKNITE DOLJE NA "PREGLED MOGUĆNOSTI"',
        },
      },
      'PREGLED MOGUĆNOSTI ': {
        B2: {
          value: 'OBRT obveznik poreza na dohodak',
        },
        C2: {
          value: 'OBRT izbor paušalno oporezivanje',
        },
        D2: {
          value: 'Obrt u sustavu poreza na dobit',
        },
        E2: {
          value: 'Obrt obveznik poreza na dohodak uz rad',
        },
        F2: {
          value: 'Obrt izbor paušalno oporezivanje uz rad',
        },
        A3: {
          value: 'ukupni oporezivi godišnji primitak',
        },
        B3: {
          formula: "'PRVO UNESITE PODATKE'!C8*12",
          value: '0',
        },
        C3: {
          formula:
            "IF('PRVO UNESITE PODATKE'!C8*12>=60000,\"NE PAUŠALNO\",'PRVO UNESITE PODATKE'!C8*12)",
          value: '0',
        },
        D3: {
          formula: "'PRVO UNESITE PODATKE'!C8*12",
          value: '0',
        },
        E3: {
          formula: 'B3',
          value: '0',
        },
        F3: {
          formula: 'C3',
          value: '0',
        },
        A4: {
          value: 'ukupni oporezivi godišnji izdatak',
        },
        B4: {
          formula: "'PRVO UNESITE PODATKE'!C9*12",
          value: '0',
        },
        C4: {
          formula: "'PRVO UNESITE PODATKE'!C9*12",
          value: '0',
        },
        D4: {
          formula: "'PRVO UNESITE PODATKE'!C9*12",
          value: '0',
        },
        E4: {
          formula: 'B4',
          value: '0',
        },
        F4: {
          formula: 'C4',
          value: '0',
        },
        A5: {
          value: 'DOPRINOSI za obrtnika mjesečno',
        },
        B5: {
          formula: '1295.45*(0.2+0.165)',
          value: '472.83924999999999',
        },
        C5: {
          formula: '797.2*(0.2+0.165)',
          value: '290.97800000000001',
        },
        D5: {
          formula: '2192.3*(0.2+0.165)+0.01',
          value: '800.19950000000006',
        },
        E5: {
          value: '0',
        },
        F5: {
          value: '0',
        },
        A6: {
          value: 'ukupno doprinosi za obrtnika godišnje',
        },
        B6: {
          formula: 'B5*12',
          value: '5674.0709999999999',
        },
        C6: {
          formula: 'C5*12',
          value: '3491.7359999999999',
        },
        D6: {
          formula: 'D5*12',
          value: '9602.3940000000002',
          sharedFrom: 'C6',
        },
        E6: {
          value: '0',
        },
        F6: {
          value: '0',
        },
        A7: {
          value: 'porez na dohodak iz poduzetničke plaće',
        },
        B7: {
          value: '0',
        },
        C7: {
          value: '0',
        },
        D7: {
          formula: 'List1!A6*12',
          value: '3184.5984000000008',
        },
        E7: {
          value: '0',
        },
        F7: {
          value: '0',
        },
        A8: {
          value: 'neto dohodak za isplatu na nivou godine',
        },
        B8: {
          value: '0',
        },
        C8: {
          value: '0',
        },
        D8: {
          formula: 'List1!A8*12',
          value: '17861.481600000003',
        },
        E8: {
          formula: 'B8',
          value: '0',
        },
        F8: {
          value: '0',
        },
        A9: {
          value: 'DOHODAK/DOBIT PRIJE OPOREZIVANJA',
        },
        B9: {
          formula: "B3-B4-B6-B8+('PRVO UNESITE PODATKE'!C15+'PRVO UNESITE PODATKE'!C16)*0.5",
          value: '-5674.0709999999999',
        },
        C9: {
          formula: "C3-C4-C6-C8+('PRVO UNESITE PODATKE'!C15+'PRVO UNESITE PODATKE'!C16)*0.5",
          value: '-3491.7359999999999',
        },
        D9: {
          formula: "D3-D4-D6-D7-D8+('PRVO UNESITE PODATKE'!C15+'PRVO UNESITE PODATKE'!C16)*0.5",
          value: '-30648.474000000002',
        },
        E9: {
          formula: 'E3-E4',
          value: '0',
        },
        F9: {
          formula: 'F3-F4',
          value: '0',
        },
        A10: {
          value: 'OSOBNI ODBITAK na nivou godine ',
        },
        B10: {
          formula: "('PRVO UNESITE PODATKE'!C18+'PRVO UNESITE PODATKE'!C19)*12",
          value: '7200',
        },
        C10: {
          value: '0',
        },
        D10: {
          value: '0',
        },
        E10: {
          value: '0',
        },
        F10: {
          value: '0',
        },
        A11: {
          value: 'UMANJENJE POREZNE OSNOVICE',
        },
        B11: {
          formula:
            "'PRVO UNESITE PODATKE'!C23+'PRVO UNESITE PODATKE'!C24+'PRVO UNESITE PODATKE'!C25*B9*0.05",
          value: '0',
        },
        C11: {
          value: '0',
        },
        D11: {
          formula: "'PRVO UNESITE PODATKE'!C23",
          value: '0',
        },
        E11: {
          formula: 'B11',
          value: '0',
        },
        F11: {
          value: '0',
        },
        A12: {
          value: 'OSNOVICA ZA OPOREZIVANJE',
        },
        B12: {
          formula: 'IF((B9-B10-B11)>0,(B9-B10-B11),0)',
          value: '0',
        },
        C12: {
          formula: 'C3',
          value: '0',
        },
        D12: {
          formula: 'IF((D9-D11)>0,(D9-D11),0)',
          value: '0',
        },
        E12: {
          formula: 'E9-E10-E11',
          value: '0',
        },
        F12: {
          formula: 'F3',
          value: '0',
        },
        A13: {
          value: 'POREZ 10% ili 12%',
        },
        C13: {
          formula:
            'IF(C3<=11300,203.4,IF(AND(C3>=11300.01,C3<=15300),275.4,IF(AND(C3>=15300.01,C3<=19900),358.2,IF(AND(C3>=19900.01,C3<=30600),550.8,IF(AND(C3>=30600.01,C3<=40000),720,IF(AND(C3>=40000.01,C3<=50000),900,IF(AND(C3>=50000.01,C3<=60000),1080,IF(C3>60000,"nemoguće primijeniti model"))))))))',
          value: '203.4',
        },
        D13: {
          formula: 'IF(D12<=0,0,IF(D12>0,D12*10%))',
          value: '0',
        },
        F13: {
          formula:
            'IF(F3<=11300,203.4,IF(AND(F3>=11300.01,F3<=15300),275.4,IF(AND(F3>=15300.01,F3<=19900),358.2,IF(AND(F3>=19900.01,F3<=30600),550.8,IF(AND(F3>=30600.01,F3<=40000),720,IF(AND(F3>=40000.01,F3<=50000),900,IF(AND(F3>=50000.01,F3<=60000),1080,IF(F3>60000,"nemoguće primijeniti model"))))))))',
          value: '203.4',
        },
        A14: {
          value: 'POREZ NIŽA STOPA',
        },
        B14: {
          formula: "B12*'PRVO UNESITE PODATKE'!C20",
          value: '0',
        },
        C14: {
          value: '0',
        },
        D14: {
          value: '0',
        },
        E14: {
          formula: "E12*'PRVO UNESITE PODATKE'!C20",
          value: '0',
        },
        F14: {
          value: '0',
        },
        A15: {
          value: 'POREZ VIŠA STOPA',
        },
        B15: {
          formula: "IF(B12>=60000*((B12-60000)*'PRVO UNESITE PODATKE'!C21/100),0)",
          value: '0',
        },
        C15: {
          value: '0',
        },
        D15: {
          value: '0',
        },
        E15: {
          formula: "IF(E12>=60000*((E12-60000)*'PRVO UNESITE PODATKE'!C21/100),0)",
          value: '0',
        },
        F15: {
          value: '0',
        },
        A16: {
          value: 'UKUPNO POREZ',
        },
        B16: {
          formula: 'SUM(B13:B15)',
          value: '0',
        },
        C16: {
          formula: 'SUM(C13:C15)',
          value: '203.4',
        },
        D16: {
          formula: 'SUM(D13:D15)',
          value: '0',
        },
        E16: {
          formula: 'E14+E15',
          value: '0',
        },
        F16: {
          formula: 'SUM(F13:F15)',
          value: '203.4',
        },
        A17: {
          value: 'POREZ NA DOHODAK OD KAPITALA, PRILIKOM ISPLATE',
        },
        D17: {
          formula: 'D18',
          value: '0',
        },
        A18: {
          value: 'POREZ 12%',
        },
        D18: {
          formula: 'IF((D12-D16)>0,(D12-D16)*0.12,0)',
          value: '0',
        },
        A19: {
          value: 'UKUPNO godišnja POREZNA OBVEZA',
        },
        B19: {
          formula: 'B16+B17',
          value: '0',
        },
        C19: {
          formula: 'C16+C17',
          value: '203.4',
        },
        D19: {
          formula: 'D16+D17',
          value: '0',
          sharedFrom: 'C19',
        },
        E19: {
          formula: 'E16',
          value: '0',
        },
        F19: {
          formula: 'F16',
          value: '203.4',
        },
        A20: {
          value: 'Ukupno doprinosi za obrtnika godišnje',
        },
        B20: {
          formula: 'B6',
          value: '5674.0709999999999',
        },
        C20: {
          formula: 'C6',
          value: '3491.7359999999999',
        },
        D20: {
          formula: 'D6',
          value: '9602.3940000000002',
        },
        E20: {
          formula: 'IF(E9>=14024.4,(14024.4*17.5/100),E9*17.5/100)',
          value: '0',
        },
        F20: {
          formula:
            'IF(F3<=11300,296.63,IF(AND(F3>=11300.01,F3<=15300),401.63,IF(AND(F3>=15300.01,F3<=19900),522.38,IF(AND(F3>=19900.01,F3<=30600),803.25,IF(AND(F3>=30600.01,F3<=40000),1050,IF(AND(F3>=40000.01,F3<=50000),1312.5,IF(AND(F3>=5000.01,F3<=60000),1575,IF(F3>60000,"nemoguće primijeniti model"))))))))',
          value: '296.63',
        },
        A21: {
          value: 'OSTAJE ZA OBRTNIKA/vlasnika na nivou godine',
        },
        B21: {
          formula: 'B9+B8-B19',
          value: '-5674.0709999999999',
        },
        C21: {
          formula: 'C9+C8-C19',
          value: '-3695.136',
        },
        D21: {
          formula: 'D9+D8-D19',
          value: '-12786.992399999999',
        },
        E21: {
          formula: 'E9-E19-E20',
          value: '0',
        },
        F21: {
          formula: 'F9-F16-F20',
          value: '-500.03',
        },
        A24: {
          value:
            'INFORMATIVNI OBRAČUN PREMA VAŠIM UPUTAMA OČEKIVANIH PRIMITAKA I IZDATAKA NA NIVOU GODINE',
        },
      },
    },
  },
  'announced-2027': {
    sourceFile: 'Kalkulator_DOBRO_JE_BITI_OBRTNIK_2027_prema_najavljenim_mjerama.xlsx',
    sheets: {
      List1: {
        A1: {
          formula: '2180*1.1',
          value: '2398',
        },
        A2: {
          formula: 'A1*0.2',
          value: '479.6',
        },
        A3: {
          formula: 'A1-A2',
          value: '1918.4',
        },
        A4: {
          formula: "'PRVO UNESITE PODATKE'!C18+'PRVO UNESITE PODATKE'!C19",
          value: '600',
        },
        A5: {
          formula: 'A3-A4',
          value: '1318.4',
        },
        A6: {
          formula: "A5*'PRVO UNESITE PODATKE'!C20",
          value: '303.23200000000003',
        },
        A8: {
          formula: 'A3-A6',
          value: '1615.1680000000001',
        },
      },
      'PRVO UNESITE PODATKE': {
        B2: {
          value: 'INFORMATIVNI KALKULATOR "DOBRO JE BITI OBRTNIK"',
        },
        B6: {
          value: 'Molimo, unesite OČEKIVANE podatke u bijela polja tablice',
        },
        G6: {
          value: 'osobni odbitak',
        },
        G7: {
          value: 'osnovni osobni odbitak',
        },
        I7: {
          value: '600',
        },
        B8: {
          value: 'mjesečni primitak BEZ PDVa',
        },
        C8: {
          value: '0',
        },
        G8: {
          value: 'uzdržavani član',
        },
        I8: {
          formula: '0.5*I7',
          value: '300',
        },
        B9: {
          value: 'mjesečni izdatak BEZ PDVa',
        },
        C9: {
          formula: 'SUM(C10:C17)',
          value: '0',
        },
        G9: {
          value: 'prvo dijete',
        },
        I9: {
          formula: '0.5*I7',
          value: '300',
        },
        B10: {
          value: 'najamnina',
        },
        C10: {
          value: '0',
        },
        G10: {
          value: 'drugo dijete',
        },
        I10: {
          formula: '0.7*I7',
          value: '420',
        },
        B11: {
          value: 'nabavka robe',
        },
        C11: {
          value: '0',
        },
        G11: {
          value: 'treće dijete',
        },
        I11: {
          formula: '1*I7',
          value: '600',
        },
        B12: {
          value: 'nabavka usluga',
        },
        C12: {
          value: '0',
        },
        G12: {
          value: 'četvrto dijete',
        },
        I12: {
          formula: '1.4*I7',
          value: '840',
        },
        B13: {
          value: 'ukupno plaće radnika (bez Vaših doprinosa!!)',
        },
        C13: {
          value: '0',
        },
        G13: {
          value: 'peto dijete',
        },
        I13: {
          formula: '1.9*I7',
          value: '1140',
        },
        B14: {
          value: 'troškovi banke',
        },
        C14: {
          value: '0',
        },
        G14: {
          value: 'šesto dijete',
        },
        I14: {
          formula: '2.5*I7',
          value: '1500',
        },
        B15: {
          value: '100% troška reprezentacije',
        },
        C15: {
          value: '0',
        },
        G15: {
          value: 'sedmo dijete',
        },
        I15: {
          formula: '3.2*I7',
          value: '1920',
        },
        B16: {
          value: '100% troška osobnog vozila',
        },
        C16: {
          value: '0',
        },
        B17: {
          value: 'ostali troškovi (uključivo troškovi teretnog vozila)',
        },
        C17: {
          value: '0',
        },
        B18: {
          value: 'osobni odbitak ',
        },
        C18: {
          value: '600',
        },
        B19: {
          value: 'dodatni odbitak (ZBROJ za uzdržavanog člana ili za djecu)',
        },
        C19: {
          value: '0',
        },
        B20: {
          value: 'NIŽA STOPA POREZA u Vašem gradu/mjestu',
        },
        C20: {
          value: '0.23',
        },
        B21: {
          value: 'VIŠA STOPA POREZA u Vašem gradu/mjestu',
        },
        C21: {
          value: '0.33',
        },
        B22: {
          value: 'IZNOS ZA UMANJENJE OSNOVICE OPOREZIVANJA',
        },
        C22: {
          formula: 'C23+C24',
          value: '0',
        },
        B23: {
          value: '80% troškova za izobrazbu',
        },
        C23: {
          value: '0',
        },
        B24: {
          value: '100% troškova za novozaposlene (umanjeno za osobe koje nisu u radnom odnosu)',
        },
        C24: {
          value: '0',
        },
        B25: {
          value: 'broj naučnika tijekom godine',
        },
        C25: {
          value: '0',
        },
        B27: {
          value: 'Nakon što unesete sve podatke, kliknite dolje na "pregled mogućnosti"',
        },
      },
      'PREGLED MOGUĆNOSTI ': {
        B2: {
          value: 'OBRT obveznik poreza na dohodak (poslovne knjige)',
        },
        C2: {
          value: 'OBRT obveznik paušalnog oporezivanja',
        },
        D2: {
          value: 'Obrt u sustavu poreza na dobit',
        },
        E2: {
          value: 'Obrt obveznik poreza na dohodak uz rad',
        },
        F2: {
          value: 'Obrt izbor paušalno oporezivanje uz rad',
        },
        A3: {
          value: 'ukupni oporezivi godišnji primitak',
        },
        B3: {
          formula: "'PRVO UNESITE PODATKE'!C8*12",
          value: '0',
        },
        C3: {
          formula:
            "IF('PRVO UNESITE PODATKE'!C8*12>=60000,\"NE PAUŠALNO\",'PRVO UNESITE PODATKE'!C8*12)",
          value: '0',
        },
        D3: {
          formula: "'PRVO UNESITE PODATKE'!C8*12",
          value: '0',
        },
        E3: {
          formula: 'B3',
          value: '0',
        },
        F3: {
          formula: 'C3',
          value: '0',
        },
        A4: {
          value: 'ukupni oporezivi godišnji izdatak',
        },
        B4: {
          formula: "'PRVO UNESITE PODATKE'!C9*12",
          value: '0',
        },
        C4: {
          formula: "'PRVO UNESITE PODATKE'!C9*12",
          value: '0',
        },
        D4: {
          formula: "'PRVO UNESITE PODATKE'!C9*12",
          value: '0',
        },
        E4: {
          formula: 'B4',
          value: '0',
        },
        F4: {
          formula: 'C4',
          value: '0',
        },
        A5: {
          value: 'DOPRINOSI za obrtnika mjesečno',
        },
        B5: {
          formula: '2180*0.65*36.5/100',
          value: '517.20500000000004',
        },
        C5: {
          formula:
            'IF((C3<=40000),2180*0.4*36.5/100,IF(AND(C3>=40000.01,C3<=50000),2180*0.45*36.5/100,IF(AND(C3>=50000.01,C3<=60000),2180*0.5*36.5/100,IF(C3>60000,"nemoguće primijeniti model"))))',
          value: '318.27999999999997',
        },
        D5: {
          formula: '2180*1.1*36.5/100',
          value: '875.27',
        },
        E5: {
          value: '0',
        },
        F5: {
          value: '0',
        },
        A6: {
          value: 'ukupno doprinosi za obrtnika godišnje',
        },
        B6: {
          formula: 'B5*12',
          value: '6206.4600000000009',
        },
        C6: {
          formula: 'C5*12',
          value: '3819.3599999999997',
        },
        D6: {
          formula: 'D5*12',
          value: '10503.24',
          sharedFrom: 'C6',
        },
        E6: {
          value: '0',
        },
        F6: {
          value: '0',
        },
        A7: {
          value: 'porez na dohodak iz poduzetničke plaće',
        },
        B7: {
          value: '0',
        },
        C7: {
          value: '0',
        },
        D7: {
          formula: 'List1!A6*12',
          value: '3638.7840000000006',
        },
        E7: {
          value: '0',
        },
        F7: {
          value: '0',
        },
        A8: {
          value: 'neto dohodak na nivou godine (obveza isplate plaće)',
        },
        B8: {
          value: '0',
        },
        C8: {
          value: '0',
        },
        D8: {
          formula: 'List1!A8*12',
          value: '19382.016000000003',
        },
        E8: {
          formula: 'B8',
          value: '0',
        },
        F8: {
          value: '0',
        },
        A9: {
          value: 'DOHODAK/DOBIT PRIJE OPOREZIVANJA',
        },
        B9: {
          formula: "B3-B4-B6-B8+('PRVO UNESITE PODATKE'!C15+'PRVO UNESITE PODATKE'!C16)*0.5",
          value: '-6206.4600000000009',
        },
        C9: {
          formula: "C3-C4-C6-C8+('PRVO UNESITE PODATKE'!C15+'PRVO UNESITE PODATKE'!C16)*0.5",
          value: '-3819.3599999999997',
        },
        D9: {
          formula: "D3-D4-D6-D7-D8+('PRVO UNESITE PODATKE'!C15+'PRVO UNESITE PODATKE'!C16)*0.5",
          value: '-33524.040000000008',
        },
        E9: {
          formula: 'E3-E4',
          value: '0',
        },
        F9: {
          formula: 'F3-F4',
          value: '0',
        },
        A10: {
          value: 'OSOBNI ODBITAK na nivou godine ',
        },
        B10: {
          formula: "('PRVO UNESITE PODATKE'!C18+'PRVO UNESITE PODATKE'!C19)*12",
          value: '7200',
        },
        C10: {
          value: '0',
        },
        D10: {
          value: '0',
        },
        E10: {
          value: '0',
        },
        F10: {
          value: '0',
        },
        A11: {
          value: 'UMANJENJE POREZNE OSNOVICE',
        },
        B11: {
          formula:
            "'PRVO UNESITE PODATKE'!C23+'PRVO UNESITE PODATKE'!C24+'PRVO UNESITE PODATKE'!C25*B9*0.05",
          value: '0',
        },
        C11: {
          value: '0',
        },
        D11: {
          formula: "'PRVO UNESITE PODATKE'!C23",
          value: '0',
        },
        E11: {
          formula: 'B11',
          value: '0',
        },
        F11: {
          value: '0',
        },
        A12: {
          value: 'OSNOVICA ZA OPOREZIVANJE',
        },
        B12: {
          formula: 'IF((B9-B10-B11)>0,(B9-B10-B11),0)',
          value: '0',
        },
        C12: {
          formula: 'C3',
          value: '0',
        },
        D12: {
          formula: 'IF((D9-D11)>0,(D9-D11),0)',
          value: '0',
        },
        E12: {
          formula: 'E9-E10-E11',
          value: '0',
        },
        F12: {
          formula: 'F3',
          value: '0',
        },
        A13: {
          value: 'POREZ 10% ili 12%',
        },
        C13: {
          formula:
            'IF(C3<=11300,203.4,IF(AND(C3>=11300.01,C3<=15300),275.4,IF(AND(C3>=15300.01,C3<=19900),358.2,IF(AND(C3>=19900.01,C3<=30600),550.8,IF(AND(C3>=30600.01,C3<=40000),720,IF(AND(C3>=40000.01,C3<=50000),1800,IF(AND(C3>=50000.01,C3<=60000),3240,IF(C3>60000,"nemoguće primijeniti model"))))))))',
          value: '203.4',
        },
        D13: {
          formula: 'IF(D12<=0,0,IF(D12>0,D12*10%))',
          value: '0',
        },
        F13: {
          formula:
            'IF(F3<=11300,203.4,IF(AND(F3>=11300.01,F3<=15300),275.4,IF(AND(F3>=15300.01,F3<=19900),358.2,IF(AND(F3>=19900.01,F3<=30600),550.8,IF(AND(F3>=30600.01,F3<=40000),720,IF(AND(F3>=40000.01,F3<=50000),1800,IF(AND(F3>=50000.01,F3<=60000),3240,IF(F3>60000,"nemoguće primijeniti model"))))))))',
          value: '203.4',
        },
        A14: {
          value: 'POREZ NIŽA STOPA',
        },
        B14: {
          formula: "B12*'PRVO UNESITE PODATKE'!C20",
          value: '0',
        },
        C14: {
          value: '0',
        },
        D14: {
          value: '0',
        },
        E14: {
          formula: "E12*'PRVO UNESITE PODATKE'!C20",
          value: '0',
        },
        F14: {
          value: '0',
        },
        A15: {
          value: 'POREZ VIŠA STOPA',
        },
        B15: {
          formula: "IF(B12>=60000*((B12-60000)*'PRVO UNESITE PODATKE'!C21/100),0)",
          value: '0',
        },
        C15: {
          value: '0',
        },
        D15: {
          value: '0',
        },
        E15: {
          formula: "IF(E12>=60000*((E12-60000)*'PRVO UNESITE PODATKE'!C21/100),0)",
          value: '0',
        },
        F15: {
          value: '0',
        },
        A16: {
          value: 'UKUPNO POREZ',
        },
        B16: {
          formula: 'SUM(B13:B15)',
          value: '0',
        },
        C16: {
          formula: 'SUM(C13:C15)',
          value: '203.4',
        },
        D16: {
          formula: 'SUM(D13:D15)',
          value: '0',
        },
        E16: {
          formula: 'E14+E15',
          value: '0',
        },
        F16: {
          formula: 'SUM(F13:F15)',
          value: '203.4',
        },
        A17: {
          value: 'POREZ NA DOHODAK OD KAPITALA, PRILIKOM ISPLATE',
        },
        D17: {
          formula: 'D18',
          value: '0',
        },
        A18: {
          value: 'POREZ 12%',
        },
        D18: {
          formula: 'IF((D12-D16)>0,(D12-D16)*0.12,0)',
          value: '0',
        },
        A19: {
          value: 'UKUPNO godišnja POREZNA OBVEZA',
        },
        B19: {
          formula: 'B16+B17',
          value: '0',
        },
        C19: {
          formula: 'C16+C17',
          value: '203.4',
        },
        D19: {
          formula: 'D16+D17',
          value: '0',
          sharedFrom: 'C19',
        },
        E19: {
          formula: 'E16',
          value: '0',
        },
        F19: {
          formula: 'F16',
          value: '203.4',
        },
        A20: {
          value: 'Ukupno doprinosi za obrtnika godišnje',
        },
        B20: {
          formula: 'B6',
          value: '6206.4600000000009',
        },
        C20: {
          formula: 'C6',
          value: '3819.3599999999997',
        },
        D20: {
          formula: 'D6',
          value: '10503.24',
        },
        E20: {
          formula: 'IF(E9>=17004,(17004*17.5/100),E9*17.5/100)',
          value: '0',
        },
        F20: {
          formula:
            'IF(F3<=11300,296.63,IF(AND(F3>=11300.01,F3<=15300),401.63,IF(AND(F3>=15300.01,F3<=19900),522.38,IF(AND(F3>=19900.01,F3<=30600),803.25,IF(AND(F3>=30600.01,F3<=40000),1050,IF(AND(F3>=40000.01,F3<=50000),2625,IF(AND(F3>=5000.01,F3<=60000),4725,IF(F3>60000,"nemoguće primijeniti model"))))))))',
          value: '296.63',
        },
        A21: {
          value: 'OSTAJE ZA OBRTNIKA/vlasnika na nivou godine',
        },
        B21: {
          formula: 'B9+B8-B19',
          value: '-6206.4600000000009',
        },
        C21: {
          formula: 'C9+C8-C19',
          value: '-4022.7599999999998',
        },
        D21: {
          formula: 'D9+D8-D19',
          value: '-14142.024000000005',
        },
        E21: {
          formula: 'E9-E19-E20',
          value: '0',
        },
        F21: {
          formula: 'F9-F16-F20',
          value: '-500.03',
        },
        A24: {
          value:
            'INFORMATIVNI OBRAČUN PREMA VAŠIM UPUTAMA OČEKIVANIH PRIMITAKA I IZDATAKA NA NIVOU GODINE',
        },
      },
    },
  },
} as const satisfies HokWorkbooks
