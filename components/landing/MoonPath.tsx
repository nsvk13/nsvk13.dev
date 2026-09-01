"use client"

import { useEffect, useRef } from "react"
import { animate, stagger, utils } from "animejs"

const SLICES = 16

// A build-time generated glitch field ("a moon path of broken
// pixels") shown as horizontal slices. On entering the viewport the
// slices cut in with a stagger; afterwards one slice tears every so
// often, and the slice under the cursor shifts.
export default function MoonPath({ src, width, height }: { src: string; width: number; height: number }) {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const slices = Array.from(root.querySelectorAll<HTMLElement>(".f-slice"))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      slices.forEach((s) => (s.style.opacity = "1"))
      return
    }
    let revealed = false
    let tearTimer: ReturnType<typeof setTimeout> | null = null
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || revealed) return
        revealed = true
        animate(slices, {
          opacity: [0, 1],
          x: [() => utils.random(-70, 70), 0],
          duration: 380,
          ease: "steps(3)",
          delay: stagger(40, { from: "random" }),
          onComplete: scheduleTear,
        })
        io.disconnect()
      },
      { threshold: 0.25 }
    )
    io.observe(root)

    function scheduleTear() {
      tearTimer = setTimeout(() => {
        const s = slices[Math.floor(Math.random() * slices.length)]
        animate(s, {
          x: [0, utils.random(-24, 24), 0],
          duration: 200,
          ease: "steps(2)",
          onComplete: () => utils.set(s, { x: 0 }),
        })
        scheduleTear()
      }, 7000 + Math.random() * 9000)
    }

    const onMove = (e: PointerEvent) => {
      if (!revealed) return
      const r = root.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
      const idx = Math.floor(((e.clientY - r.top) / r.height) * SLICES)
      const s = slices[idx]
      if (!s || s.dataset.busy) return
      s.dataset.busy = "1"
      animate(s, {
        x: [0, utils.random(-18, 18), 0],
        duration: 160,
        ease: "steps(2)",
        onComplete: () => {
          utils.set(s, { x: 0 })
          delete s.dataset.busy
        },
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    return () => {
      io.disconnect()
      if (tearTimer) clearTimeout(tearTimer)
      window.removeEventListener("pointermove", onMove)
    }
  }, [])

  const sliceH = 100 / SLICES
  return (
    <div
      ref={rootRef}
      className="f-moonpath"
      style={{ aspectRatio: `${width} / ${height}` }}
      role="img"
      aria-label="a light on water, broken into horizontal artifacts"
    >
      {Array.from({ length: SLICES }, (_, i) => (
        <div
          key={i}
          className="f-slice"
          style={{
            top: `${i * sliceH}%`,
            height: `${sliceH + 0.2}%`,
            backgroundImage: `url(${src})`,
            backgroundPosition: `0 ${(i / (SLICES - 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}
