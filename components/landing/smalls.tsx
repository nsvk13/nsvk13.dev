"use client"

// Small self-contained field creatures: the cursor's ember satellite,
// the raw coordinates readout, the checkbox that unchecks itself,
// and the visitor counter.

import { useEffect, useRef, useState } from "react"

// ---------------------------------------------------------------
// Ember dot trailing the cursor. Appears after 10s on the page.
// Becomes a × glyph for a moment when the cursor rests on a link.
export function CursorEmber() {
  const dotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    const dot = dotRef.current
    if (!dot) return

    let raf = 0
    let visible = false
    const pos = { x: -100, y: -100 }
    const target = { x: -100, y: -100 }
    let overLink = false

    const show = setTimeout(() => {
      visible = true
      dot.style.opacity = "1"
    }, 10000)

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX + 14
      target.y = e.clientY + 18
    }
    const onOver = (e: PointerEvent) => {
      overLink = !!(e.target as Element | null)?.closest?.("a, button, summary")
      dot.textContent = overLink ? "×" : ""
      dot.style.background = overLink ? "transparent" : "var(--ember)"
    }
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.12
      pos.y += (target.y - pos.y) * 0.12
      if (visible) {
        dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      }
      raf = requestAnimationFrame(loop)
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    window.addEventListener("pointerover", onOver, { passive: true })
    raf = requestAnimationFrame(loop)
    return () => {
      clearTimeout(show)
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerover", onOver)
    }
  }, [])

  return (
    <div
      ref={dotRef}
      className="f-cursor-dot"
      style={{ opacity: 0, fontSize: 10, color: "var(--ember)", lineHeight: 1 }}
      aria-hidden="true"
    />
  )
}

// ---------------------------------------------------------------
// Raw pointer coordinates, footer corner.
export function Coords() {
  const ref = useRef<HTMLSpanElement>(null)
  const [touch, setTouch] = useState(false)

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) {
      setTouch(true)
      return
    }
    const el = ref.current
    if (!el) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      const x = e.clientX
      const y = e.clientY
      raf = requestAnimationFrame(() => {
        el.textContent = `x:${String(x).padStart(4, "0")} y:${String(y).padStart(4, "0")}`
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  if (touch)
    return (
      <span className="f-meta" style={{ textTransform: "none" }}>
        touch device: coordinates unknown
      </span>
    )
  return (
    <span ref={ref} className="f-meta f-num" style={{ textTransform: "none" }} data-live="">
      x:0000 y:0000
    </span>
  )
}

// ---------------------------------------------------------------
// The checkbox that quietly unchecks itself. Checking it three
// times in a row convinces it to stay.
export function KeepLight() {
  const [checked, setChecked] = useState(false)
  const [label, setLabel] = useState("keep the light on")
  const [fading, setFading] = useState(false)
  const attempts = useRef(0)
  const kept = useRef(false)

  useEffect(() => {
    try {
      if (localStorage.getItem("field-light-kept") === "1") {
        kept.current = true
        setChecked(true)
        setLabel("you kept it on. thank you.")
      }
    } catch {}
  }, [])

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const on = e.target.checked
    setChecked(on)
    if (!on) {
      if (!kept.current) attempts.current = 0
      return
    }
    if (kept.current) return
    attempts.current += 1
    if (attempts.current >= 3) {
      kept.current = true
      setLabel("ok. it stays.")
      try {
        localStorage.setItem("field-light-kept", "1")
      } catch {}
      return
    }
    setTimeout(() => {
      if (kept.current) return
      setFading(true)
      setTimeout(() => {
        setChecked(false)
        setFading(false)
      }, 600)
    }, 2500)
  }

  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none" data-stable="">
      <input
        type="checkbox"
        className={`f-check ${fading ? "f-check-fading" : ""}`}
        checked={checked}
        onChange={onChange}
      />
      <span className="f-meta f-meta-ash" style={{ textTransform: "none" }}>
        {label}
      </span>
    </label>
  )
}

// ---------------------------------------------------------------
// Visitor counter. Real number from KV when deployed with the
// binding; honest "unknown" otherwise. № ending in 000 is kiri-ban.
export function Counter() {
  const [count, setCount] = useState<number | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    fetch("/api/visitors", { method: "POST" })
      .then((r) => (r.ok ? r.json() : { count: null }))
      .then((d: { count: number | null }) => {
        if (!cancelled) setCount(d.count)
      })
      .catch(() => {
        if (!cancelled) setCount(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const kiriban = typeof count === "number" && count > 0 && count % 1000 === 0

  return (
    <div className="f-dot text-[10px] leading-relaxed" style={{ color: "var(--ghostmeta)" }} data-live="">
      <div>
        you are visitor{" "}
        <span className={kiriban ? "f-ember" : undefined}>
          № {count === undefined ? "······" : count === null ? "unknown" : String(count).padStart(6, "0")}
        </span>
      </div>
      {kiriban ? (
        <div className="f-ember">you are the kiri-ban. tell me: contact@nsvk13.dev</div>
      ) : (
        <div>if you hit 10000 — tell me.</div>
      )}
    </div>
  )
}
