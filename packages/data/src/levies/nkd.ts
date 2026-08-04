/**
 * Довідник `NKD` (вид діяльності / activity code) — рівно настільки великий,
 * наскільки потрібно, щоб вирішити застосовність `turistička članarina` і
 * `spomenička renta`.
 *
 * ## Межа покриття, свідома
 *
 * Це **не** повна класифікація. Повний `NKD 2025` має 651 клас і 687
 * підкласів; тут лежать лише ті коди, які дослівно називають два закони:
 * `čl. 5. st. 1. Zakona o članarinama u turističkim zajednicama` і
 * `čl. 117. st. 1. Zakona o zaštiti i očuvanju kulturnih dobara`. Код, якого
 * тут немає, означає рівно одне: жоден із цих двох платежів за ним не
 * виникає. Для будь-якого іншого питання цей довідник не є джерелом.
 *
 * ## Дві редакції класифікації
 *
 * Обидва закони наводять коди в номенклатурі `NKD 2007`. Її скасовано:
 * `Odluka o Nacionalnoj klasifikaciji djelatnosti 2025. — NKD 2025.`
 * (NN 47/24) застосовується від 1 січня 2025 і додає п'ятизначні підкласи.
 * Законодавець переліки не переписав. Тому код, який обрт має сьогодні за
 * `NKD 2025`, не обов'язково збігається з тим, що надрукований у законі.
 *
 * TODO: немає джерела на офіційну таблицю відповідності `NKD 2007` → `NKD
 * 2025` для конкретно цих кодів. Поки її немає, довідник зберігає коди так,
 * як їх друкує закон, а зіставлення з чинною класифікацією лишається на
 * користувачеві.
 */

/** Форма коду `NKD`: розділ `55`, група `50.1`, клас `49.31`, підклас `47.111`. */
const OBLIK_SIFRE = /^\d{2}(\.\d{1,3})?$/

/** Запис довідника: код і назва діяльності хорватською, як її друкує закон. */
export interface NkdStavka {
  /** Код `NKD` у тому записі, у якому його друкує закон: `55`, `50.1`, `49.31`. */
  readonly sifra: string
  /** Назва діяльності (naziv djelatnosti) хорватською, дослівно з тексту закону. */
  readonly naziv: string
}

/**
 * Застереження для коду, який закон бере не повністю, а лише в перелічених
 * межах. Тоді сума нарахована умовно: чи належить діяльність обрту до цих
 * меж, з самого коду `NKD` не видно.
 */
export const napomenaZaOgranicenje = (sifra: string, ogranicenje: string): string =>
  `Закон бере NKD ${sifra} не повністю, а лише в частині: «${ogranicenje}». Сума нарахована за припущення, що діяльність обрту до неї належить.`

/**
 * Зводить код до цифр, щоб порівнювати ієрархічно: розділ `55` є префіксом
 * своїх груп і класів рівно тому, що `NKD` кодує ієрархію позиціями цифр.
 */
export const normalizirajNkd = (sifra: string): string => {
  const trimmed = sifra.trim()
  if (!OBLIK_SIFRE.test(trimmed)) {
    throw new Error(
      `«${sifra}» не має форми коду NKD (55, 50.1, 49.31 або 47.111) — застосовність платежу за ним визначити не можна`,
    )
  }
  return trimmed.replace('.', '')
}

/**
 * Найточніший запис, під який підпадає код.
 *
 * Переліки законів перекриваються: `čl. 5.` називає `45.20` у `treća skupina`,
 * а весь розділ `45` — у `peta`. Виграє довший префікс, бо інакше результат
 * залежав би від порядку рядків у таблиці, а не від закону.
 */
export const najtocnijiPogodak = <T extends { readonly sifra: string }>(
  sifra: string,
  unosi: readonly T[],
): T | undefined => {
  const kod = normalizirajNkd(sifra)

  let najbolji: T | undefined
  let duljina = 0
  for (const unos of unosi) {
    const uzorak = normalizirajNkd(unos.sifra)
    if (!kod.startsWith(uzorak)) continue
    if (uzorak.length <= duljina) continue
    najbolji = unos
    duljina = uzorak.length
  }
  return najbolji
}

