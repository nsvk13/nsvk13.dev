import Link from "next/link"
import type { Metadata } from "next"
import { ATTENDANT, mulberry32 } from "@/components/landing/art"

export const dynamic = "force-static"

export const metadata: Metadata = {
  title: "the quiet part",
  description: "nothing is required of you here.",
  robots: { index: false },
}

const rng = mulberry32(0x0d)

const LIGHTS = Array.from({ length: 28 }, () => ({
  x: 3 + rng() * 94,
  y: 6 + rng() * 86,
  glyph: ["·", "˙", "∴", "·", "·", "⁘"][Math.floor(rng() * 6)],
  dim: rng() < 0.5,
  dur: 6 + rng() * 9,
  delay: -rng() * 12,
}))

// The quiet part of the field. Reached only through the one ember
// light on the index. Nothing happens here, on purpose.
export default function FieldPage() {
  return (
    <main className="f-root min-h-screen relative overflow-hidden">
      {LIGHTS.map((l, i) => (
        <span
          key={i}
          className="f-light"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            opacity: l.dim ? 0.5 : 1,
            ["--tw-dur" as string]: `${l.dur.toFixed(1)}s`,
            ["--tw-delay" as string]: `${l.delay.toFixed(1)}s`,
          }}
          aria-hidden="true"
        >
          {l.glyph}
        </span>
      ))}

      <div className="absolute left-[10%] right-[10%] top-[62%]">
        <pre
          className="f-pre text-[12px] absolute right-[22%] -top-[60px]"
          aria-hidden="true"
        >
          {ATTENDANT.sitHang}
        </pre>
        <hr className="f-wire" data-wire="" />
      </div>

      <div className="absolute left-[12%] top-[74%] max-w-[38ch]">
        <p className="f-meta" style={{ textTransform: "none" }}>
          you found the quiet part. nothing is required of you here.
        </p>
        <Link href="/" className="f-link text-[12px] mt-6 inline-block">
          ← back to the field
        </Link>
      </div>
    </main>
  )
}
