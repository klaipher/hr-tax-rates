import type {
  Doprinos,
  DoprinosiUzRadniOdnos,
  IzracunDrugeDjelatnosti,
  Money,
  RaspodjelaPoStopama,
  StranaIzvora,
  TrakaStope,
} from '@hr-tax/engine'
import { formatEur, formatPostotak } from '@hr-tax/engine'
import type { ReactNode } from 'react'

/**
 * Підсумок: пара заголовних чисел і два рядки-джерела під нею.
 *
 * Порядок тут — це відповідь на питання, з яким людина прийшла. Спершу
 * «віддано», бо питали саме про це; «на руки» поруч, бо без нього перше число
 * не має масштабу. Далі — з якого джерела скільки, бо в цьому вся суть.
 */

const Iznos = ({ iznos }: { readonly iznos: Money<'EUR'> }) => (
  <span className="iznos">{formatEur(iznos)}</span>
)

const Redak = ({
  oznaka,
  iznos,
  zbroj = false,
}: {
  readonly oznaka: ReactNode
  readonly iznos: Money<'EUR'>
  readonly zbroj?: boolean
}) => (
  <div className={zbroj ? 'redak redak--zbroj' : 'redak'}>
    <dt>{oznaka}</dt>
    <dd>
      <Iznos iznos={iznos} />
    </dd>
  </div>
)

/**
 * Складові внесків.
 *
 * Згорнуті за замовчуванням: у таблиці з двох джерел шість рядків внесків
 * розповідали б не ту історію, по яку сюди прийшли. Але й ховати їх зовсім не
 * можна — саме тут видно, що ZO нараховується двічі.
 */
const Doprinosi_ = ({
  stavke,
  ukupno,
}: {
  readonly stavke: readonly Doprinos[]
  readonly ukupno: Money<'EUR'>
}) => (
  <details className="podrobnosti">
    <summary>
      Внески · <Iznos iznos={ukupno} />
    </summary>
    <dl className="rozbivka">
      {stavke.map((stavka) => (
        <Redak
          key={stavka.naziv.hr}
          oznaka={
            <>
              <span className="pojam">{stavka.naziv.hr}</span>{' '}
              <span className="prijevod">
                {stavka.naziv.uk}, {formatPostotak(stavka.stopa)}
                {stavka.osobnaStednja ? ' · на власний рахунок' : ''}
                {stavka.teretiOsobu ? '' : ' · платить роботодавець'}
              </span>
            </>
          }
          iznos={stavka.godisnjiIznos}
        />
      ))}
    </dl>
  </details>
)

/**
 * Прогресія: дві ставки й поріг між ними.
 *
 * Під спойлером, бо це пояснення, а не число: у рядку `predujam` стоїть одна
 * сума, і питання «чому саме стільки» виникає не в кожного. Але коли виникає
 * — відповідь має бути тут, а не в чужому калькуляторі.
 *
 * Ставки встановлює сама одиниця в межах закону, тому їхні значення прийшли
 * з довідника разом із містом, а поріг — той самий по всій країні.
 */
const Progresija = ({ raspodjela }: { readonly raspodjela: RaspodjelaPoStopama }) => {
  const traka = (naziv: string, t: TrakaStope, opis: ReactNode) => (
    <Redak
      oznaka={
        <>
          <span className="pojam">
            {naziv} · {formatPostotak(t.stopa)}
          </span>{' '}
          <span className="prijevod">{opis}</span>
        </>
      }
      iznos={t.iznos}
    />
  )

  return (
    <details className="podrobnosti">
      <summary>Чому саме стільки: дві ставки</summary>
      <p className="razlog">
        Податок із plaća прогресивний, але смуг лише дві, і рахуються вони{' '}
        <strong>помісячно</strong>: за місяць, у якому база перевищила поріг, вища ставка діє рівно
        на перевищення ({raspodjela.izvorPraga.article}). Той, хто за рік заробив стільки ж, але
        нерівномірно, заплатить інакше.
      </p>
      <dl className="rozbivka">
        <Redak
          oznaka={
            <>
              <span className="pojam">osobni odbitak</span>{' '}
              <span className="prijevod">неоподатковувана частина — у базу не входить узагалі</span>
            </>
          }
          iznos={raspodjela.osobniOdbitak}
        />
        <Redak
          oznaka={
            <>
              <span className="pojam">porezna osnovica</span>{' '}
              <span className="prijevod">plaća без утриманих внесків і без відрахунку</span>
            </>
          }
          iznos={raspodjela.poreznaOsnovica}
        />
        {traka(
          'niža stopa',
          raspodjela.niza,
          <>
            з бази до {formatEur(raspodjela.mjesecniPrag)} на місяць — тут{' '}
            {formatEur(raspodjela.niza.osnovica)} за рік
          </>,
        )}
        {traka(
          'viša stopa',
          raspodjela.visa,
          raspodjela.visa.osnovica.amount.isZero() ? (
            <>база порога не дістала — ця ставка не спрацювала жодного місяця</>
          ) : (
            <>з того, що понад поріг, — {formatEur(raspodjela.visa.osnovica)} за рік</>
          ),
        )}
      </dl>
    </details>
  )
}