/**
 * Коди, які називають два закони про `turistička članarina` і `spomenička
 * renta`. Назви — дослівно з тексту відповідного закону.
 *
 * Розділ `61` обидва закони називають по-різному: `Zakon o članarinama`
 * пише «Elektroničke komunikacije», `Zakon o zaštiti i očuvanju kulturnih
 * dobara` — «Telekomunikacije». Йдеться про той самий розділ; тут стоїть
 * назва класифікації.
 */
export const nkdDirektorij: readonly NkdStavka[] = [
  // Zakon o članarinama u turističkim zajednicama, čl. 5. st. 1., prva skupina.
  { sifra: '49.31', naziv: 'Gradski i prigradski kopneni prijevoz putnika' },
  { sifra: '49.32', naziv: 'Taksi-služba' },
  { sifra: '49.39', naziv: 'Ostali kopneni prijevoz putnika, d. n.' },
  { sifra: '50.1', naziv: 'Pomorski i obalni prijevoz putnika' },
  { sifra: '51.10', naziv: 'Zračni prijevoz putnika' },
  { sifra: '52.23', naziv: 'Uslužne djelatnosti u vezi sa zračnim prijevozom' },
  { sifra: '55', naziv: 'Smještaj' },
  { sifra: '56', naziv: 'Djelatnosti pripreme i usluživanja hrane i pića' },
  { sifra: '65.12', naziv: 'Ostalo osiguranje' },
  {
    sifra: '66.12',
    naziv: 'Djelatnosti posredovanja u poslovanju vrijednosnim papirima i robnim ugovorima',
  },
  { sifra: '68', naziv: 'Poslovanje nekretninama' },
  { sifra: '73.11', naziv: 'Agencije za promidžbu' },
  {
    sifra: '77.21',
    naziv: 'Iznajmljivanje i davanje u zakup (leasing) opreme za rekreaciju i sport',
  },
  {
    sifra: '79',
    naziv:
      'Putničke agencije, organizatori putovanja (turoperatori) i ostale rezervacijske usluge te djelatnosti povezane s njima',
  },
  { sifra: '82.3', naziv: 'Organizacija sastanaka i poslovnih sajmova' },
  { sifra: '92', naziv: 'Djelatnosti kockanja i klađenja' },
  { sifra: '93.12', naziv: 'Djelatnosti sportskih klubova' },
  { sifra: '93.21', naziv: 'Djelatnosti zabavnih i tematskih parkova' },
  { sifra: '93.29', naziv: 'Ostale zabavne i rekreacijske djelatnosti' },

  // …druga skupina.
  { sifra: '50.3', naziv: 'Prijevoz putnika unutrašnjim vodenim putovima' },
  { sifra: '52.29', naziv: 'Ostale prateće djelatnosti u prijevozu' },
  { sifra: '61', naziv: 'Telekomunikacije' },
  {
    sifra: '77.11',
    naziv:
      'Iznajmljivanje i davanje u zakup (leasing) automobila i motornih vozila lake kategorije',
  },
  {
    sifra: '77.34',
    naziv: 'Iznajmljivanje i davanje u zakup (leasing) plovnih prijevoznih sredstava',
  },
  {
    sifra: '77.35',
    naziv: 'Iznajmljivanje i davanje u zakup (leasing) zračnih prijevoznih sredstava',
  },

  // …treća skupina.
  { sifra: '45.20', naziv: 'Održavanje i popravak motornih vozila' },
  { sifra: '53', naziv: 'Poštanske i kurirske djelatnosti' },
  { sifra: '59.11', naziv: 'Proizvodnja filmova, videofilmova i televizijskog programa' },
  { sifra: '59.14', naziv: 'Djelatnosti prikazivanja filmova' },
  { sifra: '81.30', naziv: 'Uslužne djelatnosti uređenja i održavanja krajolika' },
  { sifra: '90.01', naziv: 'Izvođačka umjetnost' },
  { sifra: '90.04', naziv: 'Rad umjetničkih objekata' },

  // …četvrta skupina.
  { sifra: '45.1', naziv: 'Trgovina motornim vozilima' },
  { sifra: '45.32', naziv: 'Trgovina na malo dijelovima i priborom za motorna vozila' },
  {
    sifra: '45.40',
    naziv:
      'Trgovina motociklima, dijelovima i priborom za motocikle te održavanje i popravak motocikala',
  },
  { sifra: '47', naziv: 'Trgovina na malo, osim trgovine motornim vozilima i motociklima' },
  { sifra: '58.11', naziv: 'Izdavanje knjiga' },
  { sifra: '58.13', naziv: 'Izdavanje novina' },
  { sifra: '58.14', naziv: 'Izdavanje časopisa i periodičnih publikacija' },
  { sifra: '58.19', naziv: 'Ostala izdavačka djelatnost' },
  { sifra: '59.13', naziv: 'Distribucija filmova, videofilmova i televizijskog programa' },
  { sifra: '59.2', naziv: 'Djelatnosti snimanja zvučnih zapisa i izdavanja glazbenih zapisa' },
  { sifra: '60', naziv: 'Emitiranje programa' },
  { sifra: '74.1', naziv: 'Specijalizirane dizajnerske djelatnosti' },

  // …peta skupina.
  {
    sifra: '45',
    naziv:
      'Trgovina na veliko i na malo motornim vozilima i motociklima; popravak motornih vozila i motocikala',
  },
  { sifra: '45.31', naziv: 'Trgovina na veliko dijelovima i priborom za motorna vozila' },
  { sifra: '46.2', naziv: 'Trgovina na veliko poljoprivrednim sirovinama i živom stokom' },
  { sifra: '46.3', naziv: 'Trgovina na veliko hranom, pićima i duhanom' },
  { sifra: '46.4', naziv: 'Trgovina na veliko proizvodima za kućanstvo' },
  { sifra: '46.5', naziv: 'Trgovina na veliko informacijsko-komunikacijskom opremom' },
  { sifra: '46.6', naziv: 'Trgovina na veliko ostalim strojevima, opremom i priborom' },
  { sifra: '46.7', naziv: 'Ostala specijalizirana trgovina na veliko' },
  { sifra: '46.9', naziv: 'Nespecijalizirana trgovina na veliko' },

  // Zakon o zaštiti i očuvanju kulturnih dobara, čl. 117. st. 1.
  { sifra: '46.35', naziv: 'Trgovina na veliko duhanskim proizvodima' },
  { sifra: '46.45', naziv: 'Trgovina na veliko parfemima i kozmetikom' },
  {
    sifra: '47.26',
    naziv: 'Trgovina na malo duhanskim proizvodima u specijaliziranim prodavaonicama',
  },
  { sifra: '64.1', naziv: 'Novčarsko posredovanje' },
  {
    sifra: '66.1',
    naziv: 'Pomoćne djelatnosti kod financijskih usluga, osim osiguranja i mirovinskih fondova',
  },
  { sifra: '92.00', naziv: 'Djelatnosti kockanja i klađenja' },
]

/**
 * Назва діяльності за точним кодом довідника. Кидає виняток на коді, якого
 * в довіднику немає: мовчазний прочерк у поясненні платежу — гірше за збій,
 * бо виглядає як відповідь.
 */
export const nazivNkd = (sifra: string): string => {
  const kod = normalizirajNkd(sifra)
  const stavka = nkdDirektorij.find((s) => normalizirajNkd(s.sifra) === kod)
  if (stavka === undefined) {
    throw new Error(`Коду NKD «${sifra}» немає в довіднику — його назву взяти нізвідки`)
  }
  return stavka.naziv
}
