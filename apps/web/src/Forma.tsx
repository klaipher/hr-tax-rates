import type { JedinicaLokalneSamouprave, ParStopa } from '@hr-tax/data'
import {
  graniceStopa,
  jedinicaBySifra,
  jeOblikNkd,
  najsireGranice,
  nkdDirektorij,
  nkdPoSkupinama,
  POPUST_ZA_POTPOMOGNUTA_PODRUCJA,
  PRAVILA_NEPUNE_GODINE,
  placa2026,
  RASPON_SPOMENICKE_RENTE_PO_M2,
  searchJedinice,
  sveJedinice,
  uGranicama,
} from '@hr-tax/data'
import type {
  Djelatnost,
  IzdaciPoStavkama,
  Mjesec,
  TipKlijenta,
  UzdrzavaniClanovi,
} from '@hr-tax/engine'
import {
  brojMjeseciDjelatnosti,
  eur,
  razdobljeZa,
  steljaNeoporezivihPrimitaka,
} from '@hr-tax/engine'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { Izvor } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * Що людина знає про своє приміщення в культурному добрі.
 *
 * Окремою структурою, а не двома полями поруч: площа й місцева ставка мають
 * сенс лише разом і лише всередині культурного добра — поза ним таких чисел
 * просто немає, і саме це каже `PolozajUKulturnomDobru` в рушії. Тут вони
 * лежать «про запас», бо перемикач можна зняти й повернути, не втративши
 * набране.
 */
interface KulturnoDobro {
  readonly unutra: boolean
  readonly korisnaPovrsinaM2: number
  readonly mjesecniIznosPoM2: number
}

/**
 * Ступінь інвалідності однієї людини — рівно два, які розрізняє `čl. 14.`
 *
 * Не число й не прапорець: акт дає коефіцієнт 0,3 або 1,0, і для тієї самої
 * людини одне виключає інше. Тип каже це замість коментаря.
 */
export type StupanjInvaliditeta = 'djelomicna' | 'potpuna'

/** Щабель `olakšica za mlade`, у який потрапляє платник (`čl. 46. st. 2.`). */
export type OlaksicaMladih = 'nema' | 'do-25' | 'od-26-do-30'

/**
 * Кого платник утримує. Лічильники інвалідності сюди не входять: у формі вони
 * живуть списком людей, а не числами, і зводяться до чисел рушія на межі.
 */
type Uzdrzavani = Pick<UzdrzavaniClanovi, 'clanoviUzeObitelji' | 'djeca'>

/** Стан форми — рівно те, що вводить людина, без похідних величин. */
export interface StanjeForme {
  readonly ostalo: number
  readonly reprezentacija: number
  readonly osobnoVozilo: number
  /** `sifra` обраної `jedinica lokalne samouprave`; порожньо — не обрано. */
  readonly sifraJedinice: string
  /**
   * Ставки, вбиті руками. `undefined` — беремо ті, що в довіднику.
   *
   * Тільки обидві разом: половина рішення одиниці, склеєна з половиною
   * старого довідника, не відповідає жодній `odluka`.
   */
  readonly rucneStope: ParStopa | undefined
  readonly uzRadniOdnos: boolean
  /** Місяць відкриття обрту; `undefined` — повний рік. */
  readonly mjesecPocetka: Mjesec | undefined
  /** Чи обрт у перших двох роках від першого впису в `Obrtni registar`. */
  readonly noviObrt: boolean
  /** Кого платник утримує — від цього залежить `osobni odbitak`. */
  readonly uzdrzavani: Uzdrzavani
  /**
   * Люди з інвалідністю — по запису на людину, а не двома лічильниками.
   *
   * Лічильників було два: «скільки осіб з інвалідністю» і «з них зі 100 %».
   * Слово «з них» обіцяло підмножину, а рушій складав обидва числа незалежно,
   * тож той, хто чесно вписав одну людину в обидва поля, діставав коефіцієнт
   * 1,3 замість 1,0. Список записів робить таку помилку неможливою: людина
   * стоїть у ньому рівно раз і має рівно один ступінь.
   */
  readonly osobeSInvaliditetom: readonly StupanjInvaliditeta[]
  /**
   * Щабель `olakšica za mlade`, а не вік.
   *
   * Закон не питає, скільки людині років, — він питає, у який із трьох щаблів
   * вона потрапляє. Поле для віку змушувало відповідати точніше, ніж потрібно,
   * і не мало чесного типового значення: порожнє поле означало «пільги немає»,
   * але сказано це не було ніде.
   */
  readonly olaksicaMladih: OlaksicaMladih
  /**
   * Річна сума `neoporezivi primici`, про яку домовлено з роботодавцем.
   * `undefined` — не домовлено, і саме це типово.
   *
   * Порожньо, а не нуль: закон дає стелі, а не обіцянки, і підставити стелю
   * означало б показати чужу щедрість як норму.
   */
  readonly neoporeziviPrimici: number | undefined
  /** Чи це перше працевлаштування за договором на неозначений час. */
  readonly prvoZaposlenje: boolean
  /** Чи людина повернулася з-за кордону за `čl. 46. st. 3.` */
  readonly povratnik: boolean
  /**
   * Місячна брутто-плаћа, яку власник d.o.o. призначив собі сам.
   * `undefined` — береться законна підлога.
   */
  readonly mjesecnaPlacaVlasnika: number | undefined
  /** `NKD` (вид діяльності); порожньо — не введено. */
  readonly nkd: string
  readonly imaLokalnuTuristickuZajednicu: boolean
  readonly potpomognutoPodrucje: boolean
  readonly pretezitoProizvodna: boolean
  readonly kulturnoDobro: KulturnoDobro
  /** Звідки клієнти — від цього залежить `PDV` на вихідних рахунках. */
  readonly tipKlijenta: TipKlijenta
  /** Річна сума послуг, куплених за кордоном. */
  readonly inozemneUsluge: number
}

