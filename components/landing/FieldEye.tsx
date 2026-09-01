"use client"

import { useEffect, useRef, useState } from "react"
import {
  EYE_OPEN,
  EYE_MID,
  EYE_CLOSED,
  EYE_PUPIL_LINE,
  EYE_PUPIL,
} from "./art"

type EyeFrame = "open" | "mid" | "closed"

const CAPTION_DEFAULT = "it noticed you before you arrived."
const CAPTION_SHUT = "fine. it will not look."

// The hero eye. Blinks every 8–20s, the pupil snaps between three
// positions after the cursor, staring at it long enough closes it
// for the rest of the session.
export default function FieldEye() {
  const [frame, setFrame] = useState<EyeFrame>("open")
  const [shut, setShut] = useState(false)
  const [noticed, setNoticed] = useState(false)
  const [pupilShift, setPupilShift] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const hoverTimers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    if (sessionStorage.getItem("field-eye-shut") === "1") setShut(true)
  }, [])

  // blink scheduler
  useEffect(() => {
    if (shut) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let cancelled = false
    let timeout: ReturnType<typeof setTimeout>
    const blink = () => {
      if (cancelled) return
      setFrame("mid")
      setTimeout(() => !cancelled && setFrame("closed"), 70)
      setTimeout(() => !cancelled && setFrame("mid"), 150)
      setTimeout(() => !cancelled && setFrame("open"), 240)
      timeout = setTimeout(blink, 8000 + Math.random() * 12000)
    }
    timeout = setTimeout(blink, 4000 + Math.random() * 8000)
    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [shut])

  // pupil follows the cursor in three discrete snaps
  useEffect(() => {
    if (shut) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const el = rootRef.current
        if (!el) return
        const r = el.getBoundingClientRect()
        const cx = r.left + r.width / 2
        const dx = e.clientX - cx
        setPupilShift(dx < -120 ? -2 : dx > 120 ? 2 : 0)
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [shut])

  const clearHoverTimers = () => {
    hoverTimers.current.forEach(clearTimeout)
    hoverTimers.current = []
  }

  const onEnter = () => {
    if (shut) return
    clearHoverTimers()
    hoverTimers.current.push(
      setTimeout(() => {
        setNoticed(true)
        hoverTimers.current.push(setTimeout(() => setNoticed(false), 800))
      }, 1000),
      setTimeout(() => {
        setShut(true)
        setNoticed(false)
        try {
          sessionStorage.setItem("field-eye-shut", "1")
        } catch {}
      }, 3000)
    )
  }

  const onLeave = () => clearHoverTimers()

  const lines = shut ? EYE_CLOSED : frame === "open" ? EYE_OPEN : frame === "mid" ? EYE_MID : EYE_CLOSED
  const pupilLine = lines[EYE_PUPIL_LINE]
  const pupilAt = pupilLine.indexOf(EYE_PUPIL)
  const showPupil = !shut && frame === "open" && pupilAt >= 0

  return (
    <div ref={rootRef} onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <pre className="f-pre text-[8px] leading-[1.25] md:text-[12px]" aria-hidden="true">
        {lines.map((line, i) => {
          if (i === EYE_PUPIL_LINE && showPupil) {
            return (
              <span key={i}>
                {line.slice(0, pupilAt)}
                <span
                  className={noticed ? "f-ember" : undefined}
                  style={{
                    display: "inline-block",
                    transform: `translateX(${pupilShift}ch)`,
                  }}
                >
                  {EYE_PUPIL}
                </span>
                {line.slice(pupilAt + EYE_PUPIL.length)}
                {"\n"}
              </span>
            )
          }
          return <span key={i}>{line + "\n"}</span>
        })}
      </pre>
      <p className="f-meta mt-3" data-stable="">
        {shut ? CAPTION_SHUT : CAPTION_DEFAULT}
      </p>
    </div>
  )
}
