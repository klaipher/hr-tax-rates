import type { Podloga } from '@hr-tax/engine'
import './izvori.css'
import { PravneNorme } from './PravneNorme.tsx'
import { Statistika } from './Statistika.tsx'
import { tekst } from './tekst.ts'

/**
 * Сторінка джерел: усе, чим можна перевірити калькулятор, не вірячи йому.
 *
 * Дві частини й один намір. Правові джерела: кожне число з актом, статтею,
 * номером NN, статусом норми і датою звірки — за одну дію, без наведення й
 * без розкривання (ADR-0002). Припущення: величини, за якими стоїть
 * статистика, а не право, і які тому показані окремо (ADR-0001).
 *
 * Реєстру розбіжностей із калькуляторами HOK тут більше немає. Він лишився
 * там, де від нього є користь, — у голден-тестах, які валять збірку на
 * незареєстрованій розбіжності. На сторінці він відповідав на питання, якого
 * читач не ставить: щоб його поставити, треба спершу порахувати те саме в
 * Excel-файлі HOK.
 *
 * `podloga` приходить ззовні тим самим об'єктом, яким рахує рушій. Свого
 * набору правил сторінка не має: два переліки чисел розійшлися б, і сторінка
 * джерел цитувала б не те, що показано на картках.
 *
 * @public Секція для застосунку; підключається в `App.tsx`.
 */
export const Izvori = ({ podloga }: { readonly podloga: Podloga }) => (
  <section className="izvori" aria-labelledby="izvori-naslov">
    <header className="izvori__zaglavlje">
      <h2 id="izvori-naslov">{tekst.naslov}</h2>
      <p className="izvori__uvod">{tekst.uvod}</p>
      <p className="izvori__godina">
        {tekst.godinaPravila}: <strong>{podloga.ruleset.godina}</strong>
      </p>
    </header>

    <PravneNorme ruleset={podloga.ruleset} />
    <Statistika pretpostavke={podloga.pretpostavke} />

    <footer className="izvori__napomena">
      <p>{tekst.napomena}</p>
    </footer>
  </section>
)
