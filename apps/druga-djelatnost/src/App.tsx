import { jedinicaBySifra, resolveStope, sProsjecnomPlacomPrethodneGodine } from '@hr-tax/data'
import type { UlazDrugeDjelatnosti } from '@hr-tax/engine'
import { eur, formatEur, izracunajDrugaDjelatnost } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { dobIzForme, Forma, GlavniUnosi, POCETNO_STANJE, type StanjeForme } from './Forma.tsx'
import { PODLOGA } from './podloga.ts'
import { RazlogNedostupnosti } from './RazlogNedostupnosti.tsx'
import { Rezultat, Sazetak } from './Rezultat.tsx'

/**
 * Калькулятор для того, хто працює за наймом і веде паушальний обрт поряд.
 *
 * Питання тут інше, ніж у сусідньому застосунку. Там шість режимів —
 * альтернативи, і треба обрати одну. Тут джерел двоє одночасно, обирати нема
 * чого, і відповідь — розклад: скільки з якого джерела йде і куди.
 */
/**
 * Період, за який опублікована середня для баз внесків.
 *
 * Кінцева крапка знімається: `Narodne novine` друкують період із нею, і поруч
 * із крапкою речення виходило б дві поспіль.
 */
const PROSJECNA_PLACA_RAZDOBLJE =
  PODLOGA.pretpostavke.prosjecnaPlaca.source.status === 'published'
    ? PODLOGA.pretpostavke.prosjecnaPlaca.source.period.replace(/\.$/, '')
    : 'невідомий період'

export const App = () => {
  const [forma, postaviFormu] = useState<StanjeForme>(POCETNO_STANJE)

  const promijeni = (izmjena: Partial<StanjeForme>) => {
    postaviFormu((prijasnje) => ({ ...prijasnje, ...izmjena }))
  }

  const ishod = useMemo(() => {
    const jedinica = jedinicaBySifra(forma.sifraJedinice)

    const ulaz: UlazDrugeDjelatnosti = {
      godisnjaBrutoPlaca: eur(forma.godisnjaBrutoPlaca),
      godisnjiPrimitakObrta: eur(forma.godisnjiPrimitakObrta),
      stope: jedinica === undefined ? undefined : resolveStope({ jedinica }),
      uzdrzavani: {
        djeca: forma.djeca,
        clanoviUzeObitelji: forma.clanoviUzeObitelji,
        sInvaliditetom: forma.sInvaliditetom,
        sPotpunimInvaliditetom: forma.sPotpunimInvaliditetom,
      },
      dob: dobIzForme(forma),
      noviObrt: forma.noviObrt,
    }

    // Підміняється саме та статистика, яку рухає поле, — і робить це шар
    // даних, а не літерал тут: сусіднє припущення інакше зникло б тихо.
    return izracunajDrugaDjelatnost(ulaz, {
      ...PODLOGA,
      pretpostavke: sProsjecnomPlacomPrethodneGodine(
        PODLOGA.pretpostavke,
        forma.prosjecnaPlacaPrethodneGodine,
      ),
    })
  }, [forma])

  return (
    <main className="stranica">
      <header className="zaglavlje">
        <div>
          <h1>Обрт поряд із наймом</h1>
          <p>
            Ви працюєте за трудовим договором і паралельно ведете paušalni obrt. Для закону це не
            новий режим, а <span className="pojam">druga djelatnost</span> — той самий паушал, але з
            іншою базою внесків і вдвічі меншими ставками. Тут видно, скільки податків іде з якого
            джерела.
          </p>
        </div>
      </header>

      <div className="raspored">
        {/*
          Стовпець результату стоїть у розмітці першим, а ліворуч його ставить
          `order` на широкому екрані. Порядок саме такий, а не зворотний, бо на
          телефоні колонки лягають одна під одну в порядку розмітки: два головні
          поля, картки, підсумок — і аж потім решта налаштувань, які задають раз.
          Зворотна розмітка дала б на телефоні спершу довгу форму, а вже під нею
          те, заради чого людина прийшла.
        */}
        <div className="raspored__ishod">
          <GlavniUnosi stanje={forma} promijeni={promijeni} />

          {ishod.status === 'izracunato' ? (
            <>
              <Rezultat izracun={ishod.izracun} />
              <Sazetak izracun={ishod.izracun} />
            </>
          ) : (
            <RazlogNedostupnosti razlog={ishod.razlog} />
          )}
        </div>

        <div className="raspored__unos">
          <Forma stanje={forma} promijeni={promijeni} />
        </div>
      </div>

      <footer className="pretpostavke">
        <h2>Звідки числа</h2>
        <p className="razlog">
          Закон і статистика — два різні шари (ADR-0001). Правила взяті з чинних актів на 2026 рік;
          середня зарплата, на якій стоять бази внесків, —{' '}
          {formatEur(eur(PODLOGA.pretpostavke.prosjecnaPlaca.value))} за {PROSJECNA_PLACA_RAZDOBLJE}
          . Це <strong>не</strong> те число, що в полі внизу: там середня за повний попередній рік,
          і рухає вона лише поріг EU plava karta.
        </p>
        <p className="razlog">
          Порівняти шість режимів між собою — у сусідньому калькуляторі:{' '}
          <a href="../">податкові режими Хорватії</a>.
        </p>
      </footer>
    </main>
  )
}
