import type { ReactNode } from 'react'
import { tekst } from './tekst.ts'

/**
 * Посилання на текст джерела за межами сайту.
 *
 * Зовнішність позначена двічі: знаком ↗ для ока і словами в назві посилання
 * для зчитувача екрана. Знак прихований від зчитувача, щоб той не читав
 * стрілку як текст.
 *
 * `naziv` — повна назва цілі (акт зі статтею, видавець із публікацією).
 * Видимий текст посилання коротший, бо назва акта вже стоїть у заголовку
 * групи; проте в доступну назву вона повертається, бо посиланням «čl. 19»
 * поза контекстом скористатися не можна.
 */
export const Poveznica = ({
  url,
  naziv,
  children,
}: {
  readonly url: string
  readonly naziv: string
  readonly children: ReactNode
}) => (
  <a
    className="izvori-poveznica"
    href={url}
    target="_blank"
    rel="noreferrer"
    aria-label={`${naziv} — ${tekst.vanjskaPoveznica}`}
  >
    {children}
    <span className="izvori-poveznica__znak" aria-hidden="true">
      ↗
    </span>
  </a>
)
