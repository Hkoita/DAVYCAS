// Générateur statique bilingue (FR / EN) du site DAVYCAS International.
// Entrée : src/ (pages, partiels, données, CSS, JS, fichiers statiques) + design/tokens.json + src/i18n/en.json
// Sortie : dist/  — français à la racine (/about.html…), anglais sous /en/ (/en/about.html…)
//
// Syntaxe des gabarits :
//   <!--{ "file": "about.html", "title": "[[...]]", ... }-->  métadonnées de la page (JSON), en tête du fichier
//   [[Texte français]]        texte traduisible : remplacé par sa traduction anglaise (src/i18n/en.json) en version EN
//   {{> nom}}                 insère src/partials/nom.html
//   {{img cle sizes="..." class="..." loading="eager" priority}}   image responsive AVIF/WebP (200 Ko max)
//   {{icon nom}}              icône SVG du sprite
//   {{base}}                  préfixe de langue pour les liens internes : "/" ou "/en/"
//   {{var}}                   variable (src/data/site.json, métadonnées de page)
//   {{#each liste}}…{{.champ}}…{{/each}}   boucle

import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const FINAL_DIST = path.join(ROOT, 'dist');
const DIST = path.join(ROOT, 'dist.tmp'); // construit à part, puis remplace dist/ seulement si tout réussit
const CACHE = path.join(ROOT, '.cache', 'images');
const MAX_KB = 200;
const LANGS = ['fr', 'en'];
const ALLOW_MISSING = process.argv.includes('--allow-missing');

const read = (p) => fs.readFile(p, 'utf8');
const readJSON = async (p) => JSON.parse(await read(p));
const write = async (p, data) => { await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, data); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const norm = (s) => s.replace(/\s+/g, ' ').trim();

const site = await readJSON(path.join(SRC, 'data', 'site.json'));
const images = await readJSON(path.join(SRC, 'data', 'images.json'));
const en = existsSync(path.join(SRC, 'i18n', 'en.json')) ? await readJSON(path.join(SRC, 'i18n', 'en.json')) : {};
const missing = new Map();

// ---------- Traduction ----------
function t(text, lang) {
  const key = norm(text);
  if (lang === 'fr' || !key) return text;
  if (key in en && en[key]) return en[key];
  missing.set(key, '');
  return text;
}
const translate = (html, lang) => html.replace(/\[\[([\s\S]*?)\]\]/g, (_, s) => t(s, lang));

// ---------- 1. Tokens -> variables CSS ----------
async function tokensCSS() {
  const tokens = await readJSON(path.join(ROOT, 'design', 'tokens.json'));
  const lines = [];
  for (const [group, entries] of Object.entries(tokens)) {
    if (group.startsWith('$')) continue;
    for (const [name, tok] of Object.entries(entries)) lines.push(`  --${group}-${name}: ${tok.value};`);
  }
  return `/* Généré depuis design/tokens.json — ne pas modifier à la main */\n:root {\n${lines.join('\n')}\n}\n`;
}

// ---------- 2. Police auto-hébergée : Montserrat (variable) ----------
async function fontsCSS() {
  const nm = path.join(ROOT, 'node_modules', '@fontsource-variable', 'montserrat', 'files');
  await fs.mkdir(path.join(DIST, 'assets/fonts'), { recursive: true });
  for (const [from, to] of [['montserrat-latin-wght-normal.woff2', 'montserrat.woff2'], ['montserrat-latin-ext-wght-normal.woff2', 'montserrat-ext.woff2']]) {
    await fs.copyFile(path.join(nm, from), path.join(DIST, 'assets/fonts', to));
  }
  return `/* Montserrat, police unique du site (licence SIL OFL), auto-hébergée */
@font-face { font-family: "Montserrat"; src: url("/assets/fonts/montserrat.woff2") format("woff2"); font-weight: 300 900; font-style: normal; font-display: swap; unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
@font-face { font-family: "Montserrat"; src: url("/assets/fonts/montserrat-ext.woff2") format("woff2"); font-weight: 300 900; font-style: normal; font-display: swap; unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
@font-face { font-family: "Montserrat Fallback"; src: local("Arial"), local("Helvetica"), local("Liberation Sans"); size-adjust: 112%; ascent-override: 85%; descent-override: 22%; }
`;
}

