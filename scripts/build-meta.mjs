#!/usr/bin/env node
/**
 * Collects real build metadata from git and writes it to
 * lib/generated/build-meta.json. Safe to run without git available:
 * every git call is wrapped in try/catch and falls back to defaults.
 */

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const outFile = join(repoRoot, "lib", "generated", "build-meta.json");

/** Run a git command, returning trimmed stdout or null on any failure. */
function git(cmd) {
  try {
    return execSync(cmd, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return null;
  }
}

const DOW = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** Format a Date as YYYY.MM.DD (UTC). */
function formatDate(d) {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

const now = new Date();

// --- shortHash ---------------------------------------------------------
const shortHash = git("git rev-parse --short HEAD") || "0000000";

// --- commitCount -------------------------------------------------------
const commitCountRaw = git("git rev-list --count HEAD");
const commitCount =
  commitCountRaw !== null ? Number.parseInt(commitCountRaw, 10) || 0 : 0;

// --- lastUpdatedDays ---------------------------------------------------
let lastUpdatedDays = null;
const lastCommitTsRaw = git("git log -1 --format=%ct");
if (lastCommitTsRaw !== null) {
  const ts = Number.parseInt(lastCommitTsRaw, 10);
  if (Number.isFinite(ts)) {
    lastUpdatedDays = Math.max(
      0,
      Math.floor((now.getTime() / 1000 - ts) / 86400),
    );
  }
}

// --- log (last 8 commits, merge commits included) ----------------------
// %ct (committer unix timestamp) instead of %cs so date/dow are computed
// in a fixed timezone (UTC) with an English locale, independent of env.
let log = [];
const logRaw = git("git log -8 --format=%ct%x09%s");
if (logRaw !== null && logRaw !== "") {
  log = logRaw
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const tab = line.indexOf("\t");
      if (tab === -1) return null;
      const ts = Number.parseInt(line.slice(0, tab), 10);
      if (!Number.isFinite(ts)) return null;
      const d = new Date(ts * 1000);
      const subject = line
        .slice(tab + 1)
        .replace(/[\t\r\n]+/g, " ")
        .slice(0, 64);
      return { date: formatDate(d), dow: DOW[d.getUTCDay()], subject };
    })
    .filter(Boolean);
}

// --- activity: commits per month, last 12 months (UTC) -----------------
const activity = [];
{
  const buckets = new Map();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }
  const all = git("git log --format=%ct");
  if (all) {
    for (const line of all.split("\n")) {
      const ts = Number.parseInt(line, 10);
      if (!Number.isFinite(ts)) continue;
      const d = new Date(ts * 1000);
      const key = `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      if (buckets.has(key)) buckets.set(key, buckets.get(key) + 1);
    }
  }
  for (const [month, count] of buckets) activity.push({ month, count });
}

// --- write -------------------------------------------------------------
const meta = {
  shortHash,
  buildDate: formatDate(now),
  buildYear: now.getUTCFullYear(),
  commitCount,
  lastUpdatedDays,
  log,
  activity,
};

const json = `${JSON.stringify(meta, null, 2)}\n`;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, json, "utf8");

console.log(outFile);
console.log(json);
