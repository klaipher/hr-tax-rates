import type { Money, Podloga } from '@hr-tax/engine'
import { eur, formatEur, usporediRezime } from '@hr-tax/engine'
import { useMemo } from 'react'
import { Izvor } from '../Izvor.tsx'

/**
 * Графік річного навантаження по діапазону `primitak`.
 *
 * Обрив розряду не видно з однієї картки: там завжди одне число на один
 * `primitak`. Видно його лише на діапазоні — сходинкою, де платіж стрибає без
 * стрибка `primitak`. Тому графік і показує обидва сценарії поруч: нижче
 * 40 000 € криві збігаються точка в точку, і саме там видно, що законопроєкт
 * не чіпає нікого, крім двох найвищих розрядів.
 *
 * Компонент самодостатній: усе, що він знає про закон, приходить у `props`
 * функцією `podlogaZa`. Жодного числа з акта тут немає.
 */

/** Розміри полотна в координатах `viewBox`. */
const SIRINA = 720
const VISINA = 240

/** Поле, у якому лежить сама крива: поза ним — підписи осей. */
export const POLJE = { lijevo: 52, desno: 708, gore: 16, dolje: 212 } as const

/** Один сценарій правил на графіку. */
export interface ScenarijGrafa {
  readonly id: string
  readonly naziv: string
  /**
   * Чи це чинне право, чи законопроєкт. Крива проєкту малюється пунктиром —
   * не лише кольором, щоб різниця лишалася видимою й без кольору.
   */
  readonly status: 'in-force' | 'draft'
  /**
   * Правила й припущення для конкретного `primitak`. Функція, а не готова
   * підкладка: у законопроєкті `koeficijent` різний за розрядами, тож набір
   * правил залежить від того, куди `primitak` потрапив.
   */
  readonly podlogaZa: (godisnjiPrimitak: Money<'EUR'>) => Podloga
}

export interface TockaGrafa {
  readonly primitak: number
  /**
   * Річна повинність: `paušalni porez` і `doprinosi` разом. `undefined`, коли
   * режим недоступний — нуль на графіку не відрізнити від порахованого нуля.
   */
  readonly obveza: number | undefined
}

export interface KrivuljaGrafa {
  readonly id: string
  readonly naziv: string
  readonly status: 'in-force' | 'draft'
  readonly tocke: readonly TockaGrafa[]
  /** Ламана в координатах `viewBox`; розривається там, де режиму немає. */
  readonly putanja: string
}

/** Межа розряду на графіку — те місце, де платіж стрибає. */
export interface ObrivNaGrafu {
  readonly primitak: number
  readonly x: number
}

export interface ModelGrafa {
  readonly sirina: number
  readonly visina: number
  readonly najvisiPrimitak: number
  readonly najvisaObveza: number
  readonly krivulje: readonly KrivuljaGrafa[]
  readonly obrivi: readonly ObrivNaGrafu[]
  readonly x: (primitak: number) => number
  readonly y: (obveza: number) => number
}

/** Річна повинність паушального обрту або `undefined`, коли режим недоступний. */
const obvezaZa = (scenarij: ScenarijGrafa, primitak: number): number | undefined => {
  const godisnjiPrimitak = eur(primitak)
  const { rezimi } = usporediRezime({ godisnjiPrimitak }, scenarij.podlogaZa(godisnjiPrimitak))
  const ishod = rezimi.find((rezim) => rezim.id === 'pausalni-obrt')?.ishod
  if (ishod === undefined || ishod.status !== 'izracunato') return undefined

  const { ukupanPorez, doprinosi } = ishod.izracun
  return ukupanPorez.amount.plus(doprinosi.ukupnoGodisnje.amount).toNumber()
}

/** Найменший крок, яким закон розводить розряди: межі задані до цента. */
const CENT = 0.01

/**
 * Межі розрядів усіх сценаріїв разом.
 *
 * Об'єднання, а не таблиця першого сценарію: якби реформа колись посунула
 * самі межі, графік мусить показати обидві сітки, а не тиху одну.
 */
