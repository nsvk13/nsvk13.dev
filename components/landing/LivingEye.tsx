"use client"

import { useEffect, useRef, useState } from "react"
import { renderEye, type EyeRun } from "./eye-render"

const CAPTION_DEFAULT = "it noticed you before you arrived."
const CAPTION_SHUT = "fine. it will not look."

function runsToHtml(rows: EyeRun[][]): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  return rows
    .map((row) => {
      let html = ""
      let cur: 0 | 1 | 2 = 0
      let buf = ""
      const flush = () => {
        if (!buf) return
        html += cur === 0 ? esc(buf) : `<span class="${cur === 1 ? "i" : "p"}">${esc(buf)}</span>`
        buf = ""
      }
      for (const c of row) {
        if (c.k !== cur) {
          flush()
          cur = c.k
        }
        buf += c.ch
      }
      flush()
      return html
    })
    .join("\n")
}

// The field eye, rendered live: it tracks the cursor, wanders when
// you are still, blinks, squints when you come close, and closes for
// the session if you stare too long. Under reduced motion it is one
// static open frame.
export default function LivingEye() {
  const preRef = useRef<HTMLPreElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const [shut, setShut] = useState(false)
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem("field-eye-shut") === "1") setShut(true)
    } catch {}
    setCompact(window.matchMedia("(max-width: 767px)").matches)
  }, [])

  useEffect(() => {
    const pre = preRef.current
    const root = rootRef.current
    if (!pre || !root) return
    const cols = compact ? 46 : 72
    const rows = compact ? 14 : 22
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    if (shut) {
      pre.innerHTML = runsToHtml(renderEye({ cols, rows, lid: 1, pupilX: 0, pupilY: 0, dilate: 0 }))
      return
    }
    if (rm) {
      pre.innerHTML = runsToHtml(renderEye({ cols, rows, lid: 0, pupilX: 0, pupilY: 0, dilate: 0 }))
      return
    }

    // ---- live state ----
    let lid = 0
    let lidTarget = 0
    let px = 0
    let py = 0
    let tx = 0
    let ty = 0
    let dilate = 0
    let dilateTarget = 0
    let noticed = false
    let hovering = false
    let lastPointerAt = performance.now()
    let nextWanderAt = performance.now() + 3000
    let blinkFrames: number[] = []
    let nextBlinkAt = performance.now() + 3000 + Math.random() * 5000
    let visible = true
    let disposed = false
    let hoverT0 = 0

    const onMove = (e: PointerEvent) => {
      lastPointerAt = performance.now()
      const r = root.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      tx = Math.max(-1, Math.min(1, (e.clientX - cx) / (window.innerWidth * 0.3)))
      ty = Math.max(-1, Math.min(1, (e.clientY - cy) / (window.innerHeight * 0.35)))
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
    })
    io.observe(root)

    const enter = () => {
      if (hovering) return
      hovering = true
      hoverT0 = performance.now()
      lidTarget = 0.32
    }
    const leave = (e: MouseEvent) => {
      const r = root.getBoundingClientRect()
      if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) return
      hovering = false
      noticed = false
      lidTarget = 0
      dilateTarget = 0
      root.classList.remove("noticed")
    }
    root.addEventListener("mouseenter", enter)
    root.addEventListener("mouseleave", leave)

    const frame = () => {
      if (disposed) return
      if (!visible || document.hidden) return
      const now = performance.now()

      // hover escalation: squint → notice → shut
      if (hovering) {
        const held = now - hoverT0
        if (held > 1000 && !noticed) {
          noticed = true
          dilateTarget = 1
          root.classList.add("noticed")
        }
        if (held > 3000) {
          setShut(true)
          try {
            sessionStorage.setItem("field-eye-shut", "1")
          } catch {}
          return
        }
      }

      // blink
      if (blinkFrames.length) {
        lid = blinkFrames.shift()!
      } else {
        if (now > nextBlinkAt) {
          const double = Math.random() < 0.18
          blinkFrames = [0.4, 0.85, 1, 1, 0.7, 0.3]
          if (double) blinkFrames.push(0.45, 0.9, 1, 0.6, 0.2)
          nextBlinkAt = now + 5000 + Math.random() * 6000
        }
        lid += (lidTarget - lid) * 0.25
      }

      // wander when the pointer is still
      if (now - lastPointerAt > 4000 && now > nextWanderAt) {
        tx = (Math.random() * 2 - 1) * 0.8
        ty = (Math.random() * 2 - 1) * 0.5
        nextWanderAt = now + 1800 + Math.random() * 3500
      }
      px += (tx - px) * 0.22
      py += (ty - py) * 0.22
      dilate += (dilateTarget - dilate) * 0.2

      pre.innerHTML = runsToHtml(renderEye({ cols, rows, lid, pupilX: px, pupilY: py, dilate }))
    }

    frame()
    const iv = setInterval(frame, 80)

    return () => {
      disposed = true
      clearInterval(iv)
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
      root.removeEventListener("mouseenter", enter)
      root.removeEventListener("mouseleave", leave)
    }
  }, [shut, compact])

  return (
    <div ref={rootRef} className="f-eye">
      <pre ref={preRef} className="f-pre text-[8px] leading-[1.25] md:text-[11px]" aria-hidden="true" />
      <p className="f-meta mt-3" data-stable="">
        {shut ? CAPTION_SHUT : CAPTION_DEFAULT}
      </p>
    </div>
  )
}
