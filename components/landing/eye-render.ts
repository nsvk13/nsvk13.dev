// Procedural ASCII eye. Pure function: geometry in, character rows out.
// Rendered at ~12fps on the client so the eye can track, blink,
// squint and wander without pre-baked frames.

export interface EyeParams {
  cols: number
  rows: number
  lid: number // 0 open … 1 closed
  pupilX: number // -1 … 1 (fraction of allowed travel)
  pupilY: number // -1 … 1
  dilate: number // 0 … 1
}

export interface EyeRun {
  ch: string
  k: 0 | 1 | 2 // 0 plain, 1 iris, 2 pupil
}

const BAYER = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
]

// cell aspect: one JetBrains Mono cell is ~0.6em wide × 1.25em tall
const CELL_ASPECT = 2.08

export function renderEye(p: EyeParams): EyeRun[][] {
  const { cols, rows, lid } = p
  const hw = cols / 2
  const hh = rows / 2
  const out: EyeRun[][] = []

  // iris geometry in char-width units
  const eyeH = rows * CELL_ASPECT
  const irisR = eyeH * 0.36
  const pupilR = irisR * (0.38 + 0.22 * p.dilate)
  const travelX = cols * 0.18
  const travelY = eyeH * 0.12
  const cx = p.pupilX * travelX
  const cy = p.pupilY * travelY

  const topAt = (u: number) => -0.92 * Math.sqrt(Math.max(0, 1 - u * u)) ** 0.9
  const botAt = (u: number) => 0.62 * Math.sqrt(Math.max(0, 1 - u * u)) ** 1.1

  for (let j = 0; j < rows; j++) {
    const v = (j + 0.5 - hh) / hh
    const row: EyeRun[] = []
    for (let i = 0; i < cols; i++) {
      const u = (i + 0.5 - hw) / hw
      const t0 = topAt(u)
      const b0 = botAt(u)
      // upper lid descends with `lid`, lower lid rises a little
      const t = t0 + lid * (b0 - t0) * 0.85
      const b = b0 - lid * (b0 - t0) * 0.15
      const inside = Math.abs(u) < 1 && v > t && v < b

      let ch = " "
      let k: 0 | 1 | 2 = 0

      if (!inside) {
        // lid outlines: the cell just outside the boundary
        const vAbove = (j - 0.5 - hh) / hh
        const vBelow = (j + 1.5 - hh) / hh
        const onTop = Math.abs(u) < 1 && v <= t && vBelow > t
        const onBot = Math.abs(u) < 1 && v >= b && vAbove < b
        if ((onTop || onBot) && !(onBot && lid > 0.95)) {
          const du = 1 / hw
          const f = onTop ? (x: number) => t0 + lid * (botAt(x) - topAt(x)) * 0.85 : (x: number) => botAt(x) - lid * (botAt(x) - topAt(x)) * 0.15
          const slope = ((f(u + du) - f(u - du)) / (2 * du)) * (hh / hw) * CELL_ASPECT
          const s = Math.abs(slope)
          if (s < 0.45) ch = onTop ? "_" : "-"
          else if (s < 1.4) ch = slope < 0 ? (onTop ? "," : "'") : onTop ? "." : "`"
          else ch = slope < 0 ? "/" : "\\"
          if (Math.abs(u) > 0.93) ch = u < 0 ? "(" : ")"
        }
        row.push({ ch, k })
        continue
      }

      // inside the eye: iris / pupil / sclera
      const X = (i + 0.5 - hw) - cx
      const Y = (j + 0.5 - hh) * CELL_ASPECT - cy
      const d = Math.hypot(X, Y)
      const bayer = BAYER[j & 3][i & 3] / 16

      if (d < pupilR) {
        k = 2
        // glint, upper-left
        const gx = X + pupilR * 0.45
        const gy = Y + pupilR * 0.5
        ch = Math.hypot(gx, gy) < pupilR * 0.28 ? "." : "@"
      } else if (d < irisR) {
        k = 1
        const ang = Math.atan2(Y, X)
        const ring = (d - pupilR) / (irisR - pupilR) // 0 inner … 1 outer
        // radial spokes, denser toward the rim
        const sector = Math.floor((((ang + Math.PI) / Math.PI) * 4 + 0.5) % 4)
        const spoke = ["-", "\\", "|", "/"][sector]
        const density = 0.35 + ring * 0.55
        ch = bayer < density ? spoke : ring > 0.85 ? ":" : "."
        if (ring > 0.93) ch = bayer < 0.7 ? "0" : "o"
      } else {
        // sclera: near-empty, a little grain toward the corners and lids
        const edge = Math.min((v - t) / (b - t), 1 - (v - t) / (b - t))
        const corner = Math.abs(u)
        const grain = 0.04 + corner * 0.14 + (0.25 - Math.min(edge, 0.25)) * 0.5
        ch = bayer < grain ? (bayer < grain * 0.4 ? ":" : ".") : " "
      }
      row.push({ ch, k })
    }
    out.push(row)
  }
  return out
}

export function eyeToText(rows: EyeRun[][]): string {
  return rows.map((r) => r.map((c) => c.ch).join("")).join("\n")
}
