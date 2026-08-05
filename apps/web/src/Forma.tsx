import type { JedinicaLokalneSamouprave, ParStopa } from '@hr-tax/data'
import {
  graniceStopa,
  jedinicaBySifra,
  jeOblikNkd,
  najsireGranice,
  nkdDirektorij,
  POPUST_ZA_POTPOMOGNUTA_PODRUCJA,
  PRAVILA_NEPUNE_GODINE,
  RASPON_SPOMENICKE_RENTE_PO_M2,
  searchJedinice,
  uGranicama,
} from '@hr-tax/data'
import type {
  Djelatnost,
  IzdaciPoStavkama,
  Mjesec,
  TipKlijenta,
  UzdrzavaniClanovi,
} from '@hr-tax/engine'
import { brojMjeseciDjelatnosti, eur, razdobljeZa } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Що людина знає про своє приміщення в культурному добрі.
 *
 * Окремою структурою, а не двома полями поруч: площа й місцева ставка мають
 * сенс лише разом і лише всередині культурного добра — поза ним таких чисел
 * просто немає, і саме це каже `PolozajUKulturnomDobru` в рушії. Тут вони
 * лежать «про запас», бо перемикач можна зняти й повернути, не втративши
 * набране.
 */
interface KulturnoDobro {
  readonly unutra: boolean
  readonly korisnaPovrsinaM2: number
  readonly mjesecniIznosPoM2: number
}

/** Стан форми — рівно те, що вводить людина, без похідних величин. */
export interface StanjeForme {
  readonly ostalo: number
  readonly reprezentacija: number
  readonly osobnoVozilo: number
  /** `sifra` обраної `jedinica lokalne samouprave`; порожньо — не обрано. */
  readonly sifraJedinice: string
  /**
   * Ставки, вбиті руками. `undefined` — беремо ті, що в довіднику.
   *
   * Тільки обидві разом: половина рішення одиниці, склеєна з половиною
   * старого довідника, не відповідає жодній `odluka`.
   */
  readonly rucneStope: ParStopa | undefined
  readonly uzRadniOdnos: boolean
  /** Місяць відкриття обрту; `undefined` — повний рік. */
  readonly mjesecPocetka: Mjesec | undefined
  /** Чи обрт у перших двох роках від першого впису в `Obrtni registar`. */
  readonly noviObrt: boolean
  /** Кого платник утримує — від цього залежить `osobni odbitak`. */
  readonly uzdrzavani: UzdrzavaniClanovi
  /** `NKD` (вид діяльності); порожньо — не введено. */
  readonly nkd: string
  readonly imaLokalnuTuristickuZajednicu: boolean
  readonly potpomognutoPodrucje: boolean
  readonly pretezitoProizvodna: boolean
  readonly kulturnoDobro: KulturnoDobro
  /** Звідки клієнти — від цього залежить `PDV` на вихідних рахунках. */
  readonly tipKlijenta: TipKlijenta
  /** Річна сума послуг, куплених за кордоном. */
  readonly inozemneUsluge: number
}

/**
 * Загреб як початковий вибір.
 *
 * Без обраної одиниці два з трьох режимів мовчать одразу після відкриття, і
 * порожній калькулятор читається як зламаний. Загреб — найбільша одиниця й
 * найчастіший випадок; вибір видно у полі й будь-коли змінюється.
 */
const POCETNA_JEDINICA = '1333'

export const POCETNO_STANJE: StanjeForme = {
  ostalo: 0,
  reprezentacija: 0,
  osobnoVozilo: 0,
  sifraJedinice: POCETNA_JEDINICA,
  rucneStope: undefined,
  uzRadniOdnos: false,
  mjesecPocetka: undefined,
  noviObrt: false,
  uzdrzavani: { clanoviUzeObitelji: 0, djeca: 0 },
  nkd: '',
  // Обов'язок за `čl. 4. st. 1.` виникає на території місцевої `turistička
  // zajednica`, і такі зайняли майже всю країну. Типове «ні» ховало б платіж
  // від більшості тих, кому він таки нарахується.
  imaLokalnuTuristickuZajednicu: true,
  potpomognutoPodrucje: false,
  pretezitoProizvodna: false,
  kulturnoDobro: { unutra: false, korisnaPovrsinaM2: 0, mjesecniIznosPoM2: 0.2 },
  tipKlijenta: 'poslovni-eu',
  inozemneUsluge: 0,
}

