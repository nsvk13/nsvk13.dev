"use client"

import { useEffect, useRef } from "react"
import { WALK, STAND, LOOK, SIT, STARE, DECAY, mirror } from "./walker"

const FRAME_MS = 130
const STEP_PX = 9
const NEAR = 110

// Continuous walkers along the bottom of the viewport. At least one is
// always present; the Tools menu can add more. They turn at the edges,
// pause, look toward the cursor, stare when it comes close (head
// detaches), and dissolve/rematerialize when clicked.
export default function Walker() {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const cursor = { x: -9999, y: -9999 }
    const walkers: Array<() => void> = []

    const spawn = (startX?: number) => {
      const pre = document.createElement("pre")
      pre.className = "walker"
      pre.setAttribute("aria-hidden", "true")
      host.appendChild(pre)

      if (rm) {
        pre.textContent = SIT
        pre.style.transform = `translate(${startX ?? window.innerWidth * 0.62}px, 0)`
        return () => pre.remove()
      }

      let x = startX ?? Math.random() * (window.innerWidth - 100)
      let dir: 1 | -1 = Math.random() < 0.5 ? -1 : 1
      let mode: "walk" | "stand" | "look" | "sit" | "stare" | "decay" | "grow" = "walk"
      let f = 0
      let until = performance.now() + 3000 + Math.random() * 6000
      let nearSince = 0
      let disposed = false

      const set = (frame: string, tall = false) => {
        pre.textContent = dir < 0 ? mirror(frame) : frame
        pre.style.transform = `translate(${Math.round(x)}px, ${tall ? "-1.25em" : "0"})`
      }

      const tick = () => {
        if (disposed) return
        if (document.hidden) return
        const now = performance.now()
        const cx = x + 30
        const cy = window.innerHeight - 50
        const d = Math.hypot(cursor.x - cx, cursor.y - cy)

        if (mode !== "decay" && mode !== "grow") {
          if (d < NEAR) {
            if (mode !== "stare") {
              mode = "stare"
              nearSince = now
            } else if (now - nearSince > 2200) {
              mode = "decay"
              f = 0
            }
            if (mode === "stare") {
              dir = cursor.x < cx ? -1 : 1
              set(STARE, true)
              return
            }
          } else if (mode === "stare") {
            mode = "stand"
            until = now + 700
          }
        }

        switch (mode) {
          case "walk": {
            set(WALK[f % WALK.length])
            f++
            x += dir * STEP_PX
            if (x < -20) {
              dir = 1
              x = -20
            } else if (x > window.innerWidth - 40) {
              dir = -1
              x = window.innerWidth - 40
            }
            if (now > until) {
              const r = Math.random()
              if (r < 0.45) {
                mode = "look"
                dir = cursor.x < cx ? -1 : 1
                until = now + 1200 + Math.random() * 2500
              } else if (r < 0.8) {
                mode = "stand"
                until = now + 900 + Math.random() * 2500
              } else {
                mode = "sit"
                until = now + 5000 + Math.random() * 9000
              }
            }
            break
          }
          case "look":
            set(LOOK)
            if (now > until) {
              mode = "walk"
              until = now + 3000 + Math.random() * 7000
            }
            break
          case "stand":
            set(STAND)
            if (now > until) {
              mode = "walk"
              if (Math.random() < 0.4) dir = dir === 1 ? -1 : 1
              until = now + 3000 + Math.random() * 7000
            }
            break
          case "sit":
            set(SIT)
            if (now > until) {
              mode = "walk"
              until = now + 3000 + Math.random() * 7000
            }
            break
          case "decay":
            set(DECAY[Math.min(f, DECAY.length - 1)])
            f++
            if (f > DECAY.length + 3) {
              // rematerialize far from the cursor
              x = cursor.x > window.innerWidth / 2 ? 20 + Math.random() * 120 : window.innerWidth - 160 + Math.random() * 100
              dir = x < window.innerWidth / 2 ? 1 : -1
              mode = "grow"
              f = DECAY.length - 1
            }
            break
          case "grow":
            set(DECAY[Math.max(f, 0)])
            f--
            if (f < 0) {
              mode = "walk"
              f = 0
              until = now + 3000 + Math.random() * 6000
            }
            break
        }
      }

      const iv = setInterval(tick, FRAME_MS)
      set(STAND)

      const onClick = (e: MouseEvent) => {
        if (mode === "decay" || mode === "grow") return
        const r = pre.getBoundingClientRect()
        if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) {
          mode = "decay"
          f = 0
        }
      }
      window.addEventListener("click", onClick)

      return () => {
        disposed = true
        clearInterval(iv)
        window.removeEventListener("click", onClick)
        pre.remove()
      }
    }

    const onMove = (e: PointerEvent) => {
      cursor.x = e.clientX
      cursor.y = e.clientY
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    walkers.push(spawn())
    const onMore = () => {
      if (walkers.length < 5) walkers.push(spawn(Math.random() < 0.5 ? -10 : window.innerWidth - 60))
    }
    window.addEventListener("desk:walk", onMore)

    return () => {
      walkers.forEach((dispose) => dispose())
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("desk:walk", onMore)
    }
  }, [])

  return <div ref={hostRef} className="walker-host" aria-hidden="true" />
}
