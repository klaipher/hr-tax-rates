import type {
  LegalReference,
  Napomena,
  ObligationKind,
  Pretpostavke,
  RazlogNeprimjene,
  Ruleset,
} from '@hr-tax/data'
import type Decimal from 'decimal.js'
import type { Money } from './money.ts'

/**
 * Назва поняття: канонічна хорватська форма й український переклад поруч.
 *
 * Тип змушує дати обидві. `primitak`, `izdatak`, `dohodak` і `dobit` різні,
 * а українською всі четверо тягне до «доходу» — тому переклад іде поруч із
 * хорватським терміном, а не замість нього (CONTEXT.md).
 */
export interface Naziv {
  readonly hr: string
  readonly uk: string
}

/** Вхід форми. */
export interface Unos {
  /**
   * Річний `primitak` (надходження / receipts). Саме він визначає `razred`
   * і поріг паушалу — не `dohodak` і не `dobit`.
   */
  readonly godisnjiPrimitak: Money<'EUR'>
}

/**
 * Два шари даних, на яких стоїть розрахунок: закон і статистика (ADR-0001).
 *
 * Рушій не має свого набору правил і не знає жодного числа з закону — усе
 * приходить сюди ззовні, тож той самий рушій рахує і чинний рік, і проєкт.
 */
export interface Podloga {
  /** `ruleset` (набір правил / ruleset) — усе, що написано в законі. */
  readonly ruleset: Ruleset
  /**
   * `pretpostavke` (припущення / assumptions) — величини, на які закон
   * посилається, але яких не встановлює.
   */
  readonly pretpostavke: Pretpostavke
}

/** `režim` (режим / regime), який калькулятор уміє показати. */
export type RezimId =
  | 'pausalni-obrt'
  | 'obrt-na-dohodak'
  | 'obrt-na-dobit'
  | 'zaposlenik'
  | 'doo-placa'
  | 'doo-clan-uprave'

/**
 * Правова форма, у якій ведеться діяльність.
 *
 * Не косметика й не синонім `RezimId`: від неї залежать обов'язкові платежі
 * поза податками. `komorski doprinos` платить кожен `obrt` і тільки `obrt`,
 * `članarina HGK` стосується товариств, а найманий працівник не платить
 * жодного з них — і не має `izdatak`, які можна було б відняти.
 *
 * Три форми, а не шість режимів: обидва d.o.o. мають ту саму форму, і
 * платежі не розрізняють, чи власник у трудовому договорі.
 */
export type PravniOblik = 'obrt' | 'trgovačko društvo' | 'nesamostalni rad'

/** `razred` (розряд / bracket), що застосувався до цього `primitak`. */
export interface PrimijenjeniRazred {
  /** Порядковий номер розряду в таблиці акта. */
  readonly redniBroj: number
  /**
   * `gornja granica razreda` (верхня межа розряду / bracket upper bound).
   * Податок рахується з неї, а не з фактичного `primitak` — тому всередині
   * розряду сума не змінюється, а на межі стрибає.
   */
  readonly gornjaGranica: Money<'EUR'>
  /** Стаття з таблицею розрядів. */
  readonly izvor: LegalReference
}

/** Річний податок режиму. */
export interface Porez {
  /** Як податок зветься в законі: у паушальному обрті — `paušalni porez`. */
  readonly naziv: Naziv
  /**
   * `porezna osnovica` (база оподаткування / tax base) — з чого нарахований
   * податок.
   *
   * Не плутати з `osnovica`: у цьому глосарії `osnovica` значить базу
   * нарахування внесків і будується з `prosječna plaća`, тоді як база
   * оподаткування береться з іншого закону і з іншої величини. Одне ім'я на
   * обидві схлопнуло б два різні числа.
   *
   * У паушальному обрті базою є `paušalni dohodak` (паушальний дохід /
   * deemed income) — юридична фікція, а не різниця `primitak` і `izdatak`.
   */
  readonly poreznaOsnovica: Money<'EUR'>
  /** Ставка податку — частка від 0 до 1, а не відсотки. */
  readonly stopa: Decimal
  /** Сума податку за рік. */
  readonly godisnjiIznos: Money<'EUR'>
  /** Стаття, з якої взята ставка. */
  readonly izvor: LegalReference
}

