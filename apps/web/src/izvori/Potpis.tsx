import type { LegalReference } from '@hr-tax/data'
import { citat } from './citat.ts'
import { Poveznica } from './Poveznica.tsx'
import { tekst } from './tekst.ts'

/**
 * Позначка одним словом: статус норми, статус статистики або вид запису
 * реєстру.
 *
 * Вигляд передається окремо від напису, бо статуси в права і в статистики
 * різні, а значать одне: `nacrt` — те, на що покладатися ще зарано, і саме
 * тому воно виділене. `oznaka` — просто підпис без оцінки.
 */
export const Znak = ({
  natpis,
  izgled,
}: {
  readonly natpis: string
  readonly izgled: 'na-snazi' | 'nacrt' | 'oznaka'
}) => <span className={`izvori-znak izvori-znak--${izgled}`}>{natpis}</span>

/** Дата, коли людина востаннє звіряла число з текстом джерела. */
export const Zvireno = ({ datum }: { readonly datum: string }) => (
  <span className="izvori-potpis__datum">
    {tekst.zvireno} <time dateTime={datum}>{datum}</time>
  </span>
)

/**
 * Підпис юридичного числа: стаття, статус норми і дата звірки.
 *
 * Усе видно без наведення миші й без розкривання — саме цим підпис
 * відрізняється від компонента `Izvor` у корені застосунку, де номер NN і
 * дата звірки сховані в `title`. Наведення миші не існує на дотику, а
 * «за одну дію» означає одну дію, а не дві.
 */
export const Potpis = ({ izvor }: { readonly izvor: LegalReference }) => (
  <p className="izvori-potpis">
    <Poveznica url={izvor.url} naziv={citat(izvor)}>
      {izvor.article}
    </Poveznica>
    <Znak
      natpis={tekst.statusi[izvor.status]}
      izgled={izvor.status === 'draft' ? 'nacrt' : 'na-snazi'}
    />
    <Zvireno datum={izvor.checkedOn} />
  </p>
)
