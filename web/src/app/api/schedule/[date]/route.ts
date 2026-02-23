import { NextResponse } from "next/server"

import { getScheduleByDate } from "@/lib/schedule"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ date: string }> },
) {
  try {
    const { date } = await params

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD." },
        { status: 400 },
      )
    }

    const data = getScheduleByDate(date)

    if (!data) {
      return NextResponse.json(
        { error: "Schedule not found for this date" },
        { status: 404 },
      )
    }

    const channels = [...new Set(data.items.map((item) => item.channel))]
    const categories = [...new Set(data.items.map((item) => item.category))]

    return NextResponse.json({
      date: data.date,
      channels,
      categories,
      items: data.items,
    })
  } catch (error) {
    console.error("Failed to load schedule:", error)
    return NextResponse.json(
      { error: "Failed to load schedule" },
      { status: 500 },
    )
  }
}
