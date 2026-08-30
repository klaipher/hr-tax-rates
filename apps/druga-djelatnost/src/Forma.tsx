import { sveJedinice } from '@hr-tax/data'
import { Grad } from './Grad.tsx'
import { PODLOGA } from './podloga.ts'

/**
 * Форма: два числа, місто й обставини платника.
 *
 * Полів рівно стільки, скільки змінюють хоч одне число на екрані. Те, що
 * майже завжди «ні» — `povratnik`, `umanjenje za područje`, неоподатковані
 * виплати, перше працевлаштування, — сюди не потрапило навмисно: розрахунок
 * називає ці припущення вголос замість того, щоб питати про них усіх.
 */

/** Верхня межа поля `primitak`: вище паушалу немає (`čl. 82. st. 1.`). */
export const PRAG_PAUSALA = PODLOGA.ruleset.pausalniObrt.pragPrimitka.value.toNumber()

/**
 * Скільки дітей закон уміє порахувати.
 *
 * З акта, а не числом: `čl. 14. st. 3.` друкує коефіцієнти до певної дитини, і
 * поле не має пускати далі — розрахунок мовчки взяв би стільки, скільки знає.
 */
export const NAJVISE_DJECE = PODLOGA.placa.osobniOdbitak.koeficijentiDjece.value.length

/**
 * Хто публікує середню за повний попередній рік — якщо число ще з публікації.
 *
 * Порожньо, коли людина вже вбила своє: приписати статистиці чуже число
 * означало б рівно те, проти чого стоїть `prosjecnaPlacaPrethodneGodineZa`.
 */
const izvorPrethodneGodine = PODLOGA.pretpostavke.prosjecnaPlacaPrethodneGodine?.source
const IZDAVAC_PRETHODNE_GODINE =
  izvorPrethodneGodine?.status === 'published' ? `, ${izvorPrethodneGodine.publisher}` : ''

/**
 * Одиниця, з якої починається сторінка.
 *
 * Не «правильне» місто, а робочий початок: без обраної одиниці податок із
 * plaća не рахується взагалі, і застосунок зустрічав би людину порожньою
 * вимогою замість числа. Хто живе не в Загребі, змінює поле — воно перше під
 * формою й одразу видиме.
 *
 * Береться пошуком за назвою, а не вписаною шифрою: `1333` у коді не сказала
 * б читачеві, яке це місто, і мовчки вказала б на інше, якби довідник
 * перенумерували. Порожньо, якщо назва зникне, — і тоді сторінка чесно
 * попросить обрати місто, замість того щоб рахувати за випадковою одиницею.
 *
 * Напрямок можливої помилки названий навмисно: ставки Загреба найвищі в
 * країні (23 %/33 %), тож у того, хто місто не змінив, податок із plaća
 * вийде радше завищеним, ніж заниженим.
 */
const ZADANA_JEDINICA = sveJedinice.value.find(({ ime }) => ime === 'ZAGREB')?.sifra ?? ''

export interface StanjeForme {
  readonly godisnjaBrutoPlaca: number
  readonly godisnjiPrimitakObrta: number
  /** «Šifra grada/općine» — єдиний унікальний ключ довідника. */
  readonly sifraJedinice: string
  readonly djeca: number
  readonly clanoviUzeObitelji: number
  readonly sInvaliditetom: number
  readonly sPotpunimInvaliditetom: number
  /** Щабель `olakšica za mlade`, а не сам вік: закон питає саме щабель. */
  readonly olaksicaMladih: 'nema' | 'do-25' | 'do-30'
  readonly noviObrt: boolean
  /** Середня bruto plaća за повний попередній рік — поріг `EU plava karta`. */
  readonly prosjecnaPlacaPrethodneGodine: number
}

/**
 * Початковий стан.
 *
 * `noviObrt` увімкнений: людина, яка щойно приїхала за «блакитною карткою» й
 * відкрила обрт, у перших двох роках і є. Хто в них не потрапляє, знімає
 * галочку — і бачить, як з'являються 136,80 €.
 */
