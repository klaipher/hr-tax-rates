/**
 * Тягне офіційну таблицю річних ставок `porez na dohodak` (податок на дохідок)
 * для всіх міст і общин (grad/općina) із сайту Porezna uprava і генерує з неї
 * типізований довідник.
 *
 * Таблиця існує не з доброї волі укладача: `čl. 19.a st. 4. Zakona o porezu na
 * dohodak` зобов'язує кожну одиницю надіслати свою `odluka` (рішення) Poreznoj
 * upravi саме для оприлюднення на її сайті. Тому це не чиясь компіляція, а
 * офіційне зведення чинних рішень.
 *
 * Запуск: `node scripts/fetch-city-rates.ts`. Результат комітиться.
 *
 * Розбір навмисно недовірливий: будь-яка несподіванка в джерелі — зникла
 * колонка, ставка поза межами закону, назва з невідомим символом — це виняток,
 * а не тихо пропущений рядок. Мовчазна втрата одиниці означала б, що людина з
 * неї побачила б чужі ставки й не помітила цього.
 */
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { XMLParser } from 'fast-xml-parser'
import { unzipSync } from 'fflate'
import { uGranicama } from '../packages/data/src/cities/granice.ts'
import type {
  Datum,
  JedinicaLokalneSamouprave,
  StopePorezaNaDohodak,
} from '../packages/data/src/cities/types.ts'
import { ZAKON_O_POREZU_NA_DOHODAK } from '../packages/data/src/legal.ts'

const here = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(here, '..')

/** Сторінка «Stope godišnjeg poreza na dohodak za 2026. godinu». */
const STRANICA =
  'https://porezna-uprava.gov.hr/hr/stope-godisnjeg-poreza-na-dohodak-za-2026-godinu/8166'

/** Файл, на який ця сторінка посилається. */
const TABLICA =
  'https://porezna-uprava.gov.hr/UserDocsImages/Portal_porezne_konkurentnosti/Odluke_JLS/Porezne%20stope%20godi%C5%A1njeg%20poreza%20na%20dohodak/Tablica%20poreznih%20stopa%20godi%C5%A1njeg%20poreza%20na%20dohodak%20za%202026%20godinu.xlsx'

/**
 * Дата, коли людина востаннє звіряла числа з джерелом. Константа, а не
 * `new Date()`: інакше кожен прогін давав би інший файл і згенероване
 * перестало б бути відтворюваним. Оновлювати разом зі звіркою.
 */
const PROVJERENO = '2026-08-04'

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  // Без цього парсер обрізає пробіли, а заголовки в джерелі їх мають
  // («Niža stopa 2026.   »). Обрізати треба свідомо, а не випадково.
  trimValues: false,
  isArray: (name) => ['row', 'c', 'si', 'r'].includes(name),
})

type Xml = Record<string, unknown>

const asArray = (value: unknown): Xml[] => (Array.isArray(value) ? (value as Xml[]) : [])

const textOf = (node: unknown): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (node === null || node === undefined) return ''
  const text = (node as Xml)['#text']
  return typeof text === 'string' || typeof text === 'number' ? String(text) : ''
}

/** `si` буває простим (`<t>`) або складеним із форматованих шматків (`<r><t>`). */
const sharedStringText = (si: Xml): string => {
  const runs = asArray(si['r'])
  if (runs.length > 0) return runs.map((run) => textOf(run['t'])).join('')
  return textOf(si['t'])
}

/** Єдиний запис архіву за шаблоном; кілька або жоден — привід зупинитися. */
const jediniZapis = (zip: Record<string, Uint8Array>, pattern: RegExp): Uint8Array => {
  const found = Object.entries(zip).filter(([path]) => pattern.test(path))
  const [prvi] = found
  if (found.length !== 1 || prvi === undefined) {
    throw new Error(`Очікував рівно один запис за ${pattern}, а знайшов ${found.length}`)
  }
  return prvi[1]
}

const ADRESA = /^([A-Z]+)(\d+)$/

const parseAdresu = (adresa: string): { stupac: string; red: number } => {
  const parsed = ADRESA.exec(adresa)
  const [, stupac, red] = parsed ?? []
  if (stupac === undefined || red === undefined) {
    throw new Error(`Незрозуміла адреса комірки: ${adresa}`)
  }
  return { stupac, red: Number(red) }
}

const RASPON = /^[A-Z]+(\d+):[A-Z]+(\d+)$/

const parseRaspon = (raspon: string): { prviRed: number; zadnjiRed: number } => {
  const parsed = RASPON.exec(raspon)
  const [, prvi, zadnji] = parsed ?? []
  if (prvi === undefined || zadnji === undefined) {
    throw new Error(`Незрозумілий діапазон таблиці: ${raspon}`)
  }
  return { prviRed: Number(prvi), zadnjiRed: Number(zadnji) }
}

/** Комірки аркуша: номер рядка → буква колонки → текст. */
type Celije = ReadonlyMap<number, ReadonlyMap<string, string>>

