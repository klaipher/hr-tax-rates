import { describe, expect, it } from 'vitest'
import { sveJedinice } from './directory.ts'
import {
  GRAD_VUKOVAR,
  imaUmanjenjeZaPodrucje,
  jediniceIPrveSkupine,
  normaliziranoIme,
} from './razvijenost.ts'

describe('I. skupina po stupnju razvijenosti', () => {
  it('кожна назва зі списку знаходиться в довіднику одиниць — і рівно одна', () => {
    // Головний тест цього файлу. Список приходить із `Odluka` назвами, а
    // довідник ставок веде Porezna uprava своїми — і два реєстри розходяться
    // мовчки: перейменована община просто перестане отримувати пільгу, а
    // сума лишиться правдоподібною.
    //
    // Неоднозначність небезпечна так само: OTOK, PRIVLAKA і SVETA NEDELJA у
    // довіднику трапляються двічі з різними ставками, і якби одна з них
    // потрапила до списку, вибір був би навмання.
    const problematicni = jediniceIPrveSkupine.value
      .map((ime) => ({
        ime,
        nadeno: sveJedinice.value.filter((jedinica) => jedinica.ime === normaliziranoIme(ime))
          .length,
      }))
      .filter(({ nadeno }) => nadeno !== 1)

    expect(problematicni).toEqual([])
  })

  it('у списку рівно ті 72 одиниці, які друкує акт', () => {
    // Число з акта, а не з коду: список, що тихо схуднув на одну общину, —
    // це половина податку, забрана в її мешканця.
    expect(jediniceIPrveSkupine.value).toHaveLength(72)
  })

  it('назви не повторюються', () => {
    expect(new Set(jediniceIPrveSkupine.value).size).toBe(jediniceIPrveSkupine.value.length)
  })

  it('Вуковар дає право, хоч у списку його немає', () => {
    // Вуковар лежить у V. skupini — вище за середину, — і за списком розряду
    // пільги не мав би. Закон називає його окремим приводом.
    expect(jediniceIPrveSkupine.value).not.toContain(GRAD_VUKOVAR)
    expect(imaUmanjenjeZaPodrucje(GRAD_VUKOVAR)).toBe(true)
  })

  it('одиниця поза обома підставами права не дає', () => {
    expect(imaUmanjenjeZaPodrucje('Zagreb')).toBe(false)
    expect(imaUmanjenjeZaPodrucje('Split')).toBe(false)
  })

  it('порівнює незалежно від регістру, бо два реєстри пишуть по-різному', () => {
    // `Odluka` друкує «Babina Greda», Porezna uprava — «BABINA GREDA».
    expect(imaUmanjenjeZaPodrucje('Babina Greda')).toBe(true)
    expect(imaUmanjenjeZaPodrucje('BABINA GREDA')).toBe(true)
  })

  it('кожне число списку несе своє джерело', () => {
    expect(jediniceIPrveSkupine.source.gazette).toBe('NN 3/24')
    expect(jediniceIPrveSkupine.source.status).toBe('in-force')
  })
})
