import { buildPaymentSchedule, DEADLINES } from '@hr-tax/data'
import type { Izracun } from '@hr-tax/engine'
import { useMemo } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Коли і скільки платити протягом року.
 *
 * Річна сума нічого не каже про кеш: `paušalni porez` іде квартальними
 * авансами, `doprinosi` — щомісяця, а доплата за річним звітом настає вже
 * наступного року. Саме вона стає несподіванкою для тих, хто планував лише
 * поточний.
 *
 * Аванси будуються для фактичного розряду — стійкий стан. Розбіжність між
 * очікуваним і фактичним розрядом протягом року не моделюється: вона
 * вимагала б ще одного входу, «а що ви планували в січні».
 */
export const Kalendar = ({
  izracun,
  godina,
}: {
  readonly izracun: Izracun
  readonly godina: number
}) => {
  const { t, format } = useI18n()

  const rate = useMemo(() => {
    const komorski = izracun.obveznaDavanja.find(
      (davanje) => davanje.status === 'obračunato' && davanje.naziv.hr === 'komorski doprinos',
    )

    return buildPaymentSchedule(godina, [
      { obligation: 'paušalni porez', annualAmount: izracun.ukupanPorez.amount },
      {
        obligation: 'doprinosi (paušalni obrt)',
        annualAmount: izracun.doprinosi.ukupnoGodisnje.amount,
      },
      ...(komorski?.status === 'obračunato'
        ? [
            {
              obligation: 'komorski doprinos' as const,
              annualAmount: komorski.godisnjiIznos.amount,
            },
          ]
        : []),
    ])
  }, [izracun, godina])

  return (
    <section className="kalendar">
      <h2>{t.kalendar.naslov}</h2>
      <p className="forma__prijevod">{t.kalendar.prijevod}</p>

      <ol className="kalendar__popis">
        {rate.map((obrok) => {
          const rok = obrok.postponedTo ?? obrok.dueOn
          const datum = `${String(rok.day).padStart(2, '0')}.${String(rok.month).padStart(2, '0')}.${String(rok.year)}`

          return (
            <li className="kalendar__obrok" key={`${obrok.obligation}-${datum}`}>
              <span className="kalendar__datum">{datum}</span>
              <span className="kalendar__vrsta">
                {obrok.obligation}
                <Izvor izvor={DEADLINES[obrok.obligation].source} />
              </span>
              <span className="kalendar__iznos">
                {format.eur({ currency: 'EUR', amount: obrok.amount })}
              </span>
              {obrok.postponedTo !== undefined && (
                <span className="prijevod">{t.kalendar.pomaknuto}</span>
              )}
            </li>
          )
        })}
      </ol>
    </section>
  )
}
