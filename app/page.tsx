import Link from "next/link"
import type { CSSProperties, ReactNode } from "react"
import { getBuildMeta, hasPortraitImages, hasPublicFile } from "@/lib/field-data"
import { EYE_ASLEEP, RUIN } from "@/components/landing/art"
import LivingEye from "@/components/landing/LivingEye"
import { Cube, StaticScreen, SmallEye } from "@/components/landing/specimens"
import { KeepLight, Counter } from "@/components/landing/smalls"
import MenuBar from "@/components/desk/MenuBar"
import Desktop from "@/components/desk/Desktop"
import Walker from "@/components/desk/Walker"
import Slices from "@/components/desk/Slices"

export const dynamic = "force-static"

// ---------------------------------------------------------------
// a window of the unknown viewer
function Win({
  id,
  name,
  style,
  paper,
  closed,
  status,
  children,
  bodyClass,
  ariaLabel,
}: {
  id: string
  name: string
  style?: CSSProperties
  paper?: boolean
  closed?: boolean
  status?: [string, string]
  children: ReactNode
  bodyClass?: string
  ariaLabel?: string
}) {
  return (
    <section
      className={`w ${paper ? "w-paper" : ""} ${closed ? "is-closed" : ""}`}
      data-win={id}
      id={`win-${id}`}
      style={style}
      aria-label={ariaLabel ?? name}
    >
      <header className="w-title">
        <span className="w-name">■ {name}</span>
        <span className="w-btns" aria-hidden="true">
          <span>–</span>
          <span>□</span>
          <span className="w-close">×</span>
        </span>
      </header>
      <div className={`w-body ${bodyClass ?? ""}`}>{children}</div>
      {status ? (
        <footer className="w-status" aria-hidden="true">
          <span>{status[0]}</span>
          <span>{status[1]}</span>
        </footer>
      ) : null}
    </section>
  )
}

const FIELD_MAP_COMMENT = `
<!--
     unknown viewer · desktop schematic

     [portrait.bmp        ] [self.txt   ]   field/
     [                    ] [           ]   blog/
     [ SIMAKIN            ]    [observer]   trash
        [work/          ]  [spec.txt  ]
              [log.txt          ]
                     [signals.txt   ]
     ~~~ he walks here ~~~~~~~~~~~~~~~~~~~~~~~~~~~
-->
`

