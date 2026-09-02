// THE WALKER — a hooded ASCII figure that never stops walking the
// bottom edge of the viewer. 7 columns wide; walk frames are 6 rows,
// the stare frame is 7 (the head detaches).

export const WALK = [
  "  ___  \n ( . ) \n  /|\\  \n   |   \n  / \\  \n /   \\ ",
  "  ___  \n ( . ) \n  -|-  \n   |   \n  /|   \n / |   ",
  "  ___  \n ( . ) \n  \\|/  \n   |   \n   |   \n   |   ",
  "  ___  \n ( . ) \n  -|-  \n   |   \n   |\\  \n   | \\ ",
] as const

export const STAND = "  ___  \n ( . ) \n  /|\\  \n   |   \n  / \\  \n /   \\ "
export const LOOK = "  ___  \n ( . ) \n  /|-- \n   |   \n  / \\  \n /   \\ "
export const SIT = "  ___  \n ( . ) \n  /|   \n _/ \\_ \n       \n       "
export const STARE = "  ___  \n ( 0 ) \n       \n  /|\\  \n   |   \n  / \\  \n /   \\ "

export const DECAY = [
  "  ░░░  \n ░ ░ ░ \n  ░░░  \n   ░   \n  ░ ░  \n ░   ░ ",
  "   ·   \n  · ·  \n   ·   \n       \n   ·   \n ·   · ",
  "       \n       \n       \n       \n       \n       ",
] as const

export function mirror(frame: string): string {
  return frame
    .split("\n")
    .map((line) =>
      line
        .split("")
        .reverse()
        .map((c) => (c === "/" ? "\\" : c === "\\" ? "/" : c === "(" ? ")" : c === ")" ? "(" : c))
        .join("")
    )
    .join("\n")
}
