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
          {tekst['bruto-placa-nije-primitak'](
            format.eur(napomena.trosakZaPoslodavca),
            format.eur(napomena.doprinosiPoslodavca),
          )}
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
          {/* Друге речення з'являється лише тому, кого межа справді зачепила:
              нижче 7 000 € брутто вищої ставки немає, і застереження про неї
              сіяло б сумнів там, де пільга таки повертає весь податок. */}
          {napomena.nepovratniDio !== undefined &&
            ` ${tekst['olaksica-za-mlade-nepovratni-dio'](format.eur(napomena.nepovratniDio))}`}
          <Izvor izvor={napomena.izvor} />
        </p>
      )

    case 'porez-na-dobit-postaje-obvezan':
      return (
        <p className="razlog razlog--upozorenje">
          {tekst['porez-na-dobit-postaje-obvezan'](format.eur(napomena.prag))}
          <Izvor izvor={napomena.izvor} />
          <Izvor izvor={napomena.izvorDobrovoljnog} />
        </p>
      )

    case 'neoporezivi-primici-uracunati':
      return (
        <p className="razlog">
          {tekst['neoporezivi-primici-uracunati'](format.eur(napomena.iznos))}
          <Izvor izvor={napomena.stavke.source} />
        </p>
      )

    case 'oslobodenje-za-prvo-zaposlenje':
      return (
        <p className="razlog">
          {tekst['oslobodenje-za-prvo-zaposlenje'](format.eur(napomena.usteda))}
          <Izvor izvor={napomena.izvor} />
          {/* Друге посилання — на означення, а не на саму норму: питання «а чи
              це взагалі я?» тут важливіше за питання «а скільки?», і відповідає
              на нього інша стаття. */}
          <Izvor izvor={napomena.izvorDefinicije} />
        </p>
      )

    case 'umanjenje-za-podrucje':
      return (
        <p className="razlog">
          {tekst['umanjenje-za-podrucje'](format.eur(napomena.iznos))}
          <Izvor izvor={napomena.izvor} />
        </p>
      )

    case 'umanjenje-za-povratnika':
      return (
        <p className="razlog">
          {tekst['umanjenje-za-povratnika'](
            format.eur(napomena.iznos),
            String(napomena.godina.value),
          )}
          <Izvor izvor={napomena.izvor} />
          <Izvor izvor={napomena.izvorIskljucenja} />
        </p>
      )

    default:
      return <p className="razlog">{tekst[napomena.kod]}</p>
  }
}
