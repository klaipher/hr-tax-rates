import {
  imaUmanjenjeZaPodrucje,
  jedinicaBySifra,
  KOMORSKI_DOPRINOS_PRIJEDLOG,
  prosjecnaPlacaZa,
  resolveStope,
  rulesetNajave2027,
  sProsjecnomPlacom,
  uGranicama,
  ZADANA_PROSJECNA_PLACA,
} from '@hr-tax/data'
import type { Money, PodlogaUsporedbe, UnosUsporedbe } from '@hr-tax/engine'
import { eur, tockePreokreta, usporediRezime } from '@hr-tax/engine'
import { useMemo, useState } from 'react'
import { djelatnostIzForme, Forma, izdaciIzForme, POCETNO_STANJE } from './Forma.tsx'
import { GrafOpterecenja } from './graf/GrafOpterecenja.tsx'
import { IzvorStatistike } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'
import { LanguageSwitcher } from './i18n/LanguageSwitcher.tsx'
import { Prijevod } from './i18n/Prijevod.tsx'
import { Izvori } from './izvori/index.ts'
import { Kalendar } from './Kalendar.tsx'
import { Obriv } from './Obriv.tsx'
import { Pdv } from './Pdv.tsx'
import { Preokret } from './Preokret.tsx'
import { ProsjecnaPlaca } from './ProsjecnaPlaca.tsx'
import { PODLOGA } from './podloga.ts'
import { RezimKartica } from './RezimKartica.tsx'
import { RidnaKrajina } from './RidnaKrajina.tsx'
import { TablicaRazreda } from './TablicaRazreda.tsx'

/**
 * Два сценарії на графіку: чинний закон і заплановані зміни.
 *
 * `podlogaZa` — функція, а не готова `Podloga`, бо в проєкті `priznati
 * izdatak` і `koeficijent` різні по розрядах, а тип правил тримає по одному
 * скаляру, як і чинний закон. Розряд вибирається з `primitak` — так само, як
 * його вибирає рушій.
 *
 * Жоден зі сценаріїв не чіпає `pretpostavke`: перемикач міняє закон, а
 * `prosječna plaća` має власне поле. Доти, доки вона їхала разом із правилами,
 * перемикання показувало зміну статистики як зміну закону (ADR-0001).
 */
const SCENARIJI = [
  {
    id: 'na-snazi',
    naziv: 'чинний закон',
    status: 'in-force',
    podlogaZa: () => PODLOGA,
  },
  {
    id: 'najava',
    naziv: 'заплановані зміни',
    status: 'draft',
    podlogaZa: (primitak: ReturnType<typeof eur>) => ({
      ruleset: rulesetNajave2027(primitak.amount),
      // Проєкт змін до `Zakona o obrtu` знижує законну стелю `komorski
      // doprinos` з 2 % до 1,5 %. Це частина того самого пакета, тож сценарій
      // бере і її — а сума виходить із застереженням, бо стеля не є ставкою.
      komorskiDoprinos: KOMORSKI_DOPRINOS_PRIJEDLOG,
    }),
  },
] as const

/**
 * Стеля повзунка. Далеко за порогом паушалу навмисно: вище нього режими не
 * зникають, а міняються місцями, і саме це має бути видно.
 */
const NAJVISI_PRIMITAK = 200_000
const KORAK = 100
const POCETNI_PRIMITAK = 20_000

/**
 * Крок, яким шукаються точки перевороту.
 *
 * Дрібніший за найкоротший інтервал, на якому режим встигає побувати
 * найвигіднішим, і достатньо великий, щоб пошук лишався в межах кадру:
 * межу всередині кроку добирає половинне ділення до цента.
 */
const KORAK_PREOKRETA = eur(250)

/** Термін, що стоїть власним елементом, канонічно хорватський у кожній локалі. */
const PROSJECNA_PLACA = 'prosječna plaća'

type IdScenarija = (typeof SCENARIJI)[number]['id']

/**
 * Підкладка з обраною `prosječna plaća`.
 *
 * Припущення накладаються **останніми** навмисно: сценарій «чинний закон»
 * повертає всю `PODLOGA` разом із її власними `pretpostavke`, і при
 * будь-якому іншому порядку вони затирали б вибір людини мовчки.
 */
