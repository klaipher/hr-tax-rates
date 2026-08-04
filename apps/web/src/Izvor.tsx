import type { LegalReference, StatisticalReference } from '@hr-tax/data'
import type { ReactNode } from 'react'
import { useI18n } from './i18n/context.tsx'

/**
 * Посилання від числа на екрані до його джерела — за один клік.
 *
 * Саме заради цього кожне юридичне число носить джерело (ADR-0002): обидва
 * калькулятори HOK, взяті за еталон, містять помилки, і авторитетність
 * джерела від них не рятує — рятує можливість перевірити.
 *
 * Джерел два різновиди, і вони не взаємозамінні: правове стоїть за тим, що
 * встановлює закон, статистичне — за тим, на що закон лише посилається
 * (ADR-0001). Тому два компоненти, а не один із прапорцем.
 *
 * Дата звірки лишається в ISO в кожній локалі: вона стоїть у довідці поруч із
 * номером NN, а `2026-01-15` читається однаково всюди — на відміну від
 * `01/15/2026` і `15.01.2026`, які на око не розрізнити.
 */
const Poveznica = ({
  url,
  naslov,
  children,
}: {
  readonly url: string
  readonly naslov: string
  readonly children: ReactNode
}) => (
  <a className="izvor" href={url} target="_blank" rel="noreferrer" title={naslov}>
    {children}
  </a>
)

/** Джерело права: акт і стаття. */
export const Izvor = ({ izvor }: { readonly izvor: LegalReference }) => {
  const { t } = useI18n()

  return (
    <Poveznica url={izvor.url} naslov={`${izvor.gazette} · ${t.izvor.provjereno(izvor.checkedOn)}`}>
      {izvor.act}, {izvor.article}
    </Poveznica>
  )
}

/** Джерело статистики: хто опублікував і за який період. */
export const IzvorStatistike = ({ izvor }: { readonly izvor: StatisticalReference }) => {
  const { t } = useI18n()

  return (
    <Poveznica url={izvor.url} naslov={t.izvor.provjereno(izvor.checkedOn)}>
      {izvor.publisher}, {izvor.period} ({izvor.publication})
    </Poveznica>
  )
}
