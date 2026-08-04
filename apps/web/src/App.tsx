import { pretpostavke2026, ruleset2026 } from '@hr-tax/data'
import type { Podloga } from '@hr-tax/engine'
import { eur, formatEur, usporediRezime } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { RezimKartica } from './RezimKartica.tsx'

const PODLOGA: Podloga = { ruleset: ruleset2026, pretpostavke: pretpostavke2026 }

/** Трохи вище за поріг паушалу — щоб було видно, де режим закінчується. */
const NAJVISI_PRIMITAK = 70_000
const KORAK = 100
const POCETNI_PRIMITAK = 20_000

export const App = () => {
  const [godisnjiPrimitak, setGodisnjiPrimitak] = useState(POCETNI_PRIMITAK)

  const usporedba = useMemo(
    () => usporediRezime({ godisnjiPrimitak: eur(godisnjiPrimitak) }, PODLOGA),
    [godisnjiPrimitak],
  )

  const { prosjecnaPlaca } = PODLOGA.pretpostavke

  return (
    <main className="stranica">
      <header className="zaglavlje">
        <h1>Податкові режими Хорватії</h1>
        <p>Один річний primitak — усі режими одразу, з посиланням на статтю за кожним числом.</p>
      </header>

      <section className="unos">
        <label htmlFor="primitak">
          Річний primitak
          <span className="prijevod">надходження від діяльності за касовим методом</span>
        </label>
        <output className="unos__iznos" htmlFor="primitak">
          {formatEur(eur(godisnjiPrimitak))}
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
          <span>{formatEur(eur(0))}</span>
          <span>{formatEur(eur(NAJVISI_PRIMITAK))}</span>
        </p>
      </section>

      <section className="rezimi">
        {usporedba.rezimi.map((rezim) => (
          <RezimKartica key={rezim.id} rezim={rezim} />
        ))}
      </section>

      <footer className="pretpostavke">
        <h2>Припущення</h2>
        <p>
          Правила чинні на {usporedba.godina} рік. Внески рахуються з prosječna plaća{' '}
          <strong>{formatEur(eur(prosjecnaPlaca.value))}</strong> — цю величину закон не встановлює,
          а лише на неї посилається, тому вона лежить окремим шаром від правил і може бути
          перевизначена.
        </p>
        <p>
          <a
            className="izvor"
            href={prosjecnaPlaca.source.url}
            target="_blank"
            rel="noreferrer"
            title={`звірено ${prosjecnaPlaca.source.checkedOn}`}
          >
            {prosjecnaPlaca.source.publisher}, {prosjecnaPlaca.source.period} (
            {prosjecnaPlaca.source.publication})
          </a>
        </p>
      </footer>
    </main>
  )
}
