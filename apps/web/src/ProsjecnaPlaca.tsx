import { prosjecnaPlacaZa, SLUZBENE_PROSJECNE_PLACE } from '@hr-tax/data'
import { eur } from '@hr-tax/engine'
import { IzvorStatistike } from './Izvor.tsx'
import { useI18n } from './i18n/context.tsx'

/**
 * `prosječna plaća` як вхід, а не як частина сценарію.
 *
 * Доти, доки вона їхала разом із набором правил, перемикач сценарію змінював
 * дві незалежні речі водночас: і закон, і статистику. Тоді «різниця проти
 * чинного закону» показувала ще й зміну середньої зарплати — а це не закон,
 * і на неї ніхто не голосував (ADR-0001).
 *
 * Тепер шари розведені по двох органах керування: перемикач вище міняє
 * правила, це поле — величину, до якої правила застосовують. Обидва офіційні
 * числа лишаються за один клік, тож обидві опубліковані суми внесків на 2027
 * рік відтворюються — але вибором, а не мовчки.
 */
export const ProsjecnaPlaca = ({
  vrijednost,
  onPromjena,
}: {
  readonly vrijednost: number
  readonly onPromjena: (vrijednost: number) => void
}) => {
  const { t, format } = useI18n()
  const pretpostavka = prosjecnaPlacaZa(vrijednost)

  return (
    <section className="placa">
      <p className="polje">
        <label htmlFor="prosjecna-placa">
          <span className="pojam">prosječna plaća</span>
          <span className="prijevod">{t.pretpostavke.placaPrijevod}</span>
        </label>
        <input
          id="prosjecna-placa"
          type="number"
          inputMode="decimal"
          min={0}
          step={10}
          value={vrijednost}
          aria-describedby="prosjecna-placa-opis"
          onChange={(event) => {
            const uneseno = Number(event.target.value)
            onPromjena(Number.isFinite(uneseno) ? Math.max(0, uneseno) : 0)
          }}
        />
        <IzvorStatistike izvor={pretpostavka.source} />
      </p>

      {/* Офіційні значення поруч: набирати 2180 руками, щоб звіритися з
          калькулятором HOK, — робота, якої закон від людини не вимагає. */}
      <p className="placa__preseti">
        {SLUZBENE_PROSJECNE_PLACE.map((preset) => {
          const iznos = preset.value.toNumber()
          const odabran = iznos === vrijednost

          return (
            <button
              key={iznos}
              type="button"
              className={odabran ? 'placa__preset placa__preset--odabran' : 'placa__preset'}
              aria-pressed={odabran}
              onClick={() => {
                onPromjena(iznos)
              }}
            >
              {format.eur(eur(preset.value))}
              <span className="prijevod">
                {preset.source.status === 'forecast'
                  ? t.pretpostavke.prognoza
                  : t.pretpostavke.objavljena}
              </span>
            </button>
          )
        })}
      </p>

      <p className="forma__primjer" id="prosjecna-placa-opis">
        {t.pretpostavke.objasnjenje}
      </p>
    </section>
  )
}