const Zaglavlje = ({ strana }: { readonly strana: StranaIzvora }) => (
  <div className="kartica__zaglavlje">
    <h2>{strana.naziv.hr}</h2>
    <p className="prijevod">{strana.naziv.uk}</p>
    {/*
      Велике число — те, що лишається. Віддане стоїть рядком нижче й ще раз
      підсумком переліку: там воно на своєму місці, бо є сумою перелічених
      складових, а тут головне питання інше — скільки з цього джерела твоє.
    */}
    <p className="glavno">
      <span className="glavno__iznos">
        <Iznos iznos={strana.neto} />
      </span>
      {/* Місячне поруч, а не замість: рік — те, що рахує закон, місяць — те,
          чим живуть. Менший кегль каже, котре з них похідне. */}
      <span className="glavno__mjesecno">
        <Iznos iznos={strana.mjesecniNeto} /> у середньому на місяць
      </span>
      <span className="glavno__oznaka">
        лишається за рік із <Iznos iznos={strana.baza} />
      </span>
    </p>
    {strana.efektivnaStopa !== undefined && (
      <p className="stopa">
        віддано <strong>{formatEur(strana.odbijeno)}</strong> — ефективна ставка{' '}
        <strong>{formatPostotak(strana.efektivnaStopa)}</strong>
      </p>
    )}
  </div>
)

const StranaPlace_ = ({
  placa,
  trosakZaPoslodavca,
  pragPlaveKarte,
}: {
  readonly placa: IzracunDrugeDjelatnosti['placa']
  readonly trosakZaPoslodavca: Money<'EUR'>
  readonly pragPlaveKarte: IzracunDrugeDjelatnosti['pragPlaveKarte']
}) => {
  const svi: readonly Doprinos[] = [
    placa.doprinosi.moPrviStup,
    placa.doprinosi.moDrugiStup,
    placa.doprinosi.zo,
  ]

  return (
    <article className="kartica">
      <Zaglavlje strana={placa} />
      <dl className="rozbivka">
        <Redak
          oznaka={
            <>
              <span className="pojam">predujam poreza na dohodak</span>{' '}
              <span className="prijevod">податок, який утримують протягом року</span>
            </>
          }
          iznos={placa.porez.godisnjiIznos}
        />
        {!placa.povrat.amount.isZero() && (
          <Redak
            oznaka={
              <>
                <span className="pojam">povrat</span>{' '}
                <span className="prijevod">
                  повертається річним звітом — у наступному календарному році
                </span>
              </>
            }
            iznos={placa.povrat}
          />
        )}
      </dl>
      <Progresija raspodjela={placa.raspodjelaPoStopama} />
      <Doprinosi_ stavke={svi} ukupno={placa.doprinosi.ukupnoGodisnje} />
      <dl className="rozbivka">
        <Redak oznaka="віддано за рік" iznos={placa.odbijeno} zbroj />
      </dl>
      <p className="razlog">
        Коштує роботодавцю <strong>{formatEur(trosakZaPoslodavca)}</strong> на рік. У «віддано» це
        не входить і входити не може: внески понад plaća ніколи не були вашими грошима — але
        порівнювати вашу зарплату з примітком обрту треба саме з цим числом.
      </p>
      {/* Поріг стоїть саме тут, а не серед застережень: він про це число й
          ні про що інше, і саме заради нього сюди приходить власник картки. */}
      {pragPlaveKarte !== undefined && (
        <p className={pragPlaveKarte.dosegnut ? 'prag prag--dosegnut' : 'prag prag--nedosegnut'}>
          <span className="prag__oznaka">EU plava karta</span>
          <span>
            поріг <strong>{formatEur(pragPlaveKarte.mjesecniPrag)}</strong> на місяць, ваша{' '}
            <strong>{formatEur(placa.mjesecnaBrutoPlaca)}</strong> —{' '}
            {pragPlaveKarte.dosegnut
              ? 'дістає'
              : 'не дістає; на розрахунок вище це не впливає, на видачу дозволу так'}
            . Місячна сума — дванадцята частина річної: рік із тринадцятою виплатою дав би той самий
            рік і інший місяць.
          </span>
        </p>
      )}
    </article>
  )
}

