import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { LangProvider } from "@/lib/lang"

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" })

export const metadata: Metadata = {
  title: "Business OS",
  description: "AI-powered business pipeline",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.variable} style={{ margin: 0 }}>
        <LangProvider>
          {children}
        </LangProvider>
      </body>
    </html>
  )
}
