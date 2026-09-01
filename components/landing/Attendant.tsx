"use client"

import { useEffect, useRef } from "react"
import { ATTENDANT, WALK_CYCLE, DECAY_CYCLE, mirrorFrame } from "./art"

const FRAME_MS = 140
const NEAR_PX = 120
const CH_PX = 7.2 // 1ch at 12px JetBrains Mono
const LINE_PX = 15 // 12px * 1.25
const BODY_ROWS = 4

type Mode =
  | "hidden"
  | "materialize"
  | "walk"
  | "stand"
  | "look"
  | "stare"
  | "sit"
  | "dissolve"

// THE ATTENDANT. A small figure that sometimes materializes on the
// 1px wires of the page, walks them, looks at things, notices the
// cursor (its head detaches), and dissolves. Purely decorative;
// under prefers-reduced-motion it never mounts (a static sitting
// figure in the footer is served from the server instead).
export default function Attendant() {
  const preRef = useRef<HTMLPreElement>(null)
  const farRef = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const pre = preRef.current
    const far = farRef.current
    if (!pre || !far) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const coarse = window.matchMedia("(pointer: coarse)").matches
    const night = new Date().getHours() < 6
    const limit = coarse ? 3 : night ? 8 : 6

    let count = 0
    try {
      count = parseInt(sessionStorage.getItem("attendant-count") ?? "0", 10) || 0
    } catch {}

    let mode: Mode = "hidden"
    let dir = 1
    let x = 0 // px, viewport
    let wire: Element | null = null
    let frameIdx = 0
    let stepsLeft = 0
    let modeUntil = 0 // timestamp when the current pause-state ends
    let nearSince = 0
    let footerDone = false
    try {
      footerDone = sessionStorage.getItem("attendant-footer") === "1"
    } catch {}

    const cursor = { x: -9999, y: -9999 }
    let disposed = false
    let tickTimer: ReturnType<typeof setInterval> | null = null
    let spawnTimer: ReturnType<typeof setTimeout> | null = null

    const setFrame = (f: string) => {
      pre.textContent = dir < 0 ? mirrorFrame(f) : f
    }

    const hide = () => {
      mode = "hidden"
      pre.style.visibility = "hidden"
      if (tickTimer) {
        clearInterval(tickTimer)
        tickTimer = null
      }
      scheduleSpawn()
    }

    const wireY = () => {
      if (!wire) return -9999
      const r = (wire as HTMLElement).getBoundingClientRect()
      return r.top
    }

    const place = () => {
      const y = wireY()
      pre.style.transform = `translate(${Math.round(x)}px, ${Math.round(
        y - BODY_ROWS * LINE_PX + 2
      )}px)`
    }

    const pickWire = (): Element | null => {
      const wires = Array.from(document.querySelectorAll("[data-wire]"))
      const vh = window.innerHeight
      const candidates = wires.filter((w) => {
        const r = w.getBoundingClientRect()
        return r.top > 80 && r.top < vh - 60 && r.width > 200
      })
      if (!candidates.length) return null
      return candidates[Math.floor(Math.random() * candidates.length)]
    }

    const beginOn = (w: Element, opts?: { fromEdge?: boolean }) => {
      wire = w
      const r = (w as HTMLElement).getBoundingClientRect()
      dir = Math.random() < 0.5 ? -1 : 1
      if (opts?.fromEdge) {
        // materialize clipped at the right edge, only 2ch visible
        dir = -1
        x = window.innerWidth - 2 * CH_PX
      } else {
        x = r.left + 20 + Math.random() * Math.max(40, r.width - 80)
      }
      count += 1
      try {
        sessionStorage.setItem("attendant-count", String(count))
      } catch {}
      mode = "materialize"
      frameIdx = DECAY_CYCLE.length - 1
      pre.style.visibility = "visible"
      place()
      if (!tickTimer) tickTimer = setInterval(tick, FRAME_MS)
    }

    const startWalk = () => {
      mode = "walk"
      stepsLeft = 15 + Math.floor(Math.random() * 26)
      frameIdx = 0
    }

    const dissolve = () => {
      mode = "dissolve"
      frameIdx = 0
    }

    const tick = () => {
      if (disposed || mode === "hidden") return
      if (!wire || !document.contains(wire)) return hide()

      // cursor proximity overrides everything (it never runs away — it stops being)
      const y = wireY()
      const cx = x + 2.5 * CH_PX
      const cy = y - LINE_PX * 2
      const dist = Math.hypot(cursor.x - cx, cursor.y - cy)
      if (mode !== "dissolve" && mode !== "materialize") {
        if (dist < NEAR_PX) {
          if (mode !== "stare") {
            mode = "stare"
            nearSince = performance.now()
            pre.textContent = applyStare()
          } else if (performance.now() - nearSince > 1500) {
            dissolve()
          }
          place()
          return
        } else if (mode === "stare") {
          mode = "stand"
          modeUntil = performance.now() + 600
          setFrame(ATTENDANT.stand)
        }
      }

      switch (mode) {
        case "materialize": {
          setFrame(DECAY_CYCLE[frameIdx])
          frameIdx -= 1
          if (frameIdx < 0) startWalk()
          break
        }
        case "walk": {
          setFrame(WALK_CYCLE[frameIdx % WALK_CYCLE.length])
          frameIdx += 1
          x += dir * CH_PX
          stepsLeft -= 1
          const r = (wire as HTMLElement).getBoundingClientRect()
          if (x < r.left - 6 * CH_PX || x > r.right + 2 * CH_PX) {
            dissolve()
            break
          }
          if (stepsLeft <= 0) {
            const p = Math.random()
            const isFooter = (wire as HTMLElement).id === "eof-wire"
            if (p < 0.5) {
              mode = "look"
              modeUntil = performance.now() + 2000 + Math.random() * 2000
              setFrame(ATTENDANT.look)
            } else if (p < 0.7) {
              mode = "stand"
              modeUntil = performance.now() + 1500 + Math.random() * 2000
              setFrame(ATTENDANT.stand)
            } else if (p < 0.8 && isFooter) {
              mode = "sit"
              modeUntil = performance.now() + 20000 + Math.random() * 20000
              setFrame(ATTENDANT.sit)
            } else {
              dissolve()
            }
          }
          break
        }
        case "look":
        case "stand":
        case "sit": {
          if (performance.now() > modeUntil) {
            if (mode === "sit") dissolve()
            else if (Math.random() < 0.7) startWalk()
            else dissolve()
          }
          break
        }
        case "dissolve": {
          setFrame(DECAY_CYCLE[frameIdx])
          frameIdx += 1
          if (frameIdx >= DECAY_CYCLE.length) return hide()
          break
        }
      }
      place()
    }

    // stare frame is 5 rows (head detached) — shift up one line to keep feet on the wire
    const applyStare = () => {
      const y = wireY()
      pre.style.transform = `translate(${Math.round(x)}px, ${Math.round(
        y - 5 * LINE_PX + 2
      )}px)`
      return ATTENDANT.stare
    }

    const scheduleSpawn = () => {
      if (disposed || count >= limit) return
      const base = night ? 22500 : 45000
      const span = night ? 37500 : 75000
      spawnTimer = setTimeout(() => {
        if (disposed || mode !== "hidden" || count >= limit) return
        const w = pickWire()
        if (w) beginOn(w, { fromEdge: Math.random() < 0.15 })
        else scheduleSpawn()
      }, base + Math.random() * span)
    }

    const onMove = (e: PointerEvent) => {
      cursor.x = e.clientX
      cursor.y = e.clientY
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    // tap dismisses it on touch devices
    const onDown = (e: PointerEvent) => {
      if (mode === "hidden" || mode === "dissolve") return
      const y = wireY()
      if (Math.hypot(e.clientX - x, e.clientY - (y - LINE_PX * 2)) < 80) {
        dissolve()
      }
    }
    if (coarse) window.addEventListener("pointerdown", onDown)

    // guaranteed single pass along the footer wire
    const eofWire = document.getElementById("eof-wire")
    let io: IntersectionObserver | null = null
    if (eofWire && !footerDone) {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting) && mode === "hidden") {
            footerDone = true
            try {
              sessionStorage.setItem("attendant-footer", "1")
            } catch {}
            beginOn(eofWire)
            io?.disconnect()
          }
        },
        { threshold: 0.5 }
      )
      io.observe(eofWire)
    }

    // idle far-observer (fired by FieldEngine after 90s of stillness)
    let farVisible = false
    const showFar = () => {
      if (farVisible || coarse) return
      farVisible = true
      far.textContent = ATTENDANT.stand
      far.style.visibility = "visible"
    }
    const hideFar = () => {
      if (!farVisible) return
      far.textContent = ATTENDANT.stare
      setTimeout(() => {
        far.style.visibility = "hidden"
        farVisible = false
      }, 800)
    }
    const onFar = () => showFar()
    const onActivity = () => hideFar()
    window.addEventListener("field:far-observer", onFar)
    window.addEventListener("pointermove", onActivity, { passive: true })
    window.addEventListener("keydown", onActivity)
    window.addEventListener("scroll", onActivity, { passive: true })

    scheduleSpawn()

    return () => {
      disposed = true
      if (tickTimer) clearInterval(tickTimer)
      if (spawnTimer) clearTimeout(spawnTimer)
      io?.disconnect()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("field:far-observer", onFar)
      window.removeEventListener("pointermove", onActivity)
      window.removeEventListener("keydown", onActivity)
      window.removeEventListener("scroll", onActivity)
      if (coarse) window.removeEventListener("pointerdown", onDown)
    }
  }, [])

  return (
    <>
      <pre
        ref={preRef}
        className="f-attendant"
        style={{ visibility: "hidden" }}
        aria-hidden="true"
      />
      <pre
        ref={farRef}
        className="f-attendant f-far"
        style={{
          visibility: "hidden",
          position: "fixed",
          right: "14%",
          top: "32%",
          left: "auto",
        }}
        aria-hidden="true"
      />
    </>
  )
}
