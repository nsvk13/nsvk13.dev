"use client"

import { type ReactNode, useState, useEffect } from "react"

export default function CrtEffect({ children }: { children: ReactNode }) {
  const [isOn, setIsOn] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsOn(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  return <div className={`crt ${isOn ? "on" : "off"}`}>{children}</div>
}
