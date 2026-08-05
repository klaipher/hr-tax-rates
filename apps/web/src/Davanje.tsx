import type { Napomena, RazlogNeprimjene } from '@hr-tax/data'
import type { NapomenaRezima } from '@hr-tax/engine'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Чому обов'язковий платіж не нараховано і за яких застережень нараховано.
 *
 * Рушій віддає і причину, і застереження кодом із параметрами, а не готовим
 * реченням (ADR-0004): шар даних мови читача не знає. Тому текст складається
 * тут, з тих самих чисел і кодів, які повернув розрахунок.
 *
 * Це та різниця, заради якої незастосовний платіж узагалі лишається в
 * переліку: «не забули» і «нічого не винен» на екрані виглядають однаково,
 * поки поруч не стоїть причина.
 */
export const RazlogNeprimjeneDavanja = ({ razlog }: { readonly razlog: RazlogNeprimjene }) => {
  const { t, format } = useI18n()
  const tekst = t.kartica.davanjaRazlozi

  switch (razlog.kod) {
    case 'novootvoreni-obrt':
      return (
        <p className="razlog">
          {tekst['novootvoreni-obrt'](format.number(razlog.oslobodenjeGodina))}
        </p>
      )

    case 'djelatnost-izvan-popisa':
      return <p className="razlog">{tekst['djelatnost-izvan-popisa'](razlog.nkd)}</p>

    default:
      return <p className="razlog">{tekst[razlog.kod]}</p>
  }
}

/** Застереження, за якого нарахована сума може виявитися іншою. */
export const NapomenaDavanja = ({ napomena }: { readonly napomena: Napomena }) => {
  const { t } = useI18n()
  const tekst = t.kartica.davanjaNapomene

  switch (napomena.kod) {
    case 'ogranicenje-nkd':
      // `ogranicenje` — дослівна цитата з тексту акта хорватською, і вона
      // лишається такою в кожній локалі, як і сам термін.
      return (
        <p className="razlog">{tekst['ogranicenje-nkd'](napomena.nkd, napomena.ogranicenje)}</p>
      )

    case 'stopa-je-gornja-granica':
      return <p className="razlog">{tekst['stopa-je-gornja-granica'](napomena.stopa)}</p>

    default:
      return <p className="razlog">{tekst[napomena.kod]}</p>
  }
}

/**
 * Застереження до самого розрахунку.
 *
 * Пара до `NapomenaDavanja`, але про інше: та каже, чому сума платежу може
 * виявитися іншою, а ця — як прочитано вхід і що закон зробив із введеним
 * числом. Числа приходять `Money` й `Sourced`, тож ведуть до статті замість
 * того, щоб потонути в чужому рядку (ADR-0002, ADR-0004).
 */
export const NapomenaIzracuna = ({ napomena }: { readonly napomena: NapomenaRezima }) => {
  const { t, format } = useI18n()
  const tekst = t.kartica.napomeneRezima

  switch (napomena.kod) {
    case 'bruto-placa-nije-primitak':
      return (
        <p className="razlog">
          {tekst['bruto-placa-nije-primitak'](format.eur(napomena.trosakZaPoslodavca))}
        </p>
      )

    case 'umanjena-osnovica-prvog-stupa':
      return (
        <p className="razlog">
          {tekst['umanjena-osnovica-prvog-stupa'](format.eur(napomena.umanjenje))}
          <Izvor izvor={napomena.izvor} />
        </p>
      )

    case 'ispod-minimalne-place':
      return (
        <p className="razlog">
          {tekst['ispod-minimalne-place'](format.eur(napomena.minimalna))}
          <Izvor izvor={napomena.izvor} />
        </p>
      )

    case 'placa-podignuta-na-najnizu-osnovicu':
      return (
        <p className="razlog">
          {tekst['placa-podignuta-na-najnizu-osnovicu'](
            format.eur(napomena.trazena),
            format.eur(napomena.primijenjena),
          )}
          <Izvor izvor={napomena.izvor} />
        </p>
      )

    case 'prag-plave-karte':
      return (
        <p className="razlog">
          {napomena.dosegnut
            ? tekst['prag-plave-karte-dosegnut'](format.eur(napomena.prag))
            : tekst['prag-plave-karte-nedosegnut'](format.eur(napomena.prag))}
          <Izvor izvor={napomena.izvor} />
        </p>
      )

    case 'olaksica-za-mlade-kao-povrat':
      return (
        <p className="razlog">
          {tekst['olaksica-za-mlade-kao-povrat'](format.eur(napomena.iznos))}
          <Izvor izvor={napomena.izvor} />
        </p>
      )

    default:
      return <p className="razlog">{tekst[napomena.kod]}</p>
  }
}
