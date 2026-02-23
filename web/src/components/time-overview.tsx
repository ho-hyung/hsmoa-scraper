"use client"

import { useRef } from "react"
import { Clock } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { TimeGroup } from "@/types/schedule"

interface TimeOverviewProps {
  readonly timeGroups: readonly TimeGroup[]
}

export function TimeOverview({ timeGroups }: TimeOverviewProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  if (timeGroups.length === 0) return null

  const handleClick = (hour: number) => {
    const section = document.getElementById(`time-group-${hour}`)
    if (section) {
      const headerOffset = 80
      const elementPosition = section.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerOffset
      window.scrollTo({ top: offsetPosition, behavior: "smooth" })
    }
  }

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
    >
      <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
      {timeGroups.map((group) => (
        <Button
          key={group.hour}
          variant="outline"
          size="sm"
          className="shrink-0 gap-1 text-xs"
          onClick={() => handleClick(group.hour)}
        >
          <span>{group.label}</span>
          <span className="text-muted-foreground">({group.items.length})</span>
        </Button>
      ))}
    </div>
  )
}
