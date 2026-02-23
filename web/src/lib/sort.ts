import type { ScheduleItem } from "@/types/schedule"

export type SortOption =
  | "time"
  | "price-asc"
  | "price-desc"
  | "discount"
  | "review"
  | "rating"

export const SORT_OPTIONS: readonly { readonly value: SortOption; readonly label: string }[] = [
  { value: "time", label: "시간순" },
  { value: "price-asc", label: "가격 낮은순" },
  { value: "price-desc", label: "가격 높은순" },
  { value: "discount", label: "할인율순" },
  { value: "review", label: "리뷰순" },
  { value: "rating", label: "평점순" },
]

function toNumber(value: number | string): number {
  if (typeof value === "string") {
    const parsed = parseInt(value, 10)
    return isNaN(parsed) ? 0 : parsed
  }
  return isNaN(value) ? 0 : value
}

function getDiscountRate(item: ScheduleItem): number {
  const orig = toNumber(item.original_price)
  const curr = toNumber(item.price)
  if (orig <= 0 || curr <= 0 || orig <= curr) return 0
  return Math.round(((orig - curr) / orig) * 100)
}

export function sortItems(
  items: readonly ScheduleItem[],
  option: SortOption,
): ScheduleItem[] {
  const sorted = [...items]

  switch (option) {
    case "time":
      return sorted.sort((a, b) => a.start_time.localeCompare(b.start_time))
    case "price-asc":
      return sorted.sort((a, b) => toNumber(a.price) - toNumber(b.price))
    case "price-desc":
      return sorted.sort((a, b) => toNumber(b.price) - toNumber(a.price))
    case "discount":
      return sorted.sort((a, b) => getDiscountRate(b) - getDiscountRate(a))
    case "review":
      return sorted.sort((a, b) => b.review_count - a.review_count)
    case "rating":
      return sorted.sort((a, b) => b.review_rating - a.review_rating)
    default:
      return sorted
  }
}
