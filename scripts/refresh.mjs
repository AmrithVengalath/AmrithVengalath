#!/usr/bin/env node
/**
 * Rebuilds every generated asset and README block on this profile.
 *
 * Sources, all public, no token required:
 *   vengalath.com/feed.xml                    posts and post count
 *   api.npmjs.org                             monthly downloads per package
 *   registry.npmjs.org                        latest published version
 *   api.github.com                            stars, forks, account stats
 *   github.com/users/<login>/contributions    contribution calendar
 *
 * Usage:
 *   node scripts/refresh.mjs           fetch live data and rewrite everything
 *   node scripts/refresh.mjs --demo    render from fixed sample data, no network
 *
 * A source that fails leaves its previous output untouched rather than blanking
 * it, so one flaky endpoint never wipes a section of the profile. The script
 * still exits non zero in that case so CI surfaces the failure.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ASSETS = path.join(ROOT, "assets");
const README = path.join(ROOT, "README.md");
const CACHE_FILE = path.join(ROOT, "scripts", "cache.json");
const DEMO = process.argv.includes("--demo");

/* ------------------------------------------------------------------ config */

const LOGIN = "AmrithVengalath";
const FEED_URL = "https://vengalath.com/feed.xml";
const POSTS_SHOWN = 4;
const JOINED_YEAR = 2017;

const TOOLS = [
  {
    stage: "Pre merge",
    npm: "react-native-doctor-ci",
    owner: "AmrithVengalath",
    repo: "react-native-doctor-ci",
    summary:
      "Policy as code CI gate for React Native dependency health. Fails the pull request and annotates the exact `package.json` lines that add an abandoned, non New Architecture, or npm deprecated dependency.",
    extra: "Also ships as a GitHub Action. Emits SARIF.",
  },
  {
    stage: "Pre release",
    npm: "react-native-deeplink-devtools",
    owner: "deeplink-devtools",
    repo: "react-native-deeplink-devtools",
    summary:
      "The `rndl` CLI for React Native deep links. Inspects route tables, validates AASA and Android App Links, opens links on simulators and devices, and generates type safe link helpers.",
    extra: "Runs locally or in CI.",
  },
  {
    stage: "Post release",
    npm: "react-native-release-health",
    owner: "release-health",
    repo: "react-native-release-health",
    summary:
      "Vendor neutral OTA rollout safety. Session tagging, update probation, crash loop detection, and rollback recommendations, so a bad over the air update is caught on device instead of in your reviews.",
    extra: "Works with `expo-updates` and `hot-updater`.",
  },
];

/* ------------------------------------------------------------------- theme */

const THEMES = {
  dark: {
    bg: "#0a0d16",
    panel: "#0e1220",
    ink: "#e8ebf4",
    muted: "#8b93ab",
    faint: "#7f88a3",
    glow: "#22d3ee",
    glow2: "#a78bfa",
    line: "rgba(255,255,255,0.10)",
    heat: ["#161c2e", "#0e4f61", "#12798f", "#1cb0cd", "#22d3ee"],
  },
  light: {
    bg: "#ffffff",
    panel: "#f6f7fb",
    ink: "#0a0d16",
    muted: "#4b5468",
    faint: "#5a6377",
    glow: "#0e7490",
    glow2: "#6d28d9",
    line: "rgba(5,6,10,0.12)",
    heat: ["#e6e9f2", "#bce7f0", "#7cd0e2", "#35a8c4", "#0e7490"],
  },
};

// Webfonts do not load inside an SVG that GitHub serves through its image
// proxy, so every card leans on the one family that is present everywhere.
const MONO =
  "ui-monospace,SFMono-Regular,'JetBrains Mono',Menlo,Consolas,'Liberation Mono',monospace";

/* ----------------------------------------------------------------- helpers */

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const num = (n) => Number(n).toLocaleString("en-US");

/**
 * Monospace glyphs run about 0.6em wide, so a label's width is predictable.
 * Shrink the type until it fits its box rather than letting it bleed out, which
 * is what a long achievement name like "Pair Extraordinaire" otherwise does.
 */
const fitFont = (text, maxWidth, preferred, floor = 8) =>
  Math.max(
    floor,
    Math.min(preferred, maxWidth / (String(text).length * 0.6))
  ).toFixed(2);

