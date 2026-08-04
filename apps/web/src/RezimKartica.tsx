import type { Doprinos, Izracun, Rezim } from '@hr-tax/engine'
import { formatEur, formatPostotak } from '@hr-tax/engine'
import { Izvor } from './Izvor.tsx'

const DoprinosRedak = ({ doprinos }: { readonly doprinos: Doprinos }) => (
  <div className="redak">
    <dt>
      <span className="redak__naziv">
        {doprinos.naziv.hr}
        <span className="udio">{formatPostotak(doprinos.stopa)} osnovica</span>
      </span>
      <span className="prijevod">{doprinos.naziv.uk}</span>
      {doprinos.osobnaStednja ? (
        // II. stup іде на індивідуальний рахунок платника. Показувати його
        // нарівні з податком означало б рахувати відкладені гроші втраченими.
        <span className="znak-stednje">персональні відкладені кошти</span>
      ) : null}
      <Izvor izvor={doprinos.izvor} />
    </dt>
    <dd>{formatEur(doprinos.godisnjiIznos)}</dd>
  </div>
)

const Izracunato = ({ izracun }: { readonly izracun: Izracun }) => (
  <>
    <p className="glavno">
      <output className="glavno__iznos">{formatEur(izracun.netoZaOsobu)}</output>
      <span className="glavno__oznaka">лишається за рік, до фактичного izdatak</span>
    </p>
    <p className="stopa">
      ефективна ставка{' '}
      <strong>
        {izracun.efektivnaStopa === undefined ? '—' : formatPostotak(izracun.efektivnaStopa)}
      </strong>
    </p>

    {izracun.razred === undefined ? null : (
      <p className="razred">
        <strong>razred {izracun.razred.redniBroj}</strong>
        <span className="prijevod">розряд · стеля {formatEur(izracun.razred.gornjaGranica)}</span>
        <Izvor izvor={izracun.razred.izvor} />
      </p>
    )}

    <dl className="rozbivka">
      <div className="redak">
        <dt>
          <span className="redak__naziv">
            {izracun.porez.naziv.hr}
            <span className="udio">
              {formatPostotak(izracun.porez.stopa)} від {formatEur(izracun.porez.osnovica)}
            </span>
          </span>
          <span className="prijevod">{izracun.porez.naziv.uk}</span>
          <Izvor izvor={izracun.porez.izvor} />
        </dt>
        <dd>{formatEur(izracun.porez.godisnjiIznos)}</dd>
      </div>

      <DoprinosRedak doprinos={izracun.doprinosi.moPrviStup} />
      <DoprinosRedak doprinos={izracun.doprinosi.moDrugiStup} />
      <DoprinosRedak doprinos={izracun.doprinosi.zo} />

      <div className="redak redak--zbroj">
        <dt>
          <span className="redak__naziv">doprinosi разом</span>
          <span className="prijevod">
            osnovica {formatEur(izracun.doprinosi.mjesecnaOsnovica)} на місяць
          </span>
        </dt>
        <dd>{formatEur(izracun.doprinosi.ukupnoGodisnje)}</dd>
      </div>
    </dl>
  </>
)

/**
 * Картка режиму. Чистий показ результату рушія: жодного числа тут не
 * рахується — інакше правило жило б у двох місцях і розійшлося б.
 */
export const RezimKartica = ({ rezim }: { readonly rezim: Rezim }) => (
  <article
    className={rezim.ishod.status === 'nedostupno' ? 'kartica kartica--nedostupna' : 'kartica'}
  >
    <header className="kartica__zaglavlje">
      <h2>{rezim.naziv.hr}</h2>
      <p className="prijevod">{rezim.naziv.uk}</p>
    </header>

    {rezim.ishod.status === 'nedostupno' ? (
      <>
        <p className="oznaka-nedostupno">недоступно</p>
        <p className="razlog">{rezim.ishod.razlog}</p>
      </>
    ) : (
      <Izracunato izracun={rezim.ishod.izracun} />
    )}
  </article>
)
