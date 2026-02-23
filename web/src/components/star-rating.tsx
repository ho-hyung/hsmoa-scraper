import { Star } from "lucide-react"

interface StarRatingProps {
  readonly rating: number
  readonly maxStars?: number
}

export function StarRating({ rating, maxStars = 5 }: StarRatingProps) {
  const fullStars = Math.floor(rating)
  const hasHalf = rating - fullStars >= 0.5

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxStars }, (_, i) => {
        const isFull = i < fullStars
        const isHalf = i === fullStars && hasHalf

        return (
          <Star
            key={i}
            className={`h-3 w-3 ${
              isFull || isHalf
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/30"
            }`}
          />
        )
      })}
    </div>
  )
}
