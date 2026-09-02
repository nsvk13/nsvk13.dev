"use client"

import { useEffect } from "react"
import { animate, createDraggable, utils, steps } from "animejs"

const GLYPHS = "░▒▓·:∴⁘"

function scramble(el: HTMLElement, duration = 500) {
  const final = el.dataset.finalText ?? el.textContent ?? ""
  el.dataset.finalText = final
  const chars = final.split("")
  const settle = chars.map(() => Math.random() * duration * 0.85)
  const t0 = performance.now()
  const tick = () => {
    const t = performance.now() - t0
    el.textContent = chars
      .map((c, i) => (c === " " || t >= settle[i] ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]))
      .join("")
    if (t < duration) requestAnimationFrame(tick)
    else el.textContent = final
  }
  requestAnimationFrame(tick)
}

// The desktop engine: draggable windows, z-order, open/close, menu
// actions, keyboard shortcuts and the glitch scheduler.
export default function Desktop() {
  useEffect(() => {
    const desk = document.querySelector<HTMLElement>(".desk")
    if (!desk) return
    const rm = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isDesk = () => window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches
    const wins = Array.from(desk.querySelectorAll<HTMLElement>(".w[data-win]"))
    const byId = (id: string) => wins.find((w) => w.dataset.win === id)
    const cleanups: Array<() => void> = []
    let top = 10

    // eslint-disable-next-line no-console
    console.log("%cunknown viewer · you opened the floor. the observer does not mind.", "color:#8C8880;font-family:monospace")

    const front = (w: HTMLElement) => {
      w.style.zIndex = String(++top)
    }

    const openAnim = (w: HTMLElement) => {
      w.classList.remove("is-closed")
      const title = w.querySelector<HTMLElement>(".w-name")
      if (rm) return
      animate(w, { opacity: [0, 1], scale: [0.96, 1], duration: 260, ease: steps(4) })
      if (title) scramble(title, 420)
    }

    const closeWin = (w: HTMLElement) => {
      if (rm) {
        w.classList.add("is-closed")
        return
      }
      animate(w, {
        opacity: [1, 0],
        scale: [1, 0.97],
        duration: 180,
        ease: steps(3),
        onComplete: () => {
          w.classList.add("is-closed")
          utils.set(w, { opacity: 1, scale: 1 })
        },
      })
    }

    // ---- per-window wiring ----
    wins.forEach((w, i) => {
      w.style.zIndex = String(10 + i)
      const down = () => front(w)
      w.addEventListener("pointerdown", down)
      cleanups.push(() => w.removeEventListener("pointerdown", down))

      const closeBtn = w.querySelector<HTMLElement>(".w-close")
      if (closeBtn) {
        const c = (e: Event) => {
          e.stopPropagation()
          closeWin(w)
        }
        closeBtn.addEventListener("click", c)
        cleanups.push(() => closeBtn.removeEventListener("click", c))
      }

      if (isDesk()) {
        const handle = w.querySelector<HTMLElement>(".w-title")
        if (handle && !w.dataset.static) {
          const d = createDraggable(w, {
            trigger: handle,
            container: desk,
            containerFriction: 0.6,
            releaseEase: steps(6),
          })
          cleanups.push(() => d.revert())
        }
      }
    })

    // reveal windows as they come into view (JS-only: no-JS gets everything)
    if (!rm) {
      const unopened = wins.filter((w) => !w.classList.contains("is-closed"))
      unopened.forEach((w) => (w.style.opacity = "0"))
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (!e.isIntersecting) return
            const w = e.target as HTMLElement
            io.unobserve(w)
            setTimeout(() => openAnim(w), Math.random() * 260)
          })
        },
        { threshold: 0.12 }
      )
      unopened.forEach((w) => io.observe(w))
      cleanups.push(() => io.disconnect())
    }

    // ---- menu actions ----
    const on = (name: string, fn: (e: Event) => void) => {
      window.addEventListener(name, fn)
      cleanups.push(() => window.removeEventListener(name, fn))
    }

    on("desk:open", (e) => {
      const id = (e as CustomEvent<string>).detail
      const w = byId(id)
      if (!w) return
      openAnim(w)
      front(w)
      w.scrollIntoView({ block: "center", behavior: rm ? "auto" : "smooth" })
    })

    on("desk:close-all", () => {
      wins.forEach((w) => closeWin(w))
      const t = document.title
      document.title = "no."
      setTimeout(() => {
        wins.filter((w) => w.dataset.win !== "about").forEach((w, i) => setTimeout(() => openAnim(w), i * 90))
        document.title = t
      }, 2600)
    })

    on("desk:tidy", () => {
      wins.forEach((w) => utils.set(w, { x: 0, y: 0 }))
    })

    on("desk:invert", () => document.documentElement.classList.toggle("inverted"))
    on("desk:scanlines", () => document.body.classList.toggle("no-scan"))
    on("desk:select-all", () => {
      const main = document.querySelector("main")
      if (main) window.getSelection()?.selectAllChildren(main)
    })

    // ---- keyboard ----
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return
      const map: Record<string, string> = { "1": "self", "2": "work", "3": "spec", "4": "log", "5": "signals" }
      if (map[e.key]) window.dispatchEvent(new CustomEvent("desk:open", { detail: map[e.key] }))
      const evts: Record<string, string> = {
        i: "desk:invert",
        s: "desk:scanlines",
        t: "desk:tidy",
        r: "desk:retouch",
        w: "desk:walk",
        b: "desk:blink",
        g: "desk:glitch",
      }
      if (evts[e.key.toLowerCase()]) window.dispatchEvent(new CustomEvent(evts[e.key.toLowerCase()]))
    }
    window.addEventListener("keydown", onKey)
    cleanups.push(() => window.removeEventListener("keydown", onKey))

    // ---- glitch scheduler: the viewer is old and it shows ----
    const inView = (el: Element) => {
      const r = el.getBoundingClientRect()
      return r.bottom > 0 && r.top < window.innerHeight && !el.classList.contains("is-closed")
    }
    const glitch = () => {
      const candidates = wins.filter(inView)
      const w = candidates[Math.floor(Math.random() * candidates.length)]
      if (!w) return
      const body = w.querySelector<HTMLElement>(".w-body")
      const name = w.querySelector<HTMLElement>(".w-name")
      const kind = Math.random()
      if (kind < 0.35 && body) {
        animate(body, { x: [0, 8, -6, 0], duration: 160, ease: steps(3), onComplete: () => utils.set(body, { x: 0 }) })
      } else if (kind < 0.55) {
        w.style.filter = "invert(1)"
        setTimeout(() => (w.style.filter = ""), 90)
      } else if (kind < 0.8 && name) {
        scramble(name, 450)
      } else {
        // horizontal tear across the whole viewer
        const bar = document.createElement("div")
        bar.className = "tear"
        bar.style.top = `${Math.random() * 100}vh`
        document.body.appendChild(bar)
        animate(bar, { x: [0, (Math.random() * 2 - 1) * 60], duration: 140, ease: steps(2), onComplete: () => bar.remove() })
      }
    }
    if (!rm) {
      let t: ReturnType<typeof setTimeout>
      const loop = () => {
        if (!document.hidden) glitch()
        t = setTimeout(loop, 5000 + Math.random() * 8000)
      }
      t = setTimeout(loop, 4000)
      cleanups.push(() => clearTimeout(t))
      on("desk:glitch", () => {
        glitch()
        setTimeout(glitch, 120)
        setTimeout(glitch, 260)
      })
    }

    // ---- tab visibility ----
    const origTitle = document.title
    const onVis = () => {
      document.title = document.hidden ? "… (unknown viewer)" : origTitle
    }
    document.addEventListener("visibilitychange", onVis)
    cleanups.push(() => document.removeEventListener("visibilitychange", onVis))

    return () => cleanups.forEach((f) => f())
  }, [])

  return null
}
