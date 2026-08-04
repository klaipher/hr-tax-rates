import Decimal from 'decimal.js'

const CENTS = 2

/**
 * Розбиття річної суми на рівні платежі.
 *
 * Наївне `річна / кількість` із округленням кожного платежу окремо втрачає або
 * вигадує центи: 100 € на три квартали дало б 33,33 × 3 = 99,99. Тому
 * округлюється не платіж, а наростаючий підсумок — кожен платіж є різницею
 * двох сусідніх підсумків. Звідси дві властивості, обидві покриті тестами:
 * сума платежів точно дорівнює річній сумі, а кожен платіж відхиляється від
 * рівної частки менш ніж на цент.
 *
 * Останній підсумок береться незаокругленим навмисно. Річна сума не зобов'язана
 * бути цілим числом центів — `doprinosi` (внески) за рік дають 3 491,736 € — і
 * округлити її тут означало б тихо розійтися з річним результатом рушія.
 */
export const splitIntoInstalments = (annualAmount: Decimal, count: number): readonly Decimal[] => {
  if (!Number.isInteger(count) || count < 1) {
    throw new RangeError(`Платежів має бути ціле число, щонайменше один, а не ${count}`)
  }

  const instalments: Decimal[] = []
  let paidSoFar = new Decimal(0)

  for (let index = 1; index <= count; index++) {
    const cumulative =
      index === count
        ? annualAmount
        : annualAmount.times(index).div(count).toDecimalPlaces(CENTS, Decimal.ROUND_HALF_UP)
    instalments.push(cumulative.minus(paidSoFar))
    paidSoFar = cumulative
  }

  return instalments
}