export const POCETNO_STANJE: StanjeForme = {
  godisnjaBrutoPlaca: 38_400,
  godisnjiPrimitakObrta: 20_000,
  sifraJedinice: ZADANA_JEDINICA,
  djeca: 0,
  clanoviUzeObitelji: 0,
  sInvaliditetom: 0,
  sPotpunimInvaliditetom: 0,
  olaksicaMladih: 'nema',
  noviObrt: true,
  prosjecnaPlacaPrethodneGodine:
    PODLOGA.pretpostavke.prosjecnaPlacaPrethodneGodine?.value.toNumber() ?? 0,
}

/** Вік, який рушій прочитає як щабель пільги. `undefined` — не рахувати її. */
export const dobIzForme = (stanje: StanjeForme): number | undefined => {
  if (stanje.olaksicaMladih === 'nema') return undefined
  return stanje.olaksicaMladih === 'do-25' ? 25 : 26
}

interface BrojcanoPolje {
  readonly oznaka: string
  readonly pojasnjenje?: string | undefined
  readonly vrijednost: number
  readonly min: number
  readonly max: number
  readonly korak?: number
  readonly promijeni: (vrijednost: number) => void
  /**
   * Одиниця виміру після поля.
   *
   * Не косметика: «2016» у полі середньої зарплати читається як рік, і саме
   * так його й прочитали. Лічильники утриманців одиниці не мають — там і без
   * неї видно, що це люди.
   */
  readonly jedinica?: string | undefined
}

const Broj = ({
  oznaka,
  pojasnjenje,
  vrijednost,
  min,
  max,
  korak,
  promijeni,
  jedinica,
}: BrojcanoPolje) => (
  <p className="polje">
    <label>
      {oznaka}
      {pojasnjenje !== undefined && <span className="prijevod">{pojasnjenje}</span>}
      <span className="polje__vrijednost">
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={korak ?? 1}
          value={vrijednost}
          onChange={(dogadaj) => {
            const broj = dogadaj.currentTarget.valueAsNumber
            // Порожнє поле дає `NaN`. Нуль — чесніша відповідь за «залишити як
            // було»: людина справді стерла число, і розрахунок має це показати.
            promijeni(Number.isNaN(broj) ? min : Math.min(Math.max(broj, min), max))
          }}
        />
        {jedinica !== undefined && <span className="polje__jedinica">{jedinica}</span>}
      </span>
    </label>
  </p>
)

/**
 * Верхня межа повзунка `plaća`.
 *
 * Далеко за типовою зарплатою навмисно: повзунок має показувати, як росте
 * частка відданого, а вона росте саме там, де вмикається вища ставка.
 */
const NAJVISA_PLACA = 120_000

/** Крок у 600 € — це рівно 50 € на місяць, тобто ціле число в договорі. */
const KORAK_PLACE = 600

const KORAK_PRIMITKA = 100

/**
 * Ціле число євро з розділеними тисячами: `120 000 €`.
 *
 * Не `formatEur`: під повзунком стоїть межа діапазону, а не сума до сплати, і
 * два нулі після коми там читаються як точність, якої це число не має.
 */
const cijeliEuri = (iznos: number): string =>
  `${iznos.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} €`

interface GlavniUnos {
  readonly id: string
  readonly oznaka: string
  readonly pojasnjenje: string
  readonly vrijednost: number
  readonly max: number
  readonly korak: number
  readonly promijeni: (vrijednost: number) => void
  /** Рядок під полем — те, що з числа виводиться, а не вводиться. */
  readonly podnozje?: string | undefined
}

/**
 * Одне число: поле й повзунок на ту саму величину.
 *
 * Поле — щоб увести точну суму з договору чи з виписки. Повзунок — щоб
 * побачити, як міняється відповідь, коли суму рухати. Одне без одного тут
 * не працює: повзунком на 120 000 € із кроком 600 € у точну зарплату не
 * влучити, а полем не намацати, де саме починає рости частка відданого.
 */
