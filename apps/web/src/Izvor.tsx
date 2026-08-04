import type { LegalReference, StatisticalReference } from '@hr-tax/data'
import type { ReactNode } from 'react'

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
export const Izvor = ({ izvor }: { readonly izvor: LegalReference }) => (
  <Poveznica url={izvor.url} naslov={`${izvor.gazette} · звірено ${izvor.checkedOn}`}>
    {izvor.act}, {izvor.article}
  </Poveznica>
)

/** Джерело статистики: хто опублікував і за який період. */
export const IzvorStatistike = ({ izvor }: { readonly izvor: StatisticalReference }) => (
  <Poveznica url={izvor.url} naslov={`звірено ${izvor.checkedOn}`}>
    {izvor.publisher}, {izvor.period} ({izvor.publication})
  </Poveznica>
)
