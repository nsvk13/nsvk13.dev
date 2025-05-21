"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export default function GlitchText({
  text,
  className,
  glitchInterval = 2000,
}: {
  text: string
  className?: string
  glitchInterval?: number
}) {
  const [isGlitching, setIsGlitching] = useState(false)

  useEffect(() => {
    const glitchTimer = setInterval(() => {
      setIsGlitching(true)
      setTimeout(() => setIsGlitching(false), 200)
    }, glitchInterval)

    return () => clearInterval(glitchTimer)
  }, [glitchInterval])

  return (
    <div className={cn("relative", className)}>
      <span className={cn("relative z-10", isGlitching && "glitch-text")}>{text}</span>
      {isGlitching && (
        <>
          <span className="absolute top-0 left-0 z-0 text-neon-pink opacity-70 glitch-1">{text}</span>
          <span className="absolute top-0 left-0 z-0 text-neon-cyan opacity-70 glitch-2">{text}</span>
        </>
      )}
    </div>
  )
}
