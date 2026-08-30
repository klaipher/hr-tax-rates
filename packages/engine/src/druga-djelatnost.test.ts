import {
  drugaDjelatnost2026,
  KOMORSKI_DOPRINOS_U_SNAZI,
  placa2026,
  plavaKarta2026,
  pretpostavke2026,
  ruleset2026,
} from '@hr-tax/data'
import { describe, expect, it } from 'vitest'
import {
  izracunajDrugaDjelatnost,
  type PodlogaDrugeDjelatnosti,
  type UlazDrugeDjelatnosti,
} from './druga-djelatnost.ts'
import { add, eur, subtract, toCentString } from './money.ts'
import { BEZ_UZDRZAVANIH } from './obrt-na-dohodak.ts'

/**
 * Паушальний обрт поряд із роботою за наймом.
 *
 * Тести стоять на трьох питаннях, які й породили модуль: чи не змішалися бази
 * двох джерел, чи справді обрт рахується за ставками другої діяльності, і чи
 * підсумок складається лише з тих грошей, які людині належали.
 */

const podloga: PodlogaDrugeDjelatnosti = {
  ruleset: ruleset2026,
  pretpostavke: pretpostavke2026,
  placa: placa2026,
  drugaDjelatnost: drugaDjelatnost2026,
  plavaKarta: plavaKarta2026,
  komorskiDoprinos: KOMORSKI_DOPRINOS_U_SNAZI,
}

/** Ставки Загреба: 23 % і 33 % у базисних пунктах. */
const STOPE_ZAGREB = { niza: 2300, visa: 3300 } as const

const ulaz = (nadopuna: Partial<UlazDrugeDjelatnosti> = {}): UlazDrugeDjelatnosti => ({
  godisnjaBrutoPlaca: eur(42000),
  godisnjiPrimitakObrta: eur(20_000),
  stope: STOPE_ZAGREB,
  uzdrzavani: BEZ_UZDRZAVANIH,
  dob: undefined,
  noviObrt: false,
  ...nadopuna,
})

const izracunati = (nadopuna: Partial<UlazDrugeDjelatnosti> = {}) => {
  const ishod = izracunajDrugaDjelatnost(ulaz(nadopuna), podloga)
  if (ishod.status !== 'izracunato') {
    throw new Error(`Очікувався розрахунок, а прийшло «${ishod.razlog.kod}»`)
  }
  return ishod.izracun
}

