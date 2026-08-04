/**
 * Набори правил (`ruleset`), припущення (`pretpostavke`) і довідники.
 *
 * Крім самих правил, містить фікстури калькуляторів HOK і реєстр розбіжностей
 * з ними — матеріал для голден-тестів рушія.
 */
export * from './hok/brackets.ts'
export * from './hok/compare.ts'
export * from './hok/divergences.ts'
export * from './hok/types.ts'
export * from './hok/workbook.ts'
export * from './legal.ts'
export * from './rules/akti.ts'
export * from './rules/hr-2026.ts'
export * from './rules/types.ts'
export * from './sourced.ts'