const graniceRazreda = (
  scenariji: readonly ScenarijGrafa[],
  najvisiPrimitak: number,
): readonly number[] => {
  const granice = new Set<number>()
  for (const scenarij of scenariji) {
    const { razredi } = scenarij.podlogaZa(eur(0)).ruleset.pausalniObrt
    for (const razred of razredi.value) {
      const granica = razred.gornjaGranica.toNumber()
      if (granica <= najvisiPrimitak) granice.add(granica)
    }
  }
  return [...granice].sort((a, b) => a - b)
}

/**
 * Точки вибірки: рівний крок плюс кожна межа розряду і цент за нею.
 *
 * Без цієї пари точок обрив розмазався б у похилу лінію між сусідніми кроками
 * сітки — тобто графік показував би плавний підйом там, де закон робить
 * сходинку.
 */
const tockeUzorka = (
  granice: readonly number[],
  najvisiPrimitak: number,
  korak: number,
): readonly number[] => {
  const tocke = new Set<number>([0, najvisiPrimitak])
  for (let primitak = 0; primitak <= najvisiPrimitak; primitak += korak) tocke.add(primitak)
  for (const granica of granice) {
    tocke.add(granica)
    if (granica + CENT <= najvisiPrimitak) tocke.add(granica + CENT)
  }
  return [...tocke].sort((a, b) => a - b)
}

const putanjaZa = (
  tocke: readonly TockaGrafa[],
  x: (primitak: number) => number,
  y: (obveza: number) => number,
): string => {
  const dijelovi: string[] = []
  let pocinjemo = true

  for (const tocka of tocke) {
    if (tocka.obveza === undefined) {
      pocinjemo = true
      continue
    }
    const naredba = pocinjemo ? 'M' : 'L'
    dijelovi.push(`${naredba}${x(tocka.primitak).toFixed(2)} ${y(tocka.obveza).toFixed(2)}`)
    pocinjemo = false
  }

  return dijelovi.join(' ')
}

/**
 * Модель графіка: чиста функція від сценаріїв до координат.
 *
 * Уся арифметика графіка живе тут, щоб її можна було перевірити тестом, а не
 * оком по картинці.
 */
export const izgradiGraf = ({
  scenariji,
  najvisiPrimitak,
  korak,
}: {
  readonly scenariji: readonly ScenarijGrafa[]
  readonly najvisiPrimitak: number
  readonly korak: number
}): ModelGrafa => {
  const granice = graniceRazreda(scenariji, najvisiPrimitak)
  const primici = tockeUzorka(granice, najvisiPrimitak, korak)

  const uzorci = scenariji.map((scenarij) => ({
    scenarij,
    tocke: primici.map(
      (primitak): TockaGrafa => ({ primitak, obveza: obvezaZa(scenarij, primitak) }),
    ),
  }))

  const obveze = uzorci.flatMap(({ tocke }) =>
    tocke.flatMap((tocka) => (tocka.obveza === undefined ? [] : [tocka.obveza])),
  )
  // Одиниця знизу — сторож від ділення на нуль, коли жодна точка не порахована.
  const najvisaObveza = Math.max(1, ...obveze)

  const x = (primitak: number): number =>
    POLJE.lijevo + (primitak / najvisiPrimitak) * (POLJE.desno - POLJE.lijevo)
  const y = (obveza: number): number =>
    POLJE.dolje - (obveza / najvisaObveza) * (POLJE.dolje - POLJE.gore)

  return {
    sirina: SIRINA,
    visina: VISINA,
    najvisiPrimitak,
    najvisaObveza,
    krivulje: uzorci.map(({ scenarij, tocke }) => ({
      id: scenarij.id,
      naziv: scenarij.naziv,
      status: scenarij.status,
      tocke,
      putanja: putanjaZa(tocke, x, y),
    })),
    obrivi: granice.map((primitak) => ({ primitak, x: x(primitak) })),
    x,
    y,
  }
}

/**
 * `primitak`, на який показує клік: `udio` — частка ширини полотна від лівого
 * краю. Поза полем тримається діапазону, бо клік по підпису осі теж клік.
 */
export const primitakZaUdio = (model: ModelGrafa, udio: number): number => {
  const x = udio * model.sirina
  const dio = (x - POLJE.lijevo) / (POLJE.desno - POLJE.lijevo)
  return Math.round(Math.min(1, Math.max(0, dio)) * model.najvisiPrimitak)
}

