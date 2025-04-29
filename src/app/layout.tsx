import type React from "react"
import "@/app/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import type { Metadata } from "next"
// import { AssistantBotProvider } from "@/components/assistant-bot-context"
import { SiteHeader } from "@/components/core/site-header"

export const metadata: Metadata = {
  title: "CodeBhaav - Student-led Tech Community",
  description:
    "A student-led tech community from Amravati, fostering innovation, collaboration, and purpose-driven development.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body>
        {/* <AssistantBotProvider> */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} forcedTheme="dark">
          {/* Header */}
          <SiteHeader />
          {children}
        </ThemeProvider>
        {/* </AssistantBotProvider> */}
      </body>
    </html>
  )
}