describe('izracunajDrugaDjelatnost', () => {
  describe('бази двох джерел не змішуються', () => {
    it('розряд вибирає лише `primitak` обрту — plaća в нього не входить', () => {
      // Plaća 3 500 €/міс — це 42 000 € на рік. Якби вона потрапила в базу
      // розряду, `primitak` 20 000 € дав би 62 000 € і виніс би за поріг.
      const mala = izracunati({ godisnjaBrutoPlaca: eur(12000) })
      const velika = izracunati({ godisnjaBrutoPlaca: eur(60000) })

      expect(velika.obrt.razred.redniBroj).toBe(mala.obrt.razred.redniBroj)
      expect(toCentString(velika.obrt.odbijeno)).toBe(toCentString(mala.obrt.odbijeno))
    })

    it('`primitak` обрту не рухає податку з plaća', () => {
      const mali = izracunati({ godisnjiPrimitakObrta: eur(5000) })
      const veliki = izracunati({ godisnjiPrimitakObrta: eur(55_000) })

      expect(toCentString(veliki.placa.odbijeno)).toBe(toCentString(mali.placa.odbijeno))
    })

    it('утриманці зменшують податок із plaća і не чіпають обрту', () => {
      const bez = izracunati()
      const zDvoma = izracunati({ uzdrzavani: { ...BEZ_UZDRZAVANIH, djeca: 2 } })

      expect(zDvoma.placa.odbijeno.amount.lessThan(bez.placa.odbijeno.amount)).toBe(true)
      expect(toCentString(zDvoma.obrt.odbijeno)).toBe(toCentString(bez.obrt.odbijeno))
    })
  })

  describe('обрт рахується за правилами другої діяльності', () => {
    it('база внесків — `paušalni dohodak` розряду, а не `primitak`', () => {
      const izracun = izracunati()

      expect(toCentString(izracun.obrt.doprinosi.godisnjaOsnovica)).toBe(
        toCentString(izracun.obrt.porez.poreznaOsnovica),
      )
    })

    it('ставки 7,5 / 2,5 / 7,5 — разом 17,5 %, а не 36,5 %', () => {
      const { doprinosi } = izracunati().obrt
      const zbrojStopa = doprinosi.moPrviStup.stopa
        .plus(doprinosi.moDrugiStup.stopa)
        .plus(doprinosi.zo.stopa)

      expect(zbrojStopa.toFixed(3)).toBe('0.175')
    })

    it('стелі базі немає: `čl. 186. st. 5.` не називає паушальної бази', () => {
      expect(izracunati().obrt.doprinosi.gornjaGranica).toBeUndefined()
    })

    it('`ZO` нараховується вдруге — при тому, що роботодавець уже платить свій', () => {
      const izracun = izracunati()

      expect(izracun.obrt.doprinosi.zo.godisnjiIznos.amount.isPositive()).toBe(true)
      expect(izracun.placa.doprinosi.zo.godisnjiIznos.amount.isPositive()).toBe(true)
    })
  })

  describe('`komorski doprinos`', () => {
    it('нарахований обрту старшому за два роки — 136,80 € на рік', () => {
      const { komorskiDoprinos } = izracunati({ noviObrt: false }).obrt

      expect(komorskiDoprinos.status).toBe('obračunato')
      if (komorskiDoprinos.status !== 'obračunato') return
      expect(toCentString(komorskiDoprinos.godisnjiIznos)).toBe('136.80')
    })

    it('новий обрт звільнений — і це названа причина, а не нуль', () => {
      const { komorskiDoprinos } = izracunati({ noviObrt: true }).obrt

      expect(komorskiDoprinos.status).toBe('ne-primjenjuje-se')
      if (komorskiDoprinos.status !== 'ne-primjenjuje-se') return
      expect(komorskiDoprinos.razlog.kod).toBe('novootvoreni-obrt')
    })

    it('різниця між новим і старим обртом — рівно 136,80 €', () => {
      const novi = izracunati({ noviObrt: true }).obrt
      const stari = izracunati({ noviObrt: false }).obrt

      expect(toCentString(subtract(stari.odbijeno, novi.odbijeno))).toBe('136.80')
    })
  })

  describe('підсумок', () => {
    it('складається рівно з двох сторін', () => {
      const izracun = izracunati()

      expect(toCentString(izracun.ukupnoNeto)).toBe(
        toCentString(add(izracun.placa.neto, izracun.obrt.neto)),
      )
      expect(toCentString(izracun.ukupnoOdbijeno)).toBe(
        toCentString(add(izracun.placa.odbijeno, izracun.obrt.odbijeno)),
      )
    })

    it('`odbijeno` і `neto` кожної сторони дають її базу', () => {
      const { placa, obrt } = izracunati()

      expect(toCentString(add(placa.neto, placa.odbijeno))).toBe(toCentString(placa.baza))
      expect(toCentString(add(obrt.neto, obrt.odbijeno))).toBe(toCentString(obrt.baza))
    })

    it('`ZO` роботодавця не входить у віддане, але входить у вартість для нього', () => {
      const izracun = izracunati()
      const naTeretPoslodavca = izracun.placa.doprinosi.ukupnoGodisnje.amount.minus(
        izracun.placa.doprinosi.ukupnoGodisnjeNaTeretOsobe.amount,
      )

      expect(naTeretPoslodavca.isPositive()).toBe(true)
      // Віддане з plaća — це податок за відрахуванням повернення плюс лише ті
      // внески, що виходять із кишені людини (ADR-0005).
      expect(toCentString(izracun.placa.odbijeno)).toBe(
        izracun.placa.porez.godisnjiIznos.amount
          .minus(izracun.placa.povrat.amount)
          .plus(izracun.placa.doprinosi.ukupnoGodisnjeNaTeretOsobe.amount)
          .toFixed(2),
      )
      expect(toCentString(izracun.trosakZaPoslodavca)).toBe(
        izracun.placa.baza.amount.plus(naTeretPoslodavca).toFixed(2),
      )
    })

    it('ефективна ставка кожного джерела рахується від його власної бази', () => {
      const { placa, obrt, ukupnaEfektivnaStopa } = izracunati()

      expect(placa.efektivnaStopa?.toFixed(6)).toBe(
        placa.odbijeno.amount.div(placa.baza.amount).toFixed(6),
      )
      expect(obrt.efektivnaStopa?.toFixed(6)).toBe(
        obrt.odbijeno.amount.div(obrt.baza.amount).toFixed(6),
      )
      // Ставка на все — не середнє двох, а віддане до суми обох баз.
      expect(ukupnaEfektivnaStopa?.toFixed(6)).toBe(
        placa.odbijeno.amount
          .plus(obrt.odbijeno.amount)
          .div(placa.baza.amount.plus(obrt.baza.amount))
          .toFixed(6),
      )
    })
  })

  describe('недоступність', () => {
    it('`primitak` понад поріг паушалу — названа причина з порогом і статтею', () => {
      const ishod = izracunajDrugaDjelatnost(ulaz({ godisnjiPrimitakObrta: eur(60_001) }), podloga)

      expect(ishod.status).toBe('nedostupno')
      if (ishod.status !== 'nedostupno') return
      expect(ishod.razlog.kod).toBe('iznad-praga-pausala')
      if (ishod.razlog.kod !== 'iznad-praga-pausala') return
      expect(toCentString(ishod.razlog.prag)).toBe('60000.00')
      expect(ishod.razlog.izvor.article).toBeTruthy()
    })

    it('рівно на порозі режим ще доступний', () => {
      expect(
        izracunajDrugaDjelatnost(ulaz({ godisnjiPrimitakObrta: eur(60_000) }), podloga).status,
      ).toBe('izracunato')
    })

    it('без обраної одиниці податок із plaća не вигадується', () => {
      const ishod = izracunajDrugaDjelatnost(ulaz({ stope: undefined }), podloga)

      expect(ishod.status).toBe('nedostupno')
      if (ishod.status !== 'nedostupno') return
      expect(ishod.razlog.kod).toBe('nema-jedinice')
    })
  })

  describe('застереження', () => {
    it('про повний рік — завжди', () => {
      expect(izracunati().napomene.some((n) => n.kod === 'racun-za-punu-godinu')).toBe(true)
    })

    it('про неврахованi платежі, залежні від діяльності, — поіменно', () => {
      const napomena = izracunati().napomene.find(
        (n) => n.kod === 'davanja-ovisna-o-djelatnosti-nisu-uracunata',
      )

      expect(napomena).toBeDefined()
      if (napomena?.kod !== 'davanja-ovisna-o-djelatnosti-nisu-uracunata') return
      expect(napomena.stavke.map((s) => s.naziv.hr)).toContain('turistička članarina')
      expect(napomena.stavke.every((s) => s.izvor.act.length > 0)).toBe(true)
    })

    it('поріг `EU plava karta` — 1,5 × середня за повний попередній рік', () => {
      // 42 000 € на рік — це 3 500 € на місяць, тобто вище за поріг.
      const izracun = izracunati({ godisnjaBrutoPlaca: eur(42000) })

      expect(izracun.pragPlaveKarte).toBeDefined()
      // 2 016,00 × 1,5 = 3 024,00
      expect(toCentString(izracun.pragPlaveKarte?.mjesecniPrag ?? eur(0))).toBe('3024.00')
      expect(izracun.pragPlaveKarte?.dosegnut).toBe(true)
    })

    it('поріг не досягнуто — рядок лишається, лише з іншою відповіддю', () => {
      // 30 000 € на рік — це 2 500 € на місяць, тобто нижче за 3 024 €.
      const izracun = izracunati({ godisnjaBrutoPlaca: eur(30000) })

      expect(izracun.pragPlaveKarte?.dosegnut).toBe(false)
    })
  })
})

