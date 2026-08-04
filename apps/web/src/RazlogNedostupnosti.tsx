import type { RazlogNedostupnosti as Razlog } from '@hr-tax/engine'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Чому режим недоступний.
 *
 * Рушій віддає причину структурою — кодом і параметрами, — а не готовим
 * реченням. Тому текст складається тут, мовою читача, з тих самих чисел, які
 * порахував рушій. Числа лишаються числами, тож ті з них, що несуть джерело,
 * ведуть до статті (ADR-0002), а не тонуть у чужому рядку.
 */
export const RazlogNedostupnosti = ({ razlog }: { readonly razlog: Razlog }) => {
  const { t, format } = useI18n()

  switch (razlog.kod) {
    case 'iznad-praga-pausala':
      return (
        <p className="razlog">
          {t.razlozi['iznad-praga-pausala'](format.eur(razlog.primitak), format.eur(razlog.prag))}
          <Izvor izvor={razlog.izvor} />
        </p>
      )

    case 'nedosljedna-tablica-razreda':
      return (
        <p className="razlog">
          {t.razlozi['nedosljedna-tablica-razreda'](
            format.eur(razlog.primitak),
            format.eur(razlog.prag),
          )}
        </p>
      )

    case 'svedeni-primitak-izvan-tablice':
      return (
        <p className="razlog">
          {t.razlozi['svedeni-primitak-izvan-tablice'](
            format.eur(razlog.primitak),
            format.eur(razlog.svedeniPrimitak),
            format.number(razlog.brojMjeseci),
          )}
          <Izvor izvor={razlog.izvor} />
        </p>
      )

    case 'koeficijent-djeteta-nije-propisan':
      return (
        <p className="razlog">
          {t.razlozi['koeficijent-djeteta-nije-propisan'](
            format.number(razlog.dostupnoDjece),
            format.number(razlog.trazenoDjece),
          )}
          <Izvor izvor={razlog.izvor} />
        </p>
      )

    case 'nema-pravila':
      return <p className="razlog">{t.razlozi['nema-pravila'](razlog.pravila)}</p>

    case 'nije-modeliran':
      return <p className="razlog">{t.razlozi[razlog.rezim === 'doo' ? 'doo' : 'zaposlenik']}</p>

    default:
      return <p className="razlog">{t.razlozi[razlog.kod]}</p>
  }
}
