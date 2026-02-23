import { Tv } from "lucide-react"

import { ScheduleDashboard } from "@/components/schedule-dashboard"
import { ThemeToggle } from "@/components/theme-toggle"
import { getAvailableDates } from "@/lib/schedule"

export const dynamic = "force-dynamic"

export default function Home() {
  const dates = getAvailableDates()

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <div className="flex items-center gap-3">
          <Tv className="h-8 w-8 text-primary" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              홈쇼핑 편성표
            </h1>
            <p className="text-sm text-muted-foreground">
              홈쇼핑 채널별 편성 정보를 한눈에 확인하세요
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {dates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground">
          <Tv className="h-12 w-12" />
          <p className="text-lg">수집된 편성표 데이터가 없습니다.</p>
          <p className="text-sm">스크래퍼를 실행하여 데이터를 수집해 주세요.</p>
        </div>
      ) : (
        <ScheduleDashboard initialDates={dates} />
      )}
    </main>
  )
}