// ---------- 3. Images responsive ----------
const imageMeta = {};
async function encode(buf, w, fmt) {
  const qs = fmt === 'avif' ? [55, 46, 38, 32, 26, 20] : [74, 64, 54, 46, 38, 30, 24];
  let out;
  for (const q of qs) {
    out = await sharp(buf).resize({ width: w, withoutEnlargement: true })[fmt]({ quality: q, effort: fmt === 'avif' ? 4 : 5 }).toBuffer();
    if (out.length <= MAX_KB * 1024) return out;
  }
  throw new Error(`Image au-dessus de ${MAX_KB} Ko même compressée : ${w}px ${fmt}`);
}
async function buildImages() {
  await fs.mkdir(CACHE, { recursive: true });
  await fs.mkdir(path.join(DIST, 'assets/img'), { recursive: true });
  for (const [key, img] of Object.entries(images)) {
    const src = path.join(ROOT, img.src);
    const sig = createHash('sha1').update(JSON.stringify(img) + (await fs.stat(src)).mtimeMs).digest('hex').slice(0, 8);
    let pipeline = sharp(src).rotate();
    if (img.crop) {
      const m = await sharp(src).metadata();
      const [x, y, w, h] = img.crop;
      const left = Math.round(x * m.width), top = Math.round(y * m.height);
      pipeline = pipeline.extract({ left, top, width: Math.min(Math.round(w * m.width), m.width - left), height: Math.min(Math.round(h * m.height), m.height - top) });
    }
    const buf = await pipeline.toBuffer();
    const meta = await sharp(buf).metadata();
    const widths = (img.widths || [480, 960, 1440, 2000]).filter((w) => w <= meta.width);
    if (!widths.length) widths.push(meta.width);
    imageMeta[key] = { widths, ratio: meta.height / meta.width, alt: img.alt || '', position: img.position || '' };
    for (const w of widths) for (const fmt of ['avif', 'webp']) {
      const name = `${key}-${w}.${fmt}`;
      const cached = path.join(CACHE, `${key}-${sig}-${w}.${fmt}`);
      if (!existsSync(cached)) await fs.writeFile(cached, await encode(buf, w, fmt));
      await fs.copyFile(cached, path.join(DIST, 'assets/img', name));
    }
  }
}
function imgTag(key, attrs, lang) {
  const m = imageMeta[key];
  if (!m) throw new Error(`Image inconnue : ${key}`);
  const sizes = attrs.sizes || '100vw';
  const set = (fmt) => m.widths.map((w) => `/assets/img/${key}-${w}.${fmt} ${w}w`).join(', ');
  const largest = m.widths[m.widths.length - 1];
  const eager = attrs.loading === 'eager';
  const alt = attrs.alt !== undefined ? (attrs.alt ? t(attrs.alt, lang) : '') : t(m.alt, lang);
  const style = m.position ? ` style="object-position:${m.position}"` : '';
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="/assets/img/${key}-${m.widths[Math.min(1, m.widths.length - 1)]}.webp" width="${largest}" height="${Math.round(largest * m.ratio)}" alt="${esc(alt)}"${attrs.class ? ` class="${attrs.class}"` : ''} loading="${eager ? 'eager' : 'lazy'}" decoding="${eager ? 'sync' : 'async'}"${attrs.priority ? ' fetchpriority="high"' : ''}${style}></picture>`;
}

// ---------- 4. Gabarits ----------
const partials = {};
const parseAttrs = (s) => { const o = {}; s.replace(/(\w[\w-]*)(?:="([^"]*)")?/g, (_, k, v) => { o[k] = v === undefined ? true : v; return ''; }); return o; };
const lookup = (ctx, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
function render(tpl, ctx, depth = 0) {
  if (depth > 8) throw new Error('Inclusion trop profonde');
  let out = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Partiel inconnu : ${name}`);
    return render(partials[name], ctx, depth + 1);
  });
  out = out.replace(/\{\{#each\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, list, body) => (lookup(ctx, list) || [])
    .map((item, i) => render(body.replace(/\{\{\.([\w.]+)\}\}/g, (__, k) => { const v = k === 'index' ? i + 1 : lookup(item, k); return v == null ? '' : String(v); }), ctx, depth + 1)).join(''));
  out = out.replace(/\{\{img\s+([\w-]+)([^}]*)\}\}/g, (_, key, rest) => imgTag(key, parseAttrs(rest.trim()), ctx.lang));
  out = out.replace(/\{\{icon\s+([\w-]+)\s*\}\}/g, (_, n) => `<svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#${n}"></use></svg>`);
  out = out.replace(/\{\{([\w.]+)\}\}/g, (m, key) => { const v = lookup(ctx, key); return v == null ? m : String(v); });
  return out;
}