/**
 * Загреб як початковий вибір.
 *
 * Без обраної одиниці два з трьох режимів мовчать одразу після відкриття, і
 * порожній калькулятор читається як зламаний. Загреб — найбільша одиниця й
 * найчастіший випадок; вибір видно у полі й будь-коли змінюється.
 */
const POCETNA_JEDINICA = '1333'

export const POCETNO_STANJE: StanjeForme = {
  ostalo: 0,
  reprezentacija: 0,
  osobnoVozilo: 0,
  sifraJedinice: POCETNA_JEDINICA,
  rucneStope: undefined,
  uzRadniOdnos: false,
  mjesecPocetka: undefined,
  noviObrt: false,
  uzdrzavani: { clanoviUzeObitelji: 0, djeca: 0 },
  osobeSInvaliditetom: [],
  // Типове значення видиме, а не порожнє: «знижки немає» — це відповідь, і
  // людина мусить бачити, що саме за неї відповіли.
  olaksicaMladih: 'nema',
  neoporeziviPrimici: undefined,
  prvoZaposlenje: false,
  povratnik: false,
  mjesecnaPlacaVlasnika: undefined,
  nkd: '',
  // Обов'язок за `čl. 4. st. 1.` виникає на території місцевої `turistička
  // zajednica`, і такі зайняли майже всю країну. Типове «ні» ховало б платіж
  // від більшості тих, кому він таки нарахується.
  imaLokalnuTuristickuZajednicu: true,
  potpomognutoPodrucje: false,
  pretezitoProizvodna: false,
  kulturnoDobro: { unutra: false, korisnaPovrsinaM2: 0, mjesecniIznosPoM2: 0.2 },
  tipKlijenta: 'poslovni-eu',
  inozemneUsluge: 0,
}

/**
 * Статті `izdatak` зі стану форми.
 *
 * Форма показує три поля з восьми статей закону навмисно: `reprezentacija` і
 * `osobno vozilo` винесені окремо, бо закон визнає їх лише наполовину
 * (`čl. 33. st. 1.`), і це та різниця, яку людина має бачити. Решта статей
 * лягає в `ostalo` — для порівняння режимів важлива сума, а не її розклад.
 *
 * Половина ріжеться від усього, що потрапило в поле авто, і це вірно рівно
 * доти, доки туди не пишуть страховку: її `čl. 33. st. 2.` виводить з-під
 * винятку й визнає повністю. Тому поле саме каже писати страховку в `ostalo` —
 * дешевше пояснити межу, ніж заводити дев'яту статтю заради одного рядка.
 */
export const izdaciIzForme = (stanje: StanjeForme): IzdaciPoStavkama => ({
  najamnina: eur(0),
  nabavkaRobe: eur(0),
  nabavkaUsluga: eur(0),
  placeRadnika: eur(0),
  troskoviBanke: eur(0),
  reprezentacija: eur(stanje.reprezentacija),
  osobnoVozilo: eur(stanje.osobnoVozilo),
  ostalo: eur(stanje.ostalo),
})

/**
 * Діяльність і місце для рушія — або `undefined`, поки `NKD` не введено.
 *
 * Код хибної форми — теж `undefined`, а не виняток: людина посеред набору
 * бачить `5`, `56.`, і жоден із цих станів не привід упасти. Код правильної
 * форми, якого немає в довіднику, навпаки, передається як є — це відповідь
 * «жоден із двох платежів не виникає», і дати її має рушій, а не форма.
 */
export const djelatnostIzForme = (stanje: StanjeForme): Djelatnost | undefined => {
  if (!jeOblikNkd(stanje.nkd)) return undefined
  const { unutra, korisnaPovrsinaM2, mjesecniIznosPoM2 } = stanje.kulturnoDobro

  return {
    nkd: stanje.nkd.trim(),
    imaLokalnuTuristickuZajednicu: stanje.imaLokalnuTuristickuZajednicu,
    potpomognutoPodrucje: stanje.potpomognutoPodrucje,
    pretezitoProizvodna: stanje.pretezitoProizvodna,
    polozaj: unutra
      ? { kind: 'u-kulturnom-dobru', korisnaPovrsinaM2, mjesecniIznosPoM2 }
      : { kind: 'izvan' },
  }
}

/**
 * Значення пункту «інший код» у списку `NKD`.
 *
 * Не порожній рядок і не код: порожній уже означає «не з переліку», а будь-яка
 * цифрова форма зіткнулася б із справжнім кодом. Крапки в ній немає навмисно —
 * `jeOblikNkd` таке не пропустить, якщо воно колись просочиться далі.
 */
