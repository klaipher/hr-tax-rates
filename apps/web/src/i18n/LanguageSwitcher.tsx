import { useState } from 'react'
import { useI18n } from './context.tsx'
import { LOCALE_NAMES, LOCALES, parseLocale } from './locale.ts'

/**
 * Перемикач мови інтерфейсу.
 *
 * Рідний `select` із підписаним `label`: він приходить з клавіатури табом,
 * розкривається стрілками і читалка екрана називає і сам перемикач, і обрану
 * мову. Свій віджет із `div` довелося б навчати всьому цьому наново.
 *
 * Кожен пункт несе власний `lang`, тож читалка вимовляє «Hrvatski» хорватським
 * голосом, а не по буквах поточною мовою сторінки.
 */
export const LanguageSwitcher = () => {
  const { locale, setLocale, t } = useI18n()
  // Область `status` мусить бути в розмітці ще до зміни, інакше читалка її не
  // помітить. До першого перемикання вона порожня — оголошувати мову тому,
  // хто щойно відкрив сторінку, нема про що.
  const [promijenjeno, postaviPromijenjeno] = useState(false)

  return (
    <div className="jezik">
      <label className="jezik__oznaka" htmlFor="jezik">
        {t.jezik.oznaka}
      </label>
      <select
        id="jezik"
        className="jezik__izbor"
        value={locale}
        onChange={(event) => {
          const izabrana = parseLocale(event.target.value)
          if (izabrana !== undefined) {
            setLocale(izabrana)
            postaviPromijenjeno(true)
          }
        }}
      >
        {LOCALES.map((kandidat) => (
          <option key={kandidat} value={kandidat} lang={kandidat}>
            {LOCALE_NAMES[kandidat]}
          </option>
        ))}
      </select>
      <p className="vizualno-skriveno" role="status">
        {promijenjeno ? t.jezik.promjena(LOCALE_NAMES[locale]) : ''}
      </p>
    </div>
  )
}