/** Одна складова `doprinosi` (внески / social contributions). */
export interface Doprinos {
  /** Як внесок зветься: `MO — I. stup`, `MO — II. stup`, `ZO`. */
  readonly naziv: Naziv
  /** Ставка до `osnovica` — частка від 0 до 1, а не відсотки. */
  readonly stopa: Decimal
  /** Сума внеску за рік. */
  readonly godisnjiIznos: Money<'EUR'>
  /**
   * Чи гроші лишаються персональними. II. stup іде на індивідуальний рахунок
   * платника — це відкладені кошти, а не втрачені, і на картці їх не можна
   * показувати нарівні з податком.
   */
  readonly osobnaStednja: boolean
  /**
   * Чи внесок виходить із грошей самої людини.
   *
   * Не те саме, що поділ закону на внески «iz osnovice» і «na osnovicu»
   * (`čl. 81.` ZoD): той поділ каже, як внесок нараховують, а це поле —
   * чия кишеня порожніє. Різниця видно рівно там, де сторін дві. У
   * найманого працівника ZO платить роботодавець понад плаћу, і ці гроші
   * людині не належали ніколи. В `obrt na dobit` ZO теж нараховується
   * «na osnovicu», але платить його той самий обрт тієї самої людини —
   * тож там воно `true`.
   *
   * Поле існує, бо без нього спільна формула «на руки» відняла б у
   * найманого працівника 16,5% бруто, яких він і не отримував.
   */
  readonly teretiOsobu: boolean
  /** Стаття, з якої взята ставка. */
  readonly izvor: LegalReference
}

export interface Doprinosi {
  /**
   * `osnovica` (база нарахування внесків / contribution base) за місяць:
   * `prosječna plaća × koeficijent`. Не залежить ні від розряду, ні від
   * фактичного `primitak`.
   *
   * `undefined` у діяльності поряд із наймом: там закон місячної `osnovica`
   * не знає взагалі — база береться з річного результату діяльності
   * (`čl. 185.` ZoD). Показати «місячну базу» там означало б вигадати її.
   */
  readonly mjesecnaOsnovica: Money<'EUR'> | undefined
  /** MO — I. stup (пенсійне, генераційна солідарність / pay-as-you-go pillar). */
  readonly moPrviStup: Doprinos
  /**
   * MO — II. stup (пенсійне, індивідуальна капіталізована ощадність /
   * funded pillar).
   */
  readonly moDrugiStup: Doprinos
  /** ZO (медичне страхування / health insurance). */
  readonly zo: Doprinos
  /** Усі складові разом за рік. */
  readonly ukupnoGodisnje: Money<'EUR'>
  /**
   * Ті складові, що виходять із грошей самої людини — саме їх віднімає
   * спільна формула «на руки».
   *
   * Другий підсумок, а не заміна першому: картка показує всі внески, бо
   * медичне страхування найманого працівника оплачується й тоді, коли
   * платить його роботодавець. Приховати ZO означало б написати, що
   * страхування нема. У всіх обртних режимів обидва підсумки збігаються.
   */
  readonly ukupnoGodisnjeNaTeretOsobe: Money<'EUR'>
  /**
   * Наскільки менші внески виходять із наймом, ніж без нього. `undefined`,
   * коли найму немає — там немає з чим порівнювати.
   *
   * Число, а не різниця, яку взявся б рахувати екран: порівнювати треба той
   * самий режим на тих самих входах, і зробити це поза рушієм означало б
   * складати два розрахунки в шарі показу.
   */
  readonly ustedaUzRadniOdnos: Money<'EUR'> | undefined
}