/** Підпис межі в тисячах євро: `11 300` → `11,3`, `40 000` → `40`. */
export const oznakaTisuca = (iznos: number): string =>
  (iznos / 1000).toFixed(1).replace(/\.0$/, '').replace('.', ',')

const BOJA = {
  'in-force': 'var(--tekst, #1b1a17)',
  draft: 'var(--naglasak, #7a4b2a)',
} as const

const CRTKANO = { 'in-force': undefined, draft: '6 4' } as const

const OZNAKA_STATUSA = { 'in-force': 'чинний', draft: 'проєкт' } as const

/** Крок клавіатури: та сама сотня євро, якою рухається повзунок форми. */
const KORAK_TIPKOVNICE = 100

/**
 * Сам компонент. Показує криві сценаріїв, межі розрядів і поточний `primitak`;
 * клік і стрілки клавіатури переносять `primitak` через `onOdabir`.
 *
 * @public — точка, якою застосунок вмикає графік у сторінку.
 */
export const GrafOpterecenja = ({
  scenariji,
  godisnjiPrimitak,
  najvisiPrimitak,
  korak = 500,
  onOdabir,
}: {
  readonly scenariji: readonly ScenarijGrafa[]
  readonly godisnjiPrimitak: number
  readonly najvisiPrimitak: number
  readonly korak?: number
  readonly onOdabir: (godisnjiPrimitak: number) => void
}) => {
  const model = useMemo(
    () => izgradiGraf({ scenariji, najvisiPrimitak, korak }),
    [scenariji, najvisiPrimitak, korak],
  )

  /** Що показує легенда для поточного `primitak` — по одному рядку на сценарій. */
  const trenutni = scenariji.map((scenarij) => {
    const podloga = scenarij.podlogaZa(eur(godisnjiPrimitak))
    return {
      scenarij,
      // `prosječna plaća` кожного сценарію показана поруч навмисне: якщо два
      // сценарії стоять на різних припущеннях, криві розійдуться і там, де
      // закон не змінює нічого, — і без цього підпису різницю було б видно
      // за зміну правил (ADR-0001).
      prosjecnaPlaca: podloga.pretpostavke.prosjecnaPlaca,
      // Стаття, з якої взята таблиця розрядів цього сценарію: від сходинки на
      // графіку до тексту акта — один клік (ADR-0002).
      izvorRazreda: podloga.ruleset.pausalniObrt.razredi.source,
      obveza: obvezaZa(scenarij, godisnjiPrimitak),
    }
  })

  const pomakni = (primitak: number) =>
    onOdabir(Math.min(najvisiPrimitak, Math.max(0, Math.round(primitak))))

  return (
    <figure
      style={{
        margin: '2rem 0 0',
        padding: '1.1rem 1.2rem 1.2rem',
        background: 'var(--tlo-kartica, #fff)',
        border: '1px solid var(--rub, #e3e0d7)',
        borderRadius: '0.9rem',
      }}
    >
      <figcaption style={{ fontSize: '0.9rem' }}>
        Річна повинність за діапазоном primitak
        <span
          style={{
            display: 'block',
            fontSize: '0.8rem',
            color: 'var(--tekst-prigušen, #6a675e)',
          }}
        >
          paušalni porez і doprinosi разом · пунктиром позначені межі розрядів, на яких платіж
          стрибає без стрибка primitak · клік по графіку переносить primitak
        </span>
      </figcaption>

      {/* Полотно всередині, а роль повзунка — на обгортці: клавіатурою графік
          рухає primitak тими самими сотнями євро, що й повзунок форми. */}
      <div
        role="slider"
        tabIndex={0}
        aria-label="Річна повинність за діапазоном primitak"
        aria-valuemin={0}
        aria-valuemax={najvisiPrimitak}
        aria-valuenow={godisnjiPrimitak}
        aria-valuetext={formatEur(eur(godisnjiPrimitak))}
        style={{ marginTop: '0.6rem', cursor: 'crosshair' }}
        onClick={(dogadaj) => {
          const okvir = dogadaj.currentTarget.getBoundingClientRect()
          pomakni(primitakZaUdio(model, (dogadaj.clientX - okvir.left) / okvir.width))
        }}
        onKeyDown={(dogadaj) => {
          const pomak = { ArrowLeft: -KORAK_TIPKOVNICE, ArrowRight: KORAK_TIPKOVNICE }[dogadaj.key]
          if (pomak === undefined) return
          dogadaj.preventDefault()
          pomakni(godisnjiPrimitak + pomak)
        }}
      >
        <svg
          viewBox={`0 0 ${model.sirina} ${model.visina}`}
          style={{ display: 'block', width: '100%', height: 'auto' }}
          aria-hidden="true"
        >
          <title>Річна повинність паушального обрту за діапазоном primitak</title>

          {model.obrivi.map((obriv) => (
            <g key={obriv.primitak}>
              <line
                x1={obriv.x}
                x2={obriv.x}
                y1={POLJE.gore}
                y2={POLJE.dolje}
                stroke="var(--rub, #e3e0d7)"
                strokeDasharray="3 4"
              />
              <text
                x={obriv.x}
                y={POLJE.dolje + 16}
                textAnchor="middle"
                fontSize={10}
                fill="var(--tekst-prigušen, #6a675e)"
              >
                {oznakaTisuca(obriv.primitak)}
              </text>
            </g>
          ))}

          <line
            x1={POLJE.lijevo}
            x2={POLJE.desno}
            y1={POLJE.dolje}
            y2={POLJE.dolje}
            stroke="var(--rub, #e3e0d7)"
          />
          <text
            x={POLJE.lijevo - 8}
            y={POLJE.gore + 4}
            textAnchor="end"
            fontSize={10}
            fill="var(--tekst-prigušen, #6a675e)"
          >
            {oznakaTisuca(model.najvisaObveza)} тис. €
          </text>
          <text
            x={POLJE.lijevo - 8}
            y={POLJE.dolje}
            textAnchor="end"
            fontSize={10}
            fill="var(--tekst-prigušen, #6a675e)"
          >
            0
          </text>

          <line
            x1={model.x(godisnjiPrimitak)}
            x2={model.x(godisnjiPrimitak)}
            y1={POLJE.gore}
            y2={POLJE.dolje}
            stroke="var(--naglasak, #7a4b2a)"
            strokeWidth={1.5}
          />

          {model.krivulje.map((krivulja) => (
            <path
              key={krivulja.id}
              d={krivulja.putanja}
              fill="none"
              stroke={BOJA[krivulja.status]}
              strokeDasharray={CRTKANO[krivulja.status]}
              strokeWidth={2}
            />
          ))}

          {trenutni.map(({ scenarij, obveza }) =>
            obveza === undefined ? null : (
              <circle
                key={scenarij.id}
                cx={model.x(godisnjiPrimitak)}
                cy={model.y(obveza)}
                r={3.5}
                fill={BOJA[scenarij.status]}
              />
            ),
          )}
        </svg>
      </div>

      <ul
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.4rem 1.4rem',
          margin: '0.7rem 0 0',
          padding: 0,
          listStyle: 'none',
          fontSize: '0.85rem',
        }}
      >
        {trenutni.map(({ scenarij, obveza, prosjecnaPlaca, izvorRazreda }) => (
          <li
            key={scenarij.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '0.45rem',
              flex: '1 1 24rem',
              minWidth: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                flex: '0 0 1.5rem',
                borderTop: `2px ${scenarij.status === 'draft' ? 'dashed' : 'solid'} ${BOJA[scenarij.status]}`,
              }}
            />
            <span style={{ flex: '1 1 auto', minWidth: 0 }}>
              {scenarij.naziv}
              <span
                style={{
                  marginLeft: '0.35rem',
                  fontSize: '0.72rem',
                  color: 'var(--tekst-prigušen, #6a675e)',
                }}
              >
                {OZNAKA_STATUSA[scenarij.status]}
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: '0.72rem',
                  color: 'var(--tekst-prigušen, #6a675e)',
                }}
              >
                prosječna plaća {formatEur(eur(prosjecnaPlaca.value))}
                {prosjecnaPlaca.source.status === 'forecast' ? ' · прогноз' : ''}
              </span>
              <Izvor izvor={izvorRazreda} />
            </span>
            <strong style={{ fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
              {obveza === undefined ? 'режим недоступний' : formatEur(eur(obveza))}
            </strong>
          </li>
        ))}
      </ul>
    </figure>
  )
}
