import type { Metadata } from "next"
import { Noto_Sans_KR } from "next/font/google"
import { ThemeProvider } from "next-themes"
import "./globals.css"

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
})

export const metadata: Metadata = {
  title: "홈쇼핑 편성표",
  description: "홈쇼핑 편성표 대시보드 - 채널별, 시간대별 편성 정보 조회",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${notoSansKR.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