interface Tablica {
  readonly celije: Celije
  /** Рядок заголовків. */
  readonly zaglavlje: number
  /** Перший і останній рядок даних — уже без рядка підсумків. */
  readonly prviRed: number
  readonly zadnjiRed: number
}

const parseTablicu = (xlsx: Uint8Array): Tablica => {
  const zip = unzipSync(xlsx)
  const decoder = new TextDecoder()
  const read = (pattern: RegExp): string => decoder.decode(jediniZapis(zip, pattern))

  const sharedStrings = asArray(
    (parser.parse(read(/^xl\/sharedStrings\.xml$/))['sst'] as Xml)['si'],
  ).map(sharedStringText)

  const worksheet = parser.parse(read(/^xl\/worksheets\/sheet\d+\.xml$/))['worksheet'] as Xml

  const celije = new Map<number, Map<string, string>>()
  for (const row of asArray((worksheet['sheetData'] as Xml | undefined)?.['row'])) {
    for (const cell of asArray(row['c'])) {
      const { stupac, red } = parseAdresu(String(cell['@_r']))
      const raw = cell['v'] === undefined ? '' : textOf(cell['v'])
      const vrijednost = cell['@_t'] === 's' ? (sharedStrings[Number(raw)] ?? '') : raw
      const uRedu = celije.get(red) ?? new Map<string, string>()
      uRedu.set(stupac, vrijednost)
      celije.set(red, uRedu)
    }
  }

  // Межі даних беремо з визначення таблиці Excel, а не з `dimension` аркуша:
  // під таблицею лежать порожні комірки, і `dimension` їх зараховує.
  const definicija = parser.parse(read(/^xl\/tables\/table\d+\.xml$/))['table'] as Xml
  const { prviRed, zadnjiRed } = parseRaspon(String(definicija['@_ref']))
  const zaglavlje = prviRed + Number(definicija['@_headerRowCount'] ?? 1) - 1

  return {
    celije,
    zaglavlje,
    prviRed: zaglavlje + 1,
    zadnjiRed: zadnjiRed - Number(definicija['@_totalsRowCount'] ?? 0),
  }
}

/**
 * Колонки шукаємо за назвою заголовка, а не за буквою: у назві ставок сидить
 * рік, який щороку інший, а порядок колонок укладач може й переставити.
 * Заголовок звіряється за префіксом і має збігтися рівно один раз.
 */
const stupacPoNazivu = ({ celije, zaglavlje }: Tablica): ((naziv: string) => string) => {
  const zaglavlja = [...(celije.get(zaglavlje) ?? [])].map(
    ([stupac, tekst]) => [stupac, tekst.trim()] as const,
  )
  return (naziv) => {
    const pogodci = zaglavlja.filter(([, tekst]) => tekst.startsWith(naziv))
    const [prvi] = pogodci
    if (pogodci.length !== 1 || prvi === undefined) {
      const sve = zaglavlja.map(([, tekst]) => tekst).join(' | ')
      throw new Error(`Колонка «${naziv}» знайшлася ${pogodci.length} разів. Заголовки: ${sve}`)
    }
    return prvi[0]
  }
}

const BAZNIH_BODOVA_U_JEDINICI = 10_000

/**
 * Джерело зберігає 20,5 % як `0.20499999999999999` — це дрейф подвійної
 * точності, і в базисних пунктах він менший за 1e-12. Усе, що більше, — не
 * дрейф, а ставка з точністю, якої закон не передбачає, і її треба побачити.
 */
const DOPUSTENI_DRIFT = 1e-9

const parseStopu = (raw: string, gdje: string): number => {
  const udio = Number(raw)
  if (raw === '' || !Number.isFinite(udio)) throw new Error(`${gdje}: ставка «${raw}» не число`)
  const bodovi = udio * BAZNIH_BODOVA_U_JEDINICI
  const zaokruzeno = Math.round(bodovi)
  if (Math.abs(bodovi - zaokruzeno) > DOPUSTENI_DRIFT) {
    throw new Error(`${gdje}: ставка ${raw} не лягає в базисні пункти`)
  }
  return zaokruzeno
}

const DATUM = /^(\d{1,2})\.(\d{1,2})\.(\d{4})\.$/

const parseDatum = (raw: string, gdje: string): Datum => {
  const [, dan, mjesec, godina] = DATUM.exec(raw.trim()) ?? []
  if (dan === undefined || mjesec === undefined || godina === undefined) {
    throw new Error(`${gdje}: дата «${raw}» не у форматі d.m.yyyy.`)
  }
  return `${godina}-${mjesec.padStart(2, '0')}-${dan.padStart(2, '0')}` as Datum
}

const BROJ_NN = /^\d{1,3}\/\d{2}$/

const parseBrojeveNN = (raw: string, gdje: string): readonly string[] => {
  const brojevi = raw.split(',').map((dio) => dio.trim())
  for (const broj of brojevi) {
    if (!BROJ_NN.test(broj)) throw new Error(`${gdje}: «${broj}» не схоже на номер НН`)
  }
  return brojevi
}

