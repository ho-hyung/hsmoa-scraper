import { formatPrice, getDiscountRate } from "@/lib/format"

interface PriceDisplayProps {
  readonly price: number | string
  readonly originalPrice: number | string
}

export function PriceDisplay({ price, originalPrice }: PriceDisplayProps) {
  const discountRate = getDiscountRate(originalPrice, price)
  const formattedPrice = formatPrice(price)
  const isPriceUnknown =
    price === "" || price === null || price === undefined

  if (isPriceUnknown) {
    return <span className="text-sm text-muted-foreground">가격 미정</span>
  }

  return (
    <div className="flex items-baseline gap-1.5">
      {discountRate !== null && (
        <span className="text-sm font-bold text-red-500">
          {discountRate}%
        </span>
      )}
      <span className="text-sm font-bold">{formattedPrice}</span>
      {discountRate !== null && (
        <span className="text-xs text-muted-foreground line-through">
          {formatPrice(originalPrice)}
        </span>
      )}
    </div>
  )
}