const StranaObrta_ = ({ obrt }: { readonly obrt: IzracunDrugeDjelatnosti['obrt'] }) => {
  const doprinosi: DoprinosiUzRadniOdnos = obrt.doprinosi
  const svi: readonly Doprinos[] = [doprinosi.moPrviStup, doprinosi.moDrugiStup, doprinosi.zo]

  return (
    <article className="kartica">
      <Zaglavlje strana={obrt} />
      <p className="razred">
        Розряд {obrt.razred.redniBroj} — до <Iznos iznos={obrt.razred.gornjaGranica} /> на рік.
        Податок рахується з верхньої межі розряду, а не з вашого primitak, тож усередині розряду
        сума не змінюється.
      </p>
      <dl className="rozbivka">
        <Redak
          oznaka={
            <>
              <span className="pojam">paušalni porez</span>{' '}
              <span className="prijevod">
                {formatPostotak(obrt.porez.stopa)} від paušalni dohodak{' '}
                {formatEur(obrt.porez.poreznaOsnovica)} — ставка з закону, місто її не чіпає
              </span>
            </>
          }
          iznos={obrt.porez.godisnjiIznos}
        />
        {obrt.komorskiDoprinos.status === 'obračunato' ? (
          <Redak
            oznaka={
              <>
                <span className="pojam">{obrt.komorskiDoprinos.naziv.hr}</span>{' '}
                <span className="prijevod">{obrt.komorskiDoprinos.obracun}</span>
              </>
            }
            iznos={obrt.komorskiDoprinos.godisnjiIznos}
          />
        ) : (
          <div className="redak neprimjenjivo">
            <dt>
              <span className="pojam">{obrt.komorskiDoprinos.naziv.hr}</span>{' '}
              <span className="prijevod">
                не нараховано: обрт у перших двох роках від першого впису (
                {obrt.komorskiDoprinos.izvor.article})
              </span>
            </dt>
            <dd>—</dd>
          </div>
        )}
      </dl>
      <Doprinosi_ stavke={svi} ukupno={doprinosi.ukupnoGodisnje} />

      {/* Підсвічене навмисно: це єдине число на сторінці, яке відповідає на
          питання «а що дала сама паралельність». Решта показує, скільки коштує
          становище; це — скільки воно зекономило. */}
      {obrt.ustedaOdRadnogOdnosa.usteda.amount.isPositive() && (
        <p className="usteda">
          <span className="usteda__oznaka">Паралельність із наймом заощаджує</span>
          <strong className="usteda__iznos">
            <Iznos iznos={obrt.ustedaOdRadnogOdnosa.usteda} /> на рік
          </strong>
          <span className="usteda__objasnjenje">
            Сам по собі обрт платив би <Iznos iznos={obrt.ustedaOdRadnogOdnosa.bezRadnogOdnosa} />{' '}
            внесків — фіксовано, хоч би скільки заробив. Поряд із наймом база рахується з paušalni
            dohodak ({doprinosi.izvorOsnovice.article}), а ставки вдвічі менші: 17,5 % замість 36,5
            %, бо основне страхування вже оплачене за місцем роботи. Тому виграш найбільший саме на
            малому primitak.
          </span>
        </p>
      )}
      <dl className="rozbivka">
        <Redak oznaka="віддано за рік" iznos={obrt.odbijeno} zbroj />
      </dl>
    </article>
  )
}

/**
 * Пара заголовних чисел: скільки віддано і скільки лишилося.
 *
 * Окремим експортом від карток, бо стоїть в іншому місці розкладки — над
 * обома колонками. На телефоні саме це число має бути видно першим, ще до
 * форми, інакше по нього довелося б гортати всю сторінку.
 */
export const Sazetak = ({ izracun }: { readonly izracun: IzracunDrugeDjelatnosti }) => (
  <section className="sazetak">
    <div className="sazetak__brojevi">
      <p className="glavno">
        <span className="glavno__iznos">
          <Iznos iznos={izracun.ukupnoNeto} />
        </span>
        <span className="glavno__mjesecno">
          <Iznos iznos={izracun.ukupnoMjesecniNeto} /> у середньому на місяць
        </span>
        <span className="glavno__oznaka">лишається за рік — обидва джерела разом</span>
      </p>
      <p className="glavno">
        <span className="glavno__iznos">
          <Iznos iznos={izracun.ukupnoOdbijeno} />
        </span>
        <span className="glavno__oznaka">віддано за рік — податки, внески й палата разом</span>
      </p>
    </div>
    {izracun.ukupnaEfektivnaStopa !== undefined && (
      <p className="stopa">
        ефективна ставка на все — <strong>{formatPostotak(izracun.ukupnaEfektivnaStopa)}</strong>.
        Це не середнє двох ставок нижче, а віддане до суми обох баз.
      </p>
    )}
  </section>
)

/** Дві картки джерел. Порядок сталий: plaća, потім обрт. */
export const Rezultat = ({ izracun }: { readonly izracun: IzracunDrugeDjelatnosti }) => (
  <div className="kartice">
    <StranaPlace_
      placa={izracun.placa}
      trosakZaPoslodavca={izracun.trosakZaPoslodavca}
      pragPlaveKarte={izracun.pragPlaveKarte}
    />
    <StranaObrta_ obrt={izracun.obrt} />
  </div>
)
