import type { JedinicaLokalneSamouprave } from '@hr-tax/data'
import { jedinicaBySifra, searchJedinice } from '@hr-tax/data'
import { useId, useMemo, useState } from 'react'

/**
 * Вибір `jedinica lokalne samouprave` — одним полем, а не пошуком плюс списком.
 *
 * Два контроли поспіль виглядали логічно й працювали погано: людина набирала
 * «Zagreb», бачила своє місто в полі й ішла далі, а вибір лишався порожнім —
 * бо набране в пошуку нічого не обирає. Розрахунок при цьому чесно казав
 * «оберіть місто», і виходило, що застосунок сперечається з тим, що написано
 * на екрані.
 *
 * Тому один `combobox`: те саме поле фільтрує й обирає. Клавіатура обов'язкова
 * — стрілки, Enter, Escape, — бо 556 одиниць мишею перебирати нікому.
 */

/**
 * Скільки одиниць показувати.
 *
 * Не косметична межа: 556 елементів у списку — це 556 вузлів DOM на кожен
 * натиск клавіші. Обрізання видиме — під списком стоїть, скільки лишилося
 * поза ним, — щоб «мого міста немає» не плуталося з «список закінчився».
 */
const NAJVISE_PONUDA = 50

/** Ставка з базисних пунктів у відсотки: 2300 → «23,00 %». */
const postotak = (bazniBodovi: number): string =>
  `${(bazniBodovi / 100).toFixed(2).replace('.', ',')} %`

export const Grad = ({
  sifra,
  promijeni,
}: {
  readonly sifra: string
  readonly promijeni: (sifra: string) => void
}) => {
  const odabrana = jedinicaBySifra(sifra)
  const [upit, postaviUpit] = useState(odabrana?.ime ?? '')
  const [otvoreno, postaviOtvoreno] = useState(false)
  const [istaknuto, postaviIstaknuto] = useState(0)
  const id = useId()

  const sve = useMemo(() => searchJedinice(upit), [upit])
  const ponude = sve.slice(0, NAJVISE_PONUDA)
  const skriveno = sve.length - ponude.length

  const odaberi = (jedinica: JedinicaLokalneSamouprave) => {
    promijeni(jedinica.sifra)
    postaviUpit(jedinica.ime)
    postaviOtvoreno(false)
    postaviIstaknuto(0)
  }

  const naTipkovnici = (dogadaj: React.KeyboardEvent<HTMLInputElement>) => {
    if (dogadaj.key === 'Escape') {
      postaviOtvoreno(false)
      return
    }
    if (dogadaj.key === 'ArrowDown' || dogadaj.key === 'ArrowUp') {
      dogadaj.preventDefault()
      if (!otvoreno) {
        postaviOtvoreno(true)
        return
      }
      const pomak = dogadaj.key === 'ArrowDown' ? 1 : -1
      // По колу: список довгий, і впертися в його край, шукаючи місто з
      // кінця абетки, — зайва робота.
      postaviIstaknuto((prije) => (prije + pomak + ponude.length) % Math.max(ponude.length, 1))
      return
    }
    if (dogadaj.key === 'Enter' && otvoreno) {
      const izbor = ponude[istaknuto]
      if (izbor !== undefined) {
        dogadaj.preventDefault()
        odaberi(izbor)
      }
    }
  }

  return (
    <div className="polje grad">
      <label htmlFor={`${id}-unos`}>
        Місто або община
        <span className="prijevod">
          jedinica lokalne samouprave — від неї залежать ставки porez na dohodak із plaća, і тільки
          вони: paušalni porez обрту вона не чіпає
        </span>
      </label>

      <div className="grad__okvir">
        <input
          id={`${id}-unos`}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-expanded={otvoreno}
          aria-controls={`${id}-popis`}
          aria-autocomplete="list"
          aria-activedescendant={
            otvoreno && ponude[istaknuto] !== undefined
              ? `${id}-${ponude[istaknuto]?.sifra ?? ''}`
              : undefined
          }
          placeholder="почніть набирати назву"
          value={upit}
          onChange={(dogadaj) => {
            postaviUpit(dogadaj.currentTarget.value)
            postaviOtvoreno(true)
            postaviIstaknuto(0)
            // Набране слово скасовує попередній вибір: інакше на екрані
            // стояло б одне місто, а рахувалося б інше.
            if (sifra !== '') promijeni('')
          }}
          onFocus={(dogadaj) => {
            postaviOtvoreno(true)
            dogadaj.currentTarget.select()
          }}
          onBlur={() => {
            postaviOtvoreno(false)
            // Поле повертається до обраного: напівнабрана назва без вибору
            // виглядала б як відповідь, якою вона не є.
            postaviUpit(jedinicaBySifra(sifra)?.ime ?? '')
          }}
          onKeyDown={naTipkovnici}
        />

        {otvoreno && (
          // Клік по списку не має забирати фокус із поля: `blur` спрацював би
          // раніше за вибір і закрив список під курсором.
          <div
            className="grad__popis"
            id={`${id}-popis`}
            role="listbox"
            aria-label="Одиниці місцевого самоврядування"
            onMouseDown={(dogadaj) => {
              dogadaj.preventDefault()
            }}
          >
            {ponude.length === 0 && (
              <p className="grad__prazno" role="presentation">
                Нічого не знайдено. Спробуйте коротший запит.
              </p>
            )}
            {ponude.map((jedinica, redak) => (
              <button
                key={jedinica.sifra}
                type="button"
                id={`${id}-${jedinica.sifra}`}
                role="option"
                aria-selected={jedinica.sifra === sifra}
                className={
                  redak === istaknuto ? 'grad__stavka grad__stavka--istaknuta' : 'grad__stavka'
                }
                onMouseEnter={() => {
                  postaviIstaknuto(redak)
                }}
                onClick={() => {
                  odaberi(jedinica)
                }}
              >
                <span className="grad__ime">{jedinica.ime}</span>
                <span className="grad__stope">
                  {postotak(jedinica.stope.niza)} / {postotak(jedinica.stope.visa)}
                </span>
              </button>
            ))}
            {skriveno > 0 && (
              <p className="grad__prazno" role="presentation">
                …і ще {skriveno} — уточніть запит, щоб побачити решту.
              </p>
            )}
          </div>
        )}
      </div>

      {odabrana === undefined ? (
        <p className="razlog">
          Ставки `porez na dohodak` установлює одиниця, де ви <strong>живете</strong>, а не де
          працюєте.
        </p>
      ) : (
        <p className="razlog">
          <strong>{postotak(odabrana.stope.niza)}</strong> до порога і{' '}
          <strong>{postotak(odabrana.stope.visa)}</strong> понад нього. Оприлюднені в NN{' '}
          {odabrana.stope.narodneNovine.join(', ')}, чинні з {odabrana.stope.stupanjeNaSnagu}.
        </p>
      )}
    </div>
  )
}
