import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import {
  getBuildMeta,
  getAsciiPortrait,
  getAsciiPortraitLarge,
  getContourSvg,
  hasPortraitImages,
  hasPublicFile,
} from "@/lib/field-data"
import { EYE_ASLEEP, RUIN, ATTENDANT, mulberry32 } from "@/components/landing/art"
import LivingEye from "@/components/landing/LivingEye"
import FieldEngine from "@/components/landing/FieldEngine"
import Attendant from "@/components/landing/Attendant"
import Portrait from "@/components/landing/Portrait"
import MoonPath from "@/components/landing/MoonPath"
import { Cube, StaticScreen, SmallEye } from "@/components/landing/specimens"
import { CursorEmber, Coords, KeepLight, Counter } from "@/components/landing/smalls"

export const dynamic = "force-static"

// ---------------------------------------------------------------
// seeded layout decisions — same field on every build of a commit
const rng = mulberry32(1303)

interface LightSpot {
  x: number
  y: number
  glyph: string
  dur: number
  delay: number
}

function seedLights(count: number, avoid?: { x1: number; x2: number; y1: number; y2: number }): LightSpot[] {
  const glyphs = ["·", "⁘", "∴", "˙", "·", "·"]
  const out: LightSpot[] = []
  let guard = 0
  while (out.length < count && guard++ < 200) {
    const x = 6 + rng() * 86
    const y = 10 + rng() * 78
    if (avoid && x > avoid.x1 && x < avoid.x2 && y > avoid.y1 && y < avoid.y2) continue
    out.push({
      x,
      y,
      glyph: glyphs[Math.floor(rng() * glyphs.length)],
      dur: 6 + rng() * 9,
      delay: -rng() * 12,
    })
  }
  return out
}

const HERO_LIGHTS = seedLights(7, { x1: 30, x2: 78, y1: 34, y2: 80 })

function lightStyle(l: LightSpot): CSSProperties {
  return {
    left: `${l.x}%`,
    top: `${l.y}%`,
    ["--tw-dur" as string]: `${l.dur.toFixed(1)}s`,
    ["--tw-delay" as string]: `${l.delay.toFixed(1)}s`,
  }
}

// ---------------------------------------------------------------
// a printed catalogue label with one segment that never healed
function Etikett({
  rows,
  width = 40,
  brokenAt = 9,
}: {
  rows: Array<{ k: string; v: ReactNode }>
  width?: number
  brokenAt?: number
}) {
  const top = "┌" + "─".repeat(width) + "┐"
  const bottom = "└" + "─".repeat(width) + "┘"
  return (
    <pre className="f-etikett mt-4">
      {top.slice(0, brokenAt)}
      <span className="f-broken">░░</span>
      {top.slice(brokenAt + 2)}
      {"\n"}
      {rows.map((row) => (
        <span key={row.k}>
          {"│ "}
          {row.k.padEnd(6)}
          {row.v}
          {"\n"}
        </span>
      ))}
      {bottom}
    </pre>
  )
}