describe('обрт, який коштує більше, ніж приносить', () => {
  const izracunati = (godisnjiPrimitakObrta: number) => {
    const ishod = izracunajDrugaDjelatnost(
      {
        godisnjaBrutoPlaca: eur(38400),
        godisnjiPrimitakObrta: eur(godisnjiPrimitakObrta),
        stope: { niza: 2300, visa: 3300 },
        uzdrzavani: BEZ_UZDRZAVANIH,
        dob: undefined,
        noviObrt: false,
      },
      podloga,
    )
    if (ishod.status !== 'izracunato') throw new Error(ishod.razlog.kod)
    return ishod.izracun
  }

  it('нульовий `primitak` не звільняє від першого розряду', () => {
    const { obrt } = izracunati(0)

    // База задана розрядом, а не заробленим: податок є навіть тоді, коли
    // грошей не було взагалі.
    expect(obrt.razred.redniBroj).toBe(1)
    expect(obrt.porez.godisnjiIznos.amount.isPositive()).toBe(true)
    expect(obrt.neto.amount.isNegative()).toBe(true)
  })

  it('нестача названа застереженням, а не лишена самим мінусом', () => {
    const izracun = izracunati(0)
    const napomena = izracun.napomene.find((n) => n.kod === 'obrt-kosta-vise-nego-donosi')

    expect(napomena).toBeDefined()
    if (napomena?.kod !== 'obrt-kosta-vise-nego-donosi') return
    // Нестача — це рівно те, на скільки «лишається» пішло в мінус.
    expect(toCentString(napomena.manjak)).toBe(izracun.obrt.neto.amount.abs().toFixed(2))
  })

  it('на робочому `primitak` застереження не з’являється', () => {
    expect(izracunati(20_000).napomene.some((n) => n.kod === 'obrt-kosta-vise-nego-donosi')).toBe(
      false,
    )
  })
})

