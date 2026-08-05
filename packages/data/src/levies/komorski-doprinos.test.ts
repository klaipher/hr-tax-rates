import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import {
  GORNJA_GRANICA_KOMORSKOG_DOPRINOSA,
  KOMORSKI_DOPRINOS_PRIJEDLOG,
  KOMORSKI_DOPRINOS_U_SNAZI,
  komorskiDoprinos,
  mjesecniKomorskiDoprinos,
  tromjesecniKomorskiDoprinos,
} from './komorski-doprinos.ts'

describe('komorski doprinos (внесок до обртницької палати)', () => {
  it('за чинною Odlukom дає 11,40 € на місяць — 1,9 % основного osobni odbitak 600 €', () => {
    expect(mjesecniKomorskiDoprinos(KOMORSKI_DOPRINOS_U_SNAZI).toFixed(2)).toBe('11.40')
  })

  it('сплачується тромісячно по 34,20 €, разом 136,80 € за рік', () => {
    expect(tromjesecniKomorskiDoprinos(KOMORSKI_DOPRINOS_U_SNAZI).toFixed(2)).toBe('34.20')

    const result = komorskiDoprinos({ uPrveDvijeGodine: false }, KOMORSKI_DOPRINOS_U_SNAZI)
    if (result.kind !== 'due') throw new Error('чинний обрт мусить платити komorski doprinos')
    expect(result.godisnjiIznos.toFixed(2)).toBe('136.80')
  })

  it('платить кожен obrt незалежно від режиму — функція про режим нічого не питає', () => {
    // Внесок прив'язаний до osobni odbitak, а не до primitak чи розряду, тож
    // жодного входу про режим у сигнатурі немає. Якщо він там з'явиться,
    // цей тест перестане компілюватися. Заразом перевіряємо, що правила за
    // замовчуванням — саме чинні, а не проєктні.
    const zadano = komorskiDoprinos({ uPrveDvijeGodine: false })
    const izricito = komorskiDoprinos({ uPrveDvijeGodine: false }, KOMORSKI_DOPRINOS_U_SNAZI)

    if (zadano.kind !== 'due' || izricito.kind !== 'due') throw new Error('обрт платить внесок')
    expect(zadano.godisnjiIznos.toFixed(2)).toBe(izricito.godisnjiIznos.toFixed(2))
    expect(zadano.godisnjiIznos.toFixed(2)).toBe('136.80')
  })

  it('обрт у перші дві роки не платить — і це сказано прямо, а не нулем', () => {
    const result = komorskiDoprinos({ uPrveDvijeGodine: true })

    expect(result.kind).toBe('not-applicable')
    if (result.kind !== 'not-applicable') return
    // Причина мусить нести саме той строк, що лежить у правилах, а не слово,
    // вписане в шаблон повз джерело (ADR-0004).
    expect(result.razlog).toEqual({
      kod: 'novootvoreni-obrt',
      oslobodenjeGodina: KOMORSKI_DOPRINOS_U_SNAZI.oslobodenjeGodina.value,
    })
    // Звільнення теж має джерело: čl. 15. Odluke, а не «ми так вирішили».
    expect(result.source.article).toBe('čl. 15.')
    expect(result.source.gazette).toBe('NN 154/22')
  })

  it('ставка й звільнення несуть посилання на акт, як вимагає ADR-0002', () => {
    const { mjesecnaStopa, osnovniOsobniOdbitak, oslobodenjeGodina } = KOMORSKI_DOPRINOS_U_SNAZI
    for (const { source } of [mjesecnaStopa, osnovniOsobniOdbitak, oslobodenjeGodina]) {
      expect(source.act).not.toBe('')
      expect(source.article).not.toBe('')
      expect(source.url).toMatch(/^https:\/\//)
      expect(source.status).toBe('in-force')
      expect(source.checkedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    expect(osnovniOsobniOdbitak.source.act).toBe('Zakon o porezu na dohodak')
    expect(mjesecnaStopa.source.gazette).toBe('NN 154/22')
  })

  it('чинна ставка тримається в законній стелі 2 % із čl. 81. Zakona o obrtu', () => {
    const stopa = new Decimal(KOMORSKI_DOPRINOS_U_SNAZI.mjesecnaStopa.value)
    const granica = new Decimal(GORNJA_GRANICA_KOMORSKOG_DOPRINOSA.value)

    expect(stopa.lessThanOrEqualTo(granica)).toBe(true)
    expect(granica.toFixed(1)).toBe('2.0')
    expect(GORNJA_GRANICA_KOMORSKOG_DOPRINOSA.source.act).toBe('Zakon o obrtu')
  })

  it('проєкт зниження лежить окремо і позначений як проєкт, а не підмінює чинне', () => {
    expect(KOMORSKI_DOPRINOS_PRIJEDLOG.mjesecnaStopa.source.status).toBe('draft')
    expect(KOMORSKI_DOPRINOS_U_SNAZI.mjesecnaStopa.source.status).toBe('in-force')
    expect(KOMORSKI_DOPRINOS_PRIJEDLOG.mjesecnaStopa.value).toBe('1.5')

    // 1,5 % × 600 € = 9,00 € на місяць, 108,00 € на рік.
    expect(mjesecniKomorskiDoprinos(KOMORSKI_DOPRINOS_PRIJEDLOG).toFixed(2)).toBe('9.00')
    const result = komorskiDoprinos({ uPrveDvijeGodine: false }, KOMORSKI_DOPRINOS_PRIJEDLOG)
    if (result.kind !== 'due') throw new Error('проєкт не скасовує внесок, лише знижує')
    expect(result.godisnjiIznos.toFixed(2)).toBe('108.00')
  })

  it('проєкт міняє стелю, а не ставку — і сума з нього має про це застерігати', () => {
    // čl. 32. Prijedloga міняє в čl. 81. Zakona o obrtu число «2» на «1,5»,
    // тобто знижує максимум. Саму ставку в цих межах усе одно ухвалює HOK
    // новою Odlukom. Видавати 1,5 % за майбутню ставку — вигадка.
    expect(KOMORSKI_DOPRINOS_PRIJEDLOG.narav).toBe('gornja granica')
    expect(KOMORSKI_DOPRINOS_U_SNAZI.narav).toBe('stopa')

    const prijedlog = komorskiDoprinos({ uPrveDvijeGodine: false }, KOMORSKI_DOPRINOS_PRIJEDLOG)
    if (prijedlog.kind !== 'due') throw new Error('проєкт не скасовує внесок')
    expect(prijedlog.napomene).toEqual([
      { kod: 'stopa-je-gornja-granica', stopa: KOMORSKI_DOPRINOS_PRIJEDLOG.mjesecnaStopa.value },
    ])

    const uSnazi = komorskiDoprinos({ uPrveDvijeGodine: false })
    if (uSnazi.kind !== 'due') throw new Error('чинний обрт платить')
    expect(uSnazi.napomene).toEqual([])
  })
})
