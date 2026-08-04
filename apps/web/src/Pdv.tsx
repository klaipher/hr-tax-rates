import { pdvPravila2026 } from '@hr-tax/data'
import { eur, type Money, type TipKlijenta, usporediSustavPdv } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

const TIPOVI: readonly TipKlijenta[] = ['poslovni-eu', 'poslovni-izvan-eu', 'tuzemni']

/**
 * `PDV` — і вихідна сторона, і вхідна.
 *
 * Вихідна для типового релоканта нейтральна: рахунок бізнесу в ЄС іде за
 * `prijenos porezne obveze`. Уся вага на вхідній — самонарахування 25% на
 * послуги, куплені за кордоном, без права на відрахування. Звідси інверсія:
 * вхід у систему `PDV` цю витрату **прибирає**, і чим більше закордонних
 * послуг, тим дорожче обходиться життя під порогом.
 */
export const Pdv = ({ godisnjiPrimitak }: { readonly godisnjiPrimitak: Money<'EUR'> }) => {
  const { t, format } = useI18n()
  const [tipKlijenta, setTipKlijenta] = useState<TipKlijenta>('poslovni-eu')
  const [inozemneUsluge, setInozemneUsluge] = useState(0)

  const usporedba = useMemo(
    () =>
      usporediSustavPdv(
        {
          godisnjiPrimitak,
          tipKlijenta,
          godisnjeInozemneUsluge: eur(inozemneUsluge),
        },
        pdvPravila2026,
      ),
    [godisnjiPrimitak, tipKlijenta, inozemneUsluge],
  )

  const { izvanSustava, uSustavu, obvezniStatus } = usporedba

  return (
    <section className="pdv">
      <h2>PDV</h2>

      <p className="polje">
        <label htmlFor="tip-klijenta">
          {t.pdv.tipKlijenta}
          <span className="prijevod">{t.pdv.tipKlijentaPrijevod}</span>
        </label>
        <select
          id="tip-klijenta"
          value={tipKlijenta}
          onChange={(event) => {
            setTipKlijenta(event.target.value as TipKlijenta)
          }}
        >
          {TIPOVI.map((tip) => (
            <option key={tip} value={tip}>
              {t.pdv.klijenti[tip]}
            </option>
          ))}
        </select>
      </p>

      <p className="polje">
        <label htmlFor="inozemne-usluge">
          {t.pdv.inozemneUsluge}
          <span className="prijevod">{t.pdv.inozemneUslugePrijevod}</span>
        </label>
        <input
          id="inozemne-usluge"
          type="number"
          min={0}
          step={100}
          value={inozemneUsluge}
          onChange={(event) => {
            setInozemneUsluge(Math.max(0, Number(event.target.value)))
          }}
        />
      </p>

      <p className="pdv__status">
        {t.pdv.status(t.pdv.statusi[obvezniStatus])}
        <Izvor izvor={usporedba.izvorStatusa} />
      </p>

      <dl className="rozbivka">
        <div className="redak">
          <dt>
            <span className="redak__naziv">{t.pdv.izlaz}</span>
            <Izvor izvor={izvanSustava.izlaz.izvor} />
          </dt>
          <dd>{format.eur(izvanSustava.izlaz.godisnjiPdv)}</dd>
        </div>
        <div className="redak">
          <dt>
            <span className="redak__naziv">{t.pdv.nepovratni}</span>
            <Izvor izvor={izvanSustava.ulaz.izvorSamoobracuna} />
            <Izvor izvor={izvanSustava.ulaz.izvorOdbitka} />
          </dt>
          <dd>{format.eur(izvanSustava.ulaz.nepovratniPdv)}</dd>
        </div>
        <div className="redak">
          <dt>
            <span className="redak__naziv">{t.pdv.uSustavuNepovratni}</span>
          </dt>
          <dd>{format.eur(uSustavu.ulaz.nepovratniPdv)}</dd>
        </div>
      </dl>

      {/*
        Інверсія одним числом. Дві сторони навмисно не складаються: вихідний
        PDV є клином лише тоді, коли клієнт не може його відрахувати, а рушій
        цього не знає.
      */}
      <p className="pdv__inverzija">{t.pdv.usteda(format.eur(usporedba.ustedaUlazneStrane))}</p>

      {usporedba.obvezaPdvIdentifikacijskogBroja.obvezan && (
        <p className="razlog">
          {t.pdv.pdvId}
          <Izvor izvor={usporedba.obvezaPdvIdentifikacijskogBroja.izvor} />
        </p>
      )}
    </section>
  )
}