// ---------- 5. Pages ----------
const pages = [];
async function collectPages() {
  for (const f of (await fs.readdir(path.join(SRC, 'pages'))).filter((x) => x.endsWith('.html')).sort()) {
    const raw = await read(path.join(SRC, 'pages', f));
    const m = raw.match(/^<!--(\{[\s\S]*?\})-->\s*/);
    if (!m) throw new Error(`Métadonnées manquantes : ${f}`);
    pages.push({ meta: JSON.parse(m[1]), body: raw.slice(m[0].length), src: f });
  }
}
const urlFor = (file, lang) => (lang === 'fr' ? '/' : '/en/') + (file === 'index.html' ? '' : file);
const outFor = (file, lang) => path.join(DIST, lang === 'fr' ? '' : 'en', file);

async function buildPages() {
  const layout = await read(path.join(SRC, 'layout.html'));
  const inlineHashes = new Set();
  for (const lang of LANGS) {
    for (const page of pages) {
      const meta = page.meta;
      const other = lang === 'fr' ? 'en' : 'fr';
      const ctx = {
        ...site, site, page: meta, lang,
        base: lang === 'fr' ? '/' : '/en/',
        htmlLang: lang,
        ogLocale: lang === 'fr' ? 'fr_FR' : 'en_US',
        url: site.url + urlFor(meta.file, lang),
        urlFr: site.url + urlFor(meta.file, 'fr'),
        urlEn: site.url + urlFor(meta.file, 'en'),
        altUrl: urlFor(meta.file, other),
        altLang: other.toUpperCase(),
        altLangCode: other,
        langCur: lang.toUpperCase(),
        altLangName: other === 'en' ? 'English' : 'Français',
        bodyClass: meta.bodyClass || '',
        robots: meta.noindex ? '<meta name="robots" content="noindex">' : '',
        canonicalTag: meta.noindex ? '' : `<link rel="canonical" href="${site.url + urlFor(meta.file, lang)}">\n  <link rel="alternate" hreflang="fr" href="${site.url + urlFor(meta.file, 'fr')}">\n  <link rel="alternate" hreflang="en" href="${site.url + urlFor(meta.file, 'en')}">`,
        ogImage: `${site.url}/assets/img/${meta.og || 'og'}-${(imageMeta[meta.og || 'og'] || { widths: [1200] }).widths.slice(-2)[0]}.webp`,
        preload: (() => {
          const m = meta.lcp && imageMeta[meta.lcp];
          if (!m) return '';
          return `<link rel="preload" as="image" type="image/avif" imagesrcset="${m.widths.map((w) => `/assets/img/${meta.lcp}-${w}.avif ${w}w`).join(', ')}" imagesizes="100vw" fetchpriority="high">`;
        })(),
        ld: meta.home ? `<script type="application/ld+json">${JSON.stringify(site.organizationLD)}</script>` : '',
      };
      let html = render(layout, { ...ctx, content: '\u0000CONTENT\u0000' });
      html = html.replace('\u0000CONTENT\u0000', () => render(page.body, ctx));
      html = translate(html, lang);
      html = html.replace(new RegExp(`data-nav="${meta.nav || '__none__'}"`, 'g'), `data-nav="${meta.nav}" aria-current="page"`);
      const leftover = html.match(/\{\{[^}]+\}\}|\[\[|\]\]/);
      if (leftover) throw new Error(`Gabarit non résolu « ${leftover[0]} » dans ${page.src} (${lang})`);
      for (const s of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) inlineHashes.add(createHash('sha256').update(s[1]).digest('base64'));
      await write(outFor(meta.file, lang), html);
    }
  }
  return inlineHashes;
}

