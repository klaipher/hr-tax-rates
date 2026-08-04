import type { Ruleset } from '@hr-tax/data'
import { Potpis } from './Potpis.tsx'
import { grupirajPoAktu, pravneStavke, type RazredRedak, type Stavka } from './stavke.ts'
import { tekst } from './tekst.ts'

/**
 * Таблиця розрядів.
 *
 * Звичайна `<table>` з `<caption>` і заголовками рядків та стовпців, а не
 * сітка з `<div>`: розряд, межа й паушальний дохід — це справді таблиця, і
 * зчитувач екрана має читати клітинку разом із її заголовком.
 */
const RazrediTablica = ({ redci }: { readonly redci: readonly RazredRedak[] }) => (
  <div className="izvori-razredi">
    <table>
      <caption className="izvori-razredi__natpis">{tekst.razredi.natpis}</caption>
      <thead>
        <tr>
          <th scope="col">{tekst.razredi.redniBroj}</th>
          <th scope="col">{tekst.razredi.gornjaGranica}</th>
          <th scope="col">{tekst.razredi.pausalniDohodak}</th>
        </tr>
      </thead>
      <tbody>
        {redci.map((redak) => (
          <tr key={redak.redniBroj}>
            <th scope="row">{redak.redniBroj}</th>
            <td>{redak.gornjaGranica}</td>
            <td>{redak.godisnjiPausalniDohodak}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

/** Одне юридичне число: назва, значення, пояснення і підпис статтею. */
const Norma = ({ stavka }: { readonly stavka: Stavka }) => {
  const opis = tekst.stavke[stavka.id]

  return (
    <li className="izvori-norma">
      <div className="izvori-norma__zaglavlje">
        {/* Пробіл явний: без нього хорватський термін і переклад злипаються
            в один рядок для зчитувача екрана. */}
        <p className="izvori-norma__naziv">
          {opis.hr} <span className="izvori-prijevod">{opis.uk}</span>
        </p>
        {stavka.vrsta === 'broj' ? (
          <p className="izvori-norma__vrijednost">{stavka.vrijednost}</p>
        ) : null}
      </div>
      <p className="izvori-norma__opis">{opis.opis}</p>
      {stavka.vrsta === 'tablica' ? <RazrediTablica redci={stavka.redci} /> : null}
      <Potpis izvor={stavka.izvor} />
    </li>
  )
}

/**
 * Юридичні числа розрахунку, згруповані за актом.
 *
 * Числа беруться з того самого `ruleset`, яким рахує рушій, а не з окремого
 * переліку для сторінки: інакше сторінка джерел розійшлася б із розрахунком
 * і перетворилася б із доказу на прикрасу.
 */
export const PravneNorme = ({ ruleset }: { readonly ruleset: Ruleset }) => (
  <section className="izvori-norme" aria-labelledby="izvori-norme-naslov">
    <h3 id="izvori-norme-naslov">{tekst.norme.naslov}</h3>
    <p className="izvori-opis">{tekst.norme.opis}</p>

    {grupirajPoAktu(pravneStavke(ruleset)).map((skupina) => (
      <article className="izvori-akt" key={skupina.kljuc}>
        <h4 className="izvori-akt__naslov">{skupina.act}</h4>
        <p className="izvori-objava">
          {tekst.objava}: {skupina.gazette}
        </p>
        <ul className="izvori-akt__norme">
          {skupina.stavke.map((stavka) => (
            <Norma key={stavka.id} stavka={stavka} />
          ))}
        </ul>
      </article>
    ))}
  </section>
)
