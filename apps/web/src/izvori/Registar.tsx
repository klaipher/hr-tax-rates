import { type Divergence, divergences } from '@hr-tax/data'
import { eur, formatEur } from '@hr-tax/engine'
import type { ReactNode } from 'react'
import { Potpis, Znak } from './Potpis.tsx'
import { poredaj, prebrojPoVrsti, predmetZapisa } from './registar.ts'
import { tekst } from './tekst.ts'

const Polje = ({ naziv, children }: { readonly naziv: string; readonly children: ReactNode }) => (
  <div className="izvori-polja__redak">
    <dt>{naziv}</dt>
    <dd>{children}</dd>
  </div>
)

/**
 * Доказ розбіжності — те, що читач може відкрити у файлі HOK і побачити на
 * власні очі: фрагмент хибної формули, два числа поруч або патерн, якого в
 * книзі немає.
 */
const Dokaz = ({ zapis }: { readonly zapis: Divergence }) => {
  const { polja } = tekst.registar

  switch (zapis.kind) {
    case 'formula':
      return (
        <Polje naziv={polja.formulaContains}>
          <code>{zapis.formulaContains}</code>
        </Polje>
      )
    case 'value':
      return (
        <>
          <Polje naziv={polja.hokValue}>{formatEur(eur(zapis.hokValue))}</Polje>
          <Polje naziv={polja.ourValue}>{formatEur(eur(zapis.ourValue))}</Polje>
        </>
      )
    case 'omission':
      return (
        <Polje naziv={polja.absentPattern}>
          <code>{zapis.absentPattern}</code>
        </Polje>
      )
  }
}

const Zapis = ({ zapis }: { readonly zapis: Divergence }) => (
  <li className="izvori-zapis">
    {/* Пробіл між позначкою й предметом стоїть явно: без нього доступна назва
        заголовка злипається в «хибна формулаPREGLED …». */}
    <h4 className="izvori-zapis__naslov">
      <Znak natpis={tekst.registar.vrste[zapis.kind]} izgled="oznaka" />{' '}
      <span className="izvori-zapis__predmet">{predmetZapisa(zapis)}</span>
    </h4>
    <p className="izvori-zapis__razlog">{zapis.reason}</p>

    <dl className="izvori-polja">
      <Polje naziv={tekst.registar.polja.scenarios}>
        {zapis.scenarios.map((scenarij) => tekst.registar.scenariji[scenarij]).join(' · ')}
      </Polje>
      <Dokaz zapis={zapis} />
    </dl>

    <p className="izvori-zapis__temelj">
      {tekst.registar.temelj}: {zapis.reference.act}
      <span className="izvori-objava">
        {tekst.objava}: {zapis.reference.gazette}
      </span>
    </p>
    <Potpis izvor={zapis.reference} />
  </li>
)

/**
 * Опублікований реєстр розбіжностей із калькуляторами HOK (ADR-0003).
 *
 * Реєстр береться той самий, яким користуються голден-тести, а не окрема
 * копія для сайту: копія розійшлася б із тестами, і сторінка почала б
 * запевняти в тому, чого збірка вже не перевіряє.
 *
 * Найнезручніший факт проєкту — «наші числа не збігаються з числами палати» —
 * тут стоїть на видноті, бо кожна розбіжність підписана статтею закону.
 */
export const Registar = () => {
  const zapisi = poredaj(divergences)

  return (
    <section className="izvori-registar" aria-labelledby="izvori-registar-naslov">
      <h3 id="izvori-registar-naslov">{tekst.registar.naslov}</h3>
      <p className="izvori-opis">{tekst.registar.opis}</p>

      <p className="izvori-registar__sazetak">
        {tekst.registar.ukupno}: <strong>{zapisi.length}</strong>
      </p>
      <ul className="izvori-registar__brojevi">
        {prebrojPoVrsti(divergences).map(({ kind, broj }) => (
          <li key={kind}>
            {tekst.registar.vrste[kind]}: <strong>{broj}</strong>
          </li>
        ))}
      </ul>

      <ol className="izvori-registar__zapisi">
        {zapisi.map((zapis) => (
          <Zapis key={zapis.id} zapis={zapis} />
        ))}
      </ol>
    </section>
  )
}
