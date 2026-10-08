/** Stable grouping across server/browser ICU versions; prices are integer UZS. */
export function formatPriceUZS(price: number) {
  return String(price).replace(/\B(?=(\d{3})+(?!\d))/g, "\u00a0");
}
