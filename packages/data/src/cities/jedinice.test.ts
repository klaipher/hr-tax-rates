import { describe, expect, it } from 'vitest'
import { sveJedinice } from './directory.ts'
import { graniceStopa, uGranicama } from './granice.ts'

const jedinice = sveJedinice.value

/** Одиниць місцевого самоврядування в Хорватії: 428 općina, 127 gradova і Grad Zagreb. */
const SVIH_JEDINICA = 556

describe('довідник місцевих одиниць', () => {
  it('містить усі одиниці, скільки їх є', () => {
    // Стільки рядків має таблиця Porezna uprava — і стільки одиниць у країні.
    // Менше означало б, що розбір мовчки загубив рядки, а людина з утраченої
    // одиниці побачила б чужі ставки.
    expect(jedinice).toHaveLength(SVIH_JEDINICA)
  })

  it('має унікальну шифру в кожної одиниці', () => {
    expect(new Set(jedinice.map(({ sifra }) => sifra)).size).toBe(SVIH_JEDINICA)
  })

  it('розрізняє однойменні одиниці шифрою, а не лишає їх невідрізненними', () => {
    const imena = jedinice.map(({ ime }) => ime)
    const dvojnici = [...new Set(imena.filter((ime, i) => imena.indexOf(ime) !== i))]

    // Три пари тезок, і ставки в них різні — саме тому вибір за назвою мусить
    // мати чим розрізнити.
    expect(dvojnici.toSorted()).toEqual(['OTOK', 'PRIVLAKA', 'SVETA NEDELJA'])
    for (const ime of dvojnici) {
      const isti = jedinice.filter((jedinica) => jedinica.ime === ime)
      expect(new Set(isti.map(({ sifra }) => sifra)).size).toBe(isti.length)
    }
  })

  it('тримає ставки цілими базисними пунктами, без дрейфу float із джерела', () => {
    // У xlsx 20,5 % лежить як `0.20499999999999999`, 28 % — як
    // `0.28000000000000003`. Дробові відсотки мусять уціліти точно, а дрейф —
    // не пролізти: 2050, а не 2049 і не 2050.0000000001.
    const stope = jedinice.map(({ stope }) => stope)

    expect(
      stope.filter(({ niza, visa }) => !Number.isInteger(niza) || !Number.isInteger(visa)),
    ).toEqual([])
    expect(jedinice.filter(({ ime }) => ime === 'SUPETAR').map(({ stope }) => stope.niza)).toEqual([
      2050,
    ])
    expect(jedinice.filter(({ ime }) => ime === 'SISAK').map(({ stope }) => stope)).toMatchObject([
      { niza: 2160, visa: 3160 },
    ])
  })

  it('тримає кожну ставку в межах, дозволених čl. 19.a st. 2.', () => {
    const izvan = jedinice.filter(({ stope }) => !uGranicama(stope))

    expect(izvan.map(({ ime, stope }) => `${ime}: ${stope.niza}/${stope.visa}`)).toEqual([])
  })

  it('пускає вище стелі «veliki grad» лише Grad Zagreb', () => {
    // Найширші межі — Загребові (`čl. 19.a st. 2. t. 4.`), і взяти їх має
    // право тільки він. Таблиця не каже, якого виду решта одиниць, тож це
    // єдина перевірка тонша за об'єднання меж, яку джерело дозволяє зробити.
    const { niza, visa } = graniceStopa.value['veliki-grad']
    const nadstelja = jedinice.filter(({ stope }) => stope.niza > niza.max || stope.visa > visa.max)

    expect(nadstelja.map(({ ime }) => ime)).toEqual(['ZAGREB'])
  })

  it('веде від кожної ставки до «Narodnih novina» і дати, з якої вона діє', () => {
    const bezTraga = jedinice.filter(
      ({ stope }) =>
        stope.narodneNovine.length === 0 ||
        stope.narodneNovine.some((broj) => !/^\d{1,3}\/\d{2}$/.test(broj)) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(stope.stupanjeNaSnagu),
    )

    expect(bezTraga.map(({ ime }) => ime)).toEqual([])
  })

  it('несе своє джерело, як вимагає ADR-0002', () => {
    expect(sveJedinice.source).toEqual({
      jurisdiction: 'HR',
      act: 'Zakon o porezu na dohodak',
      article: 'čl. 19.a st. 4.',
      gazette: 'NN 115/16, 106/18, 121/19, 32/20, 138/20, 151/22, 114/23, 152/24',
      url: 'https://porezna-uprava.gov.hr/hr/stope-godisnjeg-poreza-na-dohodak-za-2026-godinu/8166',
      status: 'in-force',
      checkedOn: '2026-08-04',
    })
  })
})