/**
 * Зірочка наприкінці назви — виноска видавця (OROSLAVJE*), причому самої
 * виноски у файлі немає; до назви міста вона не належить. Решту несподіваних
 * символів пропускати не можна: наступна виноска має зупинити скрипт, а не
 * тихо приліпитися до назви.
 */
const IME = /^[A-ZĆČĐŠŽ][A-ZĆČĐŠŽ .-]*$/u

const parseIme = (raw: string, gdje: string): string => {
  const ime = raw.trim().replace(/\*$/u, '').trim()
  if (!IME.test(ime)) throw new Error(`${gdje}: назва «${raw}» має несподівані символи`)
  return ime
}

const SIFRA = /^\d+$/

const xlsx = new Uint8Array(await (await fetch(TABLICA)).arrayBuffer())
const tablica = parseTablicu(xlsx)
const stupac = stupacPoNazivu(tablica)
const stupci = {
  sifra: stupac('Šifra grada/općine'),
  ime: stupac('Ime grada/općine'),
  narodneNovine: stupac('Broj NN'),
  niza: stupac('Niža stopa'),
  visa: stupac('Viša stopa'),
  stupanjeNaSnagu: stupac('Stupanje na snagu'),
}

const jedinice: JedinicaLokalneSamouprave[] = []
for (let red = tablica.prviRed; red <= tablica.zadnjiRed; red += 1) {
  const uRedu = tablica.celije.get(red)
  if (uRedu === undefined) throw new Error(`Рядок ${red} таблиці порожній`)
  const cell = (kolona: string): string => uRedu.get(kolona) ?? ''

  const ime = parseIme(cell(stupci.ime), `рядок ${red}`)
  const gdje = `рядок ${red} (${ime})`

  const sifra = cell(stupci.sifra).trim()
  if (!SIFRA.test(sifra)) throw new Error(`${gdje}: шифра «${sifra}» не число`)

  const stope: StopePorezaNaDohodak = {
    niza: parseStopu(cell(stupci.niza), `${gdje}, niža stopa`),
    visa: parseStopu(cell(stupci.visa), `${gdje}, viša stopa`),
    narodneNovine: parseBrojeveNN(cell(stupci.narodneNovine), gdje),
    stupanjeNaSnagu: parseDatum(cell(stupci.stupanjeNaSnagu), gdje),
  }
  if (!uGranicama(stope)) {
    throw new Error(`${gdje}: ставки ${stope.niza}/${stope.visa} поза межами čl. 19.a st. 2.`)
  }

  jedinice.push({ sifra, ime, stope })
}

const dvojnici = jedinice
  .map(({ sifra }) => sifra)
  .filter((sifra, i, sve) => sve.indexOf(sifra) !== i)
if (dvojnici.length > 0) {
  throw new Error(`Шифри повторюються, ключ довідника зламаний: ${dvojnici.join(', ')}`)
}

const dataset = {
  value: jedinice,
  source: {
    ...ZAKON_O_POREZU_NA_DOHODAK,
    // Ставку встановлює `odluka` самої одиниці, а `st. 4.` зобов'язує
    // оприлюднити її на сайті Porezna uprava. Тому `url` веде на ту сторінку,
    // а не на текст закону: ADR-0002 хоче шлях від числа до джерела за один
    // клік, а числа лежать саме там. Номери НН кожної `odluka` — при ставках.
    article: 'čl. 19.a st. 4.',
    url: STRANICA,
    checkedOn: PROVJERENO,
  },
}

const sha256 = createHash('sha256').update(xlsx).digest('hex')

const output = `// ЗГЕНЕРОВАНО \`node scripts/fetch-city-rates.ts\` — не редагувати руками.
//
// Річні ставки \`porez na dohodak\` усіх міст і общин (grad/općina) зі зведеної
// таблиці Porezna uprava. Ставки в базисних пунктах: 2050 — це 20,5 %.
//
// Джерело: ${TABLICA}
// Розмір ${xlsx.byteLength} байт, sha256 ${sha256}

import type { Sourced } from '../sourced.ts'
import type { JedinicaLokalneSamouprave } from './types.ts'

export const jediniceLokalneSamouprave = ${JSON.stringify(dataset, null, 2)} as const satisfies Sourced<readonly JedinicaLokalneSamouprave[]>
`

const destination = join(repoRoot, 'packages', 'data', 'src', 'cities', 'jedinice.generated.ts')
writeFileSync(destination, output, 'utf8')

// JSON.stringify дає подвійні лапки й лапки на ключах — не той стиль, що в
// решті репозиторію. Згенероване має читатися так само, як рукописне.
execFileSync('pnpm', ['exec', 'biome', 'check', '--write', destination], {
  cwd: repoRoot,
  stdio: 'ignore',
})

const parovi = new Set(jedinice.map(({ stope }) => `${stope.niza}/${stope.visa}`))
console.log(
  `${jedinice.length} одиниць, ${parovi.size} різних пар ставок, sha256 джерела ${sha256}`,
)
