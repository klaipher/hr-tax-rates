/**
 * Мова інтерфейсу.
 *
 * Українська стоїть першою навмисно: вона мова-джерело перекладів, з якої
 * виводиться сама форма словника. Хорватська і англійська — рівні їй за
 * повнотою, але не за роллю.
 */
export type Locale = 'uk' | 'hr' | 'en'

export const LOCALES: readonly Locale[] = ['uk', 'hr', 'en']

/**
 * Мова, якою розмовляє інтерфейс, коли жодна з мов браузера не підтримана.
 * Англійська, а не українська: той, хто не читає жодної з трьох, найшвидше
 * дасть раду саме з нею.
 */
const ZAPASNA: Locale = 'en'

/**
 * Назва кожної мови нею самою.
 *
 * Не перекладається: перемикач мусить бути читабельним для того, хто поточної
 * мови інтерфейсу не розуміє взагалі — інакше з неї не вибратися.
 */
export const LOCALE_NAMES: Record<Locale, string> = {
  uk: 'Українська',
  hr: 'Hrvatski',
  en: 'English',
}

const jeLocale = (kandidat: string): kandidat is Locale =>
  LOCALES.some((locale) => locale === kandidat)

/**
 * Мовний тег BCP 47 → підтримана мова, або `undefined`.
 *
 * Регіональний тег зводиться до базової мови: `uk-UA`, `uk-CA` і `uk` — та
 * сама мова інтерфейсу, і українець із хорватським браузером не має бачити
 * англійську через один дефіс. Тег, чия базова мова не підтримана, — зокрема
 * `sr-Latn-RS` із базовою `sr` — відсіюється, а не підганяється під схоже.
 */
export const parseLocale = (tag: string): Locale | undefined => {
  const [osnovna = ''] = tag.toLowerCase().split('-')

  return jeLocale(osnovna) ? osnovna : undefined
}

/**
 * Мова інтерфейсу з двох джерел: збереженого вибору і списку мов браузера.
 *
 * Чиста функція: обидва джерела приходять аргументами, а не читаються з
 * `localStorage` і `navigator` усередині. Тому її можна ганяти тестами без
 * браузера — і тому вибір мови не залежить від того, коли саме її викликали.
 *
 * Пріоритет: збережений вибір, далі мови браузера за їхнім же порядком, далі
 * англійська. Збережене сміття — мова, якої вже немає, або підправлене руками
 * значення — не перебиває детект, а просто ігнорується.
 */
export const resolveLocale = (
  stored: string | null,
  browserLanguages: readonly string[],
): Locale => {
  const izabrana = stored === null ? undefined : parseLocale(stored)
  if (izabrana !== undefined) {
    return izabrana
  }

  for (const tag of browserLanguages) {
    const locale = parseLocale(tag)
    if (locale !== undefined) {
      return locale
    }
  }

  return ZAPASNA
}
