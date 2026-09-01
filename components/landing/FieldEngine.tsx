"use client"

import { useEffect } from "react"
import { animate, stagger, utils } from "animejs"
import { SCRAMBLE_GLYPHS, SHADES, mulberry32, EYE_OPEN } from "./art"

// FieldEngine drives every decorative behavior of the field that
// belongs to the page rather than to a single creature: one-shot
// reveals, hover states, the rare-event scheduler, idle tiers,
// tab visibility, night mode. It owns no visible DOM of its own.
//
// Under prefers-reduced-motion none of this runs — the page is
// served complete and legible without a single moving part.

const rand = mulberry32(0x13)

function pick<T>(arr: T[]): T | undefined {
  return arr[Math.floor(rand() * arr.length)]
}

function scrambleSettle(el: HTMLElement, duration = 600) {
  const final = el.dataset.finalText ?? el.textContent ?? ""
  el.dataset.finalText = final
  const chars = final.split("")
  const settleAt = chars.map(() => rand() * duration * 0.8)
  const start = performance.now()
  const tick = () => {
    const t = performance.now() - start
    el.textContent = chars
      .map((c, i) =>
        c === " " || t >= settleAt[i]
          ? c
          : SCRAMBLE_GLYPHS[Math.floor(rand() * SCRAMBLE_GLYPHS.length)]
      )
      .join("")
    if (t < duration) requestAnimationFrame(tick)
    else el.textContent = final
  }
  requestAnimationFrame(tick)
}

