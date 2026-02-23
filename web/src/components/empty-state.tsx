import { SearchX } from "lucide-react"

interface EmptyStateProps {
  readonly message?: string
}

export function EmptyState({
  message = "선택한 조건에 맞는 상품이 없습니다.",
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
      <SearchX className="h-12 w-12" />
      <p className="text-lg">{message}</p>
      <p className="text-sm">다른 채널이나 날짜를 선택해 보세요.</p>
    </div>
  )
}