// ---------- 6. Fichiers techniques ----------
async function copyDir(from, to) {
  if (!existsSync(from)) return;
  for (const e of await fs.readdir(from, { withFileTypes: true })) {
    const a = path.join(from, e.name); const b = path.join(to, e.name);
    if (e.isDirectory()) await copyDir(a, b); else { await fs.mkdir(to, { recursive: true }); await fs.copyFile(a, b); }
  }
}
async function buildStatic(inlineHashes) {
  const css = (await tokensCSS()) + '\n' + (await fontsCSS()) + '\n' + (await read(path.join(SRC, 'css', 'main.css')));
  const v = createHash('sha1').update(css).digest('hex').slice(0, 8);
  await write(path.join(DIST, 'assets/css/site.css'), css);
  await copyDir(path.join(SRC, 'js'), path.join(DIST, 'assets/js'));
  await copyDir(path.join(SRC, 'static'), DIST);
  // Versionnage des ressources (cache navigateur long sans risque de version périmée)
  const js = await read(path.join(SRC, 'js', 'main.js'));
  const vj = createHash('sha1').update(js).digest('hex').slice(0, 8);
  for (const lang of LANGS) for (const p of pages) {
    const f = outFor(p.meta.file, lang);
    await write(f, (await read(f)).replace('/assets/css/site.css', `/assets/css/site.css?v=${v}`).replace('/assets/js/main.js', `/assets/js/main.js?v=${vj}`));
  }
  const ht = path.join(DIST, '.htaccess');
  await write(ht, (await read(ht)).replace('REPLACE_INLINE_HASHES', [...inlineHashes].map((h) => `'sha256-${h}'`).join(' ')));
  const urls = pages.filter((p) => !p.meta.noindex).map((p) => `  <url><loc>${site.url + urlFor(p.meta.file, 'fr')}</loc><xhtml:link rel="alternate" hreflang="fr" href="${site.url + urlFor(p.meta.file, 'fr')}"/><xhtml:link rel="alternate" hreflang="en" href="${site.url + urlFor(p.meta.file, 'en')}"/></url>\n  <url><loc>${site.url + urlFor(p.meta.file, 'en')}</loc><xhtml:link rel="alternate" hreflang="fr" href="${site.url + urlFor(p.meta.file, 'fr')}"/><xhtml:link rel="alternate" hreflang="en" href="${site.url + urlFor(p.meta.file, 'en')}"/></url>`).join('\n');
  await write(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls}\n</urlset>\n`);
  await write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
}

// ---------- Exécution ----------
const t0 = Date.now();
await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(DIST, { recursive: true });
await buildImages();
for (const f of await fs.readdir(path.join(SRC, 'partials'))) partials[f.replace('.html', '')] = await read(path.join(SRC, 'partials', f));
await collectPages();
const hashes = await buildPages();
if (missing.size) {
  await write(path.join(ROOT, '.cache', 'i18n-missing.json'), JSON.stringify(Object.fromEntries(missing), null, 2) + '\n');
  const msg = `${missing.size} texte(s) sans traduction anglaise : voir .cache/i18n-missing.json`;
  if (!ALLOW_MISSING) { await fs.rm(DIST, { recursive: true, force: true }); throw new Error(msg); }
  console.warn('Attention : ' + msg);
}
await buildStatic(hashes);
await fs.rm(FINAL_DIST, { recursive: true, force: true });
await fs.rename(DIST, FINAL_DIST);
console.log(`Site généré dans dist/ : ${pages.length} pages × ${LANGS.length} langues, ${Object.keys(imageMeta).length} images, en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