const GlavnoPolje = ({
  id,
  oznaka,
  pojasnjenje,
  vrijednost,
  max,
  korak,
  promijeni,
  podnozje,
}: GlavniUnos) => {
  const uMezama = (broj: number) => Math.min(Math.max(Number.isNaN(broj) ? 0 : broj, 0), max)

  return (
    <div className="unos glavni-unos">
      <label htmlFor={id}>
        {oznaka}
        <span className="prijevod">{pojasnjenje}</span>
      </label>

      <span className="unos__redak">
        <input
          id={id}
          className="unos__polje"
          type="number"
          inputMode="numeric"
          min={0}
          max={max}
          step={korak}
          value={vrijednost}
          onChange={(dogadaj) => {
            promijeni(uMezama(dogadaj.currentTarget.valueAsNumber))
          }}
        />
        <span className="glavni-unos__valuta">€ на рік</span>
      </span>

      <input
        className="unos__klizac"
        type="range"
        aria-label={oznaka}
        min={0}
        max={max}
        step={korak}
        value={vrijednost}
        onChange={(dogadaj) => {
          promijeni(dogadaj.currentTarget.valueAsNumber)
        }}
      />
      <p className="unos__skala">
        <span>0 €</span>
        <span>{cijeliEuri(max)}</span>
      </p>
      {podnozje !== undefined && <p className="razlog">{podnozje}</p>}
    </div>
  )
}

/**
 * Два числа, з яких усе починається.
 *
 * Стоять окремо від решти форми й безпосередньо над картками, бо це єдині
 * два входи, які людина крутить, дивлячись на відповідь. Усе інше вона
 * задає раз і більше не чіпає — тому воно й живе в бічному стовпці.
 *
 * Обидва річні. `primitak` річний тому, що річним його міряє закон; `plaća`
 * — щоб на екрані не було двох періодів, які людина зводила б сама.
 */
export const GlavniUnosi = ({
  stanje,
  promijeni,
}: {
  readonly stanje: StanjeForme
  readonly promijeni: (izmjena: Partial<StanjeForme>) => void
}) => (
  <section className="izvori-unos">
    <div className="izvori-unos__polja">
      <GlavnoPolje
        id="godisnja-placa"
        oznaka="Річна bruto plaća"
        pojasnjenje="до утримань і до податку"
        vrijednost={stanje.godisnjaBrutoPlaca}
        max={NAJVISA_PLACA}
        korak={KORAK_PLACE}
        promijeni={(godisnjaBrutoPlaca) => {
          promijeni({ godisnjaBrutoPlaca })
        }}
      />
      <GlavnoPolje
        id="godisnji-primitak"
        oznaka="Річний primitak обрту"
        pojasnjenje="усе, що зайшло касою"
        vrijednost={stanje.godisnjiPrimitakObrta}
        max={PRAG_PAUSALA}
        korak={KORAK_PRIMITKA}
        promijeni={(godisnjiPrimitakObrta) => {
          promijeni({ godisnjiPrimitakObrta })
        }}
        podnozje={`вище паушал недоступний · ${PODLOGA.ruleset.pausalniObrt.pragPrimitka.source.article}`}
      />
    </div>
  </section>
)

