import type { PodlogaZa } from '@hr-tax/engine'
import { eur, tablicaRazreda } from '@hr-tax/engine'
import { useMemo } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Драбина розрядів цілком: кожна межа зі своїм податком і своїми внесками.
 *
 * Графік показує форму системи, картка — щабель, на якому людина стоїть.
 * Порівняти своє становище з усією драбиною ні з одного, ні з другого не
 * можна: для цього треба бачити сусідні щаблі числами.
 *
 * Числа сюди приходять із рушія готовими — компонент нічого не рахує.
 */
export const TablicaRazreda = ({
  godisnjiPrimitak,
  podlogaZa,
}: {
  /** Число, а не `Money`, з тієї самої причини, що й в обриві: інакше
      пам'ять `useMemo` не спрацьовувала б жодного разу. */
  readonly godisnjiPrimitak: number
  readonly podlogaZa: PodlogaZa
}) => {
  const { t, format } = useI18n()
  const redci = useMemo(
    () => tablicaRazreda(eur(godisnjiPrimitak), podlogaZa),
    [godisnjiPrimitak, podlogaZa],
  )

  const izvor = redci[0]?.izvor

  return (
    <section className="tablica">
      <h2>{t.tablica.naslov}</h2>
      <p className="tablica__prijevod">{t.tablica.prijevod}</p>

      <div className="tablica__okvir">
        <table className="tablica__mreza">
          <thead>
            <tr>
              {/* `razred` — канонічний хорватський термін, однаковий у кожній
                  локалі; перекладається лише пояснення поруч. */}
              <th scope="col">razred</th>
              <th scope="col">{t.tablica.granica}</th>
              <th scope="col">{t.tablica.osnovica}</th>
              <th scope="col">{t.tablica.porez}</th>
              <th scope="col">{t.tablica.doprinosi}</th>
              <th scope="col">{t.tablica.ukupno}</th>
            </tr>
          </thead>
          <tbody>
            {redci.map((redak) => (
              <tr
                key={redak.redniBroj}
                className={redak.primijenjen ? 'tablica__redak--vas' : undefined}
              >
                <th scope="row">
                  {format.number(redak.redniBroj)}
                  {redak.primijenjen && <span className="tablica__oznaka">{t.tablica.vas}</span>}
                </th>
                <td>{format.eur(redak.gornjaGranica)}</td>
                <td>{format.eur(redak.poreznaOsnovica)}</td>
                <td>{format.eur(redak.porez)}</td>
                <td>{format.eur(redak.doprinosi)}</td>
                <td>{format.eur(redak.ukupno)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {izvor !== undefined && <Izvor izvor={izvor} />}
    </section>
  )
}
