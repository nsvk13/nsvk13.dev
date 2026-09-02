"use client"

import { useEffect, useRef, useState } from "react"

// A live datamosh viewer: the image is cut into horizontal slices
// that keep tearing, blanking, inverting and briefly swapping to the
// other pre-baked states. Nothing here is a video — only pre-baked
// PNGs and transforms.
export default function Slices({
  srcs,
  width,
  height,
  slices = 28,
  alt,
  intensity = 1,
}: {
  srcs: string[]
  width: number
  height: number
  slices?: number
  alt: string
  intensity?: number
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState(0)
  const stateRef = useRef(0)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>(".slice"))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    let visible = true
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
    })
    io.observe(root)

    let n = 0
    let flashUntil = 0
    const iv = setInterval(() => {
      if (!visible || document.hidden) return
      n++
      const now = performance.now()
      // settle everything a little each tick
      els.forEach((s) => {
        if (s.dataset.hold) return
        s.style.transform = ""
        s.style.opacity = ""
        s.style.filter = ""
      })
      const bursts = Math.random() < 0.55 * intensity ? 1 + Math.floor(Math.random() * 3) : 0
      for (let i = 0; i < bursts; i++) {
        const s = els[Math.floor(Math.random() * els.length)]
        const kind = Math.random()
        if (kind < 0.6) s.style.transform = `translateX(${(Math.random() * 2 - 1) * 70 * intensity}px)`
        else if (kind < 0.8) s.style.opacity = "0"
        else s.style.filter = "invert(1)"
      }
      // now and then a whole band region shears together
      if (n % 37 === 0) {
        const start = Math.floor(Math.random() * (els.length - 6))
        const shift = (Math.random() * 2 - 1) * 90 * intensity
        for (let i = start; i < start + 6; i++) els[i].style.transform = `translateX(${shift}px)`
      }
      // brief flash to another state
      if (srcs.length > 1 && now > flashUntil && Math.random() < 0.035) {
        const next = (stateRef.current + 1 + Math.floor(Math.random() * (srcs.length - 1))) % srcs.length
        const back = stateRef.current
        setState(next)
        flashUntil = now + 20000
        setTimeout(() => setState(back), 260 + Math.random() * 500)
      }
    }, 150)

    const onMove = (e: PointerEvent) => {
      const r = root.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return
      const idx = Math.floor(((e.clientY - r.top) / r.height) * els.length)
      const s = els[idx]
      if (!s) return
      s.dataset.hold = "1"
      s.style.transform = `translateX(${(Math.random() * 2 - 1) * 40}px)`
      setTimeout(() => {
        delete s.dataset.hold
      }, 120)
    }
    window.addEventListener("pointermove", onMove, { passive: true })

    const onRetouch = () => {
      stateRef.current = (stateRef.current + 1) % srcs.length
      setState(stateRef.current)
    }
    window.addEventListener("desk:retouch", onRetouch)

    return () => {
      clearInterval(iv)
      io.disconnect()
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("desk:retouch", onRetouch)
    }
  }, [srcs, intensity])

  const sliceH = 100 / slices
  const src = srcs[state] ?? srcs[0]
  return (
    <div ref={rootRef} className="slices" style={{ aspectRatio: `${width} / ${height}` }} role="img" aria-label={alt}>
      {Array.from({ length: slices }, (_, i) => (
        <div
          key={i}
          className="slice"
          style={{
            top: `${i * sliceH}%`,
            height: `${sliceH + 0.3}%`,
            backgroundImage: `url(${src})`,
            backgroundSize: `100% ${slices * 100}%`,
            backgroundPosition: `0 ${(i / (slices - 1)) * 100}%`,
          }}
        />
      ))}
    </div>
  )
}
