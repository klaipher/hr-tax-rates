import type { PausalniObrtPravila, Razred } from '@hr-tax/data'
import { doprinosiOdMjesecneOsnovice } from './doprinosi.ts'
import { add, eur, isGreaterThan, type Money, scale, subtract } from './money.ts'
import type { Doprinosi, Ishod, Podloga, Porez } from './types.ts'

/**
 * Розряд, у який потрапляє `primitak` — перший, чия `gornja granica` його не
 * менша. Таблиця в акті впорядкована за зростанням, і розбір фікстур HOK
 * вимагає того самого, тож перший збіг і є потрібним.
 */
const razredZa = (razredi: readonly Razred[], godisnjiPrimitak: Money<'EUR'>): Razred | undefined =>
  razredi.find((razred) => !isGreaterThan(godisnjiPrimitak, eur(razred.gornjaGranica)))

/**
 * `doprinosi` паушального обрту.
 *
 * `osnovica` будується з `prosječna plaća`, яку публікує статистика, і
 * `koeficijent`, який задає закон, — по одному числу з кожного шару (ADR-0001).
 * Від розряду й від фактичного `primitak` вона не залежить узагалі: тому на
 * низькому `primitak` внески важать більше за сам податок.
 */
const doprinosiZa = ({ ruleset, pretpostavke }: Podloga): Doprinosi =>
  doprinosiOdMjesecneOsnovice(
    scale(eur(pretpostavke.prosjecnaPlaca.value), ruleset.pausalniObrt.koeficijent.value),
    ruleset,
  )

/**
 * `paušalni porez` — ставка на `paušalni dohodak` розряду.
 *
 * База береться з розряду, а не з фактичного `primitak`: `paušalni dohodak` є
 * юридичною фікцією, яку акт друкує готовою для кожного розряду.
 */
const porezZa = (razred: Razred, pravila: PausalniObrtPravila): Porez => {
  const poreznaOsnovica = eur(razred.godisnjiPausalniDohodak)

  return {
    naziv: { hr: 'paušalni porez', uk: 'паушальний податок' },
    poreznaOsnovica,
    stopa: pravila.stopaPoreza.value,
    godisnjiIznos: scale(poreznaOsnovica, pravila.stopaPoreza.value),
    izvor: pravila.stopaPoreza.source,
  }
}

export const izracunajPausalniObrt = (godisnjiPrimitak: Money<'EUR'>, podloga: Podloga): Ishod => {
  const pravila = podloga.ruleset.pausalniObrt
  const prag = eur(pravila.pragPrimitka.value)

  if (isGreaterThan(godisnjiPrimitak, prag)) {
    return {
      status: 'nedostupno',
      razlog: {
        kod: 'iznad-praga-pausala',
        primitak: godisnjiPrimitak,
        prag,
        izvor: podloga.ruleset.pausalniObrt.pragPrimitka.source,
      },
    }
  }

  const razred = razredZa(pravila.razredi.value, godisnjiPrimitak)
  if (razred === undefined) {
    return {
      status: 'nedostupno',
      razlog: {
        kod: 'nedosljedna-tablica-razreda',
        primitak: godisnjiPrimitak,
        prag,
      },
    }
  }

  const porez = porezZa(razred, pravila)
  const doprinosi = doprinosiZa(podloga)
  const obvezniPlacanja = add(porez.godisnjiIznos, doprinosi.ukupnoGodisnje)

  return {
    status: 'izracunato',
    izracun: {
      razred: {
        redniBroj: razred.redniBroj,
        gornjaGranica: eur(razred.gornjaGranica),
        izvor: pravila.razredi.source,
      },
      porezi: [porez],
      ukupanPorez: porez.godisnjiIznos,
      doprinosi,
      // Обов\'язкові платежі додає usporedba.ts — вони однакові для всіх режимів.
      // Повернень цей режим не знає: усе, що нараховано, лишається сплаченим.
      povratPoreza: eur(0),
      // Застережень немає: жодне введене число закон дорогою не підмінив.
      napomene: [],
      obveznaDavanja: [],
      ukupnaDavanja: eur(0),
      ukupniIzdaci: eur(0),
      // Види обов'язків підставляє usporedba.ts: там відомо, який це режим.
      vrsteObveza: {
        porez: 'paušalni porez',
        razlika: 'razlika paušalnog poreza',
        doprinosi: 'doprinosi (paušalni obrt)',
        komorskiDoprinos: 'komorski doprinos',
      },
      netoZaOsobu: subtract(godisnjiPrimitak, obvezniPlacanja),
      // Обидва числа підставляє спільна ланка `usporedba`: вони залежать від
      // витрат і надходжень, яких цей режим не бачить. Нулі тут — не результат.
      mjesecniNeto: eur(0),
      ukupnaObveznaPlacanja: eur(0),
      efektivnaStopa: godisnjiPrimitak.amount.isZero()
        ? undefined
        : obvezniPlacanja.amount.div(godisnjiPrimitak.amount),
    },
  }
}