/**
 * Обов'язковий платіж поза податками і `doprinosi`.
 *
 * `komorski doprinos` платить кожен `obrt` незалежно від режиму, а
 * `turistička članarina` і `spomenička renta` — лише за певних `NKD` і місць.
 * Незастосовний платіж лишається в списку зі своєю причиною: людина має
 * відрізняти «не забули» від «нічого не винен».
 */
export type ObveznoDavanje =
  | {
      readonly status: 'obračunato'
      readonly naziv: Naziv
      readonly godisnjiIznos: Money<'EUR'>
      /** Звідки взялася сума: база й ставка, словами. */
      readonly obracun: string
      /**
       * Застереження, за яких сума може виявитися іншою — кодами, а не
       * реченнями: речення складає інтерфейс мовою читача (ADR-0004).
       */
      readonly napomene: readonly Napomena[]
      readonly izvor: LegalReference
    }
  | {
      readonly status: 'ne-primjenjuje-se'
      readonly naziv: Naziv
      /** Чому платежу немає — код із параметрами, а не проза (ADR-0004). */
      readonly razlog: RazlogNeprimjene
      readonly izvor: LegalReference
    }

/**
 * Застереження до самого розрахунку — кодом із параметрами, а не реченням.
 *
 * Пара до `Napomena` в шарі платежів, але про інше: та каже, чому сума
 * платежу може виявитися іншою, а ця — за яких обставин прочитано вхід і що
 * закон зробив із введеним числом. Речення складає інтерфейс мовою читача, а
 * числа лишаються числами й ведуть до статті (ADR-0002, ADR-0004).
 */
