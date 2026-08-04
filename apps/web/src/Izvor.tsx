import type { LegalReference } from '@hr-tax/data'

/**
 * Посилання від числа на екрані до статті акта — за один клік.
 *
 * Саме заради цього кожне юридичне число носить джерело (ADR-0002): обидва
 * калькулятори HOK, взяті за еталон, містять помилки, і авторитетність
 * джерела від них не рятує — рятує можливість перевірити.
 */
export const Izvor = ({ izvor }: { readonly izvor: LegalReference }) => (
  <a
    className="izvor"
    href={izvor.url}
    target="_blank"
    rel="noreferrer"
    title={`${izvor.gazette} · звірено ${izvor.checkedOn}`}
  >
    {izvor.act}, {izvor.article}
  </a>
)
