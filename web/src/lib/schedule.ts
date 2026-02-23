import fs from "fs"
import path from "path"

import type { ScheduleData, DateInfo } from "@/types/schedule"

const OUTPUT_DIR = path.resolve(process.cwd(), "data")

export function getScheduleFiles(): string[] {
  if (!fs.existsSync(OUTPUT_DIR)) {
    return []
  }

  return fs
    .readdirSync(OUTPUT_DIR)
    .filter((f) => f.startsWith("schedule_") && f.endsWith(".json"))
    .sort()
    .reverse()
}

export function getAvailableDates(): DateInfo[] {
  const files = getScheduleFiles()

  return files.map((filename) => {
    const dateStr = filename.replace("schedule_", "").replace(".json", "")
    const year = dateStr.slice(0, 4)
    const month = dateStr.slice(4, 6)
    const day = dateStr.slice(6, 8)

    const filePath = path.join(OUTPUT_DIR, filename)
    let itemCount = 0

    try {
      const raw = fs.readFileSync(filePath, "utf-8")
      const data = JSON.parse(raw) as ScheduleData
      itemCount = data.total_count
    } catch {
      itemCount = 0
    }

    return {
      date: `${year}-${month}-${day}`,
      display: `${year}년 ${parseInt(month)}월 ${parseInt(day)}일`,
      itemCount,
    }
  })
}

export function getScheduleByDate(dateStr: string): ScheduleData | null {
  const filename = `schedule_${dateStr.replace(/-/g, "")}.json`
  const filePath = path.join(OUTPUT_DIR, filename)

  if (!fs.existsSync(filePath)) {
    return null
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8")
    return JSON.parse(raw) as ScheduleData
  } catch {
    return null
  }
}