export type NapomenaRezima =
  | {
      /**
       * Бруто нижче за `minimalna plaća`. Не порушення: мінімальна
       * встановлена на повний робочий час, тож нижча сума означає неповний.
       */
      readonly kod: 'ispod-minimalne-place'
      readonly minimalna: Money<'EUR'>
      readonly izvor: LegalReference
    }
  | {
      /** Закон не дав опустити базу внесків нижче за приписану `osnovica`. */
      readonly kod: 'placa-podignuta-na-najnizu-osnovicu'
      readonly trazena: Money<'EUR'>
      readonly primijenjena: Money<'EUR'>
      readonly izvor: LegalReference
    }
  | {
      /**
       * Поріг зарплати, за якого видають `EU plava karta`.
       *
       * Стоїть постійно, а не лише коли зарплата його не дістає: той, хто
       * планує переїзд, має бачити саме число й тоді, коли вже його
       * перевищив, — інакше рядок з'являвся б і зникав, і поріг було б видно
       * лише в найгіршому випадку.
       *
       * Не податкове правило, а умова видачі дозволу: на жодну суму в цій
       * картці воно не впливає.
       */
      readonly kod: 'prag-plave-karte'
      readonly prag: Money<'EUR'>
      /** Чи введена брутто-плаћа дістає порога. */
      readonly dosegnut: boolean
      readonly izvor: LegalReference
    }
  | {
      /**
       * `olakšica za mlade` приходить не в платіжці, а наступного року.
       * Протягом року `predujam` утримують повний (`čl. 46. st. 3.`), тож
       * сума в цьому рядку вже врахована в «на руки», але надійде вона
       * поверненням у наступному календарному році.
       */
      readonly kod: 'olaksica-za-mlade-kao-povrat'
      readonly iznos: Money<'EUR'>
      readonly izvor: LegalReference
    }
  | {
      /**
       * Слайдер прочитано як брутто-плаћу, а не як `primitak`. Клієнт обрту
       * платить рівно введену суму; роботодавець найманого — більше на
       * внески «na osnovicu».
       */
      readonly kod: 'bruto-placa-nije-primitak'
      readonly trosakZaPoslodavca: Money<'EUR'>
    }
  | {
      /**
       * `čl. 21.a` знизив базу для MO I. stup — і тільки для нього.
       *
       * Застереження потрібне, бо саме тут ламається рівність «база × ставка
       * = сума» в рядку картки: ставка лишається законними 15%, а сума
       * порахована з меншої бази. Без пояснення це читається як помилка.
       */
      readonly kod: 'umanjena-osnovica-prvog-stupa'
      readonly umanjenje: Money<'EUR'>
      readonly izvor: LegalReference
    }
  | {
      /**
       * `neoporezivi primici` — božićnica, харчування, транспорт — не
       * враховані: їх дає воля роботодавця, а не закон, і вигадати їх суму
       * означало б показати чужу щедрість як норму.
       */
      readonly kod: 'neoporezivi-primici-nisu-uracunati'
      /**
       * Стелі, які закон таки дає, — щоб «не враховано» читалося як «ось
       * скільки можна просити», а не як «цього не буває».
       */
      readonly stavke: import('@hr-tax/data').Sourced<
        readonly import('@hr-tax/data').NeoporeziviPrimitak[]
      >
    }
  | {
      /**
       * `neoporezivi primici` враховані введеною сумою. Ні в базу внесків, ні
       * в базу податку вони не входили — тільки в «на руки» й у вартість для
       * роботодавця, і рівно однаково в обидва.
       */
      readonly kod: 'neoporezivi-primici-uracunati'
      readonly iznos: Money<'EUR'>
      readonly stavke: import('@hr-tax/data').Sourced<
        readonly import('@hr-tax/data').NeoporeziviPrimitak[]
      >
    }
  | {
      /**
       * За `prvo zaposlenje` роботодавець не платить ZO — до одного року.
       *
       * На «на руки» це не впливає ані на цент: ZO ніколи не був грошима
       * працівника. Впливає воно на те, скільки плаћа коштує фірмі, — тобто
       * рівно на число, з яким порівнюють обрт.
       */
      readonly kod: 'oslobodenje-za-prvo-zaposlenje'
      readonly usteda: Money<'EUR'>
      readonly izvor: LegalReference
      /** Хто саме вважається таким, що вперше працевлаштовується. */
      readonly izvorDefinicije: LegalReference
    }
  | {
      /**
       * Половина річного податку, яку `čl. 46. st. 1.` знімає мешканцеві
       * одиниці з I. skupine розвиненості або Вуковара.
       *
       * Приходить тим самим шляхом, що й молодіжна пільга: річним звітом
       * наступного року, а не меншою платіжкою.
       */
      readonly kod: 'umanjenje-za-podrucje'
      readonly iznos: Money<'EUR'>
      readonly izvor: LegalReference
    }
  | {
      /**
       * Увесь річний податок із плаће, який `čl. 46. st. 3.` знімає
       * поверненцеві з-за кордону на п'ять років.
       *
       * `izvorIskljucenja` тут не для повноти: `st. 9.` робить це зменшення
       * заміною двох інших, і людина, яка бачить у картці одне замість трьох,
       * має бачити й чому.
       */
      readonly kod: 'umanjenje-za-povratnika'
      readonly iznos: Money<'EUR'>
      readonly godina: import('@hr-tax/data').Sourced<number>
      readonly izvor: LegalReference
      readonly izvorIskljucenja: LegalReference
    }

/**
 * Які обов'язки має режим — по одному на кожну складову платежу.
 *
 * `razlika` наведена окремо, бо настає вже в наступному календарному році:
 * саме вона стає несподіванкою для тих, хто планував лише поточний.
 */
export interface VrsteObveza {
  /** Обов'язок, за яким сплачується податок протягом року. */
  readonly porez: ObligationKind
  /** Річна доплата за звітом — наступного року. */
  readonly razlika: ObligationKind
  readonly doprinosi: ObligationKind
  /**
   * `undefined` у режимів поза обртом: внесок до обртницької палати платить
   * `obrt`, і тільки він. Порожній рядок у календарі був би не «нуль», а
   * зобов'язанням, якого немає.
   */
  readonly komorskiDoprinos: ObligationKind | undefined
}

