/**
 * Довідник `NKD` (вид діяльності / activity code), розкладений по групах для
 * вибору у формі.
 *
 * Окремим модулем, а не полем у `nkdDirektorij`, бо приналежність до групи —
 * не властивість коду, а те, куди його відніс конкретний закон:
 * `Zakon o članarinama` розводить коди по п'яти `skupina` зі своїми ставками,
 * `Zakon o zaštiti i očuvanju kulturnih dobara` тримає власний перелік.
 * `nkd.ts` про жоден із цих законів не знає й знати не повинен — це вони
 * імпортують його, а не навпаки.
 *
 * Назв груп тут немає, лише коди (ADR-0004): «prva skupina» англійською й
 * українською пишеться по-різному, і місце для цього — словник інтерфейсу.
 */

import { type NkdStavka, nkdDirektorij, normalizirajNkd } from './nkd.ts'
import { INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI } from './spomenicka-renta.ts'
import { type Skupina, TURISTICKA_CLANARINA_DJELATNOSTI } from './turisticka-clanarina.ts'

/** Куди закон відніс код: `skupina` туристичної внески або перелік ренти. */
export type KodSkupineNkd = `turisticka-${Skupina}` | 'spomenicka'

/** Група кодів для вибору: код групи і її записи в порядку довідника. */
export interface SkupinaIzboraNkd {
  readonly kod: KodSkupineNkd
  readonly stavke: readonly NkdStavka[]
}

const SKUPINE: readonly Skupina[] = ['prva', 'druga', 'treca', 'cetvrta', 'peta']

/** Запис довідника за кодом. Кидає виняток: перелік без назви — недогляд виписки. */
const stavkaZa = (sifra: string): NkdStavka => {
  const kod = normalizirajNkd(sifra)
  const stavka = nkdDirektorij.find((s) => normalizirajNkd(s.sifra) === kod)
  if (stavka === undefined) {
    throw new Error(
      `Код NKD «${sifra}» названий у переліку закону, але його немає в nkdDirektorij — назву взяти нізвідки`,
    )
  }
  return stavka
}

/**
 * Довідник по групах.
 *
 * Порядок груп — від найдорожчої ставки до найдешевшої, як їх друкує
 * `čl. 5. st. 1.`, а рента остання: вона з іншого закону й до ставок
 * туристичної внески стосунку не має.
 */
export const nkdPoSkupinama: readonly SkupinaIzboraNkd[] = [
  ...SKUPINE.map((skupina) => ({
    kod: `turisticka-${skupina}` as const,
    stavke: TURISTICKA_CLANARINA_DJELATNOSTI.value
      .filter((d) => d.skupina === skupina)
      .map((d) => stavkaZa(d.sifra)),
  })),
  {
    kod: 'spomenicka' as const,
    // Розділ `61` названий обома законами; у виборі він лишається там, де
    // з'явився вперше, — інакше той самий код стояв би у списку двічі.
    stavke: INDIREKTNA_SPOMENICKA_RENTA_DJELATNOSTI.value
      .filter(
        (d) =>
          !TURISTICKA_CLANARINA_DJELATNOSTI.value.some(
            (t) => normalizirajNkd(t.sifra) === normalizirajNkd(d.sifra),
          ),
      )
      .map((d) => stavkaZa(d.sifra)),
  },
]
