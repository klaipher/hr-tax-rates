import type { RazlogNedostupnosti as Razlog } from '@hr-tax/engine'
import { formatEur } from '@hr-tax/engine'
import type { ReactNode } from 'react'

/**
 * Чому розрахунку немає.
 *
 * Причина структурована, а не текстом із рушія (ADR-0004): екран будує з неї
 * речення, а числа й статті всередині лишаються самими собою.
 */
const tekst = (razlog: Razlog): ReactNode => {
  switch (razlog.kod) {
    case 'iznad-praga-pausala':
      return (
        <>
          <strong>Паушал недоступний.</strong> primitak {formatEur(razlog.primitak)} вищий за поріг{' '}
          {formatEur(razlog.prag)} ({razlog.izvor.article}). Понад нього обрт веде облік і платить
          porez na dohodak із фактичного dohodak — це вже інший режим, і цей калькулятор його не
          рахує.
        </>
      )
    case 'nema-jedinice':
      return (
        <>
          <strong>Оберіть місто.</strong> Ставки porez na dohodak установлює jedinica lokalne
          samouprave, де ви живете, і без них податок із plaća нема з чого нарахувати. Підставити
          чужі означало б вигадати число.
        </>
      )
    case 'nedosljedna-tablica-razreda':
      return (
        <>
          Таблиця розрядів не доходить до порога {formatEur(razlog.prag)}: набір правил
          суперечливий. Це помилка в даних, а не ваше становище.
        </>
      )
    case 'svedeni-primitak-izvan-tablice':
      return <>Зведений до річного primitak {formatEur(razlog.svedeniPrimitak)} поза таблицею.</>
    case 'koeficijent-djeteta-nije-propisan':
      return (
        <>
          Закон друкує коефіцієнти до {razlog.dostupnoDjece}-ї дитини, а запитано{' '}
          {razlog.trazenoDjece} ({razlog.izvor.article}).
        </>
      )
    case 'nema-pravila':
      return <>Бракує набору правил: {razlog.pravila}.</>
    case 'nema-izdataka':
    case 'nema-izdataka-ni-jedinice':
    case 'vec-u-radnom-odnosu':
      return <>Цей розрахунок такої відповіді дати не може.</>
  }
}

export const RazlogNedostupnosti = ({ razlog }: { readonly razlog: Razlog }) => (
  <section className="kartica kartica--nedostupna">
    <p className="razlog razlog--upozorenje">{tekst(razlog)}</p>
  </section>
)
