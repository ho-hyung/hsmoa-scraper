import { NextResponse } from "next/server"

import { getAvailableDates } from "@/lib/schedule"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const dates = getAvailableDates()
    return NextResponse.json({ dates })
  } catch (error) {
    console.error("Failed to load dates:", error)
    return NextResponse.json(
      { error: "Failed to load available dates" },
      { status: 500 },
    )
  }
}
