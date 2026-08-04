// Пряме посилання на файл, а не на `@hr-tax/data`: `rules/pdv.ts` ще не
// виведений через index пакета, а саме цей імпорт і є доказом, що набір правил
// з `@hr-tax/data` структурно задовольняє контракт `PdvPravila` рушія. Коли
// index буде дописаний при злитті, шлях стане звичайним іменем пакета.
import { pdvPravila2026, sourced } from '@hr-tax/data'
import Decimal from 'decimal.js'
import { describe, expect, it } from 'vitest'
import { eur, toCentString } from './money.ts'
import { type PdvPravila, type PdvUnos, usporediSustavPdv } from './pdv.ts'

const pravila: PdvPravila = pdvPravila2026

/** Той самий набір норм, але зі ставкою 10% — щоб зловити зашиті 25%. */
const drugaStopa: PdvPravila = {
  ...pravila,
  opcaStopa: sourced(new Decimal('0.10'), pravila.opcaStopa.source),
}

const unos = (izmjene: Partial<PdvUnos> = {}): PdvUnos => ({
  godisnjiPrimitak: eur('40000'),
  tipKlijenta: 'poslovni-eu',
  godisnjeInozemneUsluge: eur('0'),
  ...izmjene,
})

const usporedi = (izmjene: Partial<PdvUnos> = {}, sPravilima: PdvPravila = pravila) =>
  usporediSustavPdv(unos(izmjene), sPravilima)

