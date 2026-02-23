"use client"

import { Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChannelBadge } from "@/components/channel-badge"

interface ChannelInfo {
  readonly code: string
  readonly name: string
}

interface ChannelFilterProps {
  readonly channels: readonly ChannelInfo[]
  readonly selectedChannels: ReadonlySet<string>
  readonly onToggleChannel: (channelName: string) => void
  readonly onSelectAll: () => void
  readonly onDeselectAll: () => void
}

export function ChannelFilter({
  channels,
  selectedChannels,
  onToggleChannel,
  onSelectAll,
  onDeselectAll,
}: ChannelFilterProps) {
  const allSelected = channels.length === selectedChannels.size
  const noneSelected = selectedChannels.size === 0
  const selectedCount = selectedChannels.size

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>채널</span>
          {!allSelected && (
            <span className="rounded-full bg-primary px-1.5 text-xs text-primary-foreground">
              {selectedCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">
            채널 필터 ({selectedCount}/{channels.length})
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onSelectAll}
              disabled={allSelected}
            >
              전체
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={onDeselectAll}
              disabled={noneSelected}
            >
              해제
            </Button>
          </div>
        </div>
        <ScrollArea className="h-72">
          <div className="space-y-1 p-2">
            {channels.map((ch) => (
              <label
                key={ch.code}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent"
              >
                <Checkbox
                  checked={selectedChannels.has(ch.name)}
                  onCheckedChange={() => onToggleChannel(ch.name)}
                />
                <ChannelBadge channelCode={ch.code} channelName={ch.name} />
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
