import { type AnnualObligation, buildPaymentSchedule, DEADLINES } from '@hr-tax/data'
import type { Rezim } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Коли і скільки платити протягом року.
 *
 * Річна сума нічого не каже про кеш: податок іде авансами, `doprinosi` —
 * щомісяця, `komorski doprinos` — щокварталу наперед, а доплата за річним
 * звітом настає вже наступного року. Саме вона стає несподіванкою для тих,
 * хто планував лише поточний.
 *
 * Строки різні не лише за видом платежу, а й за режимом: `Zakon o doprinosima`
 * розводить режими по главах, і `obrt na dobit` платить внески в останній день
 * місяця, а не 15-го. Тому види обов'язків приходять із розрахунку, а не
 * вгадуються тут.
 *
 * Аванси будуються для фактичного розряду — стійкий стан. Розбіжність між
 * очікуваним і фактичним розрядом протягом року не моделюється: вона
 * вимагала б ще одного входу, «а що ви планували в січні».
 */
export const Kalendar = ({
  rezimi,
  godina,
}: {
  readonly rezimi: readonly Rezim[]
  readonly godina: number
}) => {
  const { t, format } = useI18n()

  const dostupni = rezimi.filter((rezim) => rezim.ishod.status === 'izracunato')
  const [odabrani, setOdabrani] = useState(dostupni[0]?.id)

  const rezim = dostupni.find((r) => r.id === odabrani) ?? dostupni[0]
  const izracun = rezim?.ishod.status === 'izracunato' ? rezim.ishod.izracun : undefined

  const rate = useMemo(() => {
    if (izracun === undefined) return []
    const { vrsteObveza } = izracun

    const obveze: AnnualObligation[] = [
      { obligation: vrsteObveza.porez, annualAmount: izracun.ukupanPorez.amount },
      {
        obligation: vrsteObveza.doprinosi,
        annualAmount: izracun.doprinosi.ukupnoGodisnje.amount,
      },
    ]

    // Незастосовний платіж у календар не потрапляє: рядок на нуль євро
    // читався б як платіж, якого насправді немає.
    if (izracun.ukupnaDavanja.amount.greaterThan(0)) {
      obveze.push({
        obligation: vrsteObveza.komorskiDoprinos,
        annualAmount: izracun.ukupnaDavanja.amount,
      })
    }

    return buildPaymentSchedule(godina, obveze)
  }, [izracun, godina])

  if (rezim === undefined || izracun === undefined) return null

  return (
    <section className="kalendar">
      <h2>{t.kalendar.naslov}</h2>
      <p className="forma__prijevod">{t.kalendar.prijevod}</p>

      {dostupni.length > 1 && (
        <fieldset className="kalendar__izbor">
          <legend className="vizualno-skriveno">{t.kalendar.naslov}</legend>
          {dostupni.map((kandidat) => (
            <label key={kandidat.id} className="scenarij__izbor">
              <input
                type="radio"
                name="kalendar-rezim"
                value={kandidat.id}
                checked={rezim.id === kandidat.id}
                onChange={() => {
                  setOdabrani(kandidat.id)
                }}
              />
              {kandidat.naziv.hr}
            </label>
          ))}
        </fieldset>
      )}

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

      {/*
        Річна доплата в календарі не показується сумою навмисно: у стійкому
        стані вона нульова, а нуль у списку платежів читався б як платіж.
        Але сам факт, що вона настає вже наступного року, сказати треба.
      */}
      <p className="forma__prijevod">
        {t.kalendar.razlika(String(godina + 1))}
        <Izvor izvor={DEADLINES[izracun.vrsteObveza.razlika].source} />
      </p>
    </section>
  )
}
