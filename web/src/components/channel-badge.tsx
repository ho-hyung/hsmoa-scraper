import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CHANNEL_COLORS } from "@/lib/constants"

interface ChannelBadgeProps {
  readonly channelCode: string
  readonly channelName: string
  readonly className?: string
}

export function ChannelBadge({
  channelCode,
  channelName,
  className,
}: ChannelBadgeProps) {
  const colors = CHANNEL_COLORS[channelCode] ?? {
    bg: "bg-gray-100",
    text: "text-gray-800",
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        "text-xs font-medium border-0",
        colors.bg,
        colors.text,
        className,
      )}
    >
      {channelName}
    </Badge>
  )
}
