import Image from "next/image"
import { Clock, ExternalLink } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChannelBadge } from "@/components/channel-badge"
import { PriceDisplay } from "@/components/price-display"
import { StarRating } from "@/components/star-rating"
import { formatTimeRange } from "@/lib/format"
import type { ScheduleItem } from "@/types/schedule"

interface ProductCardProps {
  readonly item: ScheduleItem
  readonly onImageClick?: (item: ScheduleItem) => void
}

export function ProductCard({ item, onImageClick }: ProductCardProps) {
  const handleImageClick = () => {
    if (onImageClick) {
      onImageClick(item)
    }
  }

  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      {onImageClick ? (
        <button
          type="button"
          className="block w-full cursor-pointer text-left"
          onClick={handleImageClick}
        >
          <ProductImage item={item} />
        </button>
      ) : (
        <a
          href={item.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <ProductImage item={item} />
        </a>
      )}
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{formatTimeRange(item.start_time, item.end_time)}</span>
        </div>

        <a
          href={item.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-start gap-1"
        >
          <h3 className="line-clamp-2 text-sm font-medium leading-tight group-hover:text-blue-600">
            {item.product_name}
          </h3>
          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
        </a>

        <PriceDisplay price={item.price} originalPrice={item.original_price} />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {item.brand && <span>{item.brand}</span>}
            {item.category && (
              <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                {item.category}
              </Badge>
            )}
          </div>
          {item.review_count > 0 && (
            <div className="flex items-center gap-1">
              <StarRating rating={item.review_rating} />
              <span className="text-muted-foreground/60">
                ({item.review_count})
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ProductImage({ item }: { readonly item: ScheduleItem }) {
  return (
    <div className="relative aspect-square bg-muted">
      {item.image_url ? (
        <Image
          src={item.image_url}
          alt={item.product_name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-muted-foreground">
          이미지 없음
        </div>
      )}
      <div className="absolute top-2 left-2">
        <ChannelBadge
          channelCode={item.channel_code}
          channelName={item.channel}
        />
      </div>
    </div>
  )
}
