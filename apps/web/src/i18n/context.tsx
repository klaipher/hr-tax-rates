import { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import { DICTIONARIES, type Dictionary } from './dictionary.ts'
import { createFormatters, type Formatters } from './format.ts'
import { type Locale, resolveLocale } from './locale.ts'
import { browserLanguages, readStoredLocale, writeStoredLocale } from './storage.ts'

/** Усе, що інтерфейсу треба знати про мову, якою його зараз читають. */
interface I18n {
  readonly locale: Locale
  readonly setLocale: (locale: Locale) => void
  /** Тексти інтерфейсу поточною мовою. */
  readonly t: Dictionary
  /** Форматування чисел і сум за поточною мовою; валюта всюди EUR. */
  readonly format: Formatters
}

const I18nContext = createContext<I18n | undefined>(undefined)

/**
 * Мова самого документа, а не лише тексту в ньому.
 *
 * Від `lang` залежить, яким голосом читає читалка екрана і як браузер
 * переносить слова; заголовок вкладки й опис сторінки — такий самий текст
 * інтерфейсу, як усе інше, і зоставити їх мовою оболонки означало б лишити
 * захардкоджений текст там, де його найважче помітити.
 */
const postaviJezikDokumenta = (locale: Locale, t: Dictionary): void => {
  document.documentElement.lang = locale
  document.title = t.zaglavlje.naslov
  document.querySelector('meta[name="description"]')?.setAttribute('content', t.dokument.opis)
}

export const useI18n = (): I18n => {
  const i18n = useContext(I18nContext)
  if (i18n === undefined) {
    throw new Error('Компонент показує текст поза I18nProvider')
  }

  return i18n
}

export const I18nProvider = ({ children }: { readonly children: ReactNode }) => {
  // Детект відбувається один раз, на старті: далі мову міняє тільки людина.
  const [locale, postaviLocale] = useState<Locale>(() =>
    resolveLocale(readStoredLocale(), browserLanguages()),
  )

  const t = DICTIONARIES[locale]

  const i18n = useMemo<I18n>(
    () => ({
      locale,
      setLocale: (izabrana: Locale) => {
        // Запис іде поруч зі зміною стану, а не в ефекті: збережений вибір —
        // наслідок дії людини, і відтворювати його з рендера нема потреби.
        writeStoredLocale(izabrana)
        postaviLocale(izabrana)
      },
      t,
      format: createFormatters(locale),
    }),
    [locale, t],
  )

  useEffect(() => {
    postaviJezikDokumenta(locale, t)
  }, [locale, t])

  return <I18nContext value={i18n}>{children}</I18nContext>
}
