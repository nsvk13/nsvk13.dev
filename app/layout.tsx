import type React from "react"
import type { Metadata } from "next"
import { JetBrains_Mono, Archivo, DotGothic16 } from "next/font/google"
import "./globals.css"
import { Suspense } from "react"

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["wdth"],
})

const dotGothic = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dot",
  preload: false,
})

export const metadata: Metadata = {
  title: "nsvk13 — personal index",
  description: "the field is quiet tonight. a personal index of Nikita Simakin.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${jetbrainsMono.variable} ${archivo.variable} ${dotGothic.variable} font-mono bg-black text-gold`}
      >
        <div className="grain" aria-hidden="true" />
        <Suspense>{children}</Suspense>
      </body>
    </html>
  )
}