describe('річна plaća зводиться до місячної', () => {
  const zaPlacu = (godisnja: number) => {
    const ishod = izracunajDrugaDjelatnost(ulaz({ godisnjaBrutoPlaca: eur(godisnja) }), podloga)
    if (ishod.status !== 'izracunato') throw new Error(ishod.razlog.kod)
    return ishod.izracun
  }

  it('дванадцята частина року — і це названо припущенням, а не фактом', () => {
    expect(toCentString(zaPlacu(42_000).placa.mjesecnaBrutoPlaca)).toBe('3500.00')
  })

  it('річна база повертається тією самою, а не зведеною через ділення', () => {
    // 40 000 / 12 не має скінченного десяткового запису. Якби ділення йшло
    // через `number`, множення назад дало б 39 999,99…, і база всього
    // розрахунку розійшлася б із введеним числом.
    expect(toCentString(zaPlacu(40_000).placa.baza)).toBe('40000.00')
  })

  it('поріг картки порівнюється з місячною, а не з річною', () => {
    // 3 024 € × 12 = 36 288 € на рік — саме там межа.
    expect(zaPlacu(36_288).pragPlaveKarte?.dosegnut).toBe(true)
    expect(zaPlacu(36_000).pragPlaveKarte?.dosegnut).toBe(false)
  })
})

describe('прогресія податку з plaća', () => {
  const zaPlacu = (godisnja: number) => {
    const ishod = izracunajDrugaDjelatnost(ulaz({ godisnjaBrutoPlaca: eur(godisnja) }), podloga)
    if (ishod.status !== 'izracunato') throw new Error(ishod.razlog.kod)
    return ishod.izracun.placa.raspodjelaPoStopama
  }

  it('дві смуги дають рівно той податок, що стоїть у рядку', () => {
    const ishod = izracunajDrugaDjelatnost(ulaz({ godisnjaBrutoPlaca: eur(96_000) }), podloga)
    if (ishod.status !== 'izracunato') throw new Error(ishod.razlog.kod)
    const { niza, visa } = ishod.izracun.placa.raspodjelaPoStopama

    expect(toCentString(add(niza.iznos, visa.iznos))).toBe(
      toCentString(ishod.izracun.placa.porez.godisnjiIznos),
    )
  })

  it('обидві частини бази складаються в саму базу', () => {
    const r = zaPlacu(96_000)

    expect(toCentString(add(r.niza.osnovica, r.visa.osnovica))).toBe(
      toCentString(r.poreznaOsnovica),
    )
  })

  it('поріг місячний, тож на малій plaća вища ставка не спрацьовує зовсім', () => {
    const r = zaPlacu(24_000)

    expect(toCentString(r.visa.osnovica)).toBe('0.00')
    expect(toCentString(r.visa.iznos)).toBe('0.00')
  })

  it('ставки — саме ті, що в обраної одиниці', () => {
    const r = zaPlacu(96_000)

    // Ставки Загреба з фікстури входу: 23 % і 33 %.
    expect(r.niza.stopa.times(100).toFixed(0)).toBe('23')
    expect(r.visa.stopa.times(100).toFixed(0)).toBe('33')
  })

  it('`osobni odbitak` у базу не входить', () => {
    const bez = zaPlacu(48_000)
    const zDvoma = (() => {
      const ishod = izracunajDrugaDjelatnost(
        ulaz({ godisnjaBrutoPlaca: eur(48_000), uzdrzavani: { ...BEZ_UZDRZAVANIH, djeca: 2 } }),
        podloga,
      )
      if (ishod.status !== 'izracunato') throw new Error(ishod.razlog.kod)
      return ishod.izracun.placa.raspodjelaPoStopama
    })()

    // Більший відрахунок — менша база рівно на ту саму суму.
    expect(toCentString(add(zDvoma.poreznaOsnovica, zDvoma.osobniOdbitak))).toBe(
      toCentString(add(bez.poreznaOsnovica, bez.osobniOdbitak)),
    )
    expect(zDvoma.osobniOdbitak.amount.greaterThan(bez.osobniOdbitak.amount)).toBe(true)
  })
})

