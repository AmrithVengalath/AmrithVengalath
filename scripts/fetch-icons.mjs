#!/usr/bin/env node
/**
 * Regenerates scripts/icons.json, the brand marks used by the stack card.
 *
 * Paths are pulled once and committed so nothing on the profile depends on a
 * third party image host at render time. Marks come from simple-icons, which
 * releases its icon data under CC0-1.0.
 *
 * Run: node scripts/fetch-icons.mjs
 */

import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "icons.json"
);
const BASE =
  "https://raw.githubusercontent.com/simple-icons/simple-icons/master/icons";

// Display order. Every entry maps to something on the resume.
const ROWS = [
  ["typescript", "javascript", "react", "flutter", "dart", "expo", "swift"],
  ["kotlin", "android", "apple", "xcode", "githubactions", "fastlane", "appstore"],
  ["googleplay", "sentry", "firebase", "redux", "nextdotjs", "angular", "nodedotjs"],
  ["tailwindcss", "python", "mysql", "git", "jira", "cloudflare", "claude"],
];

const rows = [];
for (const row of ROWS) {
  const icons = [];
  for (const slug of row) {
    const res = await fetch(`${BASE}/${slug}.svg`);
    if (!res.ok) throw new Error(`${slug}: HTTP ${res.status}`);
    const svg = await res.text();
    const title = /<title>([^<]+)<\/title>/.exec(svg)?.[1];
    const d = /\sd="([^"]+)"/.exec(svg)?.[1];
    if (!title || !d) throw new Error(`${slug}: could not parse title or path`);
    icons.push({ slug, title, d });
  }
  rows.push(icons);
}

await writeFile(
  OUT,
  JSON.stringify(
    {
      _note:
        "Brand marks from simple-icons (CC0-1.0). Regenerate with scripts/fetch-icons.mjs.",
      rows,
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(`wrote ${OUT}: ${rows.flat().length} icons`);
