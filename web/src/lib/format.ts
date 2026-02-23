import { HOUR_LABELS } from "./constants"

export function formatPrice(price: number | string): string {
  if (price === "" || price === null || price === undefined) {
    return "가격 미정"
  }

  const numPrice = typeof price === "string" ? parseInt(price, 10) : price

  if (isNaN(numPrice)) {
    return "가격 미정"
  }

  return `${numPrice.toLocaleString("ko-KR")}원`
}

export function formatTime(dateTimeStr: string): string {
  const timePart = dateTimeStr.split(" ")[1]
  if (!timePart) return ""
  return timePart
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} ~ ${formatTime(endTime)}`
}

export function getHourFromTime(dateTimeStr: string): number {
  const timePart = dateTimeStr.split(" ")[1]
  if (!timePart) return 0
  return parseInt(timePart.split(":")[0], 10)
}

export function getHourLabel(hour: number): string {
  return HOUR_LABELS[hour] ?? `${hour}시`
}

export function getDiscountRate(
  originalPrice: number | string,
  price: number | string,
): number | null {
  const orig =
    typeof originalPrice === "string"
      ? parseInt(originalPrice, 10)
      : originalPrice
  const curr = typeof price === "string" ? parseInt(price, 10) : price

  if (isNaN(orig) || isNaN(curr) || orig <= 0 || curr <= 0 || orig <= curr) {
    return null
  }

  return Math.round(((orig - curr) / orig) * 100)
}