describe('місячне середнє', () => {
  const izracunati = () => {
    const ishod = izracunajDrugaDjelatnost(ulaz(), podloga)
    if (ishod.status !== 'izracunato') throw new Error(ishod.razlog.kod)
    return ishod.izracun
  }

  it('дванадцята частина річного «лишається» — на кожному джерелі й на підсумку', () => {
    const { placa, obrt, ukupnoNeto, ukupnoMjesecniNeto } = izracunati()

    expect(toCentString(placa.mjesecniNeto)).toBe(placa.neto.amount.div(12).toFixed(2))
    expect(toCentString(obrt.mjesecniNeto)).toBe(obrt.neto.amount.div(12).toFixed(2))
    expect(toCentString(ukupnoMjesecniNeto)).toBe(ukupnoNeto.amount.div(12).toFixed(2))
  })

  it('підсумкове місячне — не сума двох округлених, а округлення суми', () => {
    const { placa, obrt, ukupnoMjesecniNeto } = izracunati()
    const zbrojOkruglenih = placa.mjesecniNeto.amount.plus(obrt.mjesecniNeto.amount)

    // Обидва шляхи мають зійтися до цента: інакше рядки на екрані не
    // складалися б у підсумок під ними, і винен був би не закон, а порядок
    // округлення.
    expect(ukupnoMjesecniNeto.amount.minus(zbrojOkruglenih).abs().lessThanOrEqualTo('0.01')).toBe(
      true,
    )
  })
})

describe('економія від паралельності', () => {
  const zaPrimitak = (primitak: number) => {
    const ishod = izracunajDrugaDjelatnost(ulaz({ godisnjiPrimitakObrta: eur(primitak) }), podloga)
    if (ishod.status !== 'izracunato') throw new Error(ishod.razlog.kod)
    return ishod.izracun.obrt
  }

  it('це різниця між тим, що було б без найму, і тим, що вийшло з ним', () => {
    const { doprinosi, ustedaOdRadnogOdnosa } = zaPrimitak(20_000)

    expect(toCentString(ustedaOdRadnogOdnosa.usteda)).toBe(
      toCentString(subtract(ustedaOdRadnogOdnosa.bezRadnogOdnosa, doprinosi.ukupnoGodisnje)),
    )
  })

  it('число «без найму» не залежить від заробленого — воно фіксоване', () => {
    // Саме тому воно й дорівнює 3 491,74 € на будь-якому `primitak`: база
    // звичайного паушалу стоїть на `prosječna plaća`, а не на доході.
    for (const primitak of [0, 12_000, 20_000, 60_000]) {
      expect(toCentString(zaPrimitak(primitak).ustedaOdRadnogOdnosa.bezRadnogOdnosa)).toBe(
        '3491.74',
      )
    }
  })

  it('виграш тим більший, чим менший `primitak`', () => {
    const mali = zaPrimitak(12_000).ustedaOdRadnogOdnosa.usteda
    const veliki = zaPrimitak(60_000).ustedaOdRadnogOdnosa.usteda

    expect(mali.amount.greaterThan(veliki.amount)).toBe(true)
  })

  it('додатний навіть на найвищому розряді — інакше «економія» була б неправдою', () => {
    expect(zaPrimitak(60_000).ustedaOdRadnogOdnosa.usteda.amount.isPositive()).toBe(true)
  })
})
