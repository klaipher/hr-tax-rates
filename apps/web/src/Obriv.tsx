import type { PodlogaZa } from '@hr-tax/engine'
import { blizuObriva, eur, obrivZa } from '@hr-tax/engine'
import { useMemo } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'
import { RazlogNedostupnosti } from './RazlogNedostupnosti.tsx'

/**
 * Обрив розряду: скільки лишилося до межі і чого коштує її перетнути.
 *
 * Стоїть під самим полем `primitak` навмисно. Рішення «брати ще один
 * контракт чи ні» ухвалюють, дивлячись на цю цифру, а не на картку режиму —
 * і найдорожчий євро в році стоїть рівно на одному центі, якого з картки не
 * видно взагалі: там завжди одне число на один `primitak`.
 *
 * Ретроактивність внесків показується окремим рядком, бо це найдорожча й
 * найменш очевидна частина обриву: у запланованих змінах `koeficijent`
 * залежить від розряду, тож грудневий євро переписує всі дванадцять місяців.
 */
export const Obriv = ({
  godisnjiPrimitak,
  podlogaZa,
}: {
  /** Число, а не `Money`: інакше `eur()` давав би новий об'єкт на кожен
      рендер, і пам'ять `useMemo` не спрацьовувала б жодного разу. */
  readonly godisnjiPrimitak: number
  readonly podlogaZa: PodlogaZa
}) => {
  const { t, format } = useI18n()
  const obriv = useMemo(
    () => obrivZa(eur(godisnjiPrimitak), podlogaZa),
    [godisnjiPrimitak, podlogaZa],
  )

  // Обриву немає — або режим за цим `primitak` уже недоступний, і туди вже
  // прийшли, або набір правил розрядів не знає.
  if (obriv === undefined) return null

  return (
    <section className={blizuObriva(obriv) ? 'obriv obriv--blizu' : 'obriv'}>
      <h2 className="obriv__naslov">{t.obriv.naslov}</h2>
      <p className="obriv__odstup">
        {t.obriv.doGranice(format.eur(obriv.doGranice), format.eur(obriv.granica))}
        <Izvor izvor={obriv.izvor} />
      </p>

      {obriv.vrsta === 'kraj-rezima' ? (
        <>
          <p className="razlog">{t.obriv.krajRezima}</p>
          <RazlogNedostupnosti razlog={obriv.razlog} />
        </>
      ) : (
        <>
          <p className="obriv__skok">
            {t.obriv.skok(
              format.eur(obriv.skok.ukupno),
              format.eur(obriv.skok.porez),
              format.eur(obriv.skok.doprinosi),
            )}
          </p>
          {obriv.skok.retroaktivnihMjeseci > 0 && (
            <p className="razlog">
              {t.obriv.retroaktivno(format.number(obriv.skok.retroaktivnihMjeseci))}
            </p>
          )}
        </>
      )}
    </section>
  )
}