/** Решта обставин платника — те, що задають раз і далі не чіпають. */
export const Forma = ({
  stanje,
  promijeni,
}: {
  readonly stanje: StanjeForme
  readonly promijeni: (izmjena: Partial<StanjeForme>) => void
}) => (
  <section className="forma">
    <h2 className="forma__podnaslov">Де живе платник</h2>
    <Grad
      sifra={stanje.sifraJedinice}
      promijeni={(sifraJedinice) => {
        promijeni({ sifraJedinice })
      }}
    />

    <h2 className="forma__podnaslov">Обрт і статистика</h2>

    <p className="polje polje--potvrda">
      <label>
        <input
          type="checkbox"
          checked={stanje.noviObrt}
          onChange={(dogadaj) => {
            promijeni({ noviObrt: dogadaj.currentTarget.checked })
          }}
        />
        <span>Обрт молодший за два роки</span>
        <span className="prijevod">
          перші два роки від першого впису в Obrtni registar звільнені від komorski doprinos (
          {PODLOGA.komorskiDoprinos.oslobodenjeGodina.source.article}). З третього року він
          з'являється цілком — переходу немає.
        </span>
      </label>
    </p>

    <Broj
      jedinica="€ на місяць"
      oznaka="Середня bruto plaća за повний попередній рік"
      pojasnjenje={`prosječna plaća за січень–грудень${IZDAVAC_PRETHODNE_GODINE}. Рухає лише поріг EU plava karta. Це не та середня, з якої будуються бази внесків: та інша й за інший період.`}
      vrijednost={stanje.prosjecnaPlacaPrethodneGodine}
      min={0}
      max={20_000}
      korak={1}
      promijeni={(prosjecnaPlacaPrethodneGodine) => {
        promijeni({ prosjecnaPlacaPrethodneGodine })
      }}
    />
    <h2 className="forma__podnaslov">Утриманці й вік</h2>
    <p className="forma__prijevod">
      Обидва рухають лише osobni odbitak — а отже, лише податок із plaća. На паушальний обрт вони не
      впливають ніяк: там база задана розрядом, а не заробленим.
    </p>

    {/*
      Чотири лічильники сіткою, а не стовпцем: поодинці вони займали чотири
      екрани прокрутки, хоч у кожного поле на одну цифру. Пояснення при цьому
      лишаються — це вони роблять поля різними, а не самі назви.
    */}
    <div className="brojaci">
      <Broj
        oznaka="Діти"
        pojasnjenje="uzdržavana djeca — у кожної свій коефіцієнт, що зростає з порядком"
        vrijednost={stanje.djeca}
        min={0}
        max={NAJVISE_DJECE}
        promijeni={(djeca) => {
          promijeni({ djeca })
        }}
      />
      <Broj
        oznaka="Інші утриманці"
        pojasnjenje="uzdržavani članovi uže obitelji — подружжя, батьки; дітей сюди не рахують"
        vrijednost={stanje.clanoviUzeObitelji}
        min={0}
        max={20}
        promijeni={(clanoviUzeObitelji) => {
          promijeni({ clanoviUzeObitelji })
        }}
      />
      <Broj
        oznaka="З інвалідністю"
        pojasnjenje="рахуючи й самого платника, якщо вона встановлена йому"
        vrijednost={stanje.sInvaliditetom}
        min={0}
        max={20}
        promijeni={(sInvaliditetom) => {
          promijeni({ sInvaliditetom })
        }}
      />
      <Broj
        oznaka="З повною інвалідністю"
        pojasnjenje="окремий, більший коефіцієнт — не додається до попереднього рядка"
        vrijednost={stanje.sPotpunimInvaliditetom}
        min={0}
        max={20}
        promijeni={(sPotpunimInvaliditetom) => {
          promijeni({ sPotpunimInvaliditetom })
        }}
      />
    </div>

    <p className="polje">
      <label>
        Вік
        <span className="prijevod">
          olakšica za mlade — приходить не платіжкою, а поверненням наступного року
        </span>
        <select
          value={stanje.olaksicaMladih}
          onChange={(dogadaj) => {
            promijeni({
              olaksicaMladih: dogadaj.currentTarget.value as StanjeForme['olaksicaMladih'],
            })
          }}
        >
          <option value="nema">понад 30 — пільги немає</option>
          <option value="do-25">до 25 років</option>
          <option value="do-30">від 25 до 30 років</option>
        </select>
      </label>
    </p>
  </section>
)
