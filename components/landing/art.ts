// ASCII art constants for the field. Every frame keeps a fixed
// character grid so swapping frames never shifts layout.

export const SHADES = "░▒▓";
export const SCRAMBLE_GLYPHS = "░▒▓·:∴⁘";

// ---- the field eye (hero) — 44ch wide, 11 lines ----
export const EYE_OPEN: string[] = [
  "           __..----------------..__         ",
  "      .-''                          ''-.    ",
  "   ,-'                                  '-, ",
  " ,'          __..--------..__             ',",
  "/         ,-'                '-,            ",
  ":         :        (0)          :          :",
  "\\          '-..            ..-'            /",
  " ',           ''--------''               ,' ",
  "   '-,                                 ,-'  ",
  "      '-..                        ..-''     ",
  "          ''--..__________..--''            ",
];

export const EYE_MID: string[] = [
  "                                            ",
  "                                            ",
  "   ,--..__                        __..--,   ",
  " ,'       ''--..____________..--''        ',",
  "/                                           ",
  ":         :        (-)          :          :",
  "\\          '-..            ..-'            /",
  " ',           ''--------''               ,' ",
  "   '-,                                 ,-'  ",
  "      '-..                        ..-''     ",
  "          ''--..__________..--''            ",
];

export const EYE_CLOSED: string[] = [
  "                                            ",
  "                                            ",
  "                                            ",
  "                                            ",
  "   __..--..__                  __..--..__   ",
  "--'          ''--..______..--''          '--",
  "     '    '     '        '     '    '       ",
  "                                            ",
  "                                            ",
  "                                            ",
  "                                            ",
];

// index of the line that carries the pupil, and the pupil token
export const EYE_PUPIL_LINE = 5;
export const EYE_PUPIL = "(0)";

// ---- the closed eye (signals section) ----
export const EYE_ASLEEP: string[] = [
  "  ___                                      ___",
  "     '''---...________________...---'''       ",
  "        '     '     '    '     '     '        ",
];

// ---- THE ATTENDANT — 5ch x 4 rows (stare is the 5-row exception) ----
export const ATTENDANT = {
  stand: "  o  \n /|\\ \n  |  \n / \\ ",
  walk1: "  o  \n /|\\ \n  |  \n / \\ ",
  walk2: "  o  \n /|\\ \n  |  \n  |\\ ",
  walk3: "  o  \n /|\\ \n  |  \n  |  ",
  walk4: "  o  \n /|\\ \n  |  \n /|  ",
  look: "  o  \n /|- \n  |  \n / \\ ",
  sit: "  o  \n /|  \n  |  \n / \\ ",
  sitHang: "  o  \n /|  \n_/ \\_\n     ",
  stare: "  0  \n     \n /|\\ \n  |  \n / \\ ",
  decay1: "  ░  \n ░░░ \n  ░  \n ░ ░ ",
  decay2: "  ·  \n  ·  \n     \n  ·  ",
  decay3: "     \n     \n     \n     ",
} as const;

export const WALK_CYCLE = [
  ATTENDANT.walk1,
  ATTENDANT.walk2,
  ATTENDANT.walk3,
  ATTENDANT.walk4,
] as const;

export const DECAY_CYCLE = [
  ATTENDANT.decay1,
  ATTENDANT.decay2,
  ATTENDANT.decay3,
] as const;

export function mirrorFrame(frame: string): string {
  // flip walking direction: swap the leg/arm slashes
  return frame
    .split("")
    .map((c) => (c === "/" ? "\\" : c === "\\" ? "/" : c))
    .join("");
}

// ---- ruin: records 04–12 not recovered ----
export const RUIN: string[] = [
  "█▓▓▒█▓▒▒▓░▒▓░░▒░ ░▒ ░  ░   ░       ░",
  "▓█▓▒▓▒░▓▒░░ ▒░░░  ░    ░        ░   ",
  "▒▓░▒░▒▒░░▒ ░░  ░     ░              ",
  "▓▒▒░░ ░░ ░   ░           ░          ",
  "░▒░ ░░   ░        ░                 ",
  "░ ░    ░                            ",
];

// ---- work record pictograms ----
export const PICTO_VIEWLY: string[] = [
  " ┌──────────────┐",
  " │ ▓▓▓▓▓▓▓▓▓▓▓▓ │",
  " │ ▓▓▓▓▓▓▓▓▓▓▓▓ │",
  " └──────────────┘",
  "    o_o    o_o   ",
];

export const PICTO_HODWINI: string[] = [
  "    _______ ",
  "   /      /|",
  "  /______/ |",
  "  |  ▓   | |",
  "  |      |/ ",
  "  |______|  ",
];

export const PICTO_SITE: string[] = [
  " .-------. ",
  "( (0)     )",
  " '-------' ",
];

// deterministic PRNG (mulberry32) for seeded layout decisions
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
