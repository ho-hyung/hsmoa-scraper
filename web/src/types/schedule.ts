export interface ScheduleItem {
  readonly channel_code: string
  readonly channel: string
  readonly start_time: string
  readonly end_time: string
  readonly product_name: string
  readonly price: number | string
  readonly original_price: number | string
  readonly brand: string
  readonly category: string
  readonly image_url: string
  readonly product_url: string
  readonly review_count: number
  readonly review_rating: number
}

export interface ScheduleData {
  readonly date: string
  readonly collected_at: string
  readonly total_count: number
  readonly items: readonly ScheduleItem[]
}

export interface DateInfo {
  readonly date: string
  readonly display: string
  readonly itemCount: number
}

export interface ScheduleResponse {
  readonly date: string
  readonly channels: readonly string[]
  readonly categories: readonly string[]
  readonly items: readonly ScheduleItem[]
}

export interface DatesResponse {
  readonly dates: readonly DateInfo[]
}

export interface TimeGroup {
  readonly hour: number
  readonly label: string
  readonly items: readonly ScheduleItem[]
}

export interface ChannelInfo {
  readonly code: string
  readonly name: string
}