export default function FieldEngine() {
  useEffect(() => {
    // the floor is open
    // eslint-disable-next-line no-console
    console.log("%c" + EYE_OPEN.join("\n"), "color:#8C8880;font-family:monospace")
    // eslint-disable-next-line no-console
    console.log("you opened the floor. the observer does not mind.")

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // serve everything instantly, nothing moves
      document
        .querySelectorAll<HTMLElement>("[data-reveal], [data-quote-line], [data-row]")
        .forEach((el) => (el.style.opacity = "1"))
      return
    }

    const coarse = window.matchMedia("(pointer: coarse)").matches
    const cleanups: Array<() => void> = []
    const cursor = { x: -9999, y: -9999 }
    const onCursor = (e: PointerEvent) => {
      cursor.x = e.clientX
      cursor.y = e.clientY
    }
    window.addEventListener("pointermove", onCursor, { passive: true })
    cleanups.push(() => window.removeEventListener("pointermove", onCursor))

    // ---- name scramble on load ----
    const heroName = document.getElementById("hero-name")
    if (heroName) scrambleSettle(heroName, 900)

    // ---- one-shot reveals on scroll entry ----
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const el = entry.target as HTMLElement
          io.unobserve(el)
          if (el.dataset.reveal === "scramble") {
            el.style.opacity = "1"
            scrambleSettle(el, 700)
          } else if (el.dataset.reveal === "rows") {
            const rows = el.querySelectorAll<HTMLElement>("[data-row]")
            animate(rows, {
              opacity: [0, 1],
              duration: 320,
              ease: "steps(4)",
              delay: stagger(85),
            })
          } else if (el.dataset.reveal === "quote") {
            const lines = el.querySelectorAll<HTMLElement>("[data-quote-line]")
            animate(lines, {
              opacity: [0, 1],
              duration: 400,
              ease: "outQuad",
              delay: stagger(140),
            })
          } else if (el.dataset.reveal === "drawline") {
            animate(el, { scaleX: [0, 1], duration: 300, ease: "linear" })
          } else if (el.dataset.reveal === "ruin") {
            // the ruin keeps crumbling as you look at it
            const pre = el.querySelector("pre")
            if (pre && pre.textContent) {
              const text = pre.textContent.split("")
              const idxs = text
                .map((c, i) => (c !== " " && c !== "\n" ? i : -1))
                .filter((i) => i >= 0)
              let n = 0
              const iv = setInterval(() => {
                const at = pick(idxs)
                if (at !== undefined) {
                  text[at] = " "
                  pre.textContent = text.join("")
                }
                if (++n >= 30) clearInterval(iv)
              }, 26)
              cleanups.push(() => clearInterval(iv))
            }
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    )
    document
      .querySelectorAll("[data-reveal]")
      .forEach((el) => io.observe(el))
    cleanups.push(() => io.disconnect())

    // ---- hover: nav items decay and settle ----
    document.querySelectorAll<HTMLElement>("[data-scramble-hover]").forEach((el) => {
      const enter = () => scrambleSettle(el, 250)
      el.addEventListener("mouseenter", enter)
      cleanups.push(() => el.removeEventListener("mouseenter", enter))
    })

    // ---- hover: broken etikett segment briefly repairs itself ----
    document.querySelectorAll<HTMLElement>(".f-etikett").forEach((label) => {
      const broken = label.querySelector<HTMLElement>(".f-broken")
      if (!broken) return
      const orig = broken.textContent ?? "░░"
      const enter = () => {
        setTimeout(() => (broken.textContent = "──"), 200)
      }
      const leave = () => {
        broken.textContent = orig
      }
      label.addEventListener("mouseenter", enter)
      label.addEventListener("mouseleave", leave)
      cleanups.push(() => {
        label.removeEventListener("mouseenter", enter)
        label.removeEventListener("mouseleave", leave)
      })
    })

    // ---- hover: work record titles shudder by the character ----
    document.querySelectorAll<HTMLElement>("[data-jitter]").forEach((el) => {
      let split = false
      const enter = () => {
        if (!split) {
          const text = el.textContent ?? ""
          el.textContent = ""
          text.split("").forEach((c) => {
            const s = document.createElement("span")
            s.className = "f-char"
            s.textContent = c === " " ? " " : c
            el.appendChild(s)
          })
          split = true
        }
        const chars = el.querySelectorAll(".f-char")
        animate(chars, {
          x: () => utils.random(-3, 3) + "px",
          duration: 200,
          ease: "steps(2)",
          delay: stagger(12, { from: "random" }),
          alternate: true,
          onComplete: () => utils.set(chars, { x: 0 }),
        })
      }
      el.addEventListener("mouseenter", enter)
      cleanups.push(() => el.removeEventListener("mouseenter", enter))
    })

    // ---- the hero caret crumbles now and then ----
    const caret = document.getElementById("hero-caret")
    if (caret) {
      const iv = setInterval(() => {
        caret.textContent = "░"
        setTimeout(() => (caret.textContent = "▾"), 400)
      }, 30000 + rand() * 15000)
      cleanups.push(() => clearInterval(iv))
    }

    // ---- rare events scheduler ----
    let frozen = false // idle tier 4 stops everything
    let lastEvent = 0
    let lightsBlinkDone = false
    try {
      lightsBlinkDone = sessionStorage.getItem("field-lights-blinked") === "1"
    } catch {}

    // one reusable sweep bar for the horizontal artifact
    const bar = document.createElement("div")
    bar.setAttribute("aria-hidden", "true")
    bar.style.cssText =
      "position:fixed;left:0;top:0;width:100vw;height:6px;background:#E6E1D6;mix-blend-mode:difference;pointer-events:none;z-index:80;display:none;"
    document.body.appendChild(bar)
    cleanups.push(() => bar.remove())

    const farFromCursor = (el: Element) => {
      const r = el.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height / 2
      return Math.hypot(cursor.x - cx, cursor.y - cy) > 200
    }
    const inViewport = (el: Element) => {
      const r = el.getBoundingClientRect()
      return r.bottom > 0 && r.top < window.innerHeight
    }

    const events: Array<{ p: number; run: () => void }> = [
      {
        // a word degrades character by character and recovers
        p: coarse ? 0.03 : 0.06,
        run: () => {
          const els = Array.from(
            document.querySelectorAll<HTMLElement>("[data-decayable]")
          ).filter((el) => inViewport(el) && farFromCursor(el))
          const el = pick(els)
          if (!el) return
          const orig = el.textContent ?? ""
          const words = orig.split(" ")
          const wi = Math.floor(rand() * words.length)
          const word = words[wi]
          if (!word) return
          const stages = [
            word.replace(/[aeoiu]/, "ä"),
            word
              .split("")
              .map((c, i) => (i % 2 ? "▓" : c))
              .join(""),
            word,
          ]
          stages.forEach((s, i) => {
            setTimeout(() => {
              const w = [...words]
              w[wi] = s
              el.textContent = w.join(" ")
            }, i * 500)
          })
        },
      },
      {
        // the nearest wire twitches
        p: 0.04,
        run: () => {
          const wires = Array.from(document.querySelectorAll<HTMLElement>("[data-wire]")).filter(inViewport)
          const el = pick(wires)
          if (!el) return
          animate(el, {
            y: [0, 2, 0],
            duration: 300,
            ease: "steps(2)",
            onComplete: () => utils.set(el, { y: 0 }),
          })
        },
      },
      {
        // one light goes out for three seconds
        p: 0.03,
        run: () => {
          const lights = Array.from(document.querySelectorAll<HTMLElement>(".f-light")).filter(inViewport)
          const el = pick(lights)
          if (!el) return
          el.style.opacity = "0"
          setTimeout(() => (el.style.opacity = ""), 3000)
        },
      },
      {
        // the portrait remembers it is text
        p: 0.02,
        run: () => window.dispatchEvent(new Event("field:portrait-flash")),
      },
      {
        // the current section title crumbles and reassembles
        p: 0.015,
        run: () => {
          const titles = Array.from(
            document.querySelectorAll<HTMLElement>("[data-scramble-rare]")
          ).filter((el) => inViewport(el) && farFromCursor(el))
          const el = pick(titles)
          if (el) scrambleSettle(el, 600)
        },
      },
      {
        // a horizontal artifact sweeps the screen
        p: 0.01,
        run: () => {
          bar.style.display = "block"
          bar.style.transform = `translate(${rand() * 8 - 4}px, 0px)`
          animate(bar, {
            y: [0, window.innerHeight],
            duration: 400,
            ease: "linear",
            onComplete: () => {
              bar.style.display = "none"
              utils.set(bar, { y: 0 })
            },
          })
        },
      },
      {
        // the field notices you. once.
        p: 0.002,
        run: () => {
          if (lightsBlinkDone) return
          lightsBlinkDone = true
          try {
            sessionStorage.setItem("field-lights-blinked", "1")
          } catch {}
          const lights = document.querySelectorAll<HTMLElement>(".f-light")
          lights.forEach((l) => (l.style.opacity = "0"))
          setTimeout(() => lights.forEach((l) => (l.style.opacity = "")), 150)
        },
      },
    ]

    const tickMs = coarse ? 16000 : 8000
    const scheduler = setInterval(() => {
      if (frozen || document.hidden) return
      if (performance.now() - lastEvent < 20000) return
      const roll = rand()
      let acc = 0
      for (const ev of events) {
        acc += ev.p
        if (roll < acc) {
          lastEvent = performance.now()
          ev.run()
          break
        }
      }
    }, tickMs)
    cleanups.push(() => clearInterval(scheduler))

    // ---- idle tiers ----
    let idleTimers: ReturnType<typeof setTimeout>[] = []
    const idleLine = document.querySelector<HTMLElement>("[data-idle-line]")
    const clearIdle = () => {
      idleTimers.forEach(clearTimeout)
      idleTimers = []
      if (idleLine) {
        idleLine.style.opacity = "0"
        idleLine.textContent = "you are still here."
      }
      document.documentElement.style.filter = ""
      document.documentElement.style.transition = ""
      frozen = false
    }
    const armIdle = () => {
      clearIdle()
      idleTimers.push(
        setTimeout(() => {
          if (idleLine) {
            idleLine.style.transition = "opacity 2s linear"
            idleLine.style.opacity = "1"
          }
        }, 30000)
      )
      if (!coarse) {
        idleTimers.push(
          setTimeout(() => window.dispatchEvent(new Event("field:far-observer")), 90000),
          setTimeout(() => {
            document.documentElement.style.transition = "filter 3s linear"
            document.documentElement.style.filter = "brightness(.96)"
          }, 180000),
          setTimeout(() => {
            frozen = true
            if (idleLine) idleLine.textContent = "it can wait."
          }, 240000)
        )
      }
    }
    const onActivity = () => armIdle()
    window.addEventListener("pointermove", onActivity, { passive: true })
    window.addEventListener("scroll", onActivity, { passive: true })
    window.addEventListener("keydown", onActivity)
    armIdle()
    cleanups.push(() => {
      window.removeEventListener("pointermove", onActivity)
      window.removeEventListener("scroll", onActivity)
      window.removeEventListener("keydown", onActivity)
      clearIdle()
    })

    // ---- tab visibility: the field forgets you slowly ----
    const origTitle = document.title
    let awayTimer: ReturnType<typeof setTimeout> | null = null
    const onVis = () => {
      if (document.hidden) {
        document.title = "…"
        awayTimer = setTimeout(() => {
          document.title = "the field is quiet."
        }, 30000)
      } else {
        if (awayTimer) clearTimeout(awayTimer)
        document.title = origTitle
      }
    }
    document.addEventListener("visibilitychange", onVis)
    cleanups.push(() => {
      document.removeEventListener("visibilitychange", onVis)
      if (awayTimer) clearTimeout(awayTimer)
      document.title = origTitle
    })

    // ---- night mode (00:00–06:00 local) ----
    if (new Date().getHours() < 6) {
      const cond = document.getElementById("field-condition")
      if (cond) cond.textContent = "FIELD CONDITION: UNSUPERVISED"
      const nightLine = document.querySelector<HTMLElement>("[data-night-line]")
      if (nightLine) nightLine.style.display = "block"
    }

    // ---- touch: a tap on the empty field lights a brief light ----
    if (coarse) {
      const onTap = (e: PointerEvent) => {
        const target = e.target as Element | null
        if (!target?.closest?.(".f-transit")) return
        const s = document.createElement("span")
        s.textContent = "·"
        s.setAttribute("aria-hidden", "true")
        s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;color:#8C8880;font-size:12px;pointer-events:none;z-index:80;transition:opacity 1s linear;`
        document.body.appendChild(s)
        requestAnimationFrame(() => (s.style.opacity = "0"))
        setTimeout(() => s.remove(), 1100)
      }
      window.addEventListener("pointerdown", onTap)
      cleanups.push(() => window.removeEventListener("pointerdown", onTap))
    }

    return () => cleanups.forEach((fn) => fn())
  }, [])

  return null
}
