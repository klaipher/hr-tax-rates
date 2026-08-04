import { describe, expect, it } from 'vitest'
import { LOCALE_NAMES, LOCALES, parseLocale, resolveLocale } from './locale.ts'

/**
 * Тести навмисно бігають у середовищі `node`, де немає ні `localStorage`, ні
 * `navigator.languages`. Якби резолвер зазирав у браузер, вони б упали на
 * першому ж виклику — тож чистота перевіряється не оком, а середовищем.
 */
describe('parseLocale', () => {
  it('приймає три підтримані мови', () => {
    expect(parseLocale('uk')).toBe('uk')
    expect(parseLocale('hr')).toBe('hr')
    expect(parseLocale('en')).toBe('en')
  })

  it('зводить регіональний тег до базової мови', () => {
    expect(parseLocale('uk-UA')).toBe('uk')
    expect(parseLocale('hr-BA')).toBe('hr')
    expect(parseLocale('en-GB')).toBe('en')
    expect(parseLocale('sr-Latn-RS')).toBeUndefined()
  })

  it('не зважає на регістр', () => {
    expect(parseLocale('HR')).toBe('hr')
    expect(parseLocale('EN-us')).toBe('en')
  })

  it('повертає undefined на невідоме, а не мовчазну заміну', () => {
    expect(parseLocale('de')).toBeUndefined()
    expect(parseLocale('')).toBeUndefined()
    expect(parseLocale('ukrainian')).toBeUndefined()
  })
})

describe('resolveLocale', () => {
  it('віддає перевагу збереженому вибору над мовами браузера', () => {
    expect(resolveLocale('hr', ['uk-UA', 'en'])).toBe('hr')
    expect(resolveLocale('en', ['uk'])).toBe('en')
  })

  it('без збереженого вибору бере першу підтриману мову браузера', () => {
    expect(resolveLocale(null, ['uk-UA', 'en-US'])).toBe('uk')
    expect(resolveLocale(null, ['de-DE', 'hr-HR', 'uk'])).toBe('hr')
  })

  it('ігнорує збережене сміття і повертається до детекту', () => {
    // Значення в сховищі могло лишитися від мови, якої вже немає, або бути
    // підправлене руками. Мовчки віддавати англійську тут було б грубо.
    expect(resolveLocale('de', ['hr-HR'])).toBe('hr')
    expect(resolveLocale('', ['uk'])).toBe('uk')
  })

  it('дає англійську, коли жодна мова не підтримана', () => {
    expect(resolveLocale(null, ['ja-JP', 'zh'])).toBe('en')
    expect(resolveLocale(null, [])).toBe('en')
    expect(resolveLocale('de', ['ja'])).toBe('en')
  })

  it('не залежить від порядку викликів і не чіпає вхідного списку', () => {
    const jezici = ['de-DE', 'uk-UA']
    expect(resolveLocale(null, jezici)).toBe('uk')
    expect(resolveLocale(null, jezici)).toBe('uk')
    expect(jezici).toEqual(['de-DE', 'uk-UA'])
  })
})

describe('перелік мов', () => {
  it('починається з української — мови-джерела перекладів', () => {
    expect(LOCALES).toEqual(['uk', 'hr', 'en'])
  })

  it('називає кожну мову нею самою, щоб її впізнав той, хто читає лише її', () => {
    expect(LOCALE_NAMES).toEqual({ uk: 'Українська', hr: 'Hrvatski', en: 'English' })
  })
})
