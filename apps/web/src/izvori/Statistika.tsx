import type { Pretpostavke } from '@hr-tax/data'
import { eur, formatEur } from '@hr-tax/engine'
import { Znak, Zvireno } from './Potpis.tsx'
import { Poveznica } from './Poveznica.tsx'
import { tekst } from './tekst.ts'

/**
 * Шар `pretpostavke` (припущення / assumptions) і його джерела.
 *
 * Окрема секція, а не рядок у переліку актів: за цими величинами стоїть
 * публікація статистики, а не стаття закону, і статус у них свій —
 * опубліковано чи прогноз (ADR-0001). Змішати їх з правом означало б
 * видати прогноз за норму.
 */
export const Statistika = ({ pretpostavke }: { readonly pretpostavke: Pretpostavke }) => {
  const { value, source } = pretpostavke.prosjecnaPlaca

  // Секція документує величини, з якими застосунок постачається, а не те, що
  // людина вбила в поле: у вбитого руками числа джерела немає, а без джерела
  // тут нічого показувати. Сюди приходить `PODLOGA`, тож гілка не спрацьовує —
  // але тип змушує назвати випадок, а не змовчати про нього.
  if (source.status === 'rucno') return null

  return (
    <section className="izvori-statistika" aria-labelledby="izvori-statistika-naslov">
      <h3 id="izvori-statistika-naslov">{tekst.pretpostavke.naslov}</h3>
      <p className="izvori-opis">{tekst.pretpostavke.opis}</p>

      <div className="izvori-norma">
        <div className="izvori-norma__zaglavlje">
          <p className="izvori-norma__naziv">
            {tekst.pretpostavke.hr} <span className="izvori-prijevod">{tekst.pretpostavke.uk}</span>
          </p>
          <p className="izvori-norma__vrijednost">
            {formatEur(eur(value))}{' '}
            <span className="izvori-prijevod">{tekst.pretpostavke.mjesecno}</span>
          </p>
        </div>

        <dl className="izvori-polja">
          <div className="izvori-polja__redak">
            <dt>{tekst.pretpostavke.razdoblje}</dt>
            <dd>{source.period}</dd>
          </div>
          <div className="izvori-polja__redak">
            <dt>{tekst.pretpostavke.publikacija}</dt>
            <dd>{source.publication}</dd>
          </div>
        </dl>

        <p className="izvori-potpis">
          <Poveznica url={source.url} naziv={`${source.publisher}, ${source.publication}`}>
            {source.publisher}
          </Poveznica>
          <Znak
            natpis={tekst.pretpostavke.statusi[source.status]}
            izgled={source.status === 'forecast' ? 'nacrt' : 'na-snazi'}
          />
          <Zvireno datum={source.checkedOn} />
        </p>
      </div>
    </section>
  )
}
