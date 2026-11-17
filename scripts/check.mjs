// Vérification du site généré (dist/) dans Chrome : captures 390/768/1440, débordements,
// erreurs console, requêtes en échec, titres, images sans alt, cibles tactiles.
// Usage : node scripts/check.mjs [chemin ...] [--out qa/AAAA-MM-JJ] [--full] [--no-shots]
import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const OUT = path.join(ROOT, opt('--out') || `qa/${new Date().toISOString().slice(0, 10)}`);
const FULL = args.includes('--full');
const SHOTS = !args.includes('--no-shots');
let paths = args.filter((a, i) => !a.startsWith('--') && !['--out'].includes(args[i - 1]));
if (!paths.length) {
  const sitemap = await fs.readFile(path.join(DIST, 'sitemap.xml'), 'utf8');
  paths = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+([^<]*)<\/loc>/g)].map((m) => m[1]);
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.woff2': 'font/woff2' };
const server = http.createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  try { res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }).end(await fs.readFile(path.join(DIST, p))); }
  catch { res.writeHead(404).end(await fs.readFile(path.join(DIST, '404.html')).catch(() => '')); }
}).listen(0, '127.0.0.1');
await new Promise((r) => server.once('listening', r));
const base = `http://127.0.0.1:${server.address().port}`;
await fs.mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
let problems = 0;
for (const p of paths) {
  for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errors.push('JS: ' + e.message.slice(0, 160)));
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/favicon.ico')) errors.push(`${r.status()} ${r.url().replace(base, '')}`); });
    await page.goto(base + p, { waitUntil: 'load' });
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 400) { window.scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => setTimeout(r, 60)); } window.scrollTo({ top: 0, behavior: 'instant' }); });
    await page.waitForTimeout(1300);
    const info = await page.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const overflow = document.documentElement.scrollWidth > vw + 1;
      const offenders = overflow ? [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > vw + 1 && r.width > 0 && !e.closest('.hscroll__track'); }).slice(0, 4).map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`) : [];
      const h1 = document.querySelectorAll('h1').length;
      const noAlt = [...document.images].filter((i) => !i.hasAttribute('alt')).length;
      const small = [...document.querySelectorAll('a, button, input, select, textarea')].filter((el) => {
        const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
        if (!r.width || cs.visibility === 'hidden' || el.closest('p, li.news__item, td, .prose, label, .hp') || el.closest('[inert]')) return false;
        return r.height < 43.5 && el.type !== 'checkbox';
      }).slice(0, 5).map((el) => `${el.tagName.toLowerCase()} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}" ${Math.round(el.getBoundingClientRect().height)}px`);
      const levels = [...document.querySelectorAll('h1,h2,h3,h4')].map((x) => +x.tagName[1]);
      const skips = levels.filter((l, i) => i && l > levels[i - 1] + 1).length;
      return { overflow, scrollW: document.documentElement.scrollWidth, offenders, h1, noAlt, small, skips, title: document.title };
    });
    const issues = [];
    if (info.overflow) issues.push(`débordement ${info.scrollW}px (${info.offenders.join(', ')})`);
    if (info.h1 !== 1) issues.push(`${info.h1} h1`);
    if (info.noAlt) issues.push(`${info.noAlt} img sans alt`);
    if (info.small.length) issues.push(`cibles < 44px : ${info.small.join(' ; ')}`);
    if (info.skips) issues.push(`${info.skips} saut(s) de niveau de titre`);
    if (errors.length) issues.push(`console/réseau : ${[...new Set(errors)].join(' | ')}`);
    problems += issues.length;
    const slug = (p === '/' ? 'accueil' : p.replace(/^\/|\/$/g, '').replace(/[/.]/g, '-')) + `-${w}`;
    if (SHOTS) await page.screenshot({ path: path.join(OUT, `${slug}.png`), fullPage: FULL, timeout: 60000 });
    console.log(`${issues.length ? '✗' : '✓'} ${p} ${w}px${issues.length ? '\n    ' + issues.join('\n    ') : ''}`);
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log(`\n${problems} problème(s). Captures : ${path.relative(ROOT, OUT)}`);
process.exitCode = problems ? 1 : 0;