const failures = [];

/** Run a fetch step; on failure record it and hand back the fallback. */
async function safe(label, fn, fallback) {
  try {
    return await fn();
  } catch (err) {
    failures.push(`${label}: ${err.message}`);
    return fallback;
  }
}

/**
 * vengalath.com sits behind Cloudflare, which returns 403 for the plain
 * `AmrithVengalath-profile-readme` UA GitHub Actions runners were sending
 * (npm and the GitHub API never blocked it, only the feed did). A normal
 * browser UA and Accept headers clear it.
 */
async function getText(url) {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.text();
}

const getJSON = async (url) => JSON.parse(await getText(url));

/** Write only when content actually changed, so the workflow stays quiet. */
async function writeIfChanged(file, content) {
  if (existsSync(file) && (await readFile(file, "utf8")) === content) return false;
  await writeFile(file, content, "utf8");
  return true;
}

/**
 * The last values every source actually returned, committed alongside the
 * generated cards. A failing source falls back to this, not to sample data,
 * so a persistent block (a WAF, a rate limit) freezes the page instead of
 * quietly overwriting real numbers and post titles with placeholders.
 */
async function loadCache() {
  try {
    return JSON.parse(await readFile(CACHE_FILE, "utf8"));
  } catch {
    return null;
  }
}

/* --------------------------------------------------------------- fetch: npm */

async function fetchPackage(tool) {
  const [meta, dl] = await Promise.all([
    getJSON(`https://registry.npmjs.org/${tool.npm}/latest`),
    getJSON(`https://api.npmjs.org/downloads/point/last-month/${tool.npm}`),
  ]);
  return { version: meta.version, downloads: dl.downloads ?? 0 };
}

/* ------------------------------------------------------------ fetch: github */

async function fetchRepo({ owner, repo }) {
  const r = await getJSON(`https://api.github.com/repos/${owner}/${repo}`);
  return { stars: r.stargazers_count ?? 0, forks: r.forks_count ?? 0 };
}

async function fetchAccount() {
  const u = await getJSON(`https://api.github.com/users/${LOGIN}`);
  return {
    repos: u.public_repos ?? 0,
    followers: u.followers ?? 0,
    joined: new Date(u.created_at).getUTCFullYear(),
  };
}

/**
 * The public contributions fragment. `data-level` (0 to 4) rides on each day
 * cell; the exact per day count lives in the paired <tool-tip>, keyed by the
 * cell id. Attribute order is not stable, so each tag is parsed field by field.
 */
async function fetchContributions() {
  const html = await getText(`https://github.com/users/${LOGIN}/contributions`);

  const counts = new Map();
  for (const m of html.matchAll(
    /<tool-tip[^>]*\sfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g
  )) {
    const n = /^\s*(\d[\d,]*)/.exec(m[2].trim());
    counts.set(m[1], n ? Number(n[1].replace(/,/g, "")) : 0);
  }

  const days = [];
  for (const tag of html.match(/<td\b[^>]*>/g) ?? []) {
    const date = /data-date="([^"]+)"/.exec(tag)?.[1];
    if (!date) continue;
    const id = /\sid="([^"]+)"/.exec(tag)?.[1] ?? "";
    const level = Number(/data-level="(\d)"/.exec(tag)?.[1] ?? 0);
    days.push({ date, level, count: counts.get(id) ?? (level > 0 ? 1 : 0) });
  }
  if (!days.length) throw new Error("no contribution days parsed");
  days.sort((a, b) => a.date.localeCompare(b.date));

  const totalText = /([\d,]+)\s+contributions?\s+in\s+the\s+last\s+year/i.exec(html);
  const total = totalText
    ? Number(totalText[1].replace(/,/g, ""))
    : days.reduce((a, d) => a + d.count, 0);

  return {
    days,
    total,
    activeDays: days.filter((d) => d.count > 0).length,
    busiest: days.reduce((a, d) => Math.max(a, d.count), 0),
  };
}

/* ------------------------------------------------------------ fetch: writing */

