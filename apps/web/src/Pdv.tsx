import { pdvPravila2026 } from '@hr-tax/data'
import {
  eur,
  type Money,
  type PdvStatus,
  type TipKlijenta,
  usporediSustavPdv,
} from '@hr-tax/engine'
import { useMemo } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * `PDV` — і вихідна сторона, і вхідна.
 *
 * Вихідна для типового релоканта нейтральна: рахунок бізнесу в ЄС іде за
 * `prijenos porezne obveze`. Уся вага на вхідній — самонарахування 25% на
 * послуги, куплені за кордоном, без права на відрахування. Звідси інверсія:
 * вхід у систему `PDV` цю витрату **прибирає**, і чим більше закордонних
 * послуг, тим дорожче обходиться життя під порогом.
 */
export const Pdv = ({
  godisnjiPrimitak,
  tipKlijenta,
  inozemneUsluge,
}: {
  readonly godisnjiPrimitak: Money<'EUR'>
  readonly tipKlijenta: TipKlijenta
  readonly inozemneUsluge: number
}) => {
  const { t, format } = useI18n()

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

  /** Колонка стану, який нав'язує закон, виділяється; друга лишається довідкою. */
  const stupac = (status: PdvStatus) =>
    status === obvezniStatus ? 'pdv__stupac pdv__stupac--obvezni' : 'pdv__stupac'

  return (
    <section className="pdv">
      <h2>PDV</h2>

      <p className="pdv__status">
        {t.pdv.status(t.pdv.statusi[obvezniStatus])}
        <Izvor izvor={usporedba.izvorStatusa} />
      </p>

      {/*
        Два стани поруч, а не один. Показувати лише «поза системою» означало
        нічого не показувати: під порогом і з нульовими закордонними послугами
        там усе нуль, і перемикання типу клієнта не змінює на екрані нічого —
        тоді як уся суть у різниці між станами.
      */}
      <table className="pdv__tablica">
        <thead>
          <tr>
            <th scope="col">
              <span className="vizualno-skriveno">{t.pdv.stavka}</span>
            </th>
            {/*
              Обидва стани показані, але видно, який із них нав'язує закон:
              вище порогу «поза системою» вже не вибір, а нижче нього — вибір.
              Без позначки таблиця читалася б як два рівноправні варіанти.
            */}
            <th scope="col" className={stupac('izvan-sustava')}>
              {t.pdv.statusi['izvan-sustava']}
              {obvezniStatus === 'izvan-sustava' && (
                <span className="pdv__oznaka">{t.pdv.premaZakonu}</span>
              )}
            </th>
            <th scope="col" className={stupac('u-sustavu')}>
              {t.pdv.statusi['u-sustavu']}
              {obvezniStatus === 'u-sustavu' && (
                <span className="pdv__oznaka">{t.pdv.premaZakonu}</span>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">
              <span className="redak__naziv">{t.pdv.izlaz}</span>
              <Izvor izvor={izvanSustava.izlaz.izvor} />
            </th>
            <td className={stupac('izvan-sustava')}>
              {format.eur(izvanSustava.izlaz.godisnjiPdv)}
            </td>
            <td className={stupac('u-sustavu')}>{format.eur(uSustavu.izlaz.godisnjiPdv)}</td>
          </tr>
          <tr>
            <th scope="row">
              <span className="redak__naziv">{t.pdv.nepovratni}</span>
              <Izvor izvor={izvanSustava.ulaz.izvorSamoobracuna} />
              <Izvor izvor={izvanSustava.ulaz.izvorOdbitka} />
            </th>
            <td className={stupac('izvan-sustava')}>
              {format.eur(izvanSustava.ulaz.nepovratniPdv)}
            </td>
            <td className={stupac('u-sustavu')}>{format.eur(uSustavu.ulaz.nepovratniPdv)}</td>
          </tr>
        </tbody>
      </table>

      {/*
        Нулі можуть бути законними, і тоді треба сказати чому — інакше вони
        читаються як зламаний розрахунок.
      */}
      {izvanSustava.izlaz.godisnjiPdv.amount.isZero() &&
        uSustavu.izlaz.godisnjiPdv.amount.isZero() && (
          <p className="razlog">{izvanSustava.izlaz.obrazlozenje}</p>
        )}
      {inozemneUsluge === 0 && <p className="razlog">{t.pdv.bezInozemnih}</p>}

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