describe('usporediSustavPdv', () => {
  describe('вихідна сторона — чи несе рахунок хорватський PDV', () => {
    it('бізнес-клієнтові в ЄС PDV не рахується ні до порога, ні після нього', () => {
      // Місце надання переїжджає до отримувача, тож хорватського обороту тут
      // немає взагалі — і вхід у систему PDV цього не змінює.
      const { izvanSustava, uSustavu } = usporedi({ tipKlijenta: 'poslovni-eu' })

      expect([izvanSustava.izlaz.obracunavaSePdv, uSustavu.izlaz.obracunavaSePdv]).toEqual([
        false,
        false,
      ])
      expect(toCentString(uSustavu.izlaz.godisnjiPdv)).toBe('0.00')
      expect(uSustavu.izlaz.izvor.article).toBe('čl. 17. st. 1.')
    })

    it('рахунок бізнес-клієнтові в ЄС носить напис «prijenos porezne obveze»', () => {
      const { izlaz } = usporedi({ tipKlijenta: 'poslovni-eu' }).izvanSustava

      expect(izlaz.napomenaNaRacunu?.tekst).toBe('prijenos porezne obveze')
      expect(izlaz.napomenaNaRacunu?.izvor.article).toBe('čl. 79. st. 7.')
    })

    it('клієнтові поза ЄС PDV теж не рахується, але напису прийносу немає', () => {
      // Прийнос зобов’язання — механізм ЄС. Дописати той самий напис третій
      // країні означало б послатися на норму, якої там немає.
      const { izlaz } = usporedi({ tipKlijenta: 'poslovni-izvan-eu' }).uSustavu

      expect(izlaz.obracunavaSePdv).toBe(false)
      expect(izlaz.napomenaNaRacunu).toBeUndefined()
    })

    it('клієнтові в Хорватії поза системою PDV не рахується — через звільнення, а не місце', () => {
      const { izlaz } = usporedi({ tipKlijenta: 'tuzemni' }).izvanSustava

      expect(izlaz.obracunavaSePdv).toBe(false)
      expect(toCentString(izlaz.godisnjiPdv)).toBe('0.00')
      expect(izlaz.izvor.article).toBe('čl. 90. st. 1.')
    })

    it('клієнтові в Хорватії в системі PDV лягає на рахунок за загальною ставкою', () => {
      // 40 000,00 × 25%.
      const { izlaz } = usporedi({ tipKlijenta: 'tuzemni' }).uSustavu

      expect(izlaz.obracunavaSePdv).toBe(true)
      expect(toCentString(izlaz.godisnjiPdv)).toBe('10000.00')
      expect(izlaz.izvor.article).toBe('čl. 38. st. 1.')
    })

    it('бере ставку з набору правил, а не зашиту в рушій', () => {
      const { izlaz } = usporedi({ tipKlijenta: 'tuzemni' }, drugaStopa).uSustavu

      expect(toCentString(izlaz.godisnjiPdv)).toBe('4000.00')
    })

    it('округлює податок до цента, а не тягне хвіст далі', () => {
      // 10 000,01 × 25% = 2 500,0025 — на рахунку такої суми не буває.
      // Дивимося на саму суму, а не на її форматування: `toCentString`
      // округлить хвіст і сам, і тоді тест доводив би лише сам себе.
      const { izlaz } = usporedi({
        tipKlijenta: 'tuzemni',
        godisnjiPrimitak: eur('10000.01'),
      }).uSustavu

      expect(izlaz.godisnjiPdv.amount.toFixed(4)).toBe('2500.0000')
    })
  })

  describe('вхідна сторона — послуги, куплені за кордоном', () => {
    it('поза системою PDV нараховується самому собі й лишається чистою витратою', () => {
      // 20 000,00 × 25% нараховано, нуль відраховано.
      const { ulaz } = usporedi({ godisnjeInozemneUsluge: eur('20000') }).izvanSustava

      expect(toCentString(ulaz.obracunatiPdv)).toBe('5000.00')
      expect(toCentString(ulaz.odbitakPretporeza)).toBe('0.00')
      expect(toCentString(ulaz.nepovratniPdv)).toBe('5000.00')
      // Витрату творить пара статей: одна нараховує, друга не дає відняти.
      expect(ulaz.izvorSamoobracuna.article).toBe('čl. 75. st. 1. t. 6.')
      expect(ulaz.izvorOdbitka.article).toBe('čl. 90.g')
    })

    it('у системі PDV та сама сума нараховується і повністю відраховується', () => {
      const { ulaz } = usporedi({ godisnjeInozemneUsluge: eur('20000') }).uSustavu

      expect(toCentString(ulaz.obracunatiPdv)).toBe('5000.00')
      expect(toCentString(ulaz.odbitakPretporeza)).toBe('5000.00')
      expect(toCentString(ulaz.nepovratniPdv)).toBe('0.00')
      expect(ulaz.izvorSamoobracuna.article).toBe('čl. 75. st. 1. t. 6.')
      expect(ulaz.izvorOdbitka.article).toBe('čl. 58. st. 2.')
    })

    it('не залежить від того, звідки клієнти: нарахування дає постачальник', () => {
      const trosak = (tipKlijenta: PdvUnos['tipKlijenta']) =>
        toCentString(
          usporedi({ tipKlijenta, godisnjeInozemneUsluge: eur('20000') }).izvanSustava.ulaz
            .nepovratniPdv,
        )

      expect([trosak('tuzemni'), trosak('poslovni-izvan-eu')]).toEqual(['5000.00', '5000.00'])
    })

    it('без закордонних послуг чистої витрати немає', () => {
      const { ulaz } = usporedi({ godisnjeInozemneUsluge: eur('0') }).izvanSustava

      expect(toCentString(ulaz.nepovratniPdv)).toBe('0.00')
      expect(toCentString(ulaz.obracunatiPdv)).toBe('0.00')
    })

    it('нарахування округлюється до цента, а не тягне хвіст далі', () => {
      const { ulaz } = usporedi({ godisnjeInozemneUsluge: eur('10000.01') }).izvanSustava

      expect(ulaz.obracunatiPdv.amount.toFixed(4)).toBe('2500.0000')
      expect(ulaz.nepovratniPdv.amount.toFixed(4)).toBe('2500.0000')
    })
  })

  describe('інверсія — вхід у систему PDV прибирає витрату вхідної сторони', () => {
    it('заощадження дорівнює всій невідшкодовуваній витраті поза системою', () => {
      const { izvanSustava, uSustavu, ustedaUlazneStrane } = usporedi({
        godisnjeInozemneUsluge: eur('20000'),
      })

      expect(toCentString(uSustavu.ulaz.nepovratniPdv)).toBe('0.00')
      expect(toCentString(ustedaUlazneStrane)).toBe(toCentString(izvanSustava.ulaz.nepovratniPdv))
      expect(toCentString(ustedaUlazneStrane)).toBe('5000.00')
    })

    it('для клієнтів у ЄС вхід нічого не додає на виході й прибирає витрату на вході', () => {
      // Ось і вся інверсія: рахунки лишаються без PDV в обох станах, тож
      // єдина різниця між ними — 5 000 €, яких у системі просто немає.
      const { izvanSustava, uSustavu, ustedaUlazneStrane } = usporedi({
        tipKlijenta: 'poslovni-eu',
        godisnjeInozemneUsluge: eur('20000'),
      })

      const cijenaPdva = ({ izlaz, ulaz }: typeof izvanSustava) =>
        izlaz.godisnjiPdv.amount.plus(ulaz.nepovratniPdv.amount)

      expect(cijenaPdva(uSustavu).lessThan(cijenaPdva(izvanSustava))).toBe(true)
      expect(cijenaPdva(izvanSustava).minus(cijenaPdva(uSustavu)).toFixed(2)).toBe(
        toCentString(ustedaUlazneStrane),
      )
    })

    it('для клієнтів у Хорватії вхід у систему не безкоштовний: 25% лягає на рахунки', () => {
      // Дзеркало попереднього тесту. Якби модель показувала лише заощадження
      // вхідної сторони, вона радила б входити в систему всім підряд.
      const { uSustavu, ustedaUlazneStrane } = usporedi({
        tipKlijenta: 'tuzemni',
        godisnjeInozemneUsluge: eur('20000'),
      })

      expect(uSustavu.izlaz.godisnjiPdv.amount.greaterThan(ustedaUlazneStrane.amount)).toBe(true)
      expect(toCentString(uSustavu.izlaz.godisnjiPdv)).toBe('10000.00')
    })

    it('заощадження йде зі ставки правил, а не з константи рушія', () => {
      const { ustedaUlazneStrane } = usporedi({ godisnjeInozemneUsluge: eur('20000') }, drugaStopa)

      expect(toCentString(ustedaUlazneStrane)).toBe('2000.00')
    })

    it('без закордонних послуг вхід у систему нічого не заощаджує', () => {
      expect(toCentString(usporedi().ustedaUlazneStrane)).toBe('0.00')
    })
  })

  describe('обов’язок PDV ID', () => {
    it('виникає від послуг бізнесам ЄС навіть далеко нижче порога', () => {
      const { obvezaPdvIdentifikacijskogBroja } = usporedi({
        tipKlijenta: 'poslovni-eu',
        godisnjiPrimitak: eur('10000'),
      })

      expect(obvezaPdvIdentifikacijskogBroja.obvezan).toBe(true)
      expect(obvezaPdvIdentifikacijskogBroja.razlozi).toEqual(['usluge-poslovnim-klijentima-eu'])
      expect(obvezaPdvIdentifikacijskogBroja.obrazlozenje).toContain('60 000')
      expect(obvezaPdvIdentifikacijskogBroja.izvor.article).toBe('čl. 77. st. 4.')
    })

    it('виникає й від самих лише закордонних послуг на вході', () => {
      const { obvezaPdvIdentifikacijskogBroja } = usporedi({
        tipKlijenta: 'tuzemni',
        godisnjeInozemneUsluge: eur('500'),
      })

      expect(obvezaPdvIdentifikacijskogBroja.razlozi).toEqual(['usluge-primljene-iz-inozemstva'])
    })

    it('називає обидві причини, коли обидві є', () => {
      const { obvezaPdvIdentifikacijskogBroja } = usporedi({
        tipKlijenta: 'poslovni-eu',
        godisnjeInozemneUsluge: eur('500'),
      })

      expect(obvezaPdvIdentifikacijskogBroja.razlozi).toEqual([
        'usluge-poslovnim-klijentima-eu',
        'usluge-primljene-iz-inozemstva',
      ])
    })

    it('не виникає, коли клієнти лише в Хорватії, а закордонних покупок немає', () => {
      const { obvezaPdvIdentifikacijskogBroja } = usporedi({ tipKlijenta: 'tuzemni' })

      expect(obvezaPdvIdentifikacijskogBroja.obvezan).toBe(false)
      expect(obvezaPdvIdentifikacijskogBroja.razlozi).toEqual([])
    })

    it('клієнти поза ЄС самі собою обов’язку не створюють', () => {
      // čl. 77. st. 4. говорить про іншу державу-члена; третя країна під нього
      // не підпадає, і вигадувати обов’язок «про всяк випадок» не можна.
      const { obvezaPdvIdentifikacijskogBroja } = usporedi({ tipKlijenta: 'poslovni-izvan-eu' })

      expect(obvezaPdvIdentifikacijskogBroja.obvezan).toBe(false)
    })
  })

  describe('обов’язковий стан щодо системи PDV', () => {
    it('рівно на порозі вхід ще не обов’язковий, а добровільний', () => {
      const { obvezniStatus, izvorStatusa } = usporedi({ godisnjiPrimitak: eur('60000') })

      expect(obvezniStatus).toBe('izvan-sustava')
      expect(izvorStatusa.article).toBe('čl. 90.h')
    })

    it('на цент вище порога вхід обов’язковий, і причина називає обидва числа', () => {
      const { obvezniStatus, obrazlozenjeStatusa, izvorStatusa } = usporedi({
        godisnjiPrimitak: eur('60000.01'),
      })

      expect(obvezniStatus).toBe('u-sustavu')
      expect(obrazlozenjeStatusa).toContain('60 000,01')
      expect(obrazlozenjeStatusa).toContain('60 000,00')
      expect(izvorStatusa.article).toBe('čl. 90. st. 1.')
    })

    it('понад порогом попереджає, що паушал зникає, а решта режимів лишається', () => {
      // Той самий поріг забирає режим і вмикає PDV. Людина, яка дивиться на
      // картку PDV, мусить побачити обидва наслідки одразу — саму
      // недоступність паушалу рахує `pausalni-obrt.ts`, і число тут не своє.
      const { obrazlozenjeStatusa } = usporedi({ godisnjiPrimitak: eur('70000') })

      expect(obrazlozenjeStatusa).toContain('paušalni obrt')
      expect(obrazlozenjeStatusa).toContain('решта режимів')
    })

    it('поріг береться з правил, а не зашитий у рушій', () => {
      const nizakPrag: PdvPravila = {
        ...pravila,
        pragUpisa: sourced(new Decimal('20000'), pravila.pragUpisa.source),
      }

      expect(usporedi({ godisnjiPrimitak: eur('30000') }, nizakPrag).obvezniStatus).toBe(
        'u-sustavu',
      )
    })

    it('обидва стани рахуються завжди, хоч який primitak', () => {
      // Картка мусить показати обидва сценарії й нижче порога: саме там вхід
      // у систему є вибором, і саме там інверсія має шанс щось змінити.
      const nisko = usporedi({ godisnjiPrimitak: eur('10000') })

      expect([nisko.izvanSustava.status, nisko.uSustavu.status]).toEqual([
        'izvan-sustava',
        'u-sustavu',
      ])
    })
  })

  describe('джерела', () => {
    it('кожна норма набору правил справді виходить у результат', () => {
      // Норма, яку рушій узяв у контракт і нікуди не поклав, — мертва вага:
      // на картці її не видно, а вигляд має такий, ніби вона врахована.
      // Одного входу мало, бо норми взаємовиключні, тож обходимо два.
      const izvori = [
        usporedi({ tipKlijenta: 'tuzemni', godisnjeInozemneUsluge: eur('1000') }),
        usporedi({ tipKlijenta: 'poslovni-eu', godisnjiPrimitak: eur('70000') }),
      ].flatMap(({ izvanSustava, uSustavu, izvorStatusa, obvezaPdvIdentifikacijskogBroja }) =>
        [izvanSustava, uSustavu]
          .flatMap(({ izlaz, ulaz }) => [
            izlaz.izvor,
            izlaz.napomenaNaRacunu?.izvor,
            ulaz.izvorSamoobracuna,
            ulaz.izvorOdbitka,
          ])
          .concat(izvorStatusa, obvezaPdvIdentifikacijskogBroja.izvor),
      )

      const uRezultatu = new Set(izvori.map((izvor) => izvor?.article).filter(Boolean))
      const uPravilima = new Set(
        Object.values(pravila).map((norma) => ('source' in norma ? norma.source : norma).article),
      )

      expect([...uRezultatu].sort()).toEqual([...uPravilima].sort())
    })

    it('ставка без посилання на акт не компілюється', () => {
      // ADR-0002 тримається на типі, а не на домовленості: якщо `Sourced`
      // колись ослабне і голе число почне підходити, tsc повідомить про
      // невикористану директиву й білд впаде.
      const bezIzvora: PdvPravila = {
        ...pravila,
        // @ts-expect-error — ставка без посилання на акт не є Sourced<Decimal>.
        opcaStopa: new Decimal('0.25'),
      }

      expect(bezIzvora.pragUpisa.value.toFixed(2)).toBe('60000.00')
    })
  })

  describe('чистота', () => {
    it('на однакових входах дає однаковий результат і нічого не запам’ятовує', () => {
      expect(usporedi({ godisnjeInozemneUsluge: eur('7000') })).toEqual(
        usporedi({ godisnjeInozemneUsluge: eur('7000') }),
      )
    })
  })
})
