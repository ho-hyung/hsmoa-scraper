"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Loader2 } from "lucide-react"

import { DatePicker } from "@/components/date-picker"
import { ChannelFilter } from "@/components/channel-filter"
import { TimeGroup } from "@/components/time-group"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { getHourFromTime, getHourLabel } from "@/lib/format"
import type {
  DateInfo,
  ScheduleItem,
  ScheduleResponse,
  TimeGroup as TimeGroupType,
} from "@/types/schedule"

interface ScheduleDashboardProps {
  readonly initialDates: readonly DateInfo[]
}

interface ChannelInfo {
  readonly code: string
  readonly name: string
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const handleSelectAll = useCallback(() => {
    setSelectedChannels(new Set(allChannels.map((ch) => ch.name)))
  }, [allChannels])

  const handleDeselectAll = useCallback(() => {
    setSelectedChannels(new Set())
  }, [])

  const filteredItems = useMemo(
    () => items.filter((item) => selectedChannels.has(item.channel)),
    [items, selectedChannels],
  )

  const timeGroups = useMemo(
    () => buildTimeGroups(filteredItems),
    [filteredItems],
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <DatePicker
          dates={initialDates}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
        <ChannelFilter
          channels={allChannels}
          selectedChannels={selectedChannels}
          onToggleChannel={handleToggleChannel}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
        />
        {!loading && items.length > 0 && (
          <span className="text-sm text-muted-foreground">
            {filteredItems.length} / {items.length}개 상품
          </span>
        )}
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : filteredItems.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-8">
          {timeGroups.map((group) => (
            <TimeGroup key={group.hour} group={group} />
          ))}
        </div>
      )}
    </div>
  )
}
