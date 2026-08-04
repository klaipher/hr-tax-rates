import { homeCountries, NBU_EUR_UAH_SNAPSHOT } from '@hr-tax/data'
import type { Money } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Порівняння з рідною країною — секція, яку розгортають, а не постійна колонка.
 *
 * Постійна колонка нав'язувала б українську рамку тим, кого вона не стосується,
 * а сайт має лишатися придатним для будь-кого. Тут же живе застереження про
 * податкове резидентство: воно з'являється в момент, коли людина свідомо
 * відкрила порівняння, а не як черговий дисклеймер, повз який усі проходять.
 */
export const RidnaKrajina = ({ godisnjiPrimitak }: { readonly godisnjiPrimitak: Money<'EUR'> }) => {
  const { t, format } = useI18n()
  const [otvoreno, setOtvoreno] = useState(false)
  const [tecaj, setTecaj] = useState(NBU_EUR_UAH_SNAPSHOT.value.toString())

  const rezultat = useMemo(() => {
    const rate = Number(tecaj)
    if (!Number.isFinite(rate) || rate <= 0) return undefined
    return homeCountries.UA.calculate(godisnjiPrimitak.amount.times(rate))
  }, [godisnjiPrimitak, tecaj])

  return (
    <section className="krajina">
      <button
        type="button"
        className="krajina__prekidac"
        aria-expanded={otvoreno}
        onClick={() => {
          setOtvoreno(!otvoreno)
        }}
      >
        {t.krajina.naslov}
      </button>

      {otvoreno && (
        <div className="krajina__sadrzaj">
          <p className="krajina__rezidentnost">{t.krajina.rezidentnost}</p>

          <p className="polje">
            <label htmlFor="tecaj">
              {t.krajina.tecaj}
              <span className="prijevod">{t.krajina.tecajIzvor(NBU_EUR_UAH_SNAPSHOT.asOf)}</span>
            </label>
            <input
              id="tecaj"
              type="number"
              min={1}
              step={0.01}
              value={tecaj}
              onChange={(event) => {
                setTecaj(event.target.value)
              }}
            />
          </p>

          {rezultat === undefined ? (
            <p className="razlog">{t.krajina.tecajNeispravan}</p>
          ) : (
            <>
              <dl className="rozbivka">
                {rezultat.charges.map((charge) => (
                  <div className="redak" key={charge.id}>
                    <dt>
                      <span className="redak__naziv">{charge.id}</span>
                      {charge.references.map((izvor) => (
                        <Izvor key={izvor.article} izvor={izvor} />
                      ))}
                    </dt>
                    <dd>{format.uah({ currency: 'UAH', amount: charge.annual })}</dd>
                  </div>
                ))}
                <div className="redak redak--zbroj">
                  <dt>
                    <span className="redak__naziv">{t.krajina.ukupno}</span>
                  </dt>
                  <dd>{format.uah({ currency: 'UAH', amount: rezultat.totalCharges })}</dd>
                </div>
              </dl>

              <p className="glavno">
                <output className="glavno__iznos">
                  {format.eur({
                    currency: 'EUR',
                    amount: rezultat.net.div(Number(tecaj)),
                  })}
                </output>
                <span className="glavno__oznaka">{t.krajina.ostaje}</span>
              </p>

              {rezultat.breaches.map((breach) => (
                <p className="razlog" key={breach.id}>
                  {t.krajina.prekoracenje(breach.limit.toFixed(2), breach.excess.toFixed(2))}
                  {breach.references.map((izvor) => (
                    <Izvor key={izvor.article} izvor={izvor} />
                  ))}
                </p>
              ))}
            </>
          )}
        </div>
      )}
    </section>
  )
}