function Wire({ id, className, label }: { id?: string; className?: string; label?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className ?? ""}`}>
      <hr id={id} data-wire="" data-reveal="drawline" className="f-wire flex-1" />
      {label ? <span className="f-meta shrink-0">{label}</span> : null}
    </div>
  )
}

function Stamp({ year }: { year: number }) {
  return (
    <div className="f-stamp" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <path id="stamp-ring" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
        </defs>
        <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="50" cy="50" r="29" fill="none" stroke="currentColor" strokeWidth="0.8" />
        <text fontSize="7.4" letterSpacing="1.4" fontFamily="var(--font-mono), monospace" fill="currentColor">
          <textPath href="#stamp-ring">VERIFIED IN PRODUCTION · FOUND INTACT · REV {year} ·</textPath>
        </text>
        <text
          x="50"
          y="53.5"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono), monospace"
          fill="currentColor"
        >
          N.S.
        </text>
      </svg>
    </div>
  )
}

const MARQUEE =
  "the field is quiet tonight · nothing here is broken. only tired · somewhere a server is humming for you · permanently under construction. like everyone · he walks here sometimes. do not touch him · end of file. the field continues ·"

const FIELD_MAP_COMMENT = `
<!--
     field schematic (not to scale)

     00 ─────────────·──── wire 01 ──────
        (eye)        [moon path]
     01 ── fig.1 ····· wire 02 ──────────
     02 ── rec.01 rec.02 rec.03 · ruin
     [ one intact sheet ]
     03 ── log ▁▂▃▅
     ──── contour ─ wire 03 ─ 04 (asleep)
     ══════ eof wire ═════════ he walks here
-->
`

export default function Home() {
  const meta = getBuildMeta()
  const asciiLines = getAsciiPortrait()
  const asciiLarge = getAsciiPortraitLarge()
  const hasImages = hasPortraitImages()
  const hasMoon = hasPublicFile("generated/moonpath.png")
  const contourSvg = getContourSvg()
  const activityMax = Math.max(1, ...meta.activity.map((a) => a.count))
  const activitySum = meta.activity.reduce((s, a) => s + a.count, 0)

  return (
    <main className="f-root min-h-screen pb-16 md:pb-0">
      <a href="#contents" className="f-skip">
        skip to contents
      </a>
      <FieldEngine />
      <Attendant />
      <CursorEmber />
      <div hidden dangerouslySetInnerHTML={{ __html: FIELD_MAP_COMMENT }} />

      {/* idle whisper — fades in when you stop moving */}
      <span
        data-idle-line=""
        aria-hidden="true"
        className="f-meta fixed left-[8%] bottom-[18%] z-30 pointer-events-none"
        style={{ opacity: 0, textTransform: "none" }}
      >
        you are still here.
      </span>

      {/* ============ 00 / FIELD ============ */}
      <section className="relative h-[100svh]" aria-label="index">
        <div className="absolute left-[4%] top-[8%] f-meta">
          <div>NSVK13.DEV / PERSONAL INDEX</div>
          <div className="f-num">
            DOC.NO 13-{meta.buildYear} · REV {meta.shortHash}
          </div>
          <div id="field-condition">FIELD CONDITION: QUIET</div>
        </div>

        <span className="f-vert absolute left-[2vw] top-[30%] hidden md:block">
          the observer is present
        </span>

        <div className="f-ghostnum right-[-5vw] top-[6%]" aria-hidden="true">
          00
        </div>

        {HERO_LIGHTS.map((l, i) =>
          i === 0 ? (
            <Link
              key={i}
              href="/field"
              className="f-light f-light-ember"
              style={lightStyle(l)}
              aria-label="a quiet part of the field"
            >
              ·
            </Link>
          ) : (
            <span key={i} className="f-light" style={lightStyle(l)} aria-hidden="true">
              {l.glyph}
            </span>
          )
        )}

        <div className="absolute left-[6%] md:left-[30%] top-[30%] md:top-[30%]">
          <LivingEye />
          <div className="mt-8 md:-ml-[4ch]">
            <h1 id="hero-name" className="text-[15px] font-mono tracking-wide">
              NIKITA SIMAKIN
            </h1>
            <p className="f-meta f-meta-ash mt-1" style={{ textTransform: "none" }}>
              @nsvk13 — devops engineer
            </p>
            <p className="f-meta f-num mt-1">
              LAT/LON WITHHELD · {meta.buildDate}
            </p>
          </div>
        </div>

        <nav
          className="absolute right-[4%] bottom-[8%] hidden md:flex flex-col items-end gap-1 text-[12px]"
          aria-label="sections"
        >
          <a href="#self" data-scramble-hover="" className="hover:bg-paper hover:text-field px-1">
            01 SELF
          </a>
          <a href="#work" data-scramble-hover="" className="hover:bg-paper hover:text-field px-1">
            02 WORK
          </a>
          <a href="#log" data-scramble-hover="" className="hover:bg-paper hover:text-field px-1">
            03 LOG
          </a>
          <a href="#signals" data-scramble-hover="" className="hover:bg-paper hover:text-field px-1">
            04 SIGNALS
          </a>
          <span aria-hidden="true">&nbsp;</span>
          <Link href="/blog" className="f-link">
            /blog
          </Link>
        </nav>

        <span id="hero-caret" className="absolute left-[22%] bottom-[6%] text-[12px] text-ash" aria-hidden="true">
          ▾
        </span>
      </section>

      {/* ============ TRANSIT A — the moon path ============ */}
      <section className="f-transit relative pt-[12vh]" aria-label="fig. 0">
        <div className="f-grid">
          <div className="col-span-4 md:col-span-10 md:col-start-2">
            {hasMoon ? (
              <MoonPath src="/generated/moonpath.png" width={1200} height={560} />
            ) : (
              <div className="h-[40vh]" />
            )}
            <p className="f-meta mt-3 flex justify-between" style={{ textTransform: "none" }}>
              <span data-decayable="">fig. 0 — a light on water. transmission damaged, left as is.</span>
              <span className="hidden md:inline" data-decayable="">
                the field is quiet tonight.
              </span>
            </p>
          </div>
        </div>
        <div className="mt-[18vh] px-[4%] pr-[18%]">
          <Wire label="wire 01" />
        </div>
      </section>

      {/* ============ 01 / SELF ============ */}
      <section id="self" className="relative pt-[14vh] pb-[16vh]" aria-label="about">
        <div id="contents" className="absolute -top-24" aria-hidden="true" />
        <div className="f-ghostnum left-[28%] top-[2%]" aria-hidden="true">
          01
        </div>

        <div className="f-grid relative z-[1]">
          <div className="col-span-4 md:col-span-4 md:col-start-2 relative">
            <Portrait asciiLines={asciiLines} hasImages={hasImages} />
            <span className="f-vert absolute -right-2 top-[10%] hidden lg:block">
              simakin, n. — 1/1
            </span>
          </div>

          <div className="col-span-4 md:col-span-6 md:col-start-6 relative md:mt-[22vh] md:-ml-16 z-10 mt-10">
            <h2
              className="f-display text-[clamp(2.6rem,9vw,7.5rem)]"
              data-reveal="scramble"
              data-scramble-rare=""
              data-scroll-spread=""
            >
              SELF
            </h2>
            <p className="f-body mt-8" data-decayable="">
              devops engineer, grown out of a semi-fullstack developer. builds
              and keeps alive the machinery underneath: kubernetes, docker,
              infrastructure as code, node.js, typescript, golang.
            </p>
            <p className="f-body mt-4" data-decayable="">
              in the hours the infrastructure does not need him — open source,
              crawlable strange things, technologies tried on for size. when
              there is no plan, there is enthusiasm.
            </p>
          </div>
        </div>

        <div className="f-grid mt-[18vh]">
          <blockquote className="f-quote col-span-4 md:col-span-7 md:col-start-4 m-0" data-reveal="quote">
            <div className="text-[12px] font-mono" data-quote-line="">
              i am the guy
            </div>
            <div className="f-display text-[clamp(2.2rem,6vw,5rem)] my-2" data-quote-line="">
              with BURNING{" "}
              <span>
                <span className="relative inline-block">
                  E
                  <span className="absolute -top-1.5 left-1/2 -ml-[1px] w-[3px] h-[3px] bg-ember" aria-hidden="true" />
                </span>
                Y
                <span className="relative inline-block">
                  E
                  <span className="absolute -top-1.5 left-1/2 -ml-[1px] w-[3px] h-[3px] bg-ember" aria-hidden="true" />
                </span>
                S
              </span>
            </div>
            <div className="text-[12px] font-mono text-ash" data-quote-line="">
              in the darkest of times.
            </div>
          </blockquote>
        </div>

        <span className="f-meta absolute right-[4%] top-[30%] hidden md:block" style={{ textTransform: "none" }}>
          origin: semi-fullstack
          <br />
          status: awake
        </span>
        <span className="f-dot absolute left-[10%] bottom-[6%] text-[10px] text-ghostmeta" aria-hidden="true">
          ( ´_ゝ`)
        </span>
      </section>

      {/* ============ TRANSIT B ============ */}
      <section className="f-transit relative h-[50vh]">
        <div className="absolute left-[12%] md:left-[66%] top-[18%]">
          <KeepLight />
          <p className="f-meta mt-[8vh]" style={{ textTransform: "none" }} data-decayable="">
            do not worry about the checkbox.
          </p>
        </div>
        <div className="absolute bottom-[10vh] left-0 right-0 f-marquee f-meta" style={{ textTransform: "none" }} aria-hidden="true">
          <span className="f-marquee-track">{MARQUEE}</span>
        </div>
        <div className="absolute bottom-0 left-[4%] right-[32%]">
          <Wire label="wire 02" />
        </div>
      </section>

      {/* ============ 02 / WORK ============ */}
      <section id="work" className="relative pt-[10vh]" aria-label="selected work">
        <div className="f-grid relative">
          <div className="col-span-4 md:col-span-6 md:col-start-2 relative">
            <div className="f-ghostnum -left-[6vw] -top-[4vh] text-[10rem]" aria-hidden="true">
              01
            </div>
            <p className="f-meta">rec.01 / shipped</p>
            <h3 className="f-rec-title mt-2" data-jitter="">
              VIEWLY TOGETHER
            </h3>
            <p className="f-meta f-meta-ash mt-2" style={{ textTransform: "none" }}>
              watch together / telegram mini app
            </p>
            <div className="mt-6">
              <StaticScreen />
            </div>
            <Etikett
              width={44}
              brokenAt={9}
              rows={[
                { k: "TYPE", v: "app" },
                { k: "STACK", v: "react / ts / elysia / gramio / docker" },
                {
                  k: "LINK",
                  v: (
                    <a href="https://t.me/viewlybot/app" target="_blank" rel="noopener noreferrer">
                      t.me/viewlybot/app
                    </a>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <div className="f-grid mt-[35vh]">
          <div className="col-span-4 md:col-span-6 md:col-start-7 relative md:-mr-12">
            <span className="f-vert absolute -left-8 top-0 hidden md:block">minecraft / cis</span>
            <p className="f-meta">rec.02 / running</p>
            <h3 className="f-rec-title mt-2" data-jitter="">
              HODWINI
            </h3>
            <p className="f-meta f-meta-ash mt-2" style={{ textTransform: "none" }}>
              minecraft project: banking system, launcher, its own world
            </p>
            <div className="mt-6">
              <Cube />
            </div>
            <Etikett
              width={38}
              brokenAt={21}
              rows={[
                { k: "TYPE", v: "world" },
                { k: "ROLE", v: "infra / systems" },
                {
                  k: "LINK",
                  v: (
                    <a href="https://hodwini.net" target="_blank" rel="noopener noreferrer">
                      hodwini.net
                    </a>
                  ),
                },
              ]}
            />
          </div>
        </div>

        <div className="f-grid mt-[35vh]">
          <div className="col-span-4 md:col-span-5 md:col-start-1 relative">
            <div className="f-ghostnum -left-[8vw] -top-[6vh] text-[10rem]" aria-hidden="true">
              03
            </div>
            <p className="f-meta">rec.03 / recursive</p>
            <h3 className="f-rec-title mt-2" data-jitter="">
              NSVK13.DEV
            </h3>
            <p className="f-meta f-meta-ash mt-2" style={{ textTransform: "none" }} data-decayable="">
              this site. it is watching you read about itself.
            </p>
            <div className="mt-6">
              <SmallEye />
            </div>
            <Etikett
              width={40}
              brokenAt={15}
              rows={[
                { k: "TYPE", v: "artifact" },
                { k: "STACK", v: "next.js / mdx / tailwind" },
                { k: "LINK", v: "you are here" },
              ]}
            />
          </div>
        </div>

        <div className="f-grid mt-[25vh] pb-[12vh]">
          <div className="col-span-4 md:col-span-6 md:col-start-3" data-reveal="ruin">
            <pre className="f-pre text-[12px]" aria-hidden="true">
              {RUIN.join("\n")}
            </pre>
            <p className="f-meta mt-3" style={{ textTransform: "none" }}>
              records 04–12 not recovered
            </p>
          </div>
        </div>
      </section>

      {/* ============ SPEC — the one intact sheet ============ */}
      <section className="f-invert relative py-[12vh] mt-[8vh]" data-stable="" aria-label="capabilities">
        <Stamp year={meta.buildYear} />
        <span className="f-vert absolute left-[2vw] top-[15%] hidden md:block" style={{ color: "#6b675e" }}>
          spec.sheet — rev {meta.buildYear}.09
        </span>
        <div className="f-grid">
          <div className="col-span-4 md:col-span-10 md:col-start-2">
            <p className="f-meta">found intact: one sheet · CAPABILITIES / VERIFIED IN PRODUCTION</p>
            <table className="mt-6" data-reveal="rows">
              <tbody>
                <tr data-row="">
                  <th scope="row">frontend</th>
                  <td>react · typescript · next.js · tailwind · vue~</td>
                </tr>
                <tr data-row="">
                  <th scope="row">backend</th>
                  <td>node · elysia · go · rest · grpc</td>
                </tr>
                <tr data-row="">
                  <th scope="row">ops</th>
                  <td>
                    docker · ansible · nginx/traefik · grafana+prometheus · k8s+helm · ci/cd · gcp~ ·
                    yandex.cloud · postgres · redis · mongo~
                  </td>
                </tr>
                <tr data-row="">
                  <th scope="row">tools</th>
                  <td>git · gitlab ci / gh actions · vite · bun · cloudflare</td>
                </tr>
              </tbody>
            </table>
            <p className="f-meta text-right mt-3" style={{ textTransform: "none" }}>
              ~ = fading memory
            </p>
          </div>
        </div>
      </section>

      {/* ============ 03 / LOG ============ */}
      <section id="log" className="relative pt-[15vh] pb-[10vh]" aria-label="update log">
        <div className="f-ghostnum right-[-4vw] top-[4%]" aria-hidden="true">
          03
        </div>
        <div className="f-grid">
          <div className="col-span-4 md:col-span-7 md:col-start-3">
            <h2
              className="f-display text-[clamp(2.2rem,5vw,4rem)]"
              data-reveal="scramble"
              data-scramble-rare=""
              data-scroll-spread=""
            >
              LOG
            </h2>
            <p className="f-meta mt-3">update history, auto-recovered from git</p>

            {meta.activity.length > 0 && (
              <div className="mt-8">
                <div className="f-activity" role="img" aria-label={`${activitySum} commits in the last twelve months`}>
                  {meta.activity.map((a, i) => (
                    <span
                      key={a.month}
                      className={i === meta.activity.length - 1 ? "now" : undefined}
                      style={{ height: `${Math.max(1, Math.round((a.count / activityMax) * 28))}px` }}
                      title={`${a.month} · ${a.count}`}
                    />
                  ))}
                </div>
                <p className="f-meta mt-2 f-num" style={{ textTransform: "none" }}>
                  {meta.activity[0].month} → {meta.activity[meta.activity.length - 1].month} · {activitySum} commits
                </p>
              </div>
            )}

            <p className="mt-8 mb-4">
              <span className="f-dot text-[12px]">更新履歴</span>{" "}
              <span className="f-meta f-meta-ash">/ update log</span>
            </p>
            <div data-reveal="rows">
              {meta.log.map((entry, i) => (
                <div
                  key={i}
                  className="f-logrow"
                  data-row=""
                  style={{ opacity: Math.max(0.35, 0.9 - i * 0.08) }}
                >
                  <span className="f-num shrink-0">
                    {entry.date} ({entry.dow})
                  </span>
                  <span className="f-leader" aria-hidden="true">
                    ·····································
                  </span>
                  <span>{entry.subject}</span>
                </div>
              ))}
              {meta.log.length === 0 && (
                <p className="f-meta" style={{ textTransform: "none" }}>
                  log not recovered.
                </p>
              )}
            </div>
            <div className="mt-10 flex flex-col gap-2 text-[14px]">
              <Link href="/blog" className="f-link w-fit">
                → /blog (longer texts live here)
              </Link>
            </div>
            <p className="f-dot text-[10px] mt-10" style={{ color: "var(--ghostmeta)" }}>
              此のサイトは常に工事中 <span className="f-meta">/ permanently under construction. like everyone.</span>
            </p>
          </div>
        </div>
        <span className="f-meta absolute right-[4%] bottom-[15%] hidden md:block f-num" style={{ textTransform: "none" }}>
          {meta.lastUpdatedDays === null
            ? "last update: unknown"
            : meta.lastUpdatedDays === 0
              ? "last updated today"
              : `last updated ${meta.lastUpdatedDays} day${meta.lastUpdatedDays === 1 ? "" : "s"} ago`}
        </span>
      </section>

      {/* ============ TRANSIT C — survey of the field ============ */}
      <section className="f-transit relative pt-[10vh]" aria-label="survey">
        {contourSvg ? (
          <div className="f-grid">
            <div className="col-span-4 md:col-span-12">
              <div className="f-contour" aria-hidden="true" dangerouslySetInnerHTML={{ __html: contourSvg }} />
              <p className="f-meta mt-2 flex justify-between" style={{ textTransform: "none" }}>
                <span>survey of the field — elevation unknown</span>
                <span data-decayable="">somewhere a server is humming for you.</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="h-[30vh]">
            <span className="f-meta absolute left-[22%] top-1/2" style={{ textTransform: "none" }} data-decayable="">
              somewhere a server is humming for you.
            </span>
          </div>
        )}
        <div className="mt-[10vh] pl-[28%] pr-[4%]">
          <Wire label="wire 03" />
        </div>
      </section>

      {/* ============ 04 / SIGNALS ============ */}
      <section id="signals" className="relative h-[100svh]" aria-label="contact">
        {asciiLarge && (
          <div className="f-silhouette absolute right-[-6%] md:right-[2%] bottom-[4%] md:top-[6%]" aria-hidden="true">
            <pre className="f-pre">{asciiLarge.join("\n")}</pre>
            <pre className="f-pre f-sil-lit">{asciiLarge.join("\n")}</pre>
          </div>
        )}

        <div className="absolute left-[8%] md:left-[18%] top-[14%]">
          <pre className="f-pre text-[10px] md:text-[12px]" aria-hidden="true">
            {EYE_ASLEEP.join("\n")}
          </pre>
          <p className="f-meta mt-4" style={{ textTransform: "none" }} data-decayable="">
            it is not watching. write anyway.
          </p>
        </div>

        <div className="absolute left-[10%] md:left-[14%] top-[52%]">
          <span className="f-light static mr-2" aria-hidden="true">
            ·
          </span>
          <a href="mailto:contact@nsvk13.dev" className="f-link text-[12px]" data-signal="">
            contact@nsvk13.dev
          </a>
        </div>
        <div className="absolute left-[55%] md:left-[44%] top-[44%]">
          <span className="f-light static mr-2" aria-hidden="true">
            ·
          </span>
          <a href="https://t.me/nsvkjournal" target="_blank" rel="noopener noreferrer" className="f-link text-[12px]" data-signal="">
            t.me/nsvkjournal
          </a>
        </div>
        <div className="absolute left-[20%] md:left-[30%] top-[66%]">
          <span className="f-light static mr-2" aria-hidden="true">
            ·
          </span>
          <a href="https://github.com/nsvk13" target="_blank" rel="noopener noreferrer" className="f-link text-[12px]" data-signal="">
            github.com/nsvk13
          </a>
        </div>
        <div className="absolute left-[48%] md:left-[52%] top-[60%]">
          <span className="f-light static mr-2" aria-hidden="true">
            ·
          </span>
          <a href="https://x.com/nsvkjournal" target="_blank" rel="noopener noreferrer" className="f-link text-[12px]" data-signal="">
            x.com/nsvkjournal
          </a>
        </div>

        <span className="f-vert absolute left-[2vw] bottom-[10%] hidden md:block">
          signals reach the field at night
        </span>
      </section>

      {/* ============ EOF ============ */}
      <footer className="relative pb-24 md:pb-16">
        <div className="px-[4%] relative">
          <span
            className="f-meta absolute right-[8%] -top-6"
            style={{ textTransform: "none" }}
            aria-hidden="true"
          >
            he walks here sometimes. do not touch him.
          </span>
          <pre className="f-rm-attendant" aria-hidden="true">
            {ATTENDANT.sit}
          </pre>
          <hr id="eof-wire" data-wire="" className="f-wire" />
        </div>

        <div className="f-grid mt-12 gap-y-10">
          <div className="col-span-4 md:col-span-4 md:col-start-1 f-meta" style={{ textTransform: "none" }}>
            <div>EOF · nsvk13.dev</div>
            <div className="f-num">
              built {meta.buildDate} · {meta.shortHash}
            </div>
            <div className="f-num">{meta.commitCount} commits on record</div>
            <div data-night-line="" style={{ display: "none" }}>
              someone walks here at night
            </div>
          </div>

          <div className="col-span-4 md:col-span-4 md:col-start-5">
            <Counter />
          </div>

          <div className="col-span-4 md:col-span-4 md:col-start-9 f-meta" style={{ textTransform: "none" }}>
            {hasImages ? (
              <details className="f-banner-details">
                <summary>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/generated/banner-88x31.png"
                    alt="nsvk13.dev 88x31 web banner"
                    width={88}
                    height={31}
                    className="f-pix"
                  />
                  <span className="block mt-2">link free — feel free to hotlink</span>
                </summary>
                <pre>{`<a href="https://nsvk13.dev"><img src="https://nsvk13.dev/generated/banner-88x31.png" width="88" height="31" alt="nsvk13.dev"></a>`}</pre>
              </details>
            ) : (
              <span>banner not recovered</span>
            )}
            <div className="mt-6">
              <Coords />
            </div>
          </div>
        </div>

        <p className="f-meta text-center mt-16" style={{ textTransform: "none" }}>
          the observer will close the page behind you.
        </p>
      </footer>

      {/* mobile navigation — a wire of its own */}
      <nav className="f-mobilenav" aria-label="sections">
        <a href="#self">01</a>
        <a href="#work">02</a>
        <a href="#log">03</a>
        <a href="#signals">04</a>
        <Link href="/blog">/blog</Link>
      </nav>
    </main>
  )
}
