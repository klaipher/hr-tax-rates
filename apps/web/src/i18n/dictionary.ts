import { en } from './dictionary/en.ts'
import { hr } from './dictionary/hr.ts'
import { uk } from './dictionary/uk.ts'
import type { Locale } from './locale.ts'

/**
 * Форма словника, виведена з української.
 *
 * Українська — мова-джерело перекладів, і тип це закріплює: `hr` та `en`
 * оголошені як `Dictionary`, тож доданий сюди ключ ламає їх компіляцією доти,
 * доки його не перекладуть. Три локалі однакової повноти — не домовленість, а
 * умова збірки.
 */
export type Dictionary = typeof uk

export const DICTIONARIES: Record<Locale, Dictionary> = { uk, hr, en }
