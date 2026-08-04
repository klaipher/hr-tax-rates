import type { Doprinos, Izracun, Rezim } from '@hr-tax/engine'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'
import { Prijevod } from './i18n/Prijevod.tsx'
import { RazlogNedostupnosti } from './RazlogNedostupnosti.tsx'

/** Прочерк замість числа, якого немає. Не текст — знак, однаковий усюди. */
const BEZ_VRIJEDNOSTI = '—'

const DoprinosRedak = ({ doprinos }: { readonly doprinos: Doprinos }) => {
  const { t, format } = useI18n()

  return (
    <div className="redak">
      <dt>
        <span className="redak__naziv">
          {doprinos.naziv.hr}
          <span className="udio">{t.kartica.udioOsnovice(format.percent(doprinos.stopa))}</span>
        </span>
        <Prijevod pojam={doprinos.naziv.hr} />
        {doprinos.osobnaStednja ? (
          // II. stup іде на індивідуальний рахунок платника. Показувати його
          // нарівні з податком означало б рахувати відкладені гроші втраченими.
          <span className="znak-stednje">{t.kartica.osobnaStednja}</span>
        ) : null}
        <Izvor izvor={doprinos.izvor} />
      </dt>
      <dd>{format.eur(doprinos.godisnjiIznos)}</dd>
    </div>
  )
}

const Izracunato = ({ izracun }: { readonly izracun: Izracun }) => {
  const { t, format } = useI18n()

  return (
    <>
      <p className="glavno">
        <output className="glavno__iznos">{format.eur(izracun.netoZaOsobu)}</output>
        <span className="glavno__oznaka">{t.kartica.ostaje}</span>
      </p>
      <p className="stopa">
        {t.kartica.efektivnaStopa}{' '}
        <strong>
          {izracun.efektivnaStopa === undefined
            ? BEZ_VRIJEDNOSTI
            : format.percent(izracun.efektivnaStopa)}
        </strong>
      </p>

      {izracun.razred === undefined ? null : (
        <p className="razred">
          {/* `razred` — канонічний хорватський термін, однаковий у кожній
              локалі; перекладається лише пояснення поруч. */}
          <strong>razred {format.number(izracun.razred.redniBroj)}</strong>
          <span className="prijevod">
            {t.kartica.razredPrijevod(format.eur(izracun.razred.gornjaGranica))}
          </span>
          <Izvor izvor={izracun.razred.izvor} />
        </p>
      )}

      <dl className="rozbivka">
        {/*
          Податків може бути кілька: `obrt na dobit` платить три різні за двома
          законами. Кожен показується своїм рядком зі своєю статтею — схлопнути
          їх в один означало б втратити і суми, і джерела.
        */}
        {izracun.porezi.map((porez) => (
          <div className="redak" key={porez.naziv.hr}>
            <dt>
              <span className="redak__naziv">
                {porez.naziv.hr}
                <span className="udio">
                  {t.kartica.udioPoreza(
                    format.percent(porez.stopa),
                    format.eur(porez.poreznaOsnovica),
                  )}
                </span>
              </span>
              <Prijevod pojam={porez.naziv.hr} />
              <Izvor izvor={porez.izvor} />
            </dt>
            <dd>{format.eur(porez.godisnjiIznos)}</dd>
          </div>
        ))}

        <DoprinosRedak doprinos={izracun.doprinosi.moPrviStup} />
        <DoprinosRedak doprinos={izracun.doprinosi.moDrugiStup} />
        <DoprinosRedak doprinos={izracun.doprinosi.zo} />

        <div className="redak redak--zbroj">
          <dt>
            <span className="redak__naziv">{t.kartica.doprinosiUkupno}</span>
            <span className="prijevod">
              {t.kartica.doprinosiOsnovica(format.eur(izracun.doprinosi.mjesecnaOsnovica))}
            </span>
          </dt>
          <dd>{format.eur(izracun.doprinosi.ukupnoGodisnje)}</dd>
        </div>
      </dl>
    </>
  )
}

/**
 * Картка режиму. Чистий показ результату рушія: жодного числа тут не
 * рахується — інакше правило жило б у двох місцях і розійшлося б.
 */
export const RezimKartica = ({ rezim }: { readonly rezim: Rezim }) => {
  const { t } = useI18n()

  return (
    <article
      className={rezim.ishod.status === 'nedostupno' ? 'kartica kartica--nedostupna' : 'kartica'}
    >
      <header className="kartica__zaglavlje">
        <h2>{rezim.naziv.hr}</h2>
        <Prijevod pojam={rezim.naziv.hr} />
      </header>

      {rezim.ishod.status === 'nedostupno' ? (
        <>
          <p className="oznaka-nedostupno">{t.kartica.nedostupno}</p>
          <RazlogNedostupnosti id={rezim.id} />
        </>
      ) : (
        <Izracunato izracun={rezim.ishod.izracun} />
      )}
    </article>
  )
}