const RUCNO = 'rucno'

const MJESECI: readonly Mjesec[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const TIPOVI_KLIJENATA: readonly TipKlijenta[] = ['poslovni-eu', 'poslovni-izvan-eu', 'tuzemni']

/**
 * Ставка в базисних пунктах як відсоток.
 *
 * Довідник зберігає 20,5 % як 2050 цілим числом навмисно — джерело друкує це
 * як 0.20499999999999999, і базисні пункти рятують від дрейфу. Тут число лише
 * показується, тож поділ на 100 безпечний.
 */
const postotak = (bazniBodovi: number): string => `${(bazniBodovi / 100).toFixed(2)} %`

/** Відсоток із поля назад у базисні пункти — без дрейфу, який дає множення. */
const uBazneBodove = (postotaka: number): number => Math.round(postotaka * 100)

interface Props {
  readonly stanje: StanjeForme
  readonly onPromjena: (stanje: StanjeForme) => void
}

/**
 * Секція форми: згорнута смуга з підсумком, яка розкривається в поля.
 *
 * `details`, а не свій стан із кнопкою: браузер сам дає клавіатуру, фокус і
 * пошук по сторінці всередині згорнутого вмісту. Свій перемикач довелося б
 * доучувати всьому цьому — і він однаково лишився б гіршим.
 *
 * Підсумок у смузі не декоративний: людина, яка згорнула секцію, має бачити,
 * що там лишилося введеним, — інакше згортка ховає не шум, а її ж відповіді.
 */
const Sekcija = ({
  naslov,
  prijevod,
  sazetak,
  otvorena = false,
  children,
}: {
  readonly naslov: string
  readonly prijevod: string
  readonly sazetak: string
  /** Чи секція розкрита на початку. Далі нею керує людина. */
  readonly otvorena?: boolean
  readonly children: ReactNode
}) => {
  // Стан розкриття мусить жити в React, а не лише в DOM.
  //
  // `<details open={...}>` — керований атрибут: варто передати в нього сталу
  // з пропса, і кожен наступний рендер закриватиме секцію назад. А рендер тут
  // трапляється на кожну введену цифру, тож людина набирала б перше число й
  // дивилася, як секція згортається просто під пальцями.
  const [razgornuto, postaviRazgornuto] = useState(otvorena)

  return (
    <details
      className="sekcija"
      open={razgornuto}
      onToggle={(event) => {
        postaviRazgornuto(event.currentTarget.open)
      }}
    >
      <summary className="sekcija__zaglavlje">
        <span className="sekcija__naslov">{naslov}</span>
        <span className="sekcija__sazetak">{sazetak}</span>
      </summary>
      <p className="forma__prijevod">{prijevod}</p>
      {children}
    </details>
  )
}

/** Щаблі `olakšica za mlade` в порядку, у якому їх друкує `čl. 46. st. 2.` */
const OLAKSICE_MLADIH: readonly OlaksicaMladih[] = ['nema', 'do-25', 'od-26-do-30']

/**
 * Стаття, з якої взято обидва коефіцієнти інвалідності.
 *
 * Береться з чинних правил, а не переписується сюди: одне число — одне місце,
 * і посилання під полем мусить вести туди ж, куди веде розрахунок (ADR-0002).
 */
const KOEFICIJENTI_INVALIDNOSTI = placa2026.osobniOdbitak.koeficijentInvalidnosti.source

export const Forma = ({ stanje, onPromjena }: Props) => {
  const { t, format } = useI18n()
  const promijeni = (dio: Partial<StanjeForme>) => {
    onPromjena({ ...stanje, ...dio })
  }

  const novac = (
    id: string,
    oznaka: string,
    vrijednost: number,
    postavi: (n: number) => void,
    napomena?: string,
    objasnjenje?: string,
  ) => (
    <>
      <p className="polje">
        <label htmlFor={id}>
          {oznaka}
          {napomena !== undefined && <span className="prijevod">{napomena}</span>}
        </label>
        <input
          id={id}
          type="number"
          min={0}
          step={100}
          value={vrijednost}
          // Пояснення прив'язане до поля, а не просто лежить поруч: інакше той,
          // хто йде формою з екранним читачем, чує саму лише мітку.
          {...(objasnjenje === undefined ? {} : { 'aria-describedby': `${id}-opis` })}
          onChange={(event) => {
            postavi(Math.max(0, Number(event.target.value)))
          }}
        />
      </p>
      {objasnjenje !== undefined && (
        <p className="forma__primjer forma__primjer--polje" id={`${id}-opis`}>
          {objasnjenje}
        </p>
      )}
    </>
  )

  const brojOsoba = (
    id: string,
    oznaka: string,
    napomena: string,
    vrijednost: number,
    postavi: (n: number) => void,
  ) => (
    <p className="polje">
      <label htmlFor={id}>
        {oznaka}
        <span className="prijevod">{napomena}</span>
      </label>
      <input
        id={id}
        type="number"
        min={0}
        step={1}
        value={vrijednost}
        onChange={(event) => {
          postavi(Math.max(0, Math.trunc(Number(event.target.value))))
        }}
      />
    </p>
  )

  /**
   * Необов'язкове число: порожньо означає «не введено», а не нуль.
   *
   * Окремо від `brojOsoba` навмисно. Там нуль — повноцінна відповідь: нуль
   * дітей є нулем дітей. Тут порожнє поле й нуль — різні речі, і зводити їх
   * до одного значення означало б відповісти за людину.
   */
  const neobvezniBroj = (
    id: string,
    oznaka: string,
    napomena: string,
    vrijednost: number | undefined,
    postavi: (n: number | undefined) => void,
    korak = 1,
  ) => (
    <p className="polje">
      <label htmlFor={id}>
        {oznaka}
        <span className="prijevod">{napomena}</span>
      </label>
      <input
        id={id}
        type="number"
        min={0}
        step={korak}
        value={vrijednost ?? ''}
        onChange={(event) => {
          const uneseno = event.target.value.trim()
          postavi(uneseno === '' ? undefined : Math.max(0, Number(uneseno)))
        }}
      />
    </p>
  )

  const potvrda = (
    id: string,
    oznaka: string,
    vrijednost: boolean,
    postavi: (v: boolean) => void,
    napomena?: string,
  ) => (
    <p className="polje polje--potvrda">
      <label htmlFor={id}>
        <input
          id={id}
          type="checkbox"
          checked={vrijednost}
          onChange={(event) => {
            postavi(event.target.checked)
          }}
        />
        {oznaka}
        {napomena !== undefined && <span className="prijevod">{napomena}</span>}
      </label>
    </p>
  )

  const [upit, setUpit] = useState('')
  const pronadene = useMemo(() => searchJedinice(upit), [upit])

  // Спосіб вибору, а не сам вибір: у стані форми лежить код, а не те, звідки
  // його взяли, — тому прапорець тутешній, поруч із запитом пошуку.
  const [rucniNkd, setRucniNkd] = useState(false)

  const jedinica: JedinicaLokalneSamouprave | undefined = jedinicaBySifra(stanje.sifraJedinice)
  const { rucneStope } = stanje
  const { mjesecPocetka } = stanje
  // Місяців у періоді п'ять, а не чотири, — це висновок норми, а не календаря,
  // тож і він веде до статті за один клік (ADR-0002).
  const razdoblje =
    mjesecPocetka === undefined
      ? undefined
      : brojMjeseciDjelatnosti(razdobljeZa(PRAVILA_NEPUNE_GODINE, { mjesec: mjesecPocetka }))
  const stopeIzvanGranica = rucneStope !== undefined && !uGranicama(rucneStope)
  const { niza, visa } = najsireGranice
  const { najmanje, najvise } = RASPON_SPOMENICKE_RENTE_PO_M2.value
  // Стеля не залежить від жодного введеного числа, тож рахується раз.
  const stelja = useMemo(() => steljaNeoporezivihPrimitaka(placa2026), [])

  // Підсумок секції — те, що видно, коли вона згорнута. Складається тут, а не
  // в словнику: це не речення, а перелік уже введених значень, і кожна локаль
  // збирає його з тих самих шматків.
  const spoji = (dijelovi: readonly (string | undefined)[]): string => {
    const vidljivi = dijelovi.filter((dio): dio is string => dio !== undefined)
    return vidljivi.length === 0 ? t.sekcije.nista : vidljivi.join(' · ')
  }

  const brojOsobaSInvaliditetom = stanje.osobeSInvaliditetom.length

  const sazetakMjesta =
    jedinica === undefined
      ? t.unos.gradNijeOdabran
      : `${jedinica.ime} — ${postotak(jedinica.stope.niza)} / ${postotak(jedinica.stope.visa)}`

  const sazetakObitelji = spoji([
    stanje.uzdrzavani.clanoviUzeObitelji > 0
      ? t.sekcije.utrimanih(String(stanje.uzdrzavani.clanoviUzeObitelji))
      : undefined,
    stanje.uzdrzavani.djeca > 0 ? t.sekcije.djece(String(stanje.uzdrzavani.djeca)) : undefined,
    brojOsobaSInvaliditetom > 0
      ? t.sekcije.sInvaliditetom(String(brojOsobaSInvaliditetom))
      : undefined,
  ])

  const sazetakZaposlenika = spoji([
    t.unos.olaksicaMladihIzbor[stanje.olaksicaMladih],
    stanje.neoporeziviPrimici === undefined || stanje.neoporeziviPrimici === 0
      ? undefined
      : t.sekcije.neoporezivi(format.eur(eur(stanje.neoporeziviPrimici))),
    stanje.prvoZaposlenje ? t.sekcije.prvoZaposlenje : undefined,
    stanje.povratnik ? t.sekcije.povratnik : undefined,
  ])

  const ukupniIzdaci = stanje.ostalo + stanje.reprezentacija + stanje.osobnoVozilo
  const sazetakObrta = spoji([
    razdoblje === undefined ? t.sekcije.punaGodina : t.sekcije.mjeseci(String(razdoblje.value)),
    ukupniIzdaci > 0 ? t.sekcije.izdaci(format.eur(eur(ukupniIzdaci))) : t.sekcije.bezIzdataka,
    stanje.nkd.trim() === '' ? t.sekcije.nkdNije : `NKD ${stanje.nkd}`,
    stanje.uzRadniOdnos ? t.sekcije.uzRadniOdnos : undefined,
  ])

  const sazetakDoo =
    stanje.mjesecnaPlacaVlasnika === undefined
      ? t.sekcije.placaPodloga
      : t.sekcije.placaMjesecno(format.eur(eur(stanje.mjesecnaPlacaVlasnika)))

  const sazetakPdv = spoji([
    t.pdv.klijenti[stanje.tipKlijenta],
    stanje.inozemneUsluge > 0
      ? t.sekcije.inozemneUsluge(format.eur(eur(stanje.inozemneUsluge)))
      : undefined,
  ])

  return (
    <section className="forma">
      <Sekcija
        naslov={t.sekcije.mjesto}
        prijevod={t.sekcije.mjestoPrijevod}
        sazetak={sazetakMjesta}
        otvorena
      >
        {/* Пошук і список — одне поле, а не два.
            Одиниць 556, і гортати їх до «SVETA NEDELJA» неможливо; фільтрує сам
            довідник — байдуже до регістру й діакритики, бо «Đakovo» шукають як
            «dakovo». Але пошук, який лише звужує згорнутий список нижче, не
            подає жодного видимого знаку і читається як зламаний. Тому поруч
            завжди стоїть лічильник, а коли запит звузився до однієї одиниці,
            вона й обирається: набрав «Zagreb» — отримав Zagreb. */}
        <p className="polje">
          <label htmlFor="jedinica">
            {t.unos.grad}
            <span className="prijevod">{t.unos.gradPrijevod}</span>
          </label>
          <input
            id="trazi-jedinicu"
            type="search"
            placeholder={t.unos.traziGrad}
            aria-label={t.unos.traziGrad}
            value={upit}
            onChange={(event) => {
              const noviUpit = event.target.value
              setUpit(noviUpit)
              const pogodci = searchJedinice(noviUpit)
              const jedini = pogodci.length === 1 ? pogodci[0] : undefined
              if (jedini !== undefined) promijeni({ sifraJedinice: jedini.sifra })
            }}
          />
          <select
            id="jedinica"
            value={stanje.sifraJedinice}
            onChange={(event) => {
              promijeni({ sifraJedinice: event.target.value })
            }}
          >
            <option value="">{t.unos.gradNijeOdabran}</option>
            {/* Обрана одиниця лишається в списку, навіть коли не проходить за
                фільтром: інакше поле показувало б порожньо там, де вибір є. */}
            {jedinica !== undefined && !pronadene.includes(jedinica) && (
              <option value={jedinica.sifra}>
                {jedinica.ime} — {postotak(jedinica.stope.niza)} / {postotak(jedinica.stope.visa)}
              </option>
            )}
            {pronadene.map((kandidat) => (
              <option key={kandidat.sifra} value={kandidat.sifra}>
                {kandidat.ime} — {postotak(kandidat.stope.niza)} / {postotak(kandidat.stope.visa)}
              </option>
            ))}
          </select>
          {/* `aria-live`: інакше той, хто набирає з екранним читачем, ніяк не
              дізнається, що список під пальцями змінився. */}
          {upit.trim() !== '' && pronadene.length > 0 && (
            <span className="polje__brojac" aria-live="polite">
              {t.unos.nadenoJedinica(String(pronadene.length), String(sveJedinice.value.length))}
            </span>
          )}
        </p>
        {pronadene.length === 0 && <p className="razlog">{t.unos.gradNijeNaden(upit)}</p>}

        {potvrda(
          'rucne-stope',
          t.unos.rucneStope,
          rucneStope !== undefined,
          (ukljuceno) => {
            // Вмикаючи ручні ставки, беремо ті, що вже стоять у довіднику:
            // людина правитиме своє рішення, а не набиратиме його з нуля.
            promijeni({
              rucneStope: ukljuceno
                ? { niza: jedinica?.stope.niza ?? niza.min, visa: jedinica?.stope.visa ?? visa.min }
                : undefined,
            })
          },
          t.unos.rucneStopePrijevod,
        )}

        {rucneStope !== undefined && (
          <>
            <p className="polje">
              <label htmlFor="stopa-niza">{t.unos.nizaStopa}</label>
              <input
                id="stopa-niza"
                type="number"
                min={0}
                step={0.01}
                value={rucneStope.niza / 100}
                onChange={(event) => {
                  promijeni({
                    rucneStope: { ...rucneStope, niza: uBazneBodove(Number(event.target.value)) },
                  })
                }}
              />
            </p>
            <p className="polje">
              <label htmlFor="stopa-visa">{t.unos.visaStopa}</label>
              <input
                id="stopa-visa"
                type="number"
                min={0}
                step={0.01}
                value={rucneStope.visa / 100}
                onChange={(event) => {
                  promijeni({
                    rucneStope: { ...rucneStope, visa: uBazneBodove(Number(event.target.value)) },
                  })
                }}
              />
            </p>
            {stopeIzvanGranica && (
              <p className="razlog razlog--upozorenje">
                {t.unos.stopeIzvanGranica(
                  `${postotak(niza.min)} – ${postotak(niza.max)}`,
                  `${postotak(visa.min)} – ${postotak(visa.max)}`,
                )}
                <Izvor izvor={graniceStopa.source} />
              </p>
            )}
          </>
        )}
      </Sekcija>

      <Sekcija
        naslov={t.sekcije.obitelj}
        prijevod={t.sekcije.obiteljPrijevod}
        sazetak={sazetakObitelji}
      >
        {brojOsoba(
          'uzdrzavani-clanovi',
          t.unos.clanoviUzeObitelji,
          t.unos.clanoviPrijevod,
          stanje.uzdrzavani.clanoviUzeObitelji,
          (clanoviUzeObitelji) => {
            promijeni({ uzdrzavani: { ...stanje.uzdrzavani, clanoviUzeObitelji } })
          },
        )}
        {brojOsoba(
          'uzdrzavana-djeca',
          t.unos.djeca,
          t.unos.djecaPrijevod,
          stanje.uzdrzavani.djeca,
          (djeca) => {
            promijeni({ uzdrzavani: { ...stanje.uzdrzavani, djeca } })
          },
        )}

        {/* Запис на людину, а не два лічильники: акт виключає 0,3 і 1,0 один
            одним для тієї самої особи, і список робить подвійний облік
            неможливим замість того, щоб просити про нього в підказці. */}
        <div className="popis-osoba">
          <p className="popis-osoba__naslov">
            {t.unos.osobeSInvaliditetom}
            <span className="prijevod">{t.unos.osobeSInvaliditetomPrijevod}</span>
            <Izvor izvor={KOEFICIJENTI_INVALIDNOSTI} />
          </p>
          {stanje.osobeSInvaliditetom.map((stupanj, redak) => (
            // Ключем є позиція: людей тут не розрізняють ані іменем, ані нічим
            // іншим — це лічильник, розписаний по рядках.
            <p className="polje polje--redak" key={redak}>
              <label htmlFor={`invalidnost-${String(redak)}`} className="visually-hidden">
                {t.unos.stupanjInvaliditeta(String(redak + 1))}
              </label>
              <select
                id={`invalidnost-${String(redak)}`}
                value={stupanj}
                onChange={(event) => {
                  const noviStupanj = event.target.value as StupanjInvaliditeta
                  promijeni({
                    osobeSInvaliditetom: stanje.osobeSInvaliditetom.map((stari, i) =>
                      i === redak ? noviStupanj : stari,
                    ),
                  })
                }}
              >
                <option value="djelomicna">{t.unos.stupanjDjelomicna}</option>
                <option value="potpuna">{t.unos.stupanjPotpuna}</option>
              </select>
              <button
                type="button"
                className="gumb gumb--tihi"
                onClick={() => {
                  promijeni({
                    osobeSInvaliditetom: stanje.osobeSInvaliditetom.filter((_, i) => i !== redak),
                  })
                }}
              >
                {t.unos.ukloniOsobu}
              </button>
            </p>
          ))}
          <button
            type="button"
            className="gumb"
            onClick={() => {
              promijeni({ osobeSInvaliditetom: [...stanje.osobeSInvaliditetom, 'djelomicna'] })
            }}
          >
            {t.unos.dodajOsobu}
          </button>
        </div>
      </Sekcija>

      <Sekcija
        naslov={t.sekcije.zaposlenik}
        prijevod={t.sekcije.zaposlenikPrijevod}
        sazetak={sazetakZaposlenika}
      >
        <p className="polje">
          <label htmlFor="olaksica-mladih">
            {t.unos.olaksicaMladih}
            <span className="prijevod">{t.unos.olaksicaMladihPrijevod}</span>
          </label>
          <select
            id="olaksica-mladih"
            value={stanje.olaksicaMladih}
            onChange={(event) => {
              promijeni({ olaksicaMladih: event.target.value as OlaksicaMladih })
            }}
          >
            {OLAKSICE_MLADIH.map((izbor) => (
              <option key={izbor} value={izbor}>
                {t.unos.olaksicaMladihIzbor[izbor]}
              </option>
            ))}
          </select>
        </p>

        {neobvezniBroj(
          'neoporezivi-primici',
          t.unos.neoporeziviPrimici,
          t.unos.neoporeziviPrimiciPrijevod,
          stanje.neoporeziviPrimici,
          (neoporeziviPrimici) => {
            promijeni({ neoporeziviPrimici })
          },
          100,
        )}
        {/* Стелю рахує рушій і підставляє кнопка, а не типове значення поля:
            закон дає межу, а не обіцянку, і різниця між «стільки можна» і
            «стільки буде» — це і є різниця між підказкою й вигадкою. */}
        <p className="polje__pomoc">
          <button
            type="button"
            className="gumb"
            onClick={() => {
              promijeni({ neoporeziviPrimici: Number(stelja.amount) })
            }}
          >
            {t.unos.podstaviStelju(format.eur(stelja))}
          </button>
        </p>

        {potvrda(
          'prvo-zaposlenje',
          t.unos.prvoZaposlenje,
          stanje.prvoZaposlenje,
          (prvoZaposlenje) => {
            promijeni({ prvoZaposlenje })
          },
          t.unos.prvoZaposlenjePrijevod,
        )}

        {potvrda(
          'povratnik',
          t.unos.povratnik,
          stanje.povratnik,
          (povratnik) => {
            promijeni({ povratnik })
          },
          t.unos.povratnikPrijevod,
        )}
      </Sekcija>

      <Sekcija naslov={t.sekcije.obrt} prijevod={t.sekcije.obrtPrijevod} sazetak={sazetakObrta}>
        <p className="forma__primjer">{t.unos.izdaciPrimjer}</p>
        {novac('izdatak-ostalo', t.unos.ostalo, stanje.ostalo, (ostalo) => {
          promijeni({ ostalo })
        })}

        {/* Розбивка під згортку: обидві статті визнаються лише наполовину, і
            стосуються вони меншості. Той, у кого їх немає, не має про них і
            думати; той, у кого є, знайде їх за назвою. */}
        <details className="podrobnosti">
          <summary>{t.unos.razbivkaIzdataka}</summary>
          {novac(
            'izdatak-reprezentacija',
            t.unos.reprezentacija,
            stanje.reprezentacija,
            (reprezentacija) => {
              promijeni({ reprezentacija })
            },
            t.unos.polovicno,
          )}
          {novac(
            'izdatak-vozilo',
            t.unos.osobnoVozilo,
            stanje.osobnoVozilo,
            (osobnoVozilo) => {
              promijeni({ osobnoVozilo })
            },
            t.unos.polovicno,
            t.unos.osobnoVoziloObjasnjenje,
          )}
        </details>

        <p className="polje">
          <label htmlFor="pocetak">
            {t.unos.pocetak}
            <span className="prijevod">{t.unos.pocetakPrijevod}</span>
          </label>
          <select
            id="pocetak"
            value={stanje.mjesecPocetka ?? ''}
            onChange={(event) => {
              const vrijednost = event.target.value
              promijeni({
                mjesecPocetka: vrijednost === '' ? undefined : (Number(vrijednost) as Mjesec),
              })
            }}
          >
            <option value="">{t.unos.punaGodina}</option>
            {MJESECI.map((mjesec) => (
              <option key={mjesec} value={mjesec}>
                {String(mjesec)}
              </option>
            ))}
          </select>
        </p>
        {razdoblje !== undefined && (
          <p className="razlog">
            {t.unos.brojMjeseci(String(razdoblje.value))}
            <Izvor izvor={razdoblje.source} />
          </p>
        )}

        {potvrda(
          'novi-obrt',
          t.unos.noviObrt,
          stanje.noviObrt,
          (noviObrt) => {
            promijeni({ noviObrt })
          },
          t.unos.noviObrtPrijevod,
        )}

        {potvrda(
          'uz-radni-odnos',
          t.unos.uzRadniOdnos,
          stanje.uzRadniOdnos,
          (uzRadniOdnos) => {
            promijeni({ uzRadniOdnos })
          },
          t.unos.uzRadniOdnosPrijevod,
        )}

        <h3 className="forma__podnaslov">{t.unos.djelatnostNaslov}</h3>
        <p className="forma__prijevod">{t.unos.djelatnostPrijevod}</p>

        {/* Список із назвами, а не голе поле для коду.
            Раніше тут стояв `input` із `datalist`: код доводилося знати
            напам'ять, бо назва діяльності показувалася лише тому, хто вже
            вгадав перші цифри. Тепер видно і код, і що за ним стоїть, і до якої
            `skupina` закон його відніс — а `skupina` вирішує ставку.
            Ручний ввід лишився окремим пунктом: `NKD 2025` знає п'ятизначні
            підкласи, яких закон не друкує, і 47.111 має право дійти до рушія —
            там його зведе до 47 правило найточнішого збігу. */}
        <p className="polje">
          <label htmlFor="nkd">
            {t.unos.nkd}
            <span className="prijevod">{t.unos.nkdPrijevod}</span>
          </label>
          <select
            id="nkd"
            value={rucniNkd ? RUCNO : stanje.nkd}
            onChange={(event) => {
              const odabir = event.target.value
              setRucniNkd(odabir === RUCNO)
              promijeni({ nkd: odabir === RUCNO ? '' : odabir })
            }}
          >
            <option value="">{t.unos.nkdNijeOdabran}</option>
            {nkdPoSkupinama.map((skupina) => (
              <optgroup key={skupina.kod} label={t.unos.skupineNkd[skupina.kod]}>
                {skupina.stavke.map((stavka) => (
                  <option key={stavka.sifra} value={stavka.sifra}>
                    {stavka.sifra} — {stavka.naziv}
                  </option>
                ))}
              </optgroup>
            ))}
            <option value={RUCNO}>{t.unos.nkdRucnoUnesi}</option>
          </select>
        </p>

        {rucniNkd && (
          <p className="polje">
            <label htmlFor="nkd-rucno">
              {t.unos.nkdRucnoOznaka}
              <span className="prijevod">{t.unos.nkdRucnoPrijevod}</span>
            </label>
            <input
              id="nkd-rucno"
              type="text"
              inputMode="decimal"
              value={stanje.nkd}
              onChange={(event) => {
                promijeni({ nkd: event.target.value })
              }}
            />
          </p>
        )}

        {stanje.nkd.trim() !== '' && !jeOblikNkd(stanje.nkd) && (
          <p className="razlog razlog--upozorenje">{t.unos.nkdNeispravan}</p>
        )}
        <p className="forma__primjer">{t.unos.nkdOpseg(String(nkdDirektorij.length))}</p>

        {potvrda(
          'turisticka-zajednica',
          t.unos.turistickaZajednica,
          stanje.imaLokalnuTuristickuZajednicu,
          (imaLokalnuTuristickuZajednicu) => {
            promijeni({ imaLokalnuTuristickuZajednicu })
          },
          t.unos.turistickaZajednicaPrijevod,
        )}
        {potvrda(
          'potpomognuto-podrucje',
          t.unos.potpomognutoPodrucje,
          stanje.potpomognutoPodrucje,
          (potpomognutoPodrucje) => {
            promijeni({ potpomognutoPodrucje })
          },
          t.unos.potpomognutoPrijevod(POPUST_ZA_POTPOMOGNUTA_PODRUCJA.value),
        )}
        <p className="polje__izvor">
          <Izvor izvor={POPUST_ZA_POTPOMOGNUTA_PODRUCJA.source} />
        </p>
        {potvrda(
          'pretezito-proizvodna',
          t.unos.pretezitoProizvodna,
          stanje.pretezitoProizvodna,
          (pretezitoProizvodna) => {
            promijeni({ pretezitoProizvodna })
          },
          t.unos.pretezitoProizvodnaPrijevod,
        )}
        {potvrda(
          'kulturno-dobro',
          t.unos.uKulturnomDobru,
          stanje.kulturnoDobro.unutra,
          (unutra) => {
            promijeni({ kulturnoDobro: { ...stanje.kulturnoDobro, unutra } })
          },
        )}

        {stanje.kulturnoDobro.unutra && (
          <>
            <p className="polje">
              <label htmlFor="korisna-povrsina">{t.unos.korisnaPovrsina}</label>
              <input
                id="korisna-povrsina"
                type="number"
                min={0}
                step={1}
                value={stanje.kulturnoDobro.korisnaPovrsinaM2}
                onChange={(event) => {
                  promijeni({
                    kulturnoDobro: {
                      ...stanje.kulturnoDobro,
                      korisnaPovrsinaM2: Math.max(0, Number(event.target.value)),
                    },
                  })
                }}
              />
            </p>
            <p className="polje">
              <label htmlFor="iznos-po-m2">
                {t.unos.iznosPoM2}
                <span className="prijevod">{t.unos.iznosPoM2Prijevod(najmanje, najvise)}</span>
                <Izvor izvor={RASPON_SPOMENICKE_RENTE_PO_M2.source} />
              </label>
              <input
                id="iznos-po-m2"
                type="number"
                min={Number(najmanje)}
                max={Number(najvise)}
                step={0.01}
                value={stanje.kulturnoDobro.mjesecniIznosPoM2}
                onChange={(event) => {
                  // Затиск у законний діапазон, а не виняток: `čl. 116. st. 4.`
                  // дозволяє лише його, і рушій на числі поза ним падає.
                  const uneseno = Number(event.target.value)
                  promijeni({
                    kulturnoDobro: {
                      ...stanje.kulturnoDobro,
                      mjesecniIznosPoM2: Math.min(
                        Number(najvise),
                        Math.max(Number(najmanje), Number.isFinite(uneseno) ? uneseno : 0),
                      ),
                    },
                  })
                }}
              />
            </p>
          </>
        )}
      </Sekcija>

      <Sekcija naslov={t.sekcije.doo} prijevod={t.sekcije.dooPrijevod} sazetak={sazetakDoo}>
        {neobvezniBroj(
          'placa-vlasnika',
          t.unos.placaVlasnika,
          t.unos.placaVlasnikaPrijevod,
          stanje.mjesecnaPlacaVlasnika,
          (mjesecnaPlacaVlasnika) => {
            promijeni({ mjesecnaPlacaVlasnika })
          },
          100,
        )}
      </Sekcija>

      <Sekcija naslov={t.sekcije.pdv} prijevod={t.pdv.tipKlijentaPrijevod} sazetak={sazetakPdv}>
        <p className="polje">
          <label htmlFor="tip-klijenta">{t.pdv.tipKlijenta}</label>
          <select
            id="tip-klijenta"
            value={stanje.tipKlijenta}
            onChange={(event) => {
              promijeni({ tipKlijenta: event.target.value as TipKlijenta })
            }}
          >
            {TIPOVI_KLIJENATA.map((tip) => (
              <option key={tip} value={tip}>
                {t.pdv.klijenti[tip]}
              </option>
            ))}
          </select>
        </p>

        {novac(
          'inozemne-usluge',
          t.pdv.inozemneUsluge,
          stanje.inozemneUsluge,
          (inozemneUsluge) => {
            promijeni({ inozemneUsluge })
          },
          t.pdv.inozemneUslugePrijevod,
        )}
      </Sekcija>
    </section>
  )
}
