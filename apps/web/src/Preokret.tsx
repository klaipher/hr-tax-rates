import type { Rezim, RezimId, TockaPreokreta } from '@hr-tax/engine'
import { useI18n } from './i18n/context.tsx'

/**
 * Точки перевороту: доки один режим лишається найвигіднішим і де його
 * місце переходить до іншого.
 *
 * Стоїть над картками, бо саме тут людина вибирає. Картка відповідає на
 * питання «скільки лишиться за цього `primitak`», а це — на питання «доки
 * мій вибір лишається правильним», і друге ставлять частіше.
 *
 * Назви режимів беруться з результату рушія, а не зі словника: рушій уже
 * називає кожен режим хорватською, і другий перелік назв в інтерфейсі міг би
 * з ним розійтися.
 */
export const Preokret = ({
  tocke,
  rezimi,
}: {
  readonly tocke: readonly TockaPreokreta[]
  readonly rezimi: readonly Rezim[]
}) => {
  const { t, format } = useI18n()

  const naziv = (id: RezimId): string => rezimi.find((rezim) => rezim.id === id)?.naziv.hr ?? id
  const prva = tocke[0]

  return (
    <section className="preokret">
      <h2 className="preokret__naslov">{t.preokret.naslov}</h2>
      <p className="preokret__prijevod">{t.preokret.prijevod}</p>

      {prva === undefined ? (
        <p className="razlog">{t.preokret.nema}</p>
      ) : (
        <ol className="preokret__popis">
          {/* Перший рядок називає, хто веде від нуля: без нього список
              починався б із переходу від невідомо кого. */}
          <li>{t.preokret.doPrve(format.eur(prva.primitak), naziv(prva.dosadasnji))}</li>
          {tocke.map((tocka) => (
            <li key={tocka.primitak.amount.toFixed(2)}>
              {t.preokret.tocka(
                format.eur(tocka.primitak),
                naziv(tocka.dosadasnji),
                naziv(tocka.sljedeci),
              )}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
