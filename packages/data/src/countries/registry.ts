import type { HomeCountry, HomeCountryCode } from './home-country.ts'
import { FOP_3_SKUPINE } from './ua/fop3.ts'

/**
 * Реєстр рідних країн.
 *
 * Єдине місце, де країни перелічені. Додати країну — це новий файл під
 * `countries/` і рядок тут; `Record<HomeCountryCode, HomeCountry>` не дасть
 * забути одне з двох. Рушій не змінюється: він знає інтерфейс, а не список.
 */
export const homeCountries: Record<HomeCountryCode, HomeCountry> = {
  UA: FOP_3_SKUPINE,
}
