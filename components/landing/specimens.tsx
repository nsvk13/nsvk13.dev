"use client"

// Living pictograms for the WORK records: a slowly turning ASCII
// wireframe cube, a screen full of static with two watchers, and a
// small eye that blinks. Each one renders only while on screen and
// stops entirely under prefers-reduced-motion.

import { useEffect, useRef } from "react"

function useOnScreenLoop(ref: React.RefObject<HTMLElement | null>, fps: number, tick: (t: number) => void, staticFrame: () => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      staticFrame()
      return
    }
    let visible = false
    let n = 0
    const io = new IntersectionObserver((entries) => {
      visible = entries.some((e) => e.isIntersecting)
    })
    io.observe(el)
    staticFrame()
    const iv = setInterval(() => {
      if (!visible || document.hidden) return
      tick(n++)
    }, 1000 / fps)
    return () => {
      clearInterval(iv)
      io.disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

// ---------------------------------------------------------------
// wireframe cube, orthographic, drawn with slope-aware glyphs
const CUBE_W = 30
const CUBE_H = 13
const VERTS: Array<[number, number, number]> = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
]
const EDGES: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 0],
  [4, 5], [5, 6], [6, 7], [7, 4],
  [0, 4], [1, 5], [2, 6], [3, 7],
]

function cubeFrame(a: number, b: number): string {
  const grid: string[][] = Array.from({ length: CUBE_H }, () => Array(CUBE_W).fill(" "))
  const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b)
  const pts = VERTS.map(([x, y, z]) => {
    // rotate around Y then X
    const x1 = x * ca + z * sa
    const z1 = -x * sa + z * ca
    const y1 = y * cb - z1 * sb
    return [CUBE_W / 2 + x1 * 9, CUBE_H / 2 + y1 * 4.3]
  })
  const put = (x: number, y: number, ch: string) => {
    const xi = Math.round(x), yi = Math.round(y)
    if (xi >= 0 && xi < CUBE_W && yi >= 0 && yi < CUBE_H) grid[yi][xi] = ch
  }
  for (const [i, j] of EDGES) {
    const [x0, y0] = pts[i]
    const [x1, y1] = pts[j]
    const dx = x1 - x0, dy = y1 - y0
    const steps = Math.max(Math.abs(dx), Math.abs(dy) * 2, 1)
    const slope = Math.abs(dx) < 0.3 ? "|" : Math.abs(dy) < 0.25 ? "-" : (dx > 0) === (dy > 0) ? "\\" : "/"
    for (let s = 0; s <= steps; s++) {
      put(x0 + (dx * s) / steps, y0 + (dy * s) / steps, slope)
    }
  }
  pts.forEach(([x, y]) => put(x, y, "+"))
  return grid.map((r) => r.join("")).join("\n")
}

export function Cube() {
  const ref = useRef<HTMLPreElement>(null)
  useOnScreenLoop(
    ref,
    9,
    (n) => {
      if (ref.current) ref.current.textContent = cubeFrame(0.5 + n * 0.035, 0.42 + Math.sin(n * 0.02) * 0.25)
    },
    () => {
      if (ref.current) ref.current.textContent = cubeFrame(0.6, 0.45)
    }
  )
  return <pre ref={ref} className="f-pre text-[12px]" aria-hidden="true" />
}

// ---------------------------------------------------------------
// a screen of static, two watchers who sometimes blink
const SCREEN_W = 14
const SCREEN_H = 3
const NOISE = " ░░▒▒▓"

function staticFrame(n: number, rollAt: number): string {
  const lines: string[] = []
  lines.push(" ┌" + "─".repeat(SCREEN_W + 2) + "┐")
  for (let y = 0; y < SCREEN_H; y++) {
    let row = ""
    for (let x = 0; x < SCREEN_W; x++) {
      if (y === rollAt) row += "▓"
      else row += NOISE[Math.floor(Math.random() * NOISE.length)]
    }
    lines.push(" │ " + row + " │")
  }
  lines.push(" └" + "─".repeat(SCREEN_W + 2) + "┘")
  const blinkL = n % 47 === 0 || n % 47 === 1
  const blinkR = n % 61 === 0 || n % 61 === 1
  lines.push("    " + (blinkL ? "-_-" : "o_o") + "    " + (blinkR ? "-_-" : "o_o") + "   ")
  return lines.join("\n")
}

export function StaticScreen() {
  const ref = useRef<HTMLPreElement>(null)
  const roll = useRef(-1)
  useOnScreenLoop(
    ref,
    7,
    (n) => {
      if (n % 23 === 0) roll.current = 0
      else if (roll.current >= 0) roll.current = roll.current < SCREEN_H - 1 ? roll.current + 1 : -1
      if (ref.current) ref.current.textContent = staticFrame(n, roll.current)
    },
    () => {
      if (ref.current) ref.current.textContent = staticFrame(3, -1)
    }
  )
  return <pre ref={ref} className="f-pre text-[12px]" aria-hidden="true" />
}

// ---------------------------------------------------------------
// the small eye of rec.03 — it blinks, and it looks at the cursor a little
export function SmallEye() {
  const ref = useRef<HTMLPreElement>(null)
  const state = useRef({ shift: 3, blink: 0 })
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const dx = e.clientX - (r.left + r.width / 2)
      state.current.shift = dx < -160 ? 1 : dx > 160 ? 5 : 3
    }
    window.addEventListener("pointermove", onMove, { passive: true })
    return () => window.removeEventListener("pointermove", onMove)
  }, [])
  useOnScreenLoop(
    ref,
    6,
    (n) => {
      const el = ref.current
      if (!el) return
      if (n % 37 === 0) state.current.blink = 2
      const b = state.current.blink
      if (b > 0) state.current.blink--
      const s = state.current.shift
      const mid = b > 0 ? "( ───────  )" : "( " + " ".repeat(s - 1) + "(0)" + " ".repeat(7 - s) + " )"
      el.textContent = [" .--------. ", mid, " '--------' "].join("\n")
    },
    () => {
      if (ref.current) ref.current.textContent = [" .--------. ", "(   (0)    )", " '--------' "].join("\n")
    }
  )
  return <pre ref={ref} className="f-pre text-[12px]" aria-hidden="true" />
}
