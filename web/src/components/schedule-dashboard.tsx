"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2 } from "lucide-react"

import { DatePicker } from "@/components/date-picker"
import { ChannelFilter } from "@/components/channel-filter"
import { CategoryFilter } from "@/components/category-filter"
import { SearchInput } from "@/components/search-input"
import { SortSelect } from "@/components/sort-select"
import { TimeGroup } from "@/components/time-group"
import { TimeOverview } from "@/components/time-overview"
import { ProductCard } from "@/components/product-card"
import { ProductDetailModal } from "@/components/product-detail-modal"
import { BackToTop } from "@/components/back-to-top"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { getHourFromTime, getHourLabel } from "@/lib/format"
import { sortItems, type SortOption } from "@/lib/sort"
import type {
  ChannelInfo,
  DateInfo,
  ScheduleItem,
  ScheduleResponse,
  TimeGroup as TimeGroupType,
} from "@/types/schedule"

interface ScheduleDashboardProps {
  readonly initialDates: readonly DateInfo[]
}

function buildTimeGroups(items: readonly ScheduleItem[]): TimeGroupType[] {
  const grouped = new Map<number, ScheduleItem[]>()

  for (const item of items) {
    const hour = getHourFromTime(item.start_time)
    const existing = grouped.get(hour)
    if (existing) {
      existing.push(item)
    } else {
      grouped.set(hour, [item])
    }
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([hour, groupItems]) => ({
      hour,
      label: getHourLabel(hour),
      items: groupItems,
    }))
}

function extractChannels(items: readonly ScheduleItem[]): ChannelInfo[] {
  const seen = new Map<string, string>()

  for (const item of items) {
    if (!seen.has(item.channel)) {
      seen.set(item.channel, item.channel_code)
    }
  }

  return [...seen.entries()].map(([name, code]) => ({ code, name }))
}

function extractCategories(
  items: readonly ScheduleItem[],
): { name: string; count: number }[] {
  const counts = new Map<string, number>()

  for (const item of items) {
    if (item.category) {
      counts.set(item.category, (counts.get(item.category) ?? 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([name, count]) => ({ name, count }))
}

function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="space-y-3">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ScheduleDashboard({ initialDates }: ScheduleDashboardProps) {
  const [selectedDate, setSelectedDate] = useState(
    initialDates[0]?.date ?? "",
  )
  const [items, setItems] = useState<readonly ScheduleItem[]>([])
  const [allChannels, setAllChannels] = useState<ChannelInfo[]>([])
  const [selectedChannels, setSelectedChannels] = useState<Set<string>>(
    new Set(),
  )
  const [allCategories, setAllCategories] = useState<
    { name: string; count: number }[]
  >([])
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(),
  )
  const [searchQuery, setSearchQuery] = useState("")
  const [sortOption, setSortOption] = useState<SortOption>("time")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [modalItem, setModalItem] = useState<ScheduleItem | null>(null)

  const fetchSchedule = useCallback(async (date: string) => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/schedule/${date}`)
      if (!res.ok) {
        throw new Error("Failed to fetch schedule")
      }

      const data: ScheduleResponse = await res.json()
      setItems(data.items)

      const channels = extractChannels(data.items)
      setAllChannels(channels)
      setSelectedChannels(new Set(channels.map((ch) => ch.name)))

      const categories = extractCategories(data.items)
      setAllCategories(categories)
      setSelectedCategories(new Set(categories.map((c) => c.name)))

      setSearchQuery("")
      setSortOption("time")
    } catch (err) {
      console.error("Failed to fetch schedule:", err)
      setError("편성표를 불러오는데 실패했습니다.")
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedDate) {
      fetchSchedule(selectedDate)
    }
  }, [selectedDate, fetchSchedule])

  const handleDateChange = useCallback((date: string) => {
    setSelectedDate(date)
  }, [])

  const handleToggleChannel = useCallback((channelName: string) => {
    setSelectedChannels((prev) => {
      const next = new Set(prev)
      if (next.has(channelName)) {
        next.delete(channelName)
      } else {
        next.add(channelName)
      }
      return next
    })
  }, [])

  const handleSelectAllChannels = useCallback(() => {
    setSelectedChannels(new Set(allChannels.map((ch) => ch.name)))
  }, [allChannels])

  const handleDeselectAllChannels = useCallback(() => {
    setSelectedChannels(new Set())
  }, [])

  const handleToggleCategory = useCallback((category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }, [])

  const handleSelectAllCategories = useCallback(() => {
    setSelectedCategories(new Set(allCategories.map((c) => c.name)))
  }, [allCategories])

  const handleDeselectAllCategories = useCallback(() => {
    setSelectedCategories(new Set())
  }, [])

  const handleImageClick = useCallback((item: ScheduleItem) => {
    setModalItem(item)
  }, [])

  const channelCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const item of items) {
      counts.set(item.channel, (counts.get(item.channel) ?? 0) + 1)
    }
    return counts
  }, [items])

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()

    return items.filter((item) => {
      if (!selectedChannels.has(item.channel)) return false
      if (item.category && !selectedCategories.has(item.category)) return false
      if (!item.category && selectedCategories.size < allCategories.length) {
        return false
      }

      if (query) {
        const nameMatch = item.product_name.toLowerCase().includes(query)
        const brandMatch = item.brand?.toLowerCase().includes(query)
        if (!nameMatch && !brandMatch) return false
      }

      return true
    })
  }, [items, selectedChannels, selectedCategories, allCategories.length, searchQuery])

  const sortedItems = useMemo(
    () => sortItems(filteredItems, sortOption),
    [filteredItems, sortOption],
  )

  const timeGroups = useMemo(
    () => buildTimeGroups(sortedItems),
    [sortedItems],
  )

  const isTimeSort = sortOption === "time"

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker
          dates={initialDates}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
        <ChannelFilter
          channels={allChannels}
          selectedChannels={selectedChannels}
          channelCounts={channelCounts}
          onToggleChannel={handleToggleChannel}
          onSelectAll={handleSelectAllChannels}
          onDeselectAll={handleDeselectAllChannels}
        />
        {allCategories.length > 0 && (
          <CategoryFilter
            categories={allCategories}
            selectedCategories={selectedCategories}
            onToggleCategory={handleToggleCategory}
            onSelectAll={handleSelectAllCategories}
            onDeselectAll={handleDeselectAllCategories}
          />
        )}
        <SortSelect value={sortOption} onChange={setSortOption} />
        <SearchInput value={searchQuery} onChange={setSearchQuery} />
        {!loading && items.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {sortedItems.length} / {items.length}개 상품
          </span>
        )}
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isTimeSort && !loading && timeGroups.length > 0 && (
        <TimeOverview timeGroups={timeGroups} />
      )}

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : sortedItems.length === 0 ? (
        <EmptyState />
      ) : isTimeSort ? (
        <div className="space-y-8">
          {timeGroups.map((group) => (
            <TimeGroup
              key={group.hour}
              group={group}
              onImageClick={handleImageClick}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedItems.map((item, idx) => (
            <ProductCard
              key={`${item.channel_code}-${item.start_time}-${idx}`}
              item={item}
              onImageClick={handleImageClick}
            />
          ))}
        </div>
      )}

      <ProductDetailModal
        item={modalItem}
        open={modalItem !== null}
        onOpenChange={(open) => {
          if (!open) setModalItem(null)
        }}
      />

      <BackToTop />
    </div>
  )
}
