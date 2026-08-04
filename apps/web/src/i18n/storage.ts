import type { Locale } from './locale.ts'

/**
 * Браузерний бік вибору мови.
 *
 * Тут і тільки тут інтерфейс торкається `localStorage` і `navigator`. Сам
 * вибір мови робить чистий `resolveLocale`, який приймає обидві величини
 * аргументами, — тому його можна ганяти тестами без браузера.
 *
 * Читання і запис загорнуті в `try`: у приватному режимі й за заблокованих
 * куках звернення до `localStorage` кидає, а мова інтерфейсу — не та річ,
 * заради якої варто впустити сторінку.
 */

const KLJUC = 'hr-tax-rates:locale'

/** Збережений вибір, ще не перевірений на те, чи така мова взагалі є. */
export const readStoredLocale = (): string | null => {
  try {
    return localStorage.getItem(KLJUC)
  } catch {
    return null
  }
}

/** Запам'ятати вибір людини, щоб надалі він перебивав детект. */
export const writeStoredLocale = (locale: Locale): void => {
  try {
    localStorage.setItem(KLJUC, locale)
  } catch {
    // Вибір не переживе перезавантаження, але сторінка живе далі.
  }
}

/** Мови браузера за спаданням переваги. */
export const browserLanguages = (): readonly string[] => navigator.languages
