/**
 * Публічний вхід каталогу: сторінка джерел і чисті модулі, на яких вона
 * стоїть.
 *
 * Застосунок бере звідси `Izvori`, локалізація — `tekst`, тести — чисті
 * функції. Решта файлів каталогу назовні не потрібна.
 */

/** @internal Чиста функція каталогу; назовні її бере лише власний тест. */
export { citat } from './citat.ts'
/** @public Секція для застосунку; підключається в `App.tsx`. */
export { Izvori } from './Izvori.tsx'
/** @internal Ті самі чисті функції для тестів реєстру розбіжностей. */
export { poredaj, prebrojPoVrsti, predmetZapisa } from './registar.ts'
/** @internal Ті самі чисті функції для тестів переліку правових норм. */
export { grupirajPoAktu, pravneStavke, type Stavka, type StavkaId } from './stavke.ts'
/** @public Єдине місце з текстом для людини — сюди доклеюються переклади. */
export { tekst } from './tekst.ts'
