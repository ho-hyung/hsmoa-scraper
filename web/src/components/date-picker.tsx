"use client"

import { CalendarIcon } from "lucide-react"
import { format, parse } from "date-fns"
import { ko } from "date-fns/locale"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import type { DateInfo } from "@/types/schedule"

interface DatePickerProps {
  readonly dates: readonly DateInfo[]
  readonly selectedDate: string
  readonly onDateChange: (date: string) => void
}

export function DatePicker({
  dates,
  selectedDate,
  onDateChange,
}: DatePickerProps) {
  const availableDateSet = new Set(dates.map((d) => d.date))

  const selectedDateObj = selectedDate
    ? parse(selectedDate, "yyyy-MM-dd", new Date())
    : undefined

  const availableDateObjects = dates.map((d) =>
    parse(d.date, "yyyy-MM-dd", new Date()),
  )

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    const formatted = format(date, "yyyy-MM-dd")
    if (availableDateSet.has(formatted)) {
      onDateChange(formatted)
    }
  }

  const isDisabled = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd")
    return !availableDateSet.has(formatted)
  }

  const selectedInfo = dates.find((d) => d.date === selectedDate)

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full sm:w-[240px] justify-start text-left font-normal",
            !selectedDate && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selectedDate ? (
            <span>
              {format(
                parse(selectedDate, "yyyy-MM-dd", new Date()),
                "yyyy년 M월 d일 (EEE)",
                { locale: ko },
              )}
            </span>
          ) : (
            <span>날짜 선택</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDateObj}
          onSelect={handleSelect}
          disabled={isDisabled}
          defaultMonth={availableDateObjects[0]}
          locale={ko}
        />
        {selectedInfo && (
          <div className="border-t px-3 py-2 text-xs text-muted-foreground">
            {selectedInfo.itemCount}개 상품
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