async function fetchPosts() {
  const xml = await getText(FEED_URL);
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map((m) => {
    const field = (tag) =>
      new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`)
        .exec(m[1])?.[1]
        ?.trim() ?? "";
    const date = new Date(field("pubDate"));
    return {
      title: field("title").replace(/&amp;/g, "&"),
      link: field("link"),
      date: Number.isNaN(+date)
        ? ""
        : date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone: "UTC",
          }),
    };
  });
  if (!items.length) throw new Error("no items in feed");
  return { latest: items.slice(0, POSTS_SHOWN), count: items.length };
}

/* ------------------------------------------------------------------ demo data */

function demoData() {
  const days = [];
  const start = new Date(Date.UTC(2025, 6, 27));
  for (let i = 0; i < 371; i++) {
    const d = new Date(start.getTime() + i * 86_400_000);
    const level = i % 37 === 0 ? 4 : i % 11 === 0 ? 2 : i % 5 === 0 ? 1 : 0;
    days.push({
      date: d.toISOString().slice(0, 10),
      level,
      count: level * 5,
    });
  }
  return {
    tools: TOOLS.map((t, i) => ({
      ...t,
      version: ["0.1.2", "0.1.1", "0.1.0"][i],
      downloads: [651, 691, 286][i],
      stars: 7,
      forks: 0,
    })),
    account: { repos: 20, followers: 5, joined: JOINED_YEAR },
    contrib: {
      days,
      total: 230,
      activeDays: days.filter((d) => d.count > 0).length,
      busiest: 20,
    },
    posts: {
      count: 45,
      latest: [
        {
          title:
            "react-native-release-health: catching a bad OTA update before your users do",
          link: "https://vengalath.com/blog/react-native-release-health-ota-rollout-safety/",
          date: "Jul 26, 2026",
        },
        {
          title:
            "We ran rn-doctor on 20 popular React Native templates, here is what is dying inside them",
          link: "https://vengalath.com/blog/we-ran-rn-doctor-on-20-popular-react-native-templates/",
          date: "Jul 13, 2026",
        },
        {
          title: "Why universal links and Android App Links break (10 fixes)",
          link: "https://vengalath.com/blog/why-universal-links-and-android-app-links-break/",
          date: "Jul 12, 2026",
        },
        {
          title: "Seven years shipping cross platform apps: what I actually learned",
          link: "https://vengalath.com/blog/seven-years-shipping-cross-platform-apps-release-engineering-lessons/",
          date: "Apr 21, 2026",
        },
      ],
    },
  };
}

/* ------------------------------------------------------------- svg: chrome */

/** Shared card shell: rounded panel, hairline border, corner tick, label. */
function shell({ w, h, t, label, body }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="14" fill="${t.panel}" stroke="${t.line}"/>
  <path d="M14 1 H1 V14" fill="none" stroke="${t.glow}" stroke-width="1.5" opacity="0.9"/>
  <path d="M${w - 14} ${h - 1} H${w - 1} V${h - 14}" fill="none" stroke="${t.glow2}" stroke-width="1.5" opacity="0.9"/>
${body}
</svg>
`;
}

const cardLabel = (t, x, y, text) => `  <circle cx="${x + 4}" cy="${y - 4}" r="3.5" fill="${t.glow}"/>
  <text x="${x + 16}" y="${y}" font-family="${MONO}" font-size="11" letter-spacing="1.6" fill="${t.faint}">${esc(text)}</text>`;

/* --------------------------------------------------------- svg: the banner */

function banner(t) {
  const w = 880;
  const h = 190;
  // Sparse dot field, deterministic so reruns produce an identical file.
  let dots = "";
  for (let i = 0; i < 90; i++) {
    const x = ((i * 137.5) % w).toFixed(1);
    const y = ((i * 71.3) % h).toFixed(1);
    const o = (0.05 + ((i * 17) % 11) / 60).toFixed(2);
    dots += `<circle cx="${x}" cy="${y}" r="1" fill="${t.glow}" opacity="${o}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="Amrith Vengalath, Senior Software Engineer, release safety for React Native">
  <defs>
    <linearGradient id="rule" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${t.glow}"/>
      <stop offset="60%" stop-color="${t.glow2}"/>
      <stop offset="100%" stop-color="${t.glow}" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="wash" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${t.glow}" stop-opacity="0.10"/>
      <stop offset="55%" stop-color="${t.glow2}" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${t.bg}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" rx="16" fill="${t.bg}"/>
  <rect width="${w}" height="${h}" rx="16" fill="url(#wash)"/>
  <g>${dots}</g>
  <rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="16" fill="none" stroke="${t.line}"/>
  <text x="440" y="72" text-anchor="middle" font-family="${MONO}" font-size="44" font-weight="700" letter-spacing="4" fill="${t.ink}">AMRITH VENGALATH</text>
  <rect x="240" y="92" width="400" height="2" fill="url(#rule)"/>
  <text x="440" y="122" text-anchor="middle" font-family="${MONO}" font-size="19" letter-spacing="1.5" fill="${t.glow}">senior software engineer</text>
  <text x="440" y="152" text-anchor="middle" font-family="${MONO}" font-size="16" letter-spacing="0.5" fill="${t.muted}">react native . flutter . next.js</text>
</svg>
`;
}

/* ---------------------------------------------------- svg: open source card */

function openSourceCard(t, d) {
  const downloads = d.tools.reduce((a, x) => a + x.downloads, 0);
  const stars = d.tools.reduce((a, x) => a + x.stars, 0);
  const cell = (x, value, label) =>
    `  <text x="${x}" y="152" font-family="${MONO}" font-size="20" font-weight="700" fill="${t.ink}">${esc(value)}</text>
  <text x="${x}" y="171" font-family="${MONO}" font-size="10.5" letter-spacing="0.8" fill="${t.faint}">${esc(label)}</text>`;

  return shell({
    w: 420,
    h: 200,
    t,
    label: `Open source: ${num(downloads)} npm downloads per month across ${d.tools.length} packages`,
    body: `${cardLabel(t, 24, 38, "OPEN SOURCE")}
  <text x="24" y="98" font-family="${MONO}" font-size="46" font-weight="700" fill="${t.glow}">${num(downloads)}</text>
  <text x="24" y="120" font-family="${MONO}" font-size="12.5" letter-spacing="0.6" fill="${t.muted}">npm downloads / month</text>
  <line x1="24" y1="132" x2="396" y2="132" stroke="${t.line}"/>
${cell(24, String(d.tools.length), "packages")}
${cell(148, String(stars), "stars")}
${cell(272, "MIT", "all three")}`,
  });
}

/* ------------------------------------------------------ svg: activity card */

function activityCard(t, d) {
  const days = d.contrib.days;
  // Bucket into calendar weeks, newest 52, Sunday first.
  const weeks = [];
  for (let i = 0; i < days.length; i++) {
    const dow = new Date(`${days[i].date}T00:00:00Z`).getUTCDay();
    if (!weeks.length || dow === 0) weeks.push(new Array(7).fill(null));
    weeks.at(-1)[dow] = days[i];
  }
  const shown = weeks.slice(-52);
  const pitch = 6.9;
  const size = 5.3;
  let heat = "";
  shown.forEach((week, wi) => {
    week.forEach((day, di) => {
      if (!day) return;
      const x = (24 + wi * pitch).toFixed(2);
      const y = (137 + di * pitch).toFixed(2);
      heat += `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1.2" fill="${t.heat[day.level]}"/>`;
    });
  });

  const stat = (x, value, label) =>
    `  <text x="${x}" y="100" font-family="${MONO}" font-size="21" font-weight="700" fill="${t.ink}">${esc(value)}</text>
  <text x="${x}" y="118" font-family="${MONO}" font-size="10.5" letter-spacing="0.8" fill="${t.faint}">${esc(label)}</text>`;

  return shell({
    w: 420,
    h: 200,
    t,
    label: `Contribution activity: ${num(d.contrib.total)} contributions in the last twelve months`,
    body: `${cardLabel(t, 24, 38, "ACTIVITY / LAST 12 MONTHS")}
  <text x="24" y="76" font-family="${MONO}" font-size="34" font-weight="700" fill="${t.glow2}">${num(d.contrib.total)}</text>
  <text x="${24 + String(num(d.contrib.total)).length * 20.5 + 12}" y="76" font-family="${MONO}" font-size="12.5" fill="${t.muted}">contributions</text>
${stat(24, num(d.contrib.activeDays), "active days")}
${stat(148, num(d.contrib.busiest), "busiest day")}
${stat(272, num(d.account.repos), "public repos")}
  <g>${heat}</g>`,
  });
}

/* ----------------------------------------------------- svg: highlights row */

function highlightsCard(t, d) {
  const w = 880;
  const h = 132;
  const tiles = [
    ["Pair Extraordinaire", "github achievement"],
    ["Pull Shark", "github achievement"],
    ["YOLO", "github achievement"],
    [`${d.tools.length} packages`, "published on npm"],
    [`${d.posts.count} posts`, "vengalath.com"],
    [`${new Date().getUTCFullYear() - d.account.joined} years`, "on github"],
  ];
  const pad = 20;
  const gap = 12;
  const tw = (w - pad * 2 - gap * (tiles.length - 1)) / tiles.length;

  let body = `${cardLabel(t, 24, 34, "HIGHLIGHTS")}`;
  tiles.forEach(([title, sub], i) => {
    const x = pad + i * (tw + gap);
    const accent = i < 3 ? t.glow2 : t.glow;
    body += `
  <rect x="${x.toFixed(1)}" y="52" width="${tw.toFixed(1)}" height="60" rx="10" fill="${t.bg}" stroke="${t.line}"/>
  <rect x="${x.toFixed(1)}" y="52" width="3" height="60" rx="1.5" fill="${accent}"/>
  <text x="${(x + tw / 2).toFixed(1)}" y="80" text-anchor="middle" font-family="${MONO}" font-size="${fitFont(title, tw - 18, 13)}" font-weight="700" fill="${t.ink}">${esc(title)}</text>
  <text x="${(x + tw / 2).toFixed(1)}" y="97" text-anchor="middle" font-family="${MONO}" font-size="${fitFont(sub, tw - 14, 9.5)}" letter-spacing="0.5" fill="${t.faint}">${esc(sub)}</text>`;
  });

  return shell({ w, h, t, label: "Highlights", body });
}

/* ---------------------------------------------------------- svg: tech wall */

function stackCard(t, icons) {
  const w = 880;
  const pad = 26;
  const gap = 10;
  const cols = 14;
  const flat = icons.rows.flat();
  const rows = [];
  for (let i = 0; i < flat.length; i += cols) rows.push(flat.slice(i, i + cols));

  const box = (w - pad * 2 - gap * (cols - 1)) / cols;
  // simple-icons paths are authored on a 24 unit grid; fill half the tile.
  const scale = (box * 0.5) / 24;
  const inset = (box - 24 * scale) / 2;
  const top = 58;
  const h = Math.round(top + rows.length * box + (rows.length - 1) * gap + 22);

  let body = `${cardLabel(t, 24, 38, "STACK")}`;
  rows.forEach((row, ri) => {
    row.forEach((icon, ci) => {
      const x = pad + ci * (box + gap);
      const y = top + ri * (box + gap);
      body += `
  <g>
    <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${box.toFixed(1)}" height="${box.toFixed(1)}" rx="9" fill="${t.bg}" stroke="${t.line}"/>
    <g transform="translate(${(x + inset).toFixed(2)} ${(y + inset).toFixed(2)}) scale(${scale.toFixed(4)})">
      <title>${esc(icon.title)}</title>
      <path d="${icon.d}" fill="${(ri + ci) % 2 ? t.glow2 : t.glow}" opacity="0.92"/>
    </g>
  </g>`;
    });
  });

  return shell({
    w,
    h,
    t,
    label: `Stack: ${flat.map((i) => i.title).join(", ")}`,
    body,
  });
}

/* ------------------------------------------------------- readme block text */

function toolsBlock(d) {
  return d.tools
    .map((t) => {
      const slug = `${t.owner}/${t.repo}`;
      const badges = [
        `[![npm](https://img.shields.io/npm/v/${t.npm}?style=flat-square&color=22d3ee&labelColor=0e1220&logo=npm&logoColor=22d3ee)](https://www.npmjs.com/package/${t.npm})`,
        `[![downloads](https://img.shields.io/npm/dm/${t.npm}?style=flat-square&color=a78bfa&labelColor=0e1220&label=downloads)](https://www.npmjs.com/package/${t.npm})`,
        `[![stars](https://img.shields.io/github/stars/${slug}?style=flat-square&color=8b93ab&labelColor=0e1220)](https://github.com/${slug})`,
        `[![license](https://img.shields.io/badge/license-MIT-8b93ab?style=flat-square&labelColor=0e1220)](https://github.com/${slug}/blob/main/LICENSE)`,
      ].join(" ");
      return `#### ${t.stage} &nbsp;·&nbsp; [\`${t.npm}\`](https://github.com/${slug})

${badges}

${t.summary} ${t.extra}
`;
    })
    .join("\n");
}

function postsBlock(d) {
  const rows = d.posts.latest
    .map((p) => `| ${p.date} | [${p.title.replace(/\|/g, "\\|")}](${p.link}) |`)
    .join("\n");
  return `| | |
| --- | --- |
${rows}

<sub>${d.posts.count} posts and counting at [vengalath.com/blog](https://vengalath.com/blog/) · [RSS](https://vengalath.com/feed.xml)</sub>`;
}

/** Swap the text between a marker pair, leaving the markers in place. */
function replaceBlock(md, name, content) {
  const re = new RegExp(
    `(<!--START:${name}-->)[\\s\\S]*?(<!--END:${name}-->)`,
    "m"
  );
  if (!re.test(md)) throw new Error(`marker block "${name}" not found in README`);
  return md.replace(re, `$1\n${content}\n$2`);
}

/* -------------------------------------------------------------------- main */

async function main() {
  await mkdir(ASSETS, { recursive: true });
  const icons = JSON.parse(
    await readFile(path.join(ROOT, "scripts", "icons.json"), "utf8")
  );

  let d;
  if (DEMO) {
    d = demoData();
    console.log("demo mode: rendering from sample data, no network calls");
  } else {
    // demoData() only backstops a field with no cache yet, i.e. the very
    // first run in a fresh clone. Every run after that falls back to what
    // was last actually observed, cached below.
    const cache = await loadCache();
    const demoFallback = demoData();
    const cachedTool = (npm) =>
      cache?.tools?.find((t) => t.npm === npm) ??
      demoFallback.tools.find((t) => t.npm === npm);

    const tools = await Promise.all(
      TOOLS.map(async (tool) => {
        const prior = cachedTool(tool.npm);
        return {
          ...tool,
          ...(await safe(`npm ${tool.npm}`, () => fetchPackage(tool), {
            version: prior.version,
            downloads: prior.downloads,
          })),
          ...(await safe(`repo ${tool.owner}/${tool.repo}`, () => fetchRepo(tool), {
            stars: prior.stars,
            forks: prior.forks,
          })),
        };
      })
    );
    d = {
      tools,
      account: await safe(
        "account",
        fetchAccount,
        cache?.account ?? demoFallback.account
      ),
      contrib: await safe(
        "contributions",
        fetchContributions,
        cache?.contrib ?? demoFallback.contrib
      ),
      posts: await safe("feed", fetchPosts, cache?.posts ?? demoFallback.posts),
    };

    const nextCache = {
      tools: tools.map((t) => ({
        npm: t.npm,
        version: t.version,
        downloads: t.downloads,
        stars: t.stars,
        forks: t.forks,
      })),
      account: d.account,
      contrib: d.contrib,
      posts: d.posts,
    };
    if (
      await writeIfChanged(CACHE_FILE, JSON.stringify(nextCache, null, 2) + "\n")
    ) {
      console.log("cache: scripts/cache.json updated");
    }
  }

  const written = [];
  for (const [name, render] of [
    ["banner", (t) => banner(t)],
    ["stats", (t) => openSourceCard(t, d)],
    ["activity", (t) => activityCard(t, d)],
    ["highlights", (t) => highlightsCard(t, d)],
    ["stack", (t) => stackCard(t, icons)],
  ]) {
    for (const variant of ["dark", "light"]) {
      const file = path.join(ASSETS, `${name}-${variant}.svg`);
      if (await writeIfChanged(file, render(THEMES[variant])))
        written.push(path.relative(ROOT, file));
    }
  }

  let md = await readFile(README, "utf8");
  md = replaceBlock(md, "tools", toolsBlock(d));
  md = replaceBlock(md, "posts", postsBlock(d));
  if (await writeIfChanged(README, md)) written.push("README.md");

  console.log(
    written.length ? `updated:\n  ${written.join("\n  ")}` : "no changes"
  );

  if (failures.length) {
    console.error(`\n${failures.length} source(s) failed, previous values kept:`);
    for (const f of failures) console.error(`  ${f}`);
    process.exitCode = 1;
  }
}

await main();
