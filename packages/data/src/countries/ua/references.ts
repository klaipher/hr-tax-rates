/**
 * Акти України, з яких узято числа `FOP 3. skupine`.
 *
 * Формою повторюють хорватські константи в `../../legal.ts`: спільна частина
 * акта тут, стаття й дата перевірки — на місці вжитку, бо різні числа одного
 * кодексу живуть у різних статтях (ADR-0002).
 */

/** Дата, коли числа звірені з текстами актів. */
export const CHECKED_ON = '2026-08-04' as const

export const PODATKOVYI_KODEKS = {
  jurisdiction: 'UA',
  act: 'Податковий кодекс України',
  gazette: 'ВВР, 2011, № 13-14, № 15-16, № 17, ст. 112',
  url: 'https://zakon.rada.gov.ua/laws/show/2755-17',
  status: 'in-force',
} as const

export const ZAKON_PRO_YEDYNYI_VNESOK = {
  jurisdiction: 'UA',
  act: 'Закон України «Про збір та облік єдиного внеску на загальнообов’язкове державне соціальне страхування»',
  gazette: 'ВВР, 2011, № 2-3, ст. 11',
  url: 'https://zakon.rada.gov.ua/laws/show/2464-17',
  status: 'in-force',
} as const

export const DERZHAVNYI_BIUDZHET_2026 = {
  jurisdiction: 'UA',
  act: 'Закон України «Про Державний бюджет України на 2026 рік»',
  gazette: 'Голос України від 12.12.2025 № 239; ВВР, 2026, №№ 7-9, ст. 14',
  url: 'https://zakon.rada.gov.ua/laws/show/4695-20',
  status: 'in-force',
} as const