/**
 * Розрахунок режиму. Структура однакова для всіх режимів — саме на ній
 * тримається зіставність, тож поле, якого режим не має, лишається присутнім
 * зі значенням `undefined`, а не зникає.
 */
export interface Izracun {
  /** `undefined` у режимів, які не знають розрядів. */
  readonly razred: PrimijenjeniRazred | undefined
  /**
   * Податки режиму за рік, у порядку, в якому вони виникають.
   *
   * Множина, а не один: `obrt na dobit` платить `porez na dobit`, податок із
   * `poduzetnička plaća` і податок на виплату власнику — три різні податки за
   * двома законами. Схлопнути їх в один означало б втратити і суми, і статті.
   * Режими з одним податком мають список із одного елемента.
   */
  readonly porezi: readonly Porez[]
  /** Сума всіх податків режиму — щоб картка не складала їх сама. */
  readonly ukupanPorez: Money<'EUR'>
  /**
   * Скільки з уже сплаченого податку повертається річним звітом. Нуль у
   * режимів, які повернень не знають.
   *
   * Окремим полем, а не відніманням від `ukupanPorez`: податок справді
   * нарахували й справді утримали, і сховати це означало б показати меншу
   * ставку, ніж застосував закон. Гроші повертаються — ставка ні.
   *
   * Надходять вони вже в наступному календарному році, тому в «на руки» за
   * цей рік входять, а в жодну платіжку цього року — ні.
   */
  readonly povratPoreza: Money<'EUR'>
  /** `doprinosi` (внески / social contributions), розбиті на складові. */
  readonly doprinosi: Doprinosi
  /**
   * Обов'язкові платежі поза податками і внесками — разом із тими, що не
   * застосувалися, з названою причиною.
   */
  readonly obveznaDavanja: readonly ObveznoDavanje[]
  /** Сума нарахованих `obveznaDavanja` за рік. */
  readonly ukupnaDavanja: Money<'EUR'>
  /**
   * Види обов'язків цього режиму — з чого будується календар платежів.
   *
   * Знає режим, а не інтерфейс: те, коли й чим саме платить `obrt na dobit`,
   * встановлює закон, і вгадувати це з ідентифікатора картки означало б
   * тримати право в шарі показу.
   */
  readonly vrsteObveza: VrsteObveza
  /**
   * Застереження до цього розрахунку. Порожній масив — застережень немає.
   *
   * Живуть у розрахунку, а не в картці: чи спрацювала законна підлога бази
   * й чи перейдено поріг — це наслідки застосування норми, і вирішує їх
   * закон, а не верстка.
   */
  readonly napomene: readonly NapomenaRezima[]
  /**
   * Витрати, враховані в `netoZaOsobu`. Нуль, коли форма їх не знає.
   *
   * Поле існує, щоб означення «на руки» було видимим, а не вгадуваним:
   * режими міряють витрати по-різному, і без цього числа сусідні картки
   * можна було б порівнювати помилково.
   */
  readonly ukupniIzdaci: Money<'EUR'>
  /**
   * Скільки лишається людині за рік: `primitak` без податку, без `doprinosi`
   * і без обов'язкових платежів. Головне число картки.
   *
   * Калькулятори HOK сюди `komorski doprinos` не включають — це зареєстрована
   * розбіжність, а не наша похибка: внесок платить кожен `obrt`, і без нього
   * сума систематично завищена.
   */
  readonly netoZaOsobu: Money<'EUR'>
  /**
   * Частка `primitak`, яку забирають усі обов'язкові платежі разом.
   * `undefined` за нульового `primitak`: ділити немає на що.
   */
  readonly efektivnaStopa: Decimal | undefined
}

