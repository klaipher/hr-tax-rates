/**
 * `stupanj razvijenosti` (ступінь розвиненості / development index group) —
 * розряд, у який Влада відносить кожну `jedinica lokalne samouprave`.
 *
 * Податку ця класифікація не встановлює й ставок не рухає — вона лише
 * називає одиниці, чиїм мешканцям `čl. 46. st. 1.` ZoPD зменшує **річний**
 * податок наполовину. Тому тут лежить рівно один розряд із восьми: той, який
 * закон цитує. Решта сім до податку стосунку не мають, і тримати їх означало
 * б тримати статистику заради статистики.
 *
 * Одиниці записані назвами, а не шифрами: `Odluka` друкує саме назви, а
 * шифра — ключ іншого реєстру (Porezna uprava). Зіставлення робить
 * `jediniceIPrveSkupine`, і тест падає, щойно назва перестане знаходитися або
 * почне знаходитися двічі — інакше пільга тихо дісталася б не тому місту.
 */
import type { LegalReference } from '../legal.ts'
import { type Sourced, sourced } from '../sourced.ts'

/**
 * `Odluka o razvrstavanju jedinica lokalne i područne (regionalne) samouprave
 * prema stupnju razvijenosti` — акт, що друкує самі списки.
 *
 * Влада переглядає її разом з `indeks razvijenosti`, тож акт цитується
 * випуском, а не роком: наступна редакція змінить склад списку, не змінивши
 * жодної норми закону.
 */
export const ODLUKA_O_RAZVRSTAVANJU = {
  jurisdiction: 'HR',
  act: 'Odluka o razvrstavanju jedinica lokalne i područne (regionalne) samouprave prema stupnju razvijenosti',
  article: 't. II. podt. 1.',
  gazette: 'NN 3/24',
  url: 'https://narodne-novine.nn.hr/clanci/sluzbeni/2024_01_3_60.html',
  status: 'in-force',
  checkedOn: '2026-08-14',
} as const satisfies LegalReference

/**
 * `I. skupina` — одиниці в останній чверті одиниць, рангованих нижче
 * середнього. Саме на них посилається `čl. 46. st. 1.`
 *
 * Порядок і написання — дослівно з акта. Що список саме такий, а не
 * «приблизно такий», важливо буквально: одна зайва община — це половина
 * податку, віддана тому, кому закон її не дає.
 */
export const jediniceIPrveSkupine: Sourced<readonly string[]> = sourced(
  [
    'Babina Greda',
    'Berek',
    'Biskupija',
    'Borovo',
    'Bošnjaci',
    'Cetingrad',
    'Cista Provo',
    'Civljane',
    'Čađavica',
    'Čaglin',
    'Darda',
    'Davor',
    'Donji Kukuruzari',
    'Donji Lapac',
    'Dragalić',
    'Draž',
    'Drenovci',
    'Drenje',
    'Dvor',
    'Đulovac',
    'Erdut',
    'Ervenik',
    'Gorjani',
    'Gornji Bogićevci',
    'Gračac',
    'Gradina',
    'Gunja',
    'Gvozd',
    'Hrvatska Dubica',
    'Jagodnjak',
    'Janjina',
    'Jasenovac',
    'Kijevo',
    'Kistanje',
    'Kneževi Vinogradi',
    'Krnjak',
    'Levanjska Varoš',
    'Lokvičići',
    'Lukač',
    'Majur',
    'Markušica',
    'Mikleuš',
    'Negoslavci',
    'Nova Bukovica',
    'Okučani',
    'Petlovac',
    'Plaški',
    'Podgorač',
    'Podravska Moslavina',
    'Popovac',
    'Prgomet',
    'Slavonski Šamac',
    'Sopje',
    'Stara Gradiška',
    'Sućuraj',
    'Suhopolje',
    'Sunja',
    'Šodolovci',
    'Štitar',
    'Tompojevci',
    'Trnava',
    'Trpinja',
    'Unešić',
    'Velika Pisanica',
    'Viljevo',
    'Voćin',
    'Vojnić',
    'Vrbje',
    'Vrhovine',
    'Zažablje',
    'Zrinski Topolovac',
    'Žumberak',
  ],
  ODLUKA_O_RAZVRSTAVANJU,
)

/**
 * `Grad Vukovar` — окрема підстава в тій самій статті.
 *
 * Вуковар лежить у V. skupini, тобто вище за середину, і за списком розряду
 * пільги не мав би. Закон називає його поіменно й окремим приводом
 * («i/ili na području Grada Vukovara»), тож він стоїть окремим записом, а не
 * дописаним рядком до чужого списку.
 */
export const GRAD_VUKOVAR = 'Vukovar' as const

/**
 * Назва одиниці так, як її друкує реєстр Porezna uprava: великими літерами.
 *
 * Порівнювати доводиться саме нормалізовано: `Odluka` друкує «Babina Greda»,
 * реєстр — «BABINA GREDA». Жодного іншого розходження між двома написаннями
 * немає, і тест це стереже.
 */
export const normaliziranoIme = (ime: string): string => ime.toLocaleUpperCase('hr-HR')

/**
 * Чи мешканцю цієї одиниці належить `umanjenje` з `čl. 46. st. 1.`
 *
 * Дві підстави, і закон з'єднує їх через «i/ili»: розряд списку або
 * Вуковар. Вистачає однієї.
 */
export const imaUmanjenjeZaPodrucje = (ime: string): boolean => {
  const trazeno = normaliziranoIme(ime)
  return (
    trazeno === normaliziranoIme(GRAD_VUKOVAR) ||
    jediniceIPrveSkupine.value.some((jedinica) => normaliziranoIme(jedinica) === trazeno)
  )
}
