import { placa2026, pretpostavke2026, ruleset2026 } from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import { eur, type Money, subtract, toCentString } from './money.ts'
import { BEZ_UZDRZAVANIH } from './obrt-na-dohodak.ts'
import { izracunajPlacu, type UlazPlace } from './placa.ts'
import type { Podloga } from './types.ts'

const podloga: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

/**
 * Рівні ставки замість справжніх ставок міста.
 *
 * 20 % і 30 % не з довідника — вони обрані так, щоб кожен крок розрахунку
 * можна було перевірити в голові. Тест, який звіряє число з тим самим кодом,
 * що його породив, не доводить нічого; тест, у якому арифметику видно, —
 * доводить.
 */
const STOPE = { niza: 2000, visa: 3000 } as const

/** Найнижча `osnovica` трудового відношення: 1 993 × 0,38 = 757,34. */
const najnizaOsnovica = {
  mjesecniIznos: eur('757.34'),
  izvor: placa2026.koeficijentNajnizeOsnovice.source,
}

const ulaz = (dopune: Partial<UlazPlace> = {}): UlazPlace => ({
  mjesecnaBrutoPlaca: eur(2000),
  stope: STOPE,
  uzdrzavani: BEZ_UZDRZAVANIH,
  dob: undefined,
  najnizaOsnovica,
  vlastitiPoslodavac: false,
  neoporeziviPrimici: eur(0),
  prvoZaposlenje: false,
  umanjenjeZaPodrucje: false,
  povratnik: false,
  ...dopune,
})

const izracunaj = (dopune: Partial<UlazPlace> = {}) =>
  izracunajPlacu(ulaz(dopune), podloga, placa2026)

/** Коди застережень цього розрахунку — без сум, бо тут перевіряється склад. */
const kodovi = (dopune: Partial<UlazPlace> = {}) =>
  izracunaj(dopune).napomene.map((napomena) => napomena.kod)

