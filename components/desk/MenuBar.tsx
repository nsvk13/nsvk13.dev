"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

type Item =
  | { sep: true }
  | { label: string; kbd?: string; note?: string; dim?: boolean; href?: string; open?: string; evt?: string }

const WINDOWS: Array<[string, string]> = [
  ["portrait", "portrait.bmp"],
  ["self", "self.txt"],
  ["observer", "observer.gif"],
  ["work", "work/"],
  ["spec", "spec.txt"],
  ["log", "log.txt"],
  ["signals", "signals.txt"],
  ["about", "about.txt"],
]

const MENUS: Array<{ label: string; items: Item[] }> = [
  {
    label: "File",
    items: [
      { label: "self.txt", kbd: "1", open: "self" },
      { label: "work/", kbd: "2", open: "work" },
      { label: "spec.txt", kbd: "3", open: "spec" },
      { label: "log.txt", kbd: "4", open: "log" },
      { label: "signals.txt", kbd: "5", open: "signals" },
      { sep: true },
      { label: "/blog", href: "/blog", note: "longer texts" },
      { label: "/field", href: "/field", note: "the quiet part" },
      { sep: true },
      { label: "Close all", note: "do not", evt: "desk:close-all" },
    ],
  },
  {
    label: "Edit",
    items: [
      { label: "Undo", kbd: "^Z", dim: true, note: "nothing to undo" },
      { label: "Select all", kbd: "^A", evt: "desk:select-all" },
      { sep: true },
      { label: "Retouch portrait", kbd: "R", evt: "desk:retouch" },
    ],
  },
  {
    label: "View",
    items: [
      { label: "Invert", kbd: "I", evt: "desk:invert" },
      { label: "Scanlines", kbd: "S", evt: "desk:scanlines" },
      { label: "Tidy windows", kbd: "T", evt: "desk:tidy" },
    ],
  },
  {
    label: "Buffers",
    items: WINDOWS.map(([id, name]) => ({ label: name, open: id })),
  },
  {
    label: "Tools",
    items: [
      { label: "Walk", kbd: "W", evt: "desk:walk", note: "one more" },
      { label: "Blink", kbd: "B", evt: "desk:blink" },
      { label: "Glitch now", kbd: "G", evt: "desk:glitch" },
    ],
  },
  {
    label: "Help",
    items: [
      { label: "About this artifact", open: "about" },
      { label: "Where am I", dim: true, note: "unknown" },
    ],
  },
]

export function fire(evt: string, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(evt, { detail }))
}

// Menu bar of the unknown viewer. Menus are the navigation; the right
// side carries a real clock, raw pointer coordinates and the revision.
export default function MenuBar({ rev }: { rev: string }) {
  const [open, setOpen] = useState<number | null>(null)
  const [clock, setClock] = useState("--:--:--")
  const coordsRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = () => {
      const d = new Date()
      setClock([d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":"))
    }
    t()
    const iv = setInterval(t, 1000)
    let raf = 0
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        if (coordsRef.current)
          coordsRef.current.textContent = `x:${String(Math.round(e.clientX)).padStart(4, "0")} y:${String(Math.round(e.clientY)).padStart(4, "0")}`
      })
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    const onDoc = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) setOpen(null)
    }
    document.addEventListener("pointerdown", onDoc)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null)
    }
    window.addEventListener("keydown", onKey)
    return () => {
      clearInterval(iv)
      cancelAnimationFrame(raf)
      window.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerdown", onDoc)
      window.removeEventListener("keydown", onKey)
    }
  }, [])

  const act = (it: Item) => {
    if ("sep" in it) return
    if (it.dim) return
    if (it.open) fire("desk:open", it.open)
    if (it.evt) fire(it.evt)
    setOpen(null)
  }

  return (
    <div ref={barRef} className="menubar" role="menubar" aria-label="viewer menu">
      <span className="m brand" aria-hidden="true">
        ■ nsvk13
      </span>
      {MENUS.map((menu, i) => (
        <div
          key={menu.label}
          className={`m ${open === i ? "open" : ""} ${i > 0 ? "m-desk" : ""}`}
          role="none"
          onPointerDown={(e) => {
            e.stopPropagation()
          }}
        >
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={open === i}
            className="m-btn"
            onClick={() => setOpen(open === i ? null : i)}
            onMouseEnter={() => {
              if (open !== null && open !== i) setOpen(i)
            }}
          >
            {menu.label}
          </button>
          {open === i && (
            <div className="dd" role="menu">
              {menu.items.map((it, j) =>
                "sep" in it ? (
                  <div key={j} className="sep" role="separator" />
                ) : it.href ? (
                  <Link key={j} href={it.href} className="it" role="menuitem" onClick={() => setOpen(null)}>
                    <span>{it.label}</span>
                    <span className="hint">{it.note ?? it.kbd ?? ""}</span>
                  </Link>
                ) : (
                  <button
                    key={j}
                    type="button"
                    className={`it ${it.dim ? "dim" : ""}`}
                    role="menuitem"
                    aria-disabled={it.dim || undefined}
                    onClick={() => act(it)}
                  >
                    <span>{it.label}</span>
                    <span className="hint">
                      {it.note ?? ""}
                      {it.note && it.kbd ? " · " : ""}
                      {it.kbd ? <kbd>{it.kbd}</kbd> : null}
                    </span>
                  </button>
                )
              )}
            </div>
          )}
        </div>
      ))}
      <span className="spacer" />
      <span ref={coordsRef} className="m-right m-desk f-num" aria-hidden="true">
        x:0000 y:0000
      </span>
      <span className="m-right f-num" aria-label="local time">
        {clock}
      </span>
      <span className="m-right m-desk">rev {rev}</span>
    </div>
  )
}
