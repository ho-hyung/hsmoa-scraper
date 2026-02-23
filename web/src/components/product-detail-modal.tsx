"use client"

import Image from "next/image"
import { ExternalLink } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ChannelBadge } from "@/components/channel-badge"
import { PriceDisplay } from "@/components/price-display"
import { StarRating } from "@/components/star-rating"
import { formatTimeRange } from "@/lib/format"
import type { ScheduleItem } from "@/types/schedule"

interface ProductDetailModalProps {
  readonly item: ScheduleItem | null
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function ProductDetailModal({
  item,
  open,
  onOpenChange,
}: ProductDetailModalProps) {
  if (!item) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto p-0">
        <div className="relative aspect-square bg-muted">
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.product_name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 512px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              이미지 없음
            </div>
          )}
          <div className="absolute top-3 left-3">
            <ChannelBadge
              channelCode={item.channel_code}
              channelName={item.channel}
              className="text-sm"
            />
          </div>
        </div>

        <div className="space-y-4 p-5">
          <DialogHeader>
            <DialogTitle className="text-left text-base leading-snug">
              {item.product_name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{formatTimeRange(item.start_time, item.end_time)}</span>
            {item.category && (
              <>
                <span>·</span>
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              </>
            )}
          </div>

          <PriceDisplay price={item.price} originalPrice={item.original_price} />

          <Separator />

          <div className="flex items-center justify-between text-sm">
            {item.brand && (
              <span className="text-muted-foreground">{item.brand}</span>
            )}
            {item.review_count > 0 && (
              <div className="flex items-center gap-2">
                <StarRating rating={item.review_rating} />
                <span className="text-sm font-medium">{item.review_rating}</span>
                <span className="text-muted-foreground">
                  ({item.review_count.toLocaleString()}개 리뷰)
                </span>
              </div>
            )}
          </div>

          <Button asChild className="w-full gap-2">
            <a
              href={item.product_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              상품 페이지로 이동
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
