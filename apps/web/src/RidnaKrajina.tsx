import type { ExchangeRate, IsoDate } from '@hr-tax/data'
import { homeCountries, resolveExchangeRate } from '@hr-tax/data'
import type { Money } from '@hr-tax/engine'
import { useEffect, useMemo, useState } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'
import { pocetniRucniTecaj, type RucniTecaj, rucniTecajZa, uEure } from './tecaj.ts'

/**
 * Порівняння з рідною країною — секція, яку розгортають, а не постійна колонка.
 *
 * Постійна колонка нав'язувала б українську рамку тим, кого вона не стосується,
 * а сайт має лишатися придатним для будь-кого. Тут же живе застереження про
 * податкове резидентство: воно з'являється в момент, коли людина свідомо
 * відкрила порівняння, а не як черговий дисклеймер, повз який усі проходять.
 *
 * Курс приходить ланцюжком `resolveExchangeRate`: живий запит до НБУ →
 * снепшот із датою → ручне значення, що перебиває обидва. Це єдиний
 * ввід-вивід у проєкті, і він живе в ефекті, а не в рендері: розрахунок від
 * нього не залежить — до нього приходить уже готове число.
 */
export const RidnaKrajina = ({ godisnjiPrimitak }: { readonly godisnjiPrimitak: Money<'EUR'> }) => {
  const { t, format } = useI18n()
  const [otvoreno, setOtvoreno] = useState(false)
  const [rucni, setRucni] = useState<RucniTecaj>(pocetniRucniTecaj)
  const [tecaj, setTecaj] = useState<ExchangeRate | undefined>(undefined)

  const manual = useMemo(() => rucniTecajZa(rucni), [rucni])

  useEffect(() => {
    // Секція закрита — у мережу не ходимо: запит заради секції, якої не
    // видно, платить трафіком за нічого.
    if (!otvoreno) return

    let vrijedi = true
    void resolveExchangeRate({
      fetch: (url) => globalThis.fetch(url),
      ...(manual === undefined ? {} : { manual }),
    }).then((rezultat) => {
      // Відповідь, що прийшла після зміни курсу руками, мовчки відкидається:
      // інакше повільна мережа перебила б свіжіше рішення людини.
      if (vrijedi) setTecaj(rezultat)
    })

    return () => {
      vrijedi = false
    }
  }, [otvoreno, manual])

  const rezultat = useMemo(
    () =>
      tecaj === undefined
        ? undefined
        : homeCountries.UA.calculate(godisnjiPrimitak.amount.times(tecaj.value)),
    [godisnjiPrimitak, tecaj],
  )

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
              <span className="prijevod">{t.krajina.tecajPrijevod}</span>
            </label>
            <input
              id="tecaj"
              type="number"
              min={0}
              step={0.01}
              value={rucni.vrijednost}
              onChange={(event) => {
                setRucni({ ...rucni, vrijednost: event.target.value })
              }}
            />
          </p>

          <p className="polje">
            <label htmlFor="tecaj-na-dan">{t.krajina.tecajNaDan}</label>
            <input
              id="tecaj-na-dan"
              type="date"
              value={rucni.naDan}
              onChange={(event) => {
                setRucni({ ...rucni, naDan: event.target.value as IsoDate })
              }}
            />
          </p>

          {/* Яка ланка ланцюжка спрацювала і якому дню належить число.
              Снепшот піврічної давнини і живий курс НБУ — різні за
              достовірністю величини, і людина мусить бачити, яка перед нею. */}
          <p className="krajina__tecaj">
            {tecaj === undefined ? (
              t.krajina.tecajUcitavanje
            ) : (
              <>
                <strong>{format.number(tecaj.value.toNumber())}</strong>{' '}
                {t.krajina.tecajIzvor(t.krajina.tecajPodrijetlo[tecaj.origin.kind], tecaj.asOf)}
              </>
            )}
          </p>

          {rucni.vrijednost.trim() !== '' && manual === undefined && (
            <p className="razlog razlog--upozorenje">{t.krajina.tecajNeispravan}</p>
          )}

          {rezultat !== undefined && tecaj !== undefined && (
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
                <output className="glavno__iznos">{format.eur(uEure(rezultat.net, tecaj))}</output>
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