/**
 * Чому режим недоступний — структурою, а не готовим реченням.
 *
 * Проза не перекладається: рушій не знає мови читача, а склеєний ним рядок
 * інтерфейс може хіба що показати як є. Код плюс параметри дає кожній локалі
 * скласти власне речення з тих самих чисел, і числа лишаються числами —
 * зокрема `Sourced`, тож від них є дорога до статті (ADR-0002).
 */
export type RazlogNedostupnosti =
  | {
      readonly kod: 'iznad-praga-pausala'
      readonly primitak: Money<'EUR'>
      readonly prag: Money<'EUR'>
      readonly izvor: LegalReference
    }
  | {
      /** Межі розрядів не доходять до порогу — набір правил суперечливий. */
      readonly kod: 'nedosljedna-tablica-razreda'
      readonly primitak: Money<'EUR'>
      readonly prag: Money<'EUR'>
    }
  | {
      /** Неповний рік звів `primitak` до річного вище за найвищий розряд. */
      readonly kod: 'svedeni-primitak-izvan-tablice'
      readonly primitak: Money<'EUR'>
      readonly svedeniPrimitak: Money<'EUR'>
      readonly brojMjeseci: number
      readonly izvor: LegalReference
    }
  | {
      /** Закон друкує коефіцієнти лише до певної дитини. */
      readonly kod: 'koeficijent-djeteta-nije-propisan'
      readonly dostupnoDjece: number
      readonly trazenoDjece: number
      readonly izvor: LegalReference
    }
  | { readonly kod: 'nema-izdataka' }
  | { readonly kod: 'nema-jedinice' }
  | { readonly kod: 'nema-izdataka-ni-jedinice' }
  | { readonly kod: 'nema-pravila'; readonly pravila: string }
  | {
      /**
       * Людина вже позначила, що має роботу за наймом, — і тоді картка найму
       * порівнювала б із обртом не альтернативу, а той самий найм удруге.
       *
       * Модифікатор `uz radni odnos` описує становище платника: обрт поряд
       * із наявною роботою. Картка `zaposlenik` ставить інше питання — а
       * якщо **тільки** найм. Обидва разом на одному екрані означали б, що
       * той самий слайдер читається як «плаћа плюс primitak» ліворуч і як
       * «сама плаћа» праворуч.
       */
      readonly kod: 'vec-u-radnom-odnosu'
    }

/**
 * Підсумок режиму: або розрахунок, або причина недоступності. Третього немає,
 * і порожнього розрахунку з нулями теж — нуль на картці не відрізнити від
 * порахованого нуля.
 */
export type Ishod =
  | { readonly status: 'izracunato'; readonly izracun: Izracun }
  | { readonly status: 'nedostupno'; readonly razlog: RazlogNedostupnosti }

/** Один `režim` (режим / regime) у порівнянні. */
export interface Rezim {
  readonly id: RezimId
  /** Канонічна хорватська назва режиму з українським перекладом поруч. */
  readonly naziv: Naziv
  readonly ishod: Ishod
}

export interface Usporedba {
  /** Рік правил, за якими зроблено розрахунок. */
  readonly godina: number
  /** Усі режими, завжди всі й завжди в тому самому порядку. */
  readonly rezimi: readonly Rezim[]
}

/**
 * Єдиний податок режиму, який має рівно один.
 *
 * Існує заради читаності тих режимів, де податок один: `porezi[0]` під
 * `noUncheckedIndexedAccess` дає `Porez | undefined`, а розбирати цю
 * невизначеність у кожному виклику — шум. Режим із кількома податками сюди
 * потрапити не має, тому виклик падає замість того, щоб мовчки взяти перший.
 */
export const jediniPorez = (izracun: Izracun): Porez => {
  const [porez] = izracun.porezi
  if (porez === undefined || izracun.porezi.length !== 1) {
    throw new Error(`Очікувався рівно один податок, а є ${String(izracun.porezi.length)}`)
  }
  return porez
}
