import { eur, scale, toCentString } from '@hr-tax/engine'

/**
 * Заглушка каркаса. Реальний калькулятор приходить із наскрізним зрізом
 * паушального обрту; тут лише доводиться, що збірка проходить крізь усі
 * пакети робочого простору й рушій справді підключений.
 */
export const App = () => {
  const monthlyDoprinosi = scale(eur('797.20'), '0.365')

  return (
    <main>
      <h1>Податкові режими Хорватії</h1>
      <p>Каркас на місці. Калькулятор у розробці.</p>
      <p>
        Перевірка рушія: місячні <code>doprinosi</code> паушального обрту за чинним законом —{' '}
        <output>{toCentString(monthlyDoprinosi)} €</output>
      </p>
    </main>
  )
}
