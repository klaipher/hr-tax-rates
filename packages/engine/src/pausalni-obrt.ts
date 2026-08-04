import type { PausalniObrtPravila, Razred, Sourced } from '@hr-tax/data'
import type Decimal from 'decimal.js'
import { formatEur } from './format.ts'
import { add, eur, isGreaterThan, type Money, scale, subtract, sum } from './money.ts'
import type { Doprinos, Doprinosi, Ishod, Naziv, Podloga, Porez } from './types.ts'

const MJESECI_U_GODINI = 12

const godisnje = (mjesecni: Money<'EUR'>): Money<'EUR'> => scale(mjesecni, MJESECI_U_GODINI)

/**
 * Розряд, у який потрапляє `primitak` — перший, чия `gornja granica` його не
 * менша. Таблиця в акті впорядкована за зростанням, і розбір фікстур HOK
 * вимагає того самого, тож перший збіг і є потрібним.
 */
const razredZa = (razredi: readonly Razred[], godisnjiPrimitak: Money<'EUR'>): Razred | undefined =>
  razredi.find((razred) => !isGreaterThan(godisnjiPrimitak, eur(razred.gornjaGranica)))

const doprinos = ({
  naziv,
  stopa,
  mjesecnaOsnovica,
  osobnaStednja,
}: {
  readonly naziv: Naziv
  readonly stopa: Sourced<Decimal>
  readonly mjesecnaOsnovica: Money<'EUR'>
  readonly osobnaStednja: boolean
}): Doprinos => ({
  naziv,
  stopa: stopa.value,
  godisnjiIznos: godisnje(scale(mjesecnaOsnovica, stopa.value)),
  osobnaStednja,
  izvor: stopa.source,
})

/**
 * `doprinosi` паушального обрту.
 *
 * `osnovica` будується з `prosječna plaća`, яку публікує статистика, і
 * `koeficijent`, який задає закон, — по одному числу з кожного шару (ADR-0001).
 * Від розряду й від фактичного `primitak` вона не залежить узагалі: тому на
 * низькому `primitak` внески важать більше за сам податок.
 */
const doprinosiZa = ({ ruleset, pretpostavke }: Podloga): Doprinosi => {
  const mjesecnaOsnovica = scale(
    eur(pretpostavke.prosjecnaPlaca.value),
    ruleset.pausalniObrt.koeficijent.value,
  )

  const moPrviStup = doprinos({
    naziv: { hr: 'MO — I. stup', uk: 'пенсійне, генераційна солідарність' },
    stopa: ruleset.doprinosi.stopaMoPrviStup,
    mjesecnaOsnovica,
    osobnaStednja: false,
  })
  const moDrugiStup = doprinos({
    naziv: { hr: 'MO — II. stup', uk: 'пенсійне, індивідуальна капіталізована ощадність' },
    stopa: ruleset.doprinosi.stopaMoDrugiStup,
    mjesecnaOsnovica,
    osobnaStednja: true,
  })
  const zo = doprinos({
    naziv: { hr: 'ZO', uk: 'медичне страхування' },
    stopa: ruleset.doprinosi.stopaZo,
    mjesecnaOsnovica,
    osobnaStednja: false,
  })

  return {
    mjesecnaOsnovica,
    moPrviStup,
    moDrugiStup,
    zo,
    ukupnoGodisnje: sum('EUR', [
      moPrviStup.godisnjiIznos,
      moDrugiStup.godisnjiIznos,
      zo.godisnjiIznos,
    ]),
  }
}

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
      razlog:
        `Річний primitak ${formatEur(godisnjiPrimitak)} перевищує поріг ${formatEur(prag)}, ` +
        'до якого закон дозволяє паушальне оподаткування. Понад цей поріг обрт веде книги ' +
        'і входить у систему PDV.',
    }
  }

  const razred = razredZa(pravila.razredi.value, godisnjiPrimitak)
  if (razred === undefined) {
    return {
      status: 'nedostupno',
      razlog:
        `Таблиця розрядів не покриває primitak ${formatEur(godisnjiPrimitak)}: найвищий розряд ` +
        `закінчується нижче за поріг ${formatEur(prag)}. Набір правил суперечливий, ` +
        'і рахувати за ним не можна.',
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
      obveznaDavanja: [],
      ukupnaDavanja: eur(0),
      netoZaOsobu: subtract(godisnjiPrimitak, obvezniPlacanja),
      efektivnaStopa: godisnjiPrimitak.amount.isZero()
        ? undefined
        : obvezniPlacanja.amount.div(godisnjiPrimitak.amount),
    },
  }
}