/**
 * Статті `izdatak` зі стану форми.
 *
 * Форма показує три поля з восьми статей закону навмисно: `reprezentacija` і
 * `osobno vozilo` винесені окремо, бо закон визнає їх лише наполовину
 * (`čl. 33. st. 1.`), і це та різниця, яку людина має бачити. Решта статей
 * лягає в `ostalo` — для порівняння режимів важлива сума, а не її розклад.
 *
 * Половина ріжеться від усього, що потрапило в поле авто, і це вірно рівно
 * доти, доки туди не пишуть страховку: її `čl. 33. st. 2.` виводить з-під
 * винятку й визнає повністю. Тому поле саме каже писати страховку в `ostalo` —
 * дешевше пояснити межу, ніж заводити дев'яту статтю заради одного рядка.
 */
export const izdaciIzForme = (stanje: StanjeForme): IzdaciPoStavkama => ({
  najamnina: eur(0),
  nabavkaRobe: eur(0),
  nabavkaUsluga: eur(0),
  placeRadnika: eur(0),
  troskoviBanke: eur(0),
  reprezentacija: eur(stanje.reprezentacija),
  osobnoVozilo: eur(stanje.osobnoVozilo),
  ostalo: eur(stanje.ostalo),
})

/**
 * Діяльність і місце для рушія — або `undefined`, поки `NKD` не введено.
 *
 * Код хибної форми — теж `undefined`, а не виняток: людина посеред набору
 * бачить `5`, `56.`, і жоден із цих станів не привід упасти. Код правильної
 * форми, якого немає в довіднику, навпаки, передається як є — це відповідь
 * «жоден із двох платежів не виникає», і дати її має рушій, а не форма.
 */
export const djelatnostIzForme = (stanje: StanjeForme): Djelatnost | undefined => {
  if (!jeOblikNkd(stanje.nkd)) return undefined
  const { unutra, korisnaPovrsinaM2, mjesecniIznosPoM2 } = stanje.kulturnoDobro

  return {
    nkd: stanje.nkd.trim(),
    imaLokalnuTuristickuZajednicu: stanje.imaLokalnuTuristickuZajednicu,
    potpomognutoPodrucje: stanje.potpomognutoPodrucje,
    pretezitoProizvodna: stanje.pretezitoProizvodna,
    polozaj: unutra
      ? { kind: 'u-kulturnom-dobru', korisnaPovrsinaM2, mjesecniIznosPoM2 }
      : { kind: 'izvan' },
  }
}

