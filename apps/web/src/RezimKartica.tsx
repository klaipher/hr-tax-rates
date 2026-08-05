import type { Doprinos, Izracun, ObveznoDavanje, Porez, Rezim } from '@hr-tax/engine'
import { NapomenaDavanja, RazlogNeprimjeneDavanja } from './Davanje.tsx'
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

/**
 * Рядок податку. Однаковий у розбивці й у складеному переліку — інакше
 * приховане виглядало б іншим за суттю, а воно те саме.
 */
const PorezRedak = ({ porez }: { readonly porez: Porez }) => {
  const { t, format } = useI18n()

  return (
    <div className="redak">
      <dt>
        <span className="redak__naziv">
          {porez.naziv.hr}
          <span className="udio">
            {t.kartica.udioPoreza(format.percent(porez.stopa), format.eur(porez.poreznaOsnovica))}
          </span>
        </span>
        <Prijevod pojam={porez.naziv.hr} />
        <Izvor izvor={porez.izvor} />
      </dt>
      <dd>{format.eur(porez.godisnjiIznos)}</dd>
    </div>
  )
}

const DavanjeRedak = ({ davanje }: { readonly davanje: ObveznoDavanje }) => {
  const { t, format } = useI18n()

  return (
    <div className="redak">
      <dt>
        <span className="redak__naziv">{davanje.naziv.hr}</span>
        <Prijevod pojam={davanje.naziv.hr} />
        {davanje.status === 'ne-primjenjuje-se' ? (
          <RazlogNeprimjeneDavanja razlog={davanje.razlog} />
        ) : (
          davanje.napomene.map((napomena) => (
            <NapomenaDavanja key={napomena.kod} napomena={napomena} />
          ))
        )}
        <Izvor izvor={davanje.izvor} />
      </dt>
      <dd>
        {davanje.status === 'obračunato'
          ? format.eur(davanje.godisnjiIznos)
          : t.kartica.davanjaNema}
      </dd>
    </div>
  )
}

const Izracunato = ({ izracun }: { readonly izracun: Izracun }) => {
  const { t, format } = useI18n()

  /*
    Що не застосовується — під згортку, а не в розбивку поруч із сумами.
    `obrt na dobit` платить три податки за двома законами, і два з них
    нульові, доки власник не виймає гроші; поруч із ними стоять іще два
    платежі, які взагалі не виникають без NKD. П'ять рядків «нуль» ховали
    справжні суми серед себе.

    Саме під згортку, а не геть: нуль за законом і «ми про це не подумали» —
    різні речі, і причина, чому платіж не виникає, лишається за один клік.
  */
  const neprimjenjiviPorezi = izracun.porezi.filter((porez) => porez.godisnjiIznos.amount.isZero())
  const primjenjiviPorezi = izracun.porezi.filter((porez) => !porez.godisnjiIznos.amount.isZero())
  const neprimjenjivaDavanja = izracun.obveznaDavanja.filter(
    (davanje) => davanje.status !== 'obračunato',
  )
  const primjenjivaDavanja = izracun.obveznaDavanja.filter(
    (davanje) => davanje.status === 'obračunato',
  )
  const skriveno = neprimjenjiviPorezi.length + neprimjenjivaDavanja.length

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
        {primjenjiviPorezi.map((porez) => (
          <PorezRedak key={porez.naziv.hr} porez={porez} />
        ))}

        <DoprinosRedak doprinos={izracun.doprinosi.moPrviStup} />
        <DoprinosRedak doprinos={izracun.doprinosi.moDrugiStup} />
        <DoprinosRedak doprinos={izracun.doprinosi.zo} />

        {/* Обов'язкові платежі поза податками і внесками. */}
        {primjenjivaDavanja.map((davanje) => (
          <DavanjeRedak key={davanje.naziv.hr} davanje={davanje} />
        ))}

        <div className="redak redak--zbroj">
          <dt>
            <span className="redak__naziv">{t.kartica.doprinosiUkupno}</span>
            {/*
              Місячної `osnovica` немає в діяльності поряд із наймом: там база
              річна за законом. Показувати «місячну базу» там означало б
              вигадати число, тож рядок просто зникає.
            */}
            {izracun.doprinosi.mjesecnaOsnovica !== undefined && (
              <span className="prijevod">
                {t.kartica.doprinosiOsnovica(format.eur(izracun.doprinosi.mjesecnaOsnovica))}
              </span>
            )}
            {/* Наскільки менші внески виходять із наймом — те, заради чого
                найм узагалі варто зберігати. Число рахує рушій. */}
            {izracun.doprinosi.ustedaUzRadniOdnos !== undefined && (
              <span className="prijevod">
                {t.kartica.ustedaUzRadniOdnos(format.eur(izracun.doprinosi.ustedaUzRadniOdnos))}
              </span>
            )}
          </dt>
          <dd>{format.eur(izracun.doprinosi.ukupnoGodisnje)}</dd>
        </div>
      </dl>

      {skriveno > 0 && (
        <details className="neprimjenjivo">
          <summary>{t.kartica.neprimjenjivo(format.number(skriveno))}</summary>
          <dl className="rozbivka">
            {neprimjenjiviPorezi.map((porez) => (
              <PorezRedak key={porez.naziv.hr} porez={porez} />
            ))}
            {neprimjenjivaDavanja.map((davanje) => (
              <DavanjeRedak key={davanje.naziv.hr} davanje={davanje} />
            ))}
          </dl>
        </details>
      )}
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
          <RazlogNedostupnosti razlog={rezim.ishod.razlog} />
        </>
      ) : (
        <Izracunato izracun={rezim.ishod.izracun} />
      )}
    </article>
  )
}
