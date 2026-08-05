import type { Napomena, RazlogNeprimjene } from '@hr-tax/data'
import { useI18n } from './i18n/context.tsx'

/**
 * Чому обов'язковий платіж не нараховано і за яких застережень нараховано.
 *
 * Рушій віддає і причину, і застереження кодом із параметрами, а не готовим
 * реченням (ADR-0004): шар даних мови читача не знає. Тому текст складається
 * тут, з тих самих чисел і кодів, які повернув розрахунок.
 *
 * Це та різниця, заради якої незастосовний платіж узагалі лишається в
 * переліку: «не забули» і «нічого не винен» на екрані виглядають однаково,
 * поки поруч не стоїть причина.
 */
export const RazlogNeprimjeneDavanja = ({ razlog }: { readonly razlog: RazlogNeprimjene }) => {
  const { t, format } = useI18n()
  const tekst = t.kartica.davanjaRazlozi

  switch (razlog.kod) {
    case 'novootvoreni-obrt':
      return (
        <p className="razlog">
          {tekst['novootvoreni-obrt'](format.number(razlog.oslobodenjeGodina))}
        </p>
      )

    case 'djelatnost-izvan-popisa':
      return <p className="razlog">{tekst['djelatnost-izvan-popisa'](razlog.nkd)}</p>

    default:
      return <p className="razlog">{tekst[razlog.kod]}</p>
  }
}

/** Застереження, за якого нарахована сума може виявитися іншою. */
export const NapomenaDavanja = ({ napomena }: { readonly napomena: Napomena }) => {
  const { t } = useI18n()
  const tekst = t.kartica.davanjaNapomene

  switch (napomena.kod) {
    case 'ogranicenje-nkd':
      // `ogranicenje` — дослівна цитата з тексту акта хорватською, і вона
      // лишається такою в кожній локалі, як і сам термін.
      return (
        <p className="razlog">{tekst['ogranicenje-nkd'](napomena.nkd, napomena.ogranicenje)}</p>
      )

    case 'stopa-je-gornja-granica':
      return <p className="razlog">{tekst['stopa-je-gornja-granica'](napomena.stopa)}</p>

    default:
      return <p className="razlog">{tekst[napomena.kod]}</p>
  }
}
