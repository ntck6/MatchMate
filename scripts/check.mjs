// MatchMate CI checks: no dependencies, run with `npm run check`.
// 1. Every JS file parses.
// 2. Every local href/src in the HTML pages points to a file that exists.
// 3. Every #i-* icon used in HTML/JS is defined in the sprite (js/layout.js).
// 4. EN and VI have the same i18n keys, and every key used in markup exists.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const fail = (msg) => errors.push(msg);
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');

function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

const jsFiles = walk(join(ROOT, 'js'), '.js');
const htmlFiles = readdirSync(ROOT).filter((f) => f.endsWith('.html')).map((f) => join(ROOT, f));
const read = (p) => readFileSync(p, 'utf8');

// 1. JS syntax
for (const f of jsFiles) {
  try { new vm.Script(read(f), { filename: rel(f) }); }
  catch (e) { fail(`[syntax] ${rel(f)}: ${e.message}`); }
}

// 2. Local links and assets
const ATTR = /\b(?:href|src)="([^"]+)"/g;
for (const f of htmlFiles) {
  const html = read(f);
  for (const [, url] of html.matchAll(ATTR)) {
    if (/^(https?:|data:|mailto:|tel:|#|\/\/)/.test(url)) continue;
    const path = url.split(/[?#]/)[0];
    if (!path) continue;
    if (!existsSync(join(ROOT, path))) fail(`[link] ${rel(f)} → ${url} (file not found)`);
  }
}
// links built in JS strings, e.g. 'feed.html?focus=' or 'join.html?id='
for (const f of jsFiles) {
  for (const [, page] of read(f).matchAll(/['"]([a-z]+\.html)(?:[?#'"])/g)) {
    if (!existsSync(join(ROOT, page))) fail(`[link] ${rel(f)} → ${page} (page not found)`);
  }
}

// 3. Icons
const layout = read(join(ROOT, 'js/layout.js'));
const defined = new Set([...layout.matchAll(/<symbol id=\\?"(i-[\w-]+)/g)].map((m) => m[1]));
const used = new Map();
for (const f of [...htmlFiles, ...jsFiles]) {
  for (const [, id] of read(f).matchAll(/#(i-[a-z][\w-]*)/g)) if (!used.has(id)) used.set(id, rel(f));
  // icon('name') helper calls
  for (const [, id] of read(f).matchAll(/\bicon\('([\w-]+)'/g)) if (!used.has('i-' + id)) used.set('i-' + id, rel(f));
}
// dynamic glyph names chosen at runtime
['i-ball', 'i-shuttle', 'i-users', 'i-hourglass', 'i-check', 'i-x', 'i-zap', 'i-shield', 'i-moon', 'i-sun'].forEach((id) => used.set(id, used.get(id) || 'runtime'));
for (const [id, where] of used) if (!defined.has(id)) fail(`[icon] #${id} used in ${where} but not defined in js/layout.js`);

// 4. i18n parity
const i18n = read(join(ROOT, 'js/i18n.js'));
const viAt = i18n.indexOf('\n    vi: {');
if (viAt < 0) fail('[i18n] could not find the "vi" block in js/i18n.js');
const keysOf = (src) => new Set([...src.matchAll(/^\s+'([\w.]+)':/gm)].map((m) => m[1]));
const en = keysOf(i18n.slice(0, viAt));
const vi = keysOf(i18n.slice(viAt));
for (const k of en) if (!vi.has(k)) fail(`[i18n] "${k}" has English text but no Vietnamese`);
for (const k of vi) if (!en.has(k)) fail(`[i18n] "${k}" has Vietnamese text but no English`);
for (const f of htmlFiles) {
  const html = read(f);
  for (const [, k] of html.matchAll(/data-i18n="([\w.]+)"/g)) if (!en.has(k)) fail(`[i18n] ${rel(f)} uses missing key "${k}"`);
  for (const [, pairs] of html.matchAll(/data-i18n-attr="([^"]+)"/g)) {
    for (const pair of pairs.split(';')) { const k = (pair.split(':')[1] || '').trim(); if (k && !en.has(k)) fail(`[i18n] ${rel(f)} uses missing key "${k}"`); }
  }
}
for (const f of jsFiles) {
  // complete keys only: t('feed.count', …) — skips dynamic ones like t('sport.' + m.sport)
  for (const [, k] of read(f).matchAll(/\bt\('([\w.]+)'\s*[,)]/g)) if (!en.has(k)) fail(`[i18n] ${rel(f)} uses missing key "${k}"`);
}

// Report
const summary = `${jsFiles.length} JS files, ${htmlFiles.length} pages, ${defined.size} icons, ${en.size} i18n keys`;
if (errors.length) {
  console.error(`✗ ${errors.length} problem(s) found (${summary}):\n` + errors.map((e) => '  ' + e).join('\n'));
  process.exit(1);
}
console.log(`✓ All checks passed (${summary}).`);