const MJESECI: readonly Mjesec[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const TIPOVI_KLIJENATA: readonly TipKlijenta[] = ['poslovni-eu', 'poslovni-izvan-eu', 'tuzemni']

/**
 * Ставка в базисних пунктах як відсоток.
 *
 * Довідник зберігає 20,5 % як 2050 цілим числом навмисно — джерело друкує це
 * як 0.20499999999999999, і базисні пункти рятують від дрейфу. Тут число лише
 * показується, тож поділ на 100 безпечний.
 */
const postotak = (bazniBodovi: number): string => `${(bazniBodovi / 100).toFixed(2)} %`

/** Відсоток із поля назад у базисні пункти — без дрейфу, який дає множення. */
const uBazneBodove = (postotaka: number): number => Math.round(postotaka * 100)

interface Props {
  readonly stanje: StanjeForme
  readonly onPromjena: (stanje: StanjeForme) => void
}

export const Forma = ({ stanje, onPromjena }: Props) => {
  const { t } = useI18n()
  const promijeni = (dio: Partial<StanjeForme>) => {
    onPromjena({ ...stanje, ...dio })
  }

  const novac = (
    id: string,
    oznaka: string,
    vrijednost: number,
    postavi: (n: number) => void,
    napomena?: string,
    objasnjenje?: string,
  ) => (
    <>
      <p className="polje">
        <label htmlFor={id}>
          {oznaka}
          {napomena !== undefined && <span className="prijevod">{napomena}</span>}
        </label>
        <input
          id={id}
          type="number"
          min={0}
          step={100}
          value={vrijednost}
          // Пояснення прив'язане до поля, а не просто лежить поруч: інакше той,
          // хто йде формою з екранним читачем, чує саму лише мітку.
          {...(objasnjenje === undefined ? {} : { 'aria-describedby': `${id}-opis` })}
          onChange={(event) => {
            postavi(Math.max(0, Number(event.target.value)))
          }}
        />
      </p>
      {objasnjenje !== undefined && (
        <p className="forma__primjer forma__primjer--polje" id={`${id}-opis`}>
          {objasnjenje}
        </p>
      )}
    </>
  )

  const brojOsoba = (
    id: string,
    oznaka: string,
    napomena: string,
    vrijednost: number,
    postavi: (n: number) => void,
  ) => (
    <p className="polje">
      <label htmlFor={id}>
        {oznaka}
        <span className="prijevod">{napomena}</span>
      </label>
      <input
        id={id}
        type="number"
        min={0}
        step={1}
        value={vrijednost}
        onChange={(event) => {
          postavi(Math.max(0, Math.trunc(Number(event.target.value))))
        }}
      />
    </p>
  )

  const potvrda = (
    id: string,
    oznaka: string,
    vrijednost: boolean,
    postavi: (v: boolean) => void,
    napomena?: string,
  ) => (
    <p className="polje polje--potvrda">
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={vrijednost}
          onChange={(event) => {
            postavi(event.target.checked)
          }}
        />
        {oznaka}
        {napomena !== undefined && <span className="prijevod">{napomena}</span>}
      </label>
    </p>
  )

  const [upit, setUpit] = useState('')
  const pronadene = useMemo(() => searchJedinice(upit), [upit])

  const jedinica: JedinicaLokalneSamouprave | undefined = jedinicaBySifra(stanje.sifraJedinice)
  const { rucneStope } = stanje
  const { mjesecPocetka } = stanje
  // Місяців у періоді п'ять, а не чотири, — це висновок норми, а не календаря,
  // тож і він веде до статті за один клік (ADR-0002).
  const razdoblje =
    mjesecPocetka === undefined
      ? undefined
      : brojMjeseciDjelatnosti(razdobljeZa(PRAVILA_NEPUNE_GODINE, { mjesec: mjesecPocetka }))
  const stopeIzvanGranica = rucneStope !== undefined && !uGranicama(rucneStope)
  const { niza, visa } = najsireGranice
  const { najmanje, najvise } = RASPON_SPOMENICKE_RENTE_PO_M2.value

  return (
    <section className="forma">
      <h2>{t.unos.izdaciNaslov}</h2>
      <p className="forma__prijevod">{t.unos.izdaciPrijevod}</p>
      <p className="forma__primjer">{t.unos.izdaciPrimjer}</p>

      {novac('izdatak-ostalo', t.unos.ostalo, stanje.ostalo, (ostalo) => {
        promijeni({ ostalo })
      })}
      {novac(
        'izdatak-reprezentacija',
        t.unos.reprezentacija,
        stanje.reprezentacija,
        (reprezentacija) => {
          promijeni({ reprezentacija })
        },
        t.unos.polovicno,
      )}
      {novac(
        'izdatak-vozilo',
        t.unos.osobnoVozilo,
        stanje.osobnoVozilo,
        (osobnoVozilo) => {
          promijeni({ osobnoVozilo })
        },
        t.unos.polovicno,
        t.unos.osobnoVoziloObjasnjenje,
      )}

      <h2 className="forma__podnaslov">{t.unos.uzdrzavaniNaslov}</h2>
      <p className="forma__prijevod">{t.unos.uzdrzavaniPrijevod}</p>

      {brojOsoba(
        'uzdrzavani-clanovi',
        t.unos.clanoviUzeObitelji,
        t.unos.clanoviPrijevod,
        stanje.uzdrzavani.clanoviUzeObitelji,
        (clanoviUzeObitelji) => {
          promijeni({ uzdrzavani: { ...stanje.uzdrzavani, clanoviUzeObitelji } })
        },
      )}
      {brojOsoba(
        'uzdrzavana-djeca',
        t.unos.djeca,
        t.unos.djecaPrijevod,
        stanje.uzdrzavani.djeca,
        (djeca) => {
          promijeni({ uzdrzavani: { ...stanje.uzdrzavani, djeca } })
        },
      )}

      <h2 className="forma__podnaslov">{t.unos.okolnostiNaslov}</h2>
      <p className="forma__prijevod">{t.unos.okolnostiPrijevod}</p>

      {/* Пошук над списком: одиниць 556, і гортати їх до «SVETA NEDELJA»
          неможливо. Фільтрує сам довідник — байдуже до регістру й діакритики,
          бо «Đakovo» шукають як «dakovo». */}
      <p className="polje">
        <label htmlFor="trazi-jedinicu">{t.unos.traziGrad}</label>
        <input
          id="trazi-jedinicu"
          type="text"
          value={upit}
          onChange={(event) => {
            setUpit(event.target.value)
          }}
        />
      </p>

      <p className="polje">
        <label htmlFor="jedinica">
          {t.unos.grad}
          <span className="prijevod">{t.unos.gradPrijevod}</span>
        </label>
        <select
          id="jedinica"
          value={stanje.sifraJedinice}
          onChange={(event) => {
            promijeni({ sifraJedinice: event.target.value })
          }}
        >
          <option value="">{t.unos.gradNijeOdabran}</option>
          {/* Обрана одиниця лишається в списку, навіть коли не проходить за
              фільтром: інакше поле показувало б порожньо там, де вибір є. */}
          {jedinica !== undefined && !pronadene.includes(jedinica) && (
            <option value={jedinica.sifra}>
              {jedinica.ime} — {postotak(jedinica.stope.niza)} / {postotak(jedinica.stope.visa)}
            </option>
          )}
          {pronadene.map((kandidat) => (
            <option key={kandidat.sifra} value={kandidat.sifra}>
              {kandidat.ime} — {postotak(kandidat.stope.niza)} / {postotak(kandidat.stope.visa)}
            </option>
          ))}
        </select>
      </p>
      {pronadene.length === 0 && <p className="razlog">{t.unos.gradNijeNaden(upit)}</p>}

      {potvrda(
        'rucne-stope',
        t.unos.rucneStope,
        rucneStope !== undefined,
        (ukljuceno) => {
          // Вмикаючи ручні ставки, беремо ті, що вже стоять у довіднику:
          // людина правитиме своє рішення, а не набиратиме його з нуля.
          promijeni({
            rucneStope: ukljuceno
              ? { niza: jedinica?.stope.niza ?? niza.min, visa: jedinica?.stope.visa ?? visa.min }
              : undefined,
          })
        },
        t.unos.rucneStopePrijevod,
      )}

      {rucneStope !== undefined && (
        <>
          <p className="polje">
            <label htmlFor="stopa-niza">{t.unos.nizaStopa}</label>
            <input
              id="stopa-niza"
              type="number"
              min={0}
              step={0.01}
              value={rucneStope.niza / 100}
              onChange={(event) => {
                promijeni({
                  rucneStope: { ...rucneStope, niza: uBazneBodove(Number(event.target.value)) },
                })
              }}
            />
          </p>
          <p className="polje">
            <label htmlFor="stopa-visa">{t.unos.visaStopa}</label>
            <input
              id="stopa-visa"
              type="number"
              min={0}
              step={0.01}
              value={rucneStope.visa / 100}
              onChange={(event) => {
                promijeni({
                  rucneStope: { ...rucneStope, visa: uBazneBodove(Number(event.target.value)) },
                })
              }}
            />
          </p>
          {stopeIzvanGranica && (
            <p className="razlog razlog--upozorenje">
              {t.unos.stopeIzvanGranica(
                `${postotak(niza.min)} – ${postotak(niza.max)}`,
                `${postotak(visa.min)} – ${postotak(visa.max)}`,
              )}
              <Izvor izvor={graniceStopa.source} />
            </p>
          )}
        </>
      )}

      <p className="polje">
        <label htmlFor="pocetak">
          {t.unos.pocetak}
          <span className="prijevod">{t.unos.pocetakPrijevod}</span>
        </label>
        <select
          id="pocetak"
          value={stanje.mjesecPocetka ?? ''}
          onChange={(event) => {
            const vrijednost = event.target.value
            promijeni({
              mjesecPocetka: vrijednost === '' ? undefined : (Number(vrijednost) as Mjesec),
            })
          }}
        >
          <option value="">{t.unos.punaGodina}</option>
          {MJESECI.map((mjesec) => (
            <option key={mjesec} value={mjesec}>
              {String(mjesec)}
            </option>
          ))}
        </select>
      </p>
      {razdoblje !== undefined && (
        <p className="razlog">
          {t.unos.brojMjeseci(String(razdoblje.value))}
          <Izvor izvor={razdoblje.source} />
        </p>
      )}

      {potvrda(
        'novi-obrt',
        t.unos.noviObrt,
        stanje.noviObrt,
        (noviObrt) => {
          promijeni({ noviObrt })
        },
        t.unos.noviObrtPrijevod,
      )}

      {potvrda(
        'uz-radni-odnos',
        t.unos.uzRadniOdnos,
        stanje.uzRadniOdnos,
        (uzRadniOdnos) => {
          promijeni({ uzRadniOdnos })
        },
        t.unos.uzRadniOdnosPrijevod,
      )}

      <h2 className="forma__podnaslov">{t.unos.djelatnostNaslov}</h2>
      <p className="forma__prijevod">{t.unos.djelatnostPrijevod}</p>

      <p className="polje">
        <label htmlFor="nkd">
          {t.unos.nkd}
          <span className="prijevod">{t.unos.nkdPrijevod}</span>
        </label>
        <input
          id="nkd"
          type="text"
          inputMode="decimal"
          list="nkd-popis"
          value={stanje.nkd}
          onChange={(event) => {
            promijeni({ nkd: event.target.value })
          }}
        />
        {/* Підказка, а не закритий список: `NKD 2025` знає п'ятизначні
            підкласи, яких закон не друкує, і 47.111 має право дійти до
            рушія — там його зведе до 47 правило найточнішого збігу. */}
        <datalist id="nkd-popis">
          {nkdDirektorij.map((stavka) => (
            <option key={stavka.sifra} value={stavka.sifra}>
              {stavka.naziv}
            </option>
          ))}
        </datalist>
      </p>
      {stanje.nkd.trim() !== '' && !jeOblikNkd(stanje.nkd) && (
        <p className="razlog razlog--upozorenje">{t.unos.nkdNeispravan}</p>
      )}
      <p className="forma__primjer">{t.unos.nkdOpseg(String(nkdDirektorij.length))}</p>

      {potvrda(
        'turisticka-zajednica',
        t.unos.turistickaZajednica,
        stanje.imaLokalnuTuristickuZajednicu,
        (imaLokalnuTuristickuZajednicu) => {
          promijeni({ imaLokalnuTuristickuZajednicu })
        },
        t.unos.turistickaZajednicaPrijevod,
      )}
      {potvrda(
        'potpomognuto-podrucje',
        t.unos.potpomognutoPodrucje,
        stanje.potpomognutoPodrucje,
        (potpomognutoPodrucje) => {
          promijeni({ potpomognutoPodrucje })
        },
        t.unos.potpomognutoPrijevod(POPUST_ZA_POTPOMOGNUTA_PODRUCJA.value),
      )}
      <p className="polje__izvor">
        <Izvor izvor={POPUST_ZA_POTPOMOGNUTA_PODRUCJA.source} />
      </p>
      {potvrda(
        'pretezito-proizvodna',
        t.unos.pretezitoProizvodna,
        stanje.pretezitoProizvodna,
        (pretezitoProizvodna) => {
          promijeni({ pretezitoProizvodna })
        },
        t.unos.pretezitoProizvodnaPrijevod,
      )}
      {potvrda('kulturno-dobro', t.unos.uKulturnomDobru, stanje.kulturnoDobro.unutra, (unutra) => {
        promijeni({ kulturnoDobro: { ...stanje.kulturnoDobro, unutra } })
      })}

      {stanje.kulturnoDobro.unutra && (
        <>
          <p className="polje">
            <label htmlFor="korisna-povrsina">{t.unos.korisnaPovrsina}</label>
            <input
              id="korisna-povrsina"
              type="number"
              min={0}
              step={1}
              value={stanje.kulturnoDobro.korisnaPovrsinaM2}
              onChange={(event) => {
                promijeni({
                  kulturnoDobro: {
                    ...stanje.kulturnoDobro,
                    korisnaPovrsinaM2: Math.max(0, Number(event.target.value)),
                  },
                })
              }}
            />
          </p>
          <p className="polje">
            <label htmlFor="iznos-po-m2">
              {t.unos.iznosPoM2}
              <span className="prijevod">{t.unos.iznosPoM2Prijevod(najmanje, najvise)}</span>
              <Izvor izvor={RASPON_SPOMENICKE_RENTE_PO_M2.source} />
            </label>
            <input
              id="iznos-po-m2"
              type="number"
              min={Number(najmanje)}
              max={Number(najvise)}
              step={0.01}
              value={stanje.kulturnoDobro.mjesecniIznosPoM2}
              onChange={(event) => {
                // Затиск у законний діапазон, а не виняток: `čl. 116. st. 4.`
                // дозволяє лише його, і рушій на числі поза ним падає.
                const uneseno = Number(event.target.value)
                promijeni({
                  kulturnoDobro: {
                    ...stanje.kulturnoDobro,
                    mjesecniIznosPoM2: Math.min(
                      Number(najvise),
                      Math.max(Number(najmanje), Number.isFinite(uneseno) ? uneseno : 0),
                    ),
                  },
                })
              }}
            />
          </p>
        </>
      )}

      <h2 className="forma__podnaslov">PDV</h2>
      <p className="forma__prijevod">{t.pdv.tipKlijentaPrijevod}</p>

      <p className="polje">
        <label htmlFor="tip-klijenta">{t.pdv.tipKlijenta}</label>
        <select
          id="tip-klijenta"
          value={stanje.tipKlijenta}
          onChange={(event) => {
            promijeni({ tipKlijenta: event.target.value as TipKlijenta })
          }}
        >
          {TIPOVI_KLIJENATA.map((tip) => (
            <option key={tip} value={tip}>
              {t.pdv.klijenti[tip]}
            </option>
          ))}
        </select>
      </p>

      {novac(
        'inozemne-usluge',
        t.pdv.inozemneUsluge,
        stanje.inozemneUsluge,
        (inozemneUsluge) => {
          promijeni({ inozemneUsluge })
        },
        t.pdv.inozemneUslugePrijevod,
      )}
    </section>
  )
}