const sPretpostavkama = <T extends PodlogaUsporedbe>(podloga: T, prosjecnaPlaca: number): T => ({
  ...podloga,
  // Заміну одного поля робить шар даних, а не цей рядок. Доти, доки він
  // будував `pretpostavke` заново, друга статистика — середня за повний
  // попередній рік — мовчки зникала разом із порогом `EU plava karta`, і
  // ані тип, ані тести цього не бачили.
  pretpostavke: sProsjecnomPlacom(podloga.pretpostavke, prosjecnaPlaca),
})

export const App = () => {
  const { t, format } = useI18n()
  const [godisnjiPrimitak, setGodisnjiPrimitak] = useState(POCETNI_PRIMITAK)
  const [forma, setForma] = useState(POCETNO_STANJE)
  const [scenarij, setScenarij] = useState<IdScenarija>('na-snazi')
  const [prosjecnaPlacaUnos, setProsjecnaPlacaUnos] = useState(
    ZADANA_PROSJECNA_PLACA.value.toNumber(),
  )

  // Функція, а не готова підкладка: обриви, драбина розрядів і точки
  // перевороту питають правила по обидва боки від межі, а в проєкті
  // `koeficijent` залежить від розряду.
  const podlogaZa = useMemo(() => {
    const odabrani = SCENARIJI.find((s) => s.id === scenarij) ?? SCENARIJI[0]
    return (primitak: Money<'EUR'>): PodlogaUsporedbe =>
      sPretpostavkama({ ...PODLOGA, ...odabrani.podlogaZa(primitak) }, prosjecnaPlacaUnos)
  }, [scenarij, prosjecnaPlacaUnos])

  // Графік малює обидва сценарії водночас, і обидва — за тією самою
  // `prosječna plaća`: інакше криві розходилися б ще й через статистику.
  const scenarijiGrafa = useMemo(
    () =>
      SCENARIJI.map((s) => ({
        ...s,
        podlogaZa: (primitak: Money<'EUR'>) =>
          sPretpostavkama({ ...PODLOGA, ...s.podlogaZa(primitak) }, prosjecnaPlacaUnos),
      })),
    [prosjecnaPlacaUnos],
  )

  /**
   * Усе, що форма знає про платника, крім самого `primitak`.
   *
   * Окремо від нього навмисно: точки перевороту від поточного `primitak` не
   * залежать узагалі, тож перерахунок на кожен рух повзунка був би марним.
   */
  const okolnosti = useMemo((): Omit<UnosUsporedbe, 'godisnjiPrimitak'> => {
    const jedinica = jedinicaBySifra(forma.sifraJedinice)
    const { rucneStope } = forma
    // Ставки поза межами `čl. 19.a st. 2.` резолвер відкидає винятком: жодна
    // одиниця такого рішення ухвалити не могла. Форма попереджає раніше, а
    // сюди така пара просто не доходить — і режими кажуть, чого їм бракує.
    const rucnoZadano = rucneStope !== undefined && uGranicama(rucneStope) ? rucneStope : undefined
    const djelatnost = djelatnostIzForme(forma)

    return {
      godisnjiIzdaci: izdaciIzForme(forma),
      uzdrzavani: forma.uzdrzavani,
      noviObrt: forma.noviObrt,
      uzRadniOdnos: forma.uzRadniOdnos,
      prvoZaposlenje: forma.prvoZaposlenje,
      povratnik: forma.povratnik,
      // Право на `umanjenje` з `čl. 46. st. 1.` вирішує не форма й не рушій:
      // список одиниць друкує `Odluka` Влади. Тут лише запит до довідника про
      // ту саму одиницю, з якої вже взято ставки.
      umanjenjeZaPodrucje: jedinica !== undefined && imaUmanjenjeZaPodrucje(jedinica.ime),
      neoporeziviPrimici: eur(forma.neoporeziviPrimici ?? 0),
      ...(forma.dob === undefined ? {} : { dob: forma.dob }),
      ...(forma.mjesecnaPlacaVlasnika === undefined
        ? {}
        : { mjesecnaPlacaVlasnika: eur(forma.mjesecnaPlacaVlasnika) }),
      ...(jedinica === undefined
        ? {}
        : {
            stope: resolveStope({
              jedinica,
              ...(rucnoZadano === undefined ? {} : { rucnoZadano }),
            }),
          }),
      ...(forma.mjesecPocetka === undefined ? {} : { pocetak: { mjesec: forma.mjesecPocetka } }),
      ...(djelatnost === undefined ? {} : { djelatnost }),
    }
  }, [forma])

  const usporedba = useMemo(
    () =>
      usporediRezime(
        { ...okolnosti, godisnjiPrimitak: eur(godisnjiPrimitak) },
        podlogaZa(eur(godisnjiPrimitak)),
      ),
    [godisnjiPrimitak, okolnosti, podlogaZa],
  )

  // Не залежить від поточного `primitak`: пересування повзунка точок не рухає.
  const preokreti = useMemo(
    () =>
      tockePreokreta({ ...okolnosti, godisnjiPrimitak: eur(0) }, podlogaZa, {
        najvisiPrimitak: eur(NAJVISI_PRIMITAK),
        korak: KORAK_PREOKRETA,
      }),
    [okolnosti, podlogaZa],
  )

  // Дельта рахується тим самим рушієм на тому самому вході — різниця лише в
  // наборі правил. Це і є перевірка ADR-0001: нижче 40 000 € вона нульова,
  // бо реформа чіпає лише два верхні розряди.
  const delta = useMemo(() => {
    const zaPodlogu = (podloga: typeof PODLOGA) => {
      const ishod = usporediRezime({ godisnjiPrimitak: eur(godisnjiPrimitak) }, podloga).rezimi[0]
        ?.ishod
      return ishod?.status === 'izracunato' ? ishod.izracun.netoZaOsobu.amount : undefined
    }

    // Припущення по обидва боки ті самі — і саме ті, які обрала людина.
    // Інакше в дельту потрапила б ще й зміна prosječna plaća, і «різниця проти
    // чинного закону» показувала б зміну статистики як зміну закону (ADR-0001).
    const naSnazi = zaPodlogu(sPretpostavkama(PODLOGA, prosjecnaPlacaUnos))
    const najava = zaPodlogu(
      sPretpostavkama(
        { ...PODLOGA, ruleset: SCENARIJI[1].podlogaZa(eur(godisnjiPrimitak)).ruleset },
        prosjecnaPlacaUnos,
      ),
    )
    return naSnazi === undefined || najava === undefined ? undefined : najava.minus(naSnazi)
  }, [godisnjiPrimitak, prosjecnaPlacaUnos])

  const prosjecnaPlaca = prosjecnaPlacaZa(prosjecnaPlacaUnos)

  return (
    <main className="stranica">
      <header className="zaglavlje">
        <div className="zaglavlje__tekst">
          <h1>{t.zaglavlje.naslov}</h1>
          <p>{t.zaglavlje.podnaslov}</p>
        </div>
        <LanguageSwitcher />
      </header>

      {/*
        Два стовпці: усі входи зліва, усі результати справа. Раніше форма
        стояла між картками й графіком, тож щоб змінити витрати, доводилося
        гортати повз результат, який ти саме й хочеш побачити.
      */}
      <div className="raspored">
        <div className="raspored__unos">
          <section className="unos">
            <label htmlFor="primitak">
              {t.unos.oznaka}
              <span className="prijevod">{t.unos.prijevod}</span>
            </label>

            {/*
              Одне число, а не два. Раніше поруч стояли сире значення в полі
              й відформатована сума — те саме двічі, і незрозуміло, яке з них
              справжнє. Тепер редагується саме те, що видно.

              Повзунок лишається під ним: він добрий, щоб побачити форму
              кривої, але на 200 000 € крок у 100 € робить його непридатним
              для точного значення.
            */}
            <span className="unos__redak">
              <input
                id="primitak"
                className="unos__polje"
                type="number"
                inputMode="numeric"
                min={0}
                max={NAJVISI_PRIMITAK}
                step={KORAK}
                value={godisnjiPrimitak}
                onChange={(event) => {
                  const uneseno = Number(event.target.value)
                  setGodisnjiPrimitak(
                    Number.isFinite(uneseno) ? Math.min(Math.max(0, uneseno), NAJVISI_PRIMITAK) : 0,
                  )
                }}
              />
              <span className="unos__valuta" aria-hidden="true">
                €
              </span>
            </span>

            <input
              className="unos__klizac"
              type="range"
              aria-label={t.unos.oznaka}
              min={0}
              max={NAJVISI_PRIMITAK}
              step={KORAK}
              value={godisnjiPrimitak}
              onChange={(event) => {
                setGodisnjiPrimitak(Number(event.target.value))
              }}
            />
            <p className="unos__skala">
              <span>{format.eur(eur(0))}</span>
              <span>{format.eur(eur(NAJVISI_PRIMITAK))}</span>
            </p>
          </section>

          {/* Обрив стоїть під самим полем: рішення «брати ще один контракт»
              ухвалюють тут, а не на картці режиму. */}
          <Obriv godisnjiPrimitak={godisnjiPrimitak} podlogaZa={podlogaZa} />

          <section className="scenarij">
            <fieldset>
              <legend>{t.scenarij.naslov}</legend>
              {SCENARIJI.map((s) => (
                <label key={s.id} className="scenarij__izbor">
                  <input
                    type="radio"
                    name="scenarij"
                    value={s.id}
                    checked={scenarij === s.id}
                    onChange={() => {
                      setScenarij(s.id)
                    }}
                  />
                  {t.scenarij[s.id]}
                </label>
              ))}
            </fieldset>
            {/* Реформа чіпає лише паушал — і в ньому лише два верхні розряди. */}
            <p className="razlog">{t.scenarij.samoPausal}</p>
            {scenarij === 'najava' && <p className="razlog">{t.scenarij.prognoza}</p>}
            <p className="scenarij__delta">
              {delta === undefined || delta.isZero()
                ? t.scenarij.bezRazlike
                : t.scenarij.delta(format.eur(eur(delta)))}
            </p>
          </section>

          {/* Одразу під перемикачем: тут видно, що правила й статистика — два
              різні органи керування, і перемикач другого не чіпає. */}
          <ProsjecnaPlaca vrijednost={prosjecnaPlacaUnos} onPromjena={setProsjecnaPlacaUnos} />

          <Forma stanje={forma} onPromjena={setForma} />
        </div>

        <div className="raspored__ishod">
          {/* Точки перевороту стоять над картками: тут людина вибирає. */}
          <Preokret tocke={preokreti} rezimi={usporedba.rezimi} />

          <section className="rezimi">
            {usporedba.rezimi.map((rezim) => (
              <RezimKartica key={rezim.id} rezim={rezim} />
            ))}
          </section>

          <Pdv
            godisnjiPrimitak={eur(godisnjiPrimitak)}
            tipKlijenta={forma.tipKlijenta}
            inozemneUsluge={forma.inozemneUsluge}
          />
        </div>
      </div>

      <GrafOpterecenja
        scenariji={scenarijiGrafa}
        godisnjiPrimitak={godisnjiPrimitak}
        najvisiPrimitak={NAJVISI_PRIMITAK}
        onOdabir={setGodisnjiPrimitak}
      />

      <TablicaRazreda godisnjiPrimitak={godisnjiPrimitak} podlogaZa={podlogaZa} />

      <Kalendar rezimi={usporedba.rezimi} godina={usporedba.godina} />

      <RidnaKrajina godisnjiPrimitak={eur(godisnjiPrimitak)} />

      <Izvori podloga={PODLOGA} />

      <footer className="pretpostavke">
        <h2>{t.pretpostavke.naslov}</h2>
        {/* Рік — мітка, а не величина: групувати його розряди не можна, тож
            він і не проходить через форматувальник чисел. */}
        <p>{t.pretpostavke.godina(String(usporedba.godina))}</p>
        <p className="pretpostavke__velicina">
          <span className="pojam">{PROSJECNA_PLACA}</span>
          <Prijevod pojam={PROSJECNA_PLACA} />
          <strong>{format.eur(eur(prosjecnaPlaca.value))}</strong>
        </p>
        {/* Пояснення тут не повторюється: воно стоїть біля самого поля вгорі,
            а внизу лишається зведення — рік правил і величина, до якої вони
            застосовані. */}
        <p>
          <IzvorStatistike izvor={prosjecnaPlaca.source} />
        </p>
      </footer>
    </main>
  )
}
