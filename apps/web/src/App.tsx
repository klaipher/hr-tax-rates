import {
  jedinicaBySifra,
  pretpostavkeNajave2027,
  resolveStope,
  rulesetNajave2027,
} from '@hr-tax/data'
import { eur, usporediRezime } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { Forma, izdaciIzForme, POCETNO_STANJE } from './Forma.tsx'
import { GrafOpterecenja } from './graf/GrafOpterecenja.tsx'
import { IzvorStatistike } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'
import { LanguageSwitcher } from './i18n/LanguageSwitcher.tsx'
import { Prijevod } from './i18n/Prijevod.tsx'
import { Izvori } from './izvori/index.ts'
import { PODLOGA } from './podloga.ts'
import { RezimKartica } from './RezimKartica.tsx'

/**
 * Два сценарії на графіку: чинний закон і заплановані зміни.
 *
 * `podlogaZa` — функція, а не готова `Podloga`, бо в проєкті `priznati
 * izdatak` і `koeficijent` різні по розрядах, а тип правил тримає по одному
 * скаляру, як і чинний закон. Розряд вибирається з `primitak` — так само, як
 * його вибирає рушій.
 */
const SCENARIJI = [
  {
    id: 'na-snazi',
    naziv: 'чинний закон',
    status: 'in-force',
    podlogaZa: () => PODLOGA,
  },
  {
    id: 'najava',
    naziv: 'заплановані зміни',
    status: 'draft',
    podlogaZa: (primitak: ReturnType<typeof eur>) => ({
      ruleset: rulesetNajave2027(primitak.amount),
      pretpostavke: pretpostavkeNajave2027,
    }),
  },
] as const

/** Трохи вище за поріг паушалу — щоб було видно, де режим закінчується. */
const NAJVISI_PRIMITAK = 70_000
const KORAK = 100
const POCETNI_PRIMITAK = 20_000

/** Термін, що стоїть власним елементом, канонічно хорватський у кожній локалі. */
const PROSJECNA_PLACA = 'prosječna plaća'

export const App = () => {
  const { t, format } = useI18n()
  const [godisnjiPrimitak, setGodisnjiPrimitak] = useState(POCETNI_PRIMITAK)
  const [forma, setForma] = useState(POCETNO_STANJE)

  const usporedba = useMemo(() => {
    const jedinica = jedinicaBySifra(forma.sifraJedinice)
    return usporediRezime(
      {
        godisnjiPrimitak: eur(godisnjiPrimitak),
        godisnjiIzdaci: izdaciIzForme(forma),
        // Ставки бере довідник; місто не обране — режимів із porez na dohodak
        // просто немає, і вони самі кажуть, чого бракує.
        ...(jedinica === undefined ? {} : { stope: resolveStope({ jedinica }) }),
        ...(forma.mjesecPocetka === undefined ? {} : { pocetak: { mjesec: forma.mjesecPocetka } }),
        uzRadniOdnos: forma.uzRadniOdnos,
      },
      PODLOGA,
    )
  }, [godisnjiPrimitak, forma])

  const { prosjecnaPlaca } = PODLOGA.pretpostavke

  return (
    <main className="stranica">
      <header className="zaglavlje">
        <div className="zaglavlje__tekst">
          <h1>{t.zaglavlje.naslov}</h1>
          <p>{t.zaglavlje.podnaslov}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <section className="unos">
        <label htmlFor="primitak">
          {t.unos.oznaka}
          <span className="prijevod">{t.unos.prijevod}</span>
        </label>
        <output className="unos__iznos" htmlFor="primitak">
          {format.eur(eur(godisnjiPrimitak))}
        </output>
        <input
          id="primitak"
          type="range"
          min={0}
          max={NAJVISI_PRIMITAK}
          step={KORAK}
          value={godisnjiPrimitak}
          onChange={(event) => setGodisnjiPrimitak(Number(event.target.value))}
        />
        <p className="unos__skala">
          <span>{format.eur(eur(0))}</span>
          <span>{format.eur(eur(NAJVISI_PRIMITAK))}</span>
        </p>
      </section>

      <Forma stanje={forma} onPromjena={setForma} />

      <section className="rezimi">
        {usporedba.rezimi.map((rezim) => (
          <RezimKartica key={rezim.id} rezim={rezim} />
        ))}
      </section>

      <GrafOpterecenja
        scenariji={SCENARIJI}
        godisnjiPrimitak={godisnjiPrimitak}
        najvisiPrimitak={NAJVISI_PRIMITAK}
        onOdabir={setGodisnjiPrimitak}
      />

      <Izvori podloga={PODLOGA} />

      <footer className="pretpostavke">
        <h2>{t.pretpostavke.naslov}</h2>
        {/* Рік — мітка, а не величина: групувати його розряди не можна, тож
            він і не проходить через форматувальник чисел. */}
        <p>{t.pretpostavke.godina(String(usporedba.godina))}</p>
        <p className="pretpostavke__velicina">
          <span className="pojam">{PROSJECNA_PLACA}</span>
          <Prijevod pojam={PROSJECNA_PLACA} />
          <strong>{format.eur(eur(prosjecnaPlaca.value))}</strong>
        </p>
        <p>{t.pretpostavke.objasnjenje}</p>
        <p>
          <IzvorStatistike izvor={prosjecnaPlaca.source} />
        </p>
      </footer>
    </main>
  )
}
