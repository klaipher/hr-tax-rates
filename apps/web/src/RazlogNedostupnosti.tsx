import { eur, type RezimId } from '@hr-tax/engine'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'
import { PODLOGA } from './podloga.ts'

/**
 * Поріг паушалу — єдине юридичне число, яке картка бере не з рушія.
 *
 * Воно приходить із `ruleset` разом зі своїм джерелом (ADR-0002): якби число
 * стояло словами в перекладі, від нього не було б дороги до статті, а після
 * зміни закону три переклади розійшлися б із правилами мовчки.
 */
const PRAG_PAUSALA = PODLOGA.ruleset.pausalniObrt.pragPrimitka

/**
 * Чому режим недоступний.
 *
 * Рушій повертає причину готовою прозою українською — його контракт склався
 * до появи локалей. Тому текст береться зі словника за `RezimId`, а не з
 * `Ishod.razlog`: перекласти чужий рядок на льоту неможливо.
 */
export const RazlogNedostupnosti = ({ id }: { readonly id: RezimId }) => {
  const { t, format } = useI18n()

  if (id === 'pausalni-obrt') {
    return (
      <p className="razlog">
        {t.razlozi['pausalni-obrt'](format.eur(eur(PRAG_PAUSALA.value)))}
        <Izvor izvor={PRAG_PAUSALA.source} />
      </p>
    )
  }

  return <p className="razlog">{t.razlozi[id]}</p>
}