export default function Home() {
  const meta = getBuildMeta()
  const hasImages = hasPortraitImages()
  const hasMoon = hasPublicFile("generated/moonpath.png")
  const activityMax = Math.max(1, ...meta.activity.map((a) => a.count))
  const activitySum = meta.activity.reduce((s, a) => s + a.count, 0)

  const portraitStates = hasImages
    ? ["/generated/avatar-atkinson.png", "/generated/avatar-bands.png", "/generated/avatar-bayer.png"]
    : []

  return (
    <main className="desk-root">
      <a href="#win-self" className="f-skip">
        skip to contents
      </a>
      <div className="wallpaper" aria-hidden="true" style={hasMoon ? undefined : { backgroundImage: "none" }} />
      <div className="scan" aria-hidden="true" />
      <MenuBar rev={meta.shortHash} />
      <Desktop />
      <Walker />
      <div hidden dangerouslySetInnerHTML={{ __html: FIELD_MAP_COMMENT }} />

      <div className="desk">
        {/* ---------- desktop icons ---------- */}
        <Link href="/field" className="icon" style={{ right: "2vw", top: "6vh" }}>
          <pre aria-hidden="true">{"┌───┐\n│ · │\n└───┘"}</pre>
          field/
        </Link>
        <Link href="/blog" className="icon" style={{ right: "2vw", top: "18vh" }}>
          <pre aria-hidden="true">{"┌───┐\n│≡≡≡│\n└───┘"}</pre>
          blog/
        </Link>
        <span className="icon" style={{ right: "2vw", top: "30vh" }} aria-hidden="true">
          <pre>{"┌───┐\n│   │\n└───┘"}</pre>
          trash (empty)
        </span>

        {/* ---------- portrait.bmp ---------- */}
        <Win
          id="portrait"
          name="portrait.bmp — 1-bit, 480×480"
          style={{ left: "3vw", top: "5vh", width: "56vw" }}
          bodyClass="tight"
          status={["subject partially recovered · retouching failed, left as is", "R to retouch"]}
          ariaLabel="portrait"
        >
          {portraitStates.length ? (
            <Slices
              srcs={portraitStates}
              width={480}
              height={480}
              slices={30}
              alt="portrait of nsvk13: a hooded figure, dithered to one bit, dissolving into horizontal noise"
            />
          ) : (
            <pre className="f-pre p-6">portrait not recovered</pre>
          )}
          <div className="w-over" aria-hidden="true">
            Simakin,
            <br />
            N.
          </div>
          <span className="w-annot" style={{ right: "6%", top: "12%" }} aria-hidden="true">
            fig. 1 — retouching
          </span>
        </Win>

        {/* ---------- self.txt ---------- */}
        <Win
          id="self"
          name="self.txt"
          style={{ left: "50vw", top: "16vh", width: "46vw" }}
          status={["-UUU:---  self.txt", "All  L1  (Text)"]}
        >
          <p className="f-meta" style={{ textTransform: "none" }}>
            nsvk13.dev / personal index · doc.no 13-{meta.buildYear} · rev {meta.shortHash}
          </p>
          <h1 className="mt-4 text-[22px] leading-tight tracking-wide">NIKITA SIMAKIN</h1>
          <p className="text-ash text-[13px] mt-1">@nsvk13 — devops engineer · lat/lon withheld</p>
          <p className="mt-6">
            devops engineer, grown out of a semi-fullstack developer. builds and keeps alive the
            machinery underneath: kubernetes, docker, infrastructure as code, node.js, typescript,
            golang.
          </p>
          <p className="mt-3">
            in the hours the infrastructure does not need him — open source, crawlable strange things,
            technologies tried on for size. when there is no plan, there is enthusiasm.
          </p>
          <blockquote className="f-quote m-0 mt-8">
            <div className="text-[12px]">i am the guy</div>
            <div
              className="f-display text-[clamp(2rem,4.2vw,3.6rem)] my-1"
              style={{ fontStretch: "75%", lineHeight: 0.95 }}
            >
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
            <div className="text-[12px] text-ash">in the darkest of times.</div>
          </blockquote>
          <p className="f-dot text-[11px] mt-8 text-ash" aria-hidden="true">
            ( ´_ゝ`) &nbsp; 此のサイトは常に工事中
          </p>
        </Win>

        {/* ---------- observer.gif ---------- */}
        <Win
          id="observer"
          name="observer.gif"
          style={{ left: "62vw", top: "84vh", width: "34vw" }}
          status={["looping · 12 fps", "it is not a gif"]}
        >
          <LivingEye />
        </Win>

        {/* ---------- work/ ---------- */}
        <Win
          id="work"
          name="work/ — 3 files, 9 not recovered"
          style={{ left: "4vw", top: "108vh", width: "50vw" }}
          status={["rec.01–03 readable", "records 04–12 not recovered"]}
        >
          <table className="fb">
            <thead>
              <tr>
                <th>name</th>
                <th>type</th>
                <th>stack</th>
                <th>link</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>viewly_together</td>
                <td>app</td>
                <td>react · ts · elysia · gramio · docker</td>
                <td>
                  <a href="https://t.me/viewlybot/app" target="_blank" rel="noopener noreferrer">
                    t.me/viewlybot/app
                  </a>
                </td>
              </tr>
              <tr>
                <td>hodwini</td>
                <td>world</td>
                <td>minecraft · infra · banking · launcher</td>
                <td>
                  <a href="https://hodwini.net" target="_blank" rel="noopener noreferrer">
                    hodwini.net
                  </a>
                </td>
              </tr>
              <tr>
                <td>nsvk13.dev</td>
                <td>artifact</td>
                <td>next.js · mdx · tailwind · anime.js</td>
                <td>you are here</td>
              </tr>
              <tr className="dim">
                <td>records_04-12</td>
                <td>?</td>
                <td>not recovered</td>
                <td>—</td>
              </tr>
            </tbody>
          </table>
          <div className="specimens" aria-hidden="true">
            <div>
              <div className="cap">viewly · watch together</div>
              <StaticScreen />
            </div>
            <div>
              <div className="cap">hodwini · a world</div>
              <Cube />
            </div>
            <div>
              <div className="cap">this site · watching itself</div>
              <SmallEye />
            </div>
          </div>
          <pre className="f-pre text-[11px] mt-5" aria-hidden="true">
            {RUIN.join("\n")}
          </pre>
        </Win>

        {/* ---------- spec.txt ---------- */}
        <Win
          id="spec"
          name="spec.txt — found intact"
          paper
          style={{ left: "57vw", top: "128vh", width: "40vw" }}
          status={["capabilities / verified in production", "~ = fading memory"]}
        >
          <table className="w-full border-collapse text-[13px]">
            <tbody>
              {[
                ["frontend", "react · typescript · next.js · tailwind · vue~"],
                ["backend", "node · elysia · go · rest · grpc"],
                ["ops", "docker · ansible · nginx/traefik · grafana+prometheus · k8s+helm · ci/cd · gcp~ · yandex.cloud · postgres · redis · mongo~"],
                ["tools", "git · gitlab ci / gh actions · vite · bun · cloudflare"],
              ].map(([k, v]) => (
                <tr key={k} className="border-b border-field/40 align-top">
                  <th scope="row" className="text-left uppercase text-[10px] tracking-[.1em] font-normal py-2 pr-4 w-[10ch]">
                    {k}
                  </th>
                  <td className="py-2">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Win>

        {/* ---------- log.txt ---------- */}
        <Win
          id="log"
          name="log.txt — auto-recovered from git"
          style={{ left: "10vw", top: "178vh", width: "56vw" }}
          status={[
            `${meta.commitCount} commits on record`,
            meta.lastUpdatedDays === null
              ? "last update unknown"
              : meta.lastUpdatedDays === 0
                ? "last updated today"
                : `last updated ${meta.lastUpdatedDays}d ago`,
          ]}
        >
          {meta.activity.length > 0 && (
            <div className="mb-5">
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
          <p className="mb-3">
            <span className="f-dot text-[12px]">更新履歴</span>{" "}
            <span className="f-meta f-meta-ash">/ update log</span>
          </p>
          {meta.log.map((entry, i) => (
            <div key={i} className="f-logrow" style={{ opacity: Math.max(0.4, 0.95 - i * 0.07) }}>
              <span className="f-num shrink-0">
                {entry.date} ({entry.dow})
              </span>
              <span className="f-leader" aria-hidden="true">
                ·····································
              </span>
              <span>{entry.subject}</span>
            </div>
          ))}
          {meta.log.length === 0 && <p className="text-ash">log not recovered.</p>}
          <p className="mt-6 text-[14px]">
            <Link href="/blog">→ /blog (longer texts live here)</Link>
          </p>
        </Win>

        {/* ---------- signals.txt ---------- */}
        <Win
          id="signals"
          name="signals.txt"
          style={{ left: "50vw", top: "212vh", width: "44vw" }}
          status={["it is not watching. write anyway.", "signals reach the field at night"]}
        >
          <pre className="f-pre text-[11px] mb-5" aria-hidden="true">
            {EYE_ASLEEP.join("\n")}
          </pre>
          <ul className="text-[16px] leading-[2] list-none m-0 p-0">
            <li>
              <span className="text-ash mr-3">mail</span>
              <a href="mailto:contact@nsvk13.dev">contact@nsvk13.dev</a>
            </li>
            <li>
              <span className="text-ash mr-3">tg &nbsp;</span>
              <a href="https://t.me/nsvkjournal" target="_blank" rel="noopener noreferrer">
                t.me/nsvkjournal
              </a>
            </li>
            <li>
              <span className="text-ash mr-3">git </span>
              <a href="https://github.com/nsvk13" target="_blank" rel="noopener noreferrer">
                github.com/nsvk13
              </a>
            </li>
            <li>
              <span className="text-ash mr-3">x &nbsp; </span>
              <a href="https://x.com/nsvkjournal" target="_blank" rel="noopener noreferrer">
                x.com/nsvkjournal
              </a>
            </li>
          </ul>
          <div className="mt-6">
            <KeepLight />
          </div>
        </Win>

        {/* ---------- about.txt (Help → About) ---------- */}
        <Win
          id="about"
          name="about.txt"
          closed
          style={{ left: "30vw", top: "60vh", width: "40vw" }}
          status={["EOF · nsvk13.dev", "the observer will close the page behind you."]}
        >
          <p className="f-meta" style={{ textTransform: "none" }}>
            built {meta.buildDate} · {meta.shortHash} · {meta.commitCount} commits on record
          </p>
          <div className="mt-4">
            <Counter />
          </div>
          {hasImages && (
            <div className="mt-5 f-meta" style={{ textTransform: "none" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/generated/banner-88x31.png" alt="nsvk13.dev 88x31 web banner" width={88} height={31} className="f-pix" />
              <div className="mt-2">link free — feel free to hotlink</div>
            </div>
          )}
          <p className="mt-5 text-ash text-[13px]">
            an unknown viewer showing a handful of recovered files. nothing here is broken. only tired.
          </p>
        </Win>
      </div>
    </main>
  )
}
