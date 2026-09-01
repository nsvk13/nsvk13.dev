"use client"

import { useCallback, useEffect, useRef, useState } from "react"

const STATES = ["atkinson", "bayer", "ascii", "bands"] as const
type PortraitState = (typeof STATES)[number]

const SRC: Record<Exclude<PortraitState, "ascii">, string> = {
  atkinson: "/generated/avatar-atkinson.png",
  bayer: "/generated/avatar-bayer.png",
  bands: "/generated/avatar-bands.png",
}

const CAPTIONS: Record<PortraitState, string> = {
  atkinson: "fig. 1 — subject partially recovered. retouching failed, left as is.",
  bayer: "fig. 1 — subject, ordered read.",
  ascii: "fig. 1 — subject, character dump.",
  bands: "fig. 1 — subject, transmission damaged.",
}

// The only photographic object in the field: one portrait,
// pre-baked into four degraded states at build time. Interacting
// with it re-processes it; holding it down freezes it for the session.
export default function Portrait({
  asciiLines,
  hasImages,
}: {
  asciiLines: string[]
  hasImages: boolean
}) {
  const [idx, setIdx] = useState(0)
  const [frozen, setFrozen] = useState(false)
  const [flash, setFlash] = useState(false)
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("portrait-frozen")
      if (saved !== null) {
        setIdx(parseInt(saved, 10) || 0)
        setFrozen(true)
      }
    } catch {}
  }, [])

  const advance = useCallback(() => {
    if (frozen) return
    setIdx((v) => (v + 1) % STATES.length)
  }, [frozen])

  const startHold = () => {
    if (frozen) return
    holdTimer.current = setTimeout(() => {
      setFrozen(true)
      setIdx((v) => {
        try {
          sessionStorage.setItem("portrait-frozen", String(v))
        } catch {}
        return v
      })
    }, 1500)
  }
  const endHold = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current)
  }

  // rare event: the portrait becomes its character dump for a moment
  useEffect(() => {
    const onFlash = () => {
      if (frozen) return
      setFlash(true)
      setTimeout(() => setFlash(false), 700)
    }
    window.addEventListener("field:portrait-flash", onFlash)
    return () => window.removeEventListener("field:portrait-flash", onFlash)
  }, [frozen])

  const state: PortraitState = flash ? "ascii" : STATES[idx]
  const showAscii = state === "ascii" || !hasImages

  return (
    <figure className="m-0" data-stable="">
      <div
        className={showAscii ? "" : "f-scanlines"}
        onMouseEnter={advance}
        onClick={advance}
        onMouseDown={startHold}
        onMouseUp={endHold}
        onMouseLeave={endHold}
        onTouchStart={startHold}
        onTouchEnd={endHold}
      >
        {showAscii ? (
          <pre
            className="f-pre text-[5px] leading-[1.05] sm:text-[6px] md:text-[7px]"
            aria-hidden="true"
          >
            {asciiLines.join("\n")}
          </pre>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={SRC[state as Exclude<PortraitState, "ascii">]}
            alt="portrait of nsvk13 — a hooded figure, 1-bit dithered, dissolving into horizontal noise"
            width={480}
            height={480}
            className="f-pix block w-full max-w-[420px] select-none"
            draggable={false}
          />
        )}
      </div>
      <figcaption className="f-meta mt-4 max-w-[46ch] normal-case" style={{ textTransform: "none" }}>
        <span aria-hidden="true">└─ </span>
        {frozen ? CAPTIONS[state] + " (held.)" : CAPTIONS[state]}
        <span className="block mt-1 md:hidden">tap to re-process</span>
      </figcaption>
    </figure>
  )
}
