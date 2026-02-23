import { Clock } from "lucide-react"

import { ProductCard } from "@/components/product-card"
import type { TimeGroup as TimeGroupType, ScheduleItem } from "@/types/schedule"

interface TimeGroupProps {
  readonly group: TimeGroupType
  readonly onImageClick?: (item: ScheduleItem) => void
}

export function TimeGroup({ group, onImageClick }: TimeGroupProps) {
  return (
    <section id={`time-group-${group.hour}`}>
      <div className="sticky top-0 z-10 mb-4 flex items-center gap-2 border-b bg-background/95 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{group.label}</h2>
        <span className="text-sm text-muted-foreground">
          {group.items.length}개 상품
        </span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {group.items.map((item, idx) => (
          <ProductCard
            key={`${item.channel_code}-${item.start_time}-${idx}`}
            item={item}
            onImageClick={onImageClick}
          />
        ))}
      </div>
    </section>
  )
}
