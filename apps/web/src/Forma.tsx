import { sveJedinice } from '@hr-tax/data'
import { eur, type IzdaciPoStavkama, type Mjesec } from '@hr-tax/engine'
import { useI18n } from './i18n/context.tsx'

/** Стан форми — рівно те, що вводить людина, без похідних величин. */
export interface StanjeForme {
  readonly ostalo: number
  readonly reprezentacija: number
  readonly osobnoVozilo: number
  /** `sifra` обраної `jedinica lokalne samouprave`; порожньо — не обрано. */
  readonly sifraJedinice: string
  readonly uzRadniOdnos: boolean
  /** Місяць відкриття обрту; `undefined` — повний рік. */
  readonly mjesecPocetka: Mjesec | undefined
}

export const POCETNO_STANJE: StanjeForme = {
  ostalo: 0,
  reprezentacija: 0,
  osobnoVozilo: 0,
  sifraJedinice: '',
  uzRadniOdnos: false,
  mjesecPocetka: undefined,
}

/**
 * Статті `izdatak` зі стану форми.
 *
 * Форма показує три поля з восьми статей закону навмисно: `reprezentacija` і
 * `osobno vozilo` винесені окремо, бо закон визнає їх лише наполовину
 * (`čl. 33. st. 1.`), і це та різниця, яку людина має бачити. Решта статей
 * лягає в `ostalo` — для порівняння режимів важлива сума, а не її розклад.
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

const MJESECI: readonly Mjesec[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/**
 * Ставка в базисних пунктах як відсоток.
 *
 * Довідник зберігає 20,5 % як 2050 цілим числом навмисно — джерело друкує це
 * як 0.20499999999999999, і базисні пункти рятують від дрейфу. Тут число лише
 * показується, тож поділ на 100 безпечний.
 */
const postotak = (bazniBodovi: number): string => `${(bazniBodovi / 100).toFixed(2)} %`

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
  ) => (
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
        onChange={(event) => {
          postavi(Math.max(0, Number(event.target.value)))
        }}
      />
    </p>
  )

  return (
    <section className="forma">
      <h2>{t.unos.izdaciNaslov}</h2>
      <p className="forma__prijevod">{t.unos.izdaciPrijevod}</p>

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
      )}

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
          {sveJedinice.value.map((jedinica) => (
            <option key={jedinica.sifra} value={jedinica.sifra}>
              {jedinica.ime} — {postotak(jedinica.stope.niza)} / {postotak(jedinica.stope.visa)}
            </option>
          ))}
        </select>
      </p>

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

      <p className="polje polje--potvrda">
        <label htmlFor="uz-radni-odnos">
          <input
            id="uz-radni-odnos"
            type="checkbox"
            checked={stanje.uzRadniOdnos}
            onChange={(event) => {
              promijeni({ uzRadniOdnos: event.target.checked })
            }}
          />
          {t.unos.uzRadniOdnos}
          <span className="prijevod">{t.unos.uzRadniOdnosPrijevod}</span>
        </label>
      </p>
    </section>
  )
}