describe('plaća', () => {
  describe('дві сторони внеску', () => {
    it('утримує з плаће лише MO, а ZO залишає роботодавцю', () => {
      const { doprinosi } = izracunaj()

      // 2 000 × 15 % × 12 = 3 600; 2 000 × 5 % × 12 = 1 200.
      expect(toCentString(doprinosi.moPrviStup.godisnjiIznos)).toBe('3600.00')
      expect(toCentString(doprinosi.moDrugiStup.godisnjiIznos)).toBe('1200.00')
      // 2 000 × 16,5 % × 12 = 3 960 — понад плаћу, а не з неї.
      expect(toCentString(doprinosi.zo.godisnjiIznos)).toBe('3960.00')

      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('8760.00')
      expect(toCentString(doprinosi.ukupnoGodisnjeNaTeretOsobe)).toBe('4800.00')
    })

    it('позначає ZO як не свою кишеню, а обидва MO — як свою', () => {
      const { doprinosi } = izracunaj()

      expect(doprinosi.moPrviStup.teretiOsobu).toBe(true)
      expect(doprinosi.moDrugiStup.teretiOsobu).toBe(true)
      // Саме ця відповідь відрізняє найм від усього, що було в калькуляторі
      // до нього: ті гроші людині не належали ніколи.
      expect(doprinosi.zo.teretiOsobu).toBe(false)
    })

    it('у власній фірмі ZO стає своєю кишенею, не змінюючи ані ставки, ані суми', () => {
      const tudja = izracunaj()
      const vlastita = izracunaj({ vlastitiPoslodavac: true })

      // Та сама сума, та сама стаття — інша відповідь на питання, чиї це гроші.
      expect(toCentString(vlastita.doprinosi.zo.godisnjiIznos)).toBe(
        toCentString(tudja.doprinosi.zo.godisnjiIznos),
      )
      expect(vlastita.doprinosi.zo.teretiOsobu).toBe(true)
      expect(toCentString(vlastita.doprinosi.ukupnoGodisnjeNaTeretOsobe)).toBe('8760.00')

      // «На руки» з самої плаће при цьому не змінюється: ZO як не утримували
      // з плаће, так і не утримують — він лише зменшує dobit у сусідньому
      // розрахунку.
      expect(toCentString(vlastita.godisnjiNeto)).toBe(toCentString(tudja.godisnjiNeto))
    })

    it('вартість для роботодавця — це брутто разом із внеском понад неї', () => {
      // 24 000 + 3 960. Саме це число робить порівняння з обртом чесним:
      // клієнт обрту платить 24 000, роботодавець найманого — 27 960.
      expect(toCentString(izracunaj().trosakZaPoslodavca)).toBe('27960.00')
    })
  })

  describe('податок', () => {
    it('рахує помісячно: брутто без утриманих внесків і без osobni odbitak', () => {
      const { porez } = izracunaj()

      // (2 000 − 400 − 600) × 12 = 12 000 бази на рік.
      expect(toCentString(porez.poreznaOsnovica)).toBe('12000.00')
      // Уся база нижча за місячний поріг 5 000, тож усе за нижчою: 12 000 × 20 %.
      expect(toCentString(porez.godisnjiIznos)).toBe('2400.00')
    })

    it('вища ставка вмикається на місячному порозі, а не на річному', () => {
      // 6 000 брутто: внески 1 200, odbitak 600 → база 4 200 < 5 000, усе
      // за нижчою, хоч річна база 50 400 давно за річним порогом 60 000 не є.
      expect(toCentString(izracunaj({ mjesecnaBrutoPlaca: eur(6000) }).porez.godisnjiIznos)).toBe(
        '10080.00',
      )

      // 7 000: внески 1 400, odbitak 600 → база 5 000, рівно на порозі —
      // вища ставка ще не діє.
      expect(toCentString(izracunaj({ mjesecnaBrutoPlaca: eur(7000) }).porez.godisnjiIznos)).toBe(
        '12000.00',
      )

      // 8 000: внески 1 600, odbitak 600 → база 5 800. 5 000 × 20 % +
      // 800 × 30 % = 1 240 на місяць.
      expect(toCentString(izracunaj({ mjesecnaBrutoPlaca: eur(8000) }).porez.godisnjiIznos)).toBe(
        '14880.00',
      )
    })

    it('утриманці збільшують osobni odbitak і зменшують базу', () => {
      // Подружжя (0,5) і одна дитина (0,5) → 600 × 2 = 1 200 на місяць.
      const { porez } = izracunaj({
        uzdrzavani: { ...BEZ_UZDRZAVANIH, clanoviUzeObitelji: 1, djeca: 1 },
      })

      expect(toCentString(porez.poreznaOsnovica)).toBe('4800.00')
      expect(toCentString(porez.godisnjiIznos)).toBe('960.00')
    })

    it('база не буває від’ємною, і податку з неї немає', () => {
      // 600 брутто: внески 151,468 (з підлоги 757,34), odbitak 600 — база
      // пішла б у мінус, а від’ємного податку не буває.
      const { porez } = izracunaj({ mjesecnaBrutoPlaca: eur(600) })

      expect(toCentString(porez.poreznaOsnovica)).toBe('0.00')
      expect(toCentString(porez.godisnjiIznos)).toBe('0.00')
    })
  })

  describe('olakšica za mlade', () => {
    it('до двадцяти п’яти повертає весь податок, порахований нижчою ставкою', () => {
      const { olaksicaZaMlade, godisnjiNeto } = izracunaj({ dob: 25 })

      expect(olaksicaZaMlade?.udio.toString()).toBe('1')
      expect(toCentString(olaksicaZaMlade?.iznos ?? eur(0))).toBe('2400.00')
      // 24 000 − 4 800 внесків − 2 400 податку + 2 400 повернення.
      expect(toCentString(godisnjiNeto)).toBe('19200.00')
    })

    it('від двадцяти шести до тридцяти повертає половину', () => {
      const { olaksicaZaMlade, godisnjiNeto } = izracunaj({ dob: 30 })

      expect(toCentString(olaksicaZaMlade?.iznos ?? eur(0))).toBe('1200.00')
      expect(toCentString(godisnjiNeto)).toBe('18000.00')
    })

    it('понад тридцять пільги немає — і це відсутність, а не нуль', () => {
      // Нуль на картці не відрізнити від пільги в нуль євро для того, хто
      // податку взагалі не платить.
      expect(izracunaj({ dob: 31 }).olaksicaZaMlade).toBeUndefined()
      expect(toCentString(izracunaj({ dob: 31 }).godisnjiNeto)).toBe('16800.00')
    })

    it('межі щаблів включні: 25 дає повну, 26 — половину', () => {
      // Закон дає пільгу «za cijelo porezno razdoblje u kojem obveznik
      // navršava određenu godinu života», тож той, кому цього року
      // виповнюється 25, ще в першому щаблі, а 26 — уже в другому.
      expect(izracunaj({ dob: 24 }).olaksicaZaMlade?.udio.toString()).toBe('1')
      expect(izracunaj({ dob: 25 }).olaksicaZaMlade?.udio.toString()).toBe('1')
      expect(izracunaj({ dob: 26 }).olaksicaZaMlade?.udio.toString()).toBe('0.5')
      expect(izracunaj({ dob: 30 }).olaksicaZaMlade?.udio.toString()).toBe('0.5')
      expect(izracunaj({ dob: 31 }).olaksicaZaMlade).toBeUndefined()
    })

    it('без введеного віку пільга не рахується взагалі', () => {
      // Припустити «понад тридцять» означало б тихо забрати пільгу в того,
      // кому вона належить.
      expect(izracunaj({ dob: undefined }).olaksicaZaMlade).toBeUndefined()
    })

    it('не повертає ту частину податку, яку нараховано вищою ставкою', () => {
      // 8 000 брутто: 12 000 за нижчою + 2 880 за вищою = 14 880 податку.
      // Двадцятип’ятирічному повертається лише перша частина.
      const { olaksicaZaMlade, porez } = izracunaj({ mjesecnaBrutoPlaca: eur(8000), dob: 25 })

      expect(toCentString(porez.godisnjiIznos)).toBe('14880.00')
      expect(toCentString(olaksicaZaMlade?.iznos ?? eur(0))).toBe('12000.00')
    })

    it('податок лишається податком: повернення не зменшує ані суми, ані ставки', () => {
      // Гроші повертаються — ставка ні. Сховати це означало б показати меншу
      // ставку, ніж застосував закон.
      const bezOlaksice = izracunaj()
      const zOlaksicom = izracunaj({ dob: 25 })

      expect(toCentString(zOlaksicom.porez.godisnjiIznos)).toBe(
        toCentString(bezOlaksice.porez.godisnjiIznos),
      )
      expect(zOlaksicom.porez.stopa.toString()).toBe(bezOlaksice.porez.stopa.toString())
    })
  })

  describe('законна підлога бази', () => {
    it('піднімає базу внесків, не чіпаючи самої плаће', () => {
      // 600 брутто — законна робота на пів ставки. Внески закон однаково
      // нарахує з 757,34, а плаћа лишається 600.
      const { doprinosi, mjesecnaOsnovicaDoprinosa, godisnjaBrutoPlaca } = izracunaj({
        mjesecnaBrutoPlaca: eur(600),
      })

      expect(toCentString(mjesecnaOsnovicaDoprinosa)).toBe('757.34')
      expect(toCentString(godisnjaBrutoPlaca)).toBe('7200.00')
      // MO I: (757,34 − 300 знижки) × 15 % × 12 = 823,212.
      // MO II: 757,34 × 5 % × 12 = 454,404 — знижка сюди не доходить.
      expect(toCentString(doprinosi.ukupnoGodisnjeNaTeretOsobe)).toBe('1277.62')
    })

    it('вища плаћа підлоги не помічає', () => {
      expect(toCentString(izracunaj().mjesecnaOsnovicaDoprinosa)).toBe('2000.00')
    })
  })

  describe('umanjenje osnovice за čl. 21.a', () => {
    /** Сама знижка, а не її наслідок: підлога бази інакше плутається під ногами. */
    const umanjenje = (mjesecnaBrutoPlaca: Money<'EUR'>): string => {
      const napomena = izracunaj({ mjesecnaBrutoPlaca }).napomene.find(
        (n) => n.kod === 'umanjena-osnovica-prvog-stupa',
      )
      return napomena === undefined ? 'немає' : toCentString(napomena.umanjenje)
    }

    it('до 700 € знижка стала — 300 €, скільки б плаћа не падала', () => {
      expect(umanjenje(eur(700))).toBe('300.00')
      expect(umanjenje(eur(400))).toBe('300.00')
    })

    it('між 700 і 1 300 спадає вдвічі повільніше за плаћу', () => {
      // 1 000 €: знижка 0,5 × (1 300 − 1 000) = 150.
      // MO I: (1 000 − 150) × 15 % × 12 = 1 530.
      const { doprinosi } = izracunaj({ mjesecnaBrutoPlaca: eur(1000) })

      expect(toCentString(doprinosi.moPrviStup.godisnjiIznos)).toBe('1530.00')
    })

    it('на 1 300 € знижка гасне, і жодного стрибка через межу немає', () => {
      // 0,5 × (1 300 − 1 300) = 0 — межа зроблена так, щоб платіж на ній був
      // неперервним. Стрибок тут означав би обрив, і його треба було б
      // показувати окремо, як обриви розрядів у паушалі.
      const naGranici = izracunaj({ mjesecnaBrutoPlaca: eur(1300) })
      const iznadGranice = izracunaj({ mjesecnaBrutoPlaca: eur('1300.01') })

      expect(toCentString(naGranici.doprinosi.moPrviStup.godisnjiIznos)).toBe('2340.00')
      expect(toCentString(iznadGranice.doprinosi.moPrviStup.godisnjiIznos)).toBe('2340.02')
    })

    it('знижує базу лише MO I. stup — не II. stup і не ZO', () => {
      // Головна пастка правила. 1 000 €: якби знижка діяла на всі три, MO II
      // дав би 510 замість 600, а ZO — 1 683 замість 1 980.
      const { doprinosi } = izracunaj({ mjesecnaBrutoPlaca: eur(1000) })

      expect(toCentString(doprinosi.moDrugiStup.godisnjiIznos)).toBe('600.00')
      expect(toCentString(doprinosi.zo.godisnjiIznos)).toBe('1980.00')
    })

    it('поріг міряється по фактичній плаћі, а не по піднятій базі', () => {
      // 600 € плаће: база піднята до 757,34 законною підлогою, але знижку
      // закон дає за плаћею — і дає повні 300, а не 0,5 × (1 300 − 757,34).
      const { doprinosi } = izracunaj({ mjesecnaBrutoPlaca: eur(600) })

      // (757,34 − 300) × 15 % × 12 = 823,212.
      expect(toCentString(doprinosi.moPrviStup.godisnjiIznos)).toBe('823.21')
    })

    it('на високих зарплатах знижки немає взагалі', () => {
      // 2 000 × 15 % × 12 = 3 600 — рівно стільки, скільки без правила.
      expect(toCentString(izracunaj().doprinosi.moPrviStup.godisnjiIznos)).toBe('3600.00')
      expect(izracunaj().napomene.map((n) => n.kod)).not.toContain('umanjena-osnovica-prvog-stupa')
    })

    it('пояснює знижку, бо в рядку картки «база × ставка» більше не сходиться', () => {
      expect(izracunaj({ mjesecnaBrutoPlaca: eur(1000) }).napomene.map((n) => n.kod)).toContain(
        'umanjena-osnovica-prvog-stupa',
      )
      // Ставка лишається законною, хоч база й менша: закон знизив базу, а не ставку.
      expect(
        izracunaj({ mjesecnaBrutoPlaca: eur(1000) }).doprinosi.moPrviStup.stopa.toString(),
      ).toBe('0.15')
    })
  })

  describe('застереження', () => {
    it('завжди каже, що неоподатковувані виплати не враховані', () => {
      expect(kodovi()).toContain('neoporezivi-primici-nisu-uracunati')
    })

    it('нижче за мінімальну каже про неповний робочий час, а не про порушення', () => {
      expect(kodovi({ mjesecnaBrutoPlaca: eur(600) })).toContain('ispod-minimalne-place')
      expect(kodovi({ mjesecnaBrutoPlaca: eur(1050) })).not.toContain('ispod-minimalne-place')
    })

    it('каже, коли закон підняв базу вище за задану плаћу', () => {
      expect(kodovi({ mjesecnaBrutoPlaca: eur(600) })).toContain(
        'placa-podignuta-na-najnizu-osnovicu',
      )
      expect(kodovi()).not.toContain('placa-podignuta-na-najnizu-osnovicu')
    })

    it('про вісь слайдера мовчить: цього припущення модуль не робив', () => {
      // Прирівнювання введеного числа до брутто-плаће робить режим, а не цей
      // модуль — він дістав місячну плаћу й нічого не припускав.
      expect(kodovi()).not.toContain('bruto-placa-nije-primitak')
    })

    it('називає пільгу застереженням, бо гроші надійдуть наступного року', () => {
      expect(kodovi({ dob: 25 })).toContain('olaksica-za-mlade-kao-povrat')
      expect(kodovi()).not.toContain('olaksica-za-mlade-kao-povrat')
    })
  })

  describe('osobni odbitak за інвалідністю', () => {
    it('коефіцієнт 0,3 додається до основного відрахунку', () => {
      // Відрахунок 600 × (1 + 0,3) = 780. База 2 000 − 400 внесків − 780 = 820,
      // податок 164 на місяць проти 200 без інвалідності.
      const { porez } = izracunaj({ uzdrzavani: { ...BEZ_UZDRZAVANIH, sInvaliditetom: 1 } })

      expect(toCentString(porez.godisnjiIznos)).toBe('1968.00')
    })

    it('100 % інвалідність дає коефіцієнт 1,0, а не 0,3', () => {
      // 600 × (1 + 1,0) = 1 200 відрахунку; база 400, податок 80 на місяць.
      const { porez } = izracunaj({ uzdrzavani: { ...BEZ_UZDRZAVANIH, sPotpunimInvaliditetom: 1 } })

      expect(toCentString(porez.godisnjiIznos)).toBe('960.00')
    })

    it('рахує кожну особу окремо, а не факт наявності', () => {
      // Двоє дітей з інвалідністю — це 0,6, а не 0,3: акт дає коефіцієнт
      // «на кожну утримувану дитину», і схлопнути їх в один означало б
      // забрати відрахунок у другої.
      // 4 000 брутто, а не типові 2 000: із двома дітьми відрахунок і так
      // майже з'їдає базу, і на 2 000 другий коефіцієнт упирався б у нуль —
      // тест міряв би обмеження бази, а не другий коефіцієнт.
      const jedno = izracunaj({
        mjesecnaBrutoPlaca: eur(4000),
        uzdrzavani: { ...BEZ_UZDRZAVANIH, djeca: 2, sInvaliditetom: 1 },
      })
      const oboje = izracunaj({
        mjesecnaBrutoPlaca: eur(4000),
        uzdrzavani: { ...BEZ_UZDRZAVANIH, djeca: 2, sInvaliditetom: 2 },
      })

      // 0,3 × 600 × 12 × 20 % = 432 різниці податку за другу особу.
      expect(toCentString(subtract(jedno.porez.godisnjiIznos, oboje.porez.godisnjiIznos))).toBe(
        '432.00',
      )
    })
  })

  describe('prvo zaposlenje', () => {
    it('знімає ZO цілком, лишаючи обидва стовпи MO', () => {
      const { doprinosi } = izracunaj({ prvoZaposlenje: true })

      expect(toCentString(doprinosi.zo.godisnjiIznos)).toBe('0.00')
      // MO обох стовпів — 20 % від 24 000 — лишаються недоторканими.
      expect(toCentString(doprinosi.ukupnoGodisnje)).toBe('4800.00')
    })

    it('здешевлює плаћу роботодавцю рівно на ZO', () => {
      // 24 000 × 16,5 % = 3 960 — саме стільки роботодавець не платить.
      const bez = izracunaj()
      const zPravom = izracunaj({ prvoZaposlenje: true })

      expect(toCentString(subtract(bez.trosakZaPoslodavca, zPravom.trosakZaPoslodavca))).toBe(
        '3960.00',
      )
    })

    it('на «на руки» не впливає ані на цент', () => {
      // ZO ніколи не був грошима працівника, тож звільнення від нього не може
      // додати йому нічого. Якби це число рушило — знак, що ZO десь відняли
      // від плаће, якої він не торкався.
      expect(toCentString(izracunaj({ prvoZaposlenje: true }).godisnjiNeto)).toBe(
        toCentString(izracunaj().godisnjiNeto),
      )
    })

    it('називає застереженням суму, якої роботодавець не заплатив', () => {
      const napomena = izracunaj({ prvoZaposlenje: true }).napomene.find(
        (n) => n.kod === 'oslobodenje-za-prvo-zaposlenje',
      )

      expect(napomena === undefined ? 'немає' : toCentString(napomena.usteda)).toBe('3960.00')
      expect(kodovi()).not.toContain('oslobodenje-za-prvo-zaposlenje')
    })
  })

  describe('umanjenje za područje — čl. 46. st. 1.', () => {
    it('знімає половину річного податку мешканцеві I. skupine', () => {
      const { umanjenjeZaPodrucje, godisnjiNeto } = izracunaj({ umanjenjeZaPodrucje: true })

      expect(toCentString(umanjenjeZaPodrucje?.iznos ?? eur(0))).toBe('1200.00')
      // 24 000 − 4 800 внесків − 2 400 податку + 1 200 повернення.
      expect(toCentString(godisnjiNeto)).toBe('18000.00')
    })

    it('рахується від усього податку, а не лише від частини за нижчою ставкою', () => {
      // 8 000 брутто: 12 000 за нижчою + 2 880 за вищою = 14 880 податку.
      // Половина від усього — 7 440, а не 6 000.
      const { umanjenjeZaPodrucje } = izracunaj({
        mjesecnaBrutoPlaca: eur(8000),
        umanjenjeZaPodrucje: true,
      })

      expect(toCentString(umanjenjeZaPodrucje?.iznos ?? eur(0))).toBe('7440.00')
    })

    it('застосовується після молодіжного, як вимагає st. 7.', () => {
      // 8 000 брутто, 25 років: молодіжне забирає 12 000 за нижчою ставкою,
      // і половина береться вже від залишку — 0,5 × 2 880 = 1 440.
      // Зворотний порядок дав би 7 440 + 3 720 і завищив повернення вдвічі.
      const { olaksicaZaMlade, umanjenjeZaPodrucje, ukupniPovrat } = izracunaj({
        mjesecnaBrutoPlaca: eur(8000),
        dob: 25,
        umanjenjeZaPodrucje: true,
      })

      expect(toCentString(olaksicaZaMlade?.iznos ?? eur(0))).toBe('12000.00')
      expect(toCentString(umanjenjeZaPodrucje?.iznos ?? eur(0))).toBe('1440.00')
      expect(toCentString(ukupniPovrat)).toBe('13440.00')
    })
  })

  describe('umanjenje za povratnika — čl. 46. st. 3.', () => {
    it('повертає весь податок із плаће, а не частину за нижчою ставкою', () => {
      const { umanjenjeZaPovratnika, ukupniPovrat } = izracunaj({
        mjesecnaBrutoPlaca: eur(8000),
        povratnik: true,
      })

      expect(toCentString(umanjenjeZaPovratnika?.iznos ?? eur(0))).toBe('14880.00')
      expect(toCentString(ukupniPovrat)).toBe('14880.00')
    })

    it('виключає обидва інші зменшення, а не додається до них', () => {
      // `st. 9.` каже прямо: це зменшення виключає st. 1. і st. 2. Тому
      // навіть двадцятип'ятирічний мешканець Вуковара отримує одне, а не три.
      const izracun = izracunaj({ povratnik: true, dob: 25, umanjenjeZaPodrucje: true })

      expect(izracun.olaksicaZaMlade).toBeUndefined()
      expect(izracun.umanjenjeZaPodrucje).toBeUndefined()
      expect(toCentString(izracun.ukupniPovrat)).toBe('2400.00')
    })
  })

  describe('neoporezivi primici', () => {
    it('додаються і в «на руки», і у вартість для роботодавця — однаково', () => {
      const bez = izracunaj()
      const z = izracunaj({ neoporeziviPrimici: eur(1200) })

      expect(toCentString(subtract(z.godisnjiNeto, bez.godisnjiNeto))).toBe('1200.00')
      expect(toCentString(subtract(z.trosakZaPoslodavca, bez.trosakZaPoslodavca))).toBe('1200.00')
    })

    it('у жодну базу не входять: ні в податок, ні у внески', () => {
      const z = izracunaj({ neoporeziviPrimici: eur(1200) })
      const bez = izracunaj()

      expect(toCentString(z.porez.godisnjiIznos)).toBe(toCentString(bez.porez.godisnjiIznos))
      expect(toCentString(z.doprinosi.ukupnoGodisnje)).toBe(
        toCentString(bez.doprinosi.ukupnoGodisnje),
      )
      expect(toCentString(z.mjesecnaOsnovicaDoprinosa)).toBe(
        toCentString(bez.mjesecnaOsnovicaDoprinosa),
      )
    })

    it('нуль і введена сума кажуть різне, але кажуть обидва', () => {
      // Мовчати про стелі не можна: закон їх таки дає, і людина, яка бачить
      // нуль, має знати, скільки могла б просити.
      expect(kodovi()).toContain('neoporezivi-primici-nisu-uracunati')
      expect(kodovi({ neoporeziviPrimici: eur(1200) })).toContain('neoporezivi-primici-uracunati')
      expect(kodovi({ neoporeziviPrimici: eur(1200) })).not.toContain(
        'neoporezivi-primici-nisu-uracunati',
      )
    })
  })
})
