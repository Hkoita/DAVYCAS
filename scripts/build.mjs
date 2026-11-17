// Générateur statique du site DAVYCAS International.
// Entrée : src/ (pages, gabarits, données, CSS, JS) + design/tokens.json
// Sortie : dist/ (HTML statique prêt à envoyer sur LWS par FTP)
//
// Syntaxe des gabarits (volontairement minimale) :
//   <!--{ "title": "...", ... }-->   en tête d'une page : ses métadonnées (JSON)
//   {{> nom}}                         insère src/partials/nom.html
//   {{img cle sizes="..." class="..." loading="lazy|eager" priority}}   image responsive AVIF/WebP
//   {{var}}                           variable de page ou de site (src/data/site.json)
//   {{#each projets}}...{{/each}}     boucle sur une liste de site.json / projets.json ({{.champ}})

import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { createHash } from 'node:crypto';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const CACHE = path.join(ROOT, '.cache', 'images');
const read = (p) => fs.readFile(p, 'utf8');
const readJSON = async (p) => JSON.parse(await read(p));
const write = async (p, data) => { await fs.mkdir(path.dirname(p), { recursive: true }); await fs.writeFile(p, data); };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const site = await readJSON(path.join(SRC, 'data', 'site.json'));
const images = await readJSON(path.join(SRC, 'data', 'images.json'));
const projets = await readJSON(path.join(SRC, 'data', 'projets.json'));
site.projets = projets;
const MAX_KB = 200;

// ---------- 1. Tokens -> variables CSS ----------
async function buildTokens() {
  const tokens = await readJSON(path.join(ROOT, 'design', 'tokens.json'));
  const lines = [];
  for (const [group, entries] of Object.entries(tokens)) {
    if (group.startsWith('$')) continue;
    for (const [name, t] of Object.entries(entries)) lines.push(`  --${group}-${name}: ${t.value};`);
  }
  const css = `/* Généré par scripts/build.mjs depuis design/tokens.json — ne pas modifier à la main */\n:root {\n${lines.join('\n')}\n}\n`;
  await write(path.join(DIST, 'assets/css/tokens.css'), css);
  return tokens;
}

// ---------- 2. Polices auto-hébergées ----------
async function buildFonts() {
  const nm = path.join(ROOT, 'node_modules');
  const files = [
    ['@fontsource-variable/instrument-sans/files/instrument-sans-latin-wght-normal.woff2', 'instrument-sans-var.woff2'],
    ['@fontsource/instrument-serif/files/instrument-serif-latin-400-italic.woff2', 'instrument-serif-italic.woff2'],
    ['@fontsource/instrument-serif/files/instrument-serif-latin-400-normal.woff2', 'instrument-serif.woff2'],
  ];
  for (const [from, to] of files) await fs.copyFile(path.join(nm, from), path.join(DIST, 'assets/fonts', to)).catch(async () => {
    await fs.mkdir(path.join(DIST, 'assets/fonts'), { recursive: true });
    await fs.copyFile(path.join(nm, from), path.join(DIST, 'assets/fonts', to));
  });
  const css = `/* Polices auto-hébergées (licence SIL OFL) */
@font-face { font-family: "Instrument Sans"; src: url("/assets/fonts/instrument-sans-var.woff2") format("woff2"); font-weight: 400 700; font-style: normal; font-display: optional; }
@font-face { font-family: "Instrument Sans Fallback"; src: local("Arial"), local("Helvetica"), local("Liberation Sans"); size-adjust: 98%; }
@font-face { font-family: "Instrument Serif"; src: url("/assets/fonts/instrument-serif-italic.woff2") format("woff2"); font-weight: 400; font-style: italic; font-display: optional; }
@font-face { font-family: "Instrument Serif"; src: url("/assets/fonts/instrument-serif.woff2") format("woff2"); font-weight: 400; font-style: normal; font-display: swap; }
`;
  await write(path.join(DIST, 'assets/css/fonts.css'), css);
}

// ---------- 3. Images responsive (AVIF + WebP, 200 Ko max) ----------
const imageMeta = {};
async function encode(buf, w, fmt) {
  const qs = fmt === "avif" ? [52, 44, 38, 32, 26] : [72, 62, 54, 46, 38, 30];
  let out;
  for (const q of qs) {
    out = await sharp(buf).resize({ width: w, withoutEnlargement: true })[fmt]({ quality: q, effort: fmt === "avif" ? 4 : 5 }).toBuffer();
    if (out.length <= MAX_KB * 1024) return out;
  }
  return out;
}
async function buildImages() {
  await fs.mkdir(CACHE, { recursive: true });
  for (const [key, img] of Object.entries(images)) {
    const src = path.join(ROOT, img.src);
    const stat = await fs.stat(src);
    let pipeline = sharp(src).rotate();
    if (img.crop) {
      const m = await sharp(src).metadata();
      const [x, y, w, h] = img.crop; // fractions 0..1
      const left = Math.round(x * m.width), top = Math.round(y * m.height);
      pipeline = pipeline.extract({ left, top, width: Math.min(Math.round(w * m.width), m.width - left), height: Math.min(Math.round(h * m.height), m.height - top) });
    }
    const buf = await pipeline.toBuffer();
    const meta = await sharp(buf).metadata();
    const widths = (img.widths || [480, 960, 1440, 2000]).filter((w) => w <= meta.width);
    if (!widths.length) widths.push(meta.width);
    imageMeta[key] = { widths, width: meta.width, height: meta.height, ratio: meta.height / meta.width, alt: img.alt || '', position: img.position || 'center' };
    for (const w of widths) for (const fmt of ['avif', 'webp']) {
      const name = `${key}-${w}.${fmt}`;
      const cached = path.join(CACHE, name);
      const fresh = existsSync(cached) && (await fs.stat(cached)).mtimeMs > stat.mtimeMs;
      if (!fresh) await fs.writeFile(cached, await encode(buf, w, fmt));
      await fs.mkdir(path.join(DIST, 'assets/img'), { recursive: true });
      await fs.copyFile(cached, path.join(DIST, 'assets/img', name));
    }
  }
}
function imgTag(key, attrs) {
  const m = imageMeta[key];
  if (!m) throw new Error(`Image inconnue : ${key}`);
  const sizes = attrs.sizes || '100vw';
  const set = (fmt) => m.widths.map((w) => `/assets/img/${key}-${w}.${fmt} ${w}w`).join(', ');
  const largest = m.widths[m.widths.length - 1];
  const h = Math.round(largest * m.ratio);
  const eager = attrs.loading === 'eager';
  const alt = attrs.alt !== undefined ? attrs.alt : m.alt;
  const style = m.position !== 'center' ? ` style="object-position: ${m.position}"` : '';
  return `<picture><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><source type="image/webp" srcset="${set('webp')}" sizes="${sizes}"><img src="/assets/img/${key}-${m.widths[Math.min(1, m.widths.length - 1)]}.webp" width="${largest}" height="${h}" alt="${esc(alt)}"${attrs.class ? ` class="${attrs.class}"` : ''} loading="${eager ? 'eager' : 'lazy'}" decoding="${eager ? 'sync' : 'async'}"${attrs.priority ? ' fetchpriority="high"' : ''}${style}></picture>`;
}

// ---------- 4. Gabarits ----------
const partials = {};
async function loadPartials() {
  for (const f of await fs.readdir(path.join(SRC, 'partials'))) partials[f.replace('.html', '')] = await read(path.join(SRC, 'partials', f));
}
function parseAttrs(s) {
  const out = {};
  s.replace(/(\w[\w-]*)(?:="([^"]*)")?/g, (_, k, v) => { out[k] = v === undefined ? true : v; return ''; });
  return out;
}
function lookup(ctx, key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), ctx);
}
function render(tpl, ctx, depth = 0) {
  if (depth > 8) throw new Error('Inclusion trop profonde');
  let out = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, name) => {
    if (!(name in partials)) throw new Error(`Partiel inconnu : ${name}`);
    return render(partials[name], ctx, depth + 1);
  });
  out = out.replace(/\{\{#each\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/each\}\}/g, (_, list, body) => {
    const items = lookup(ctx, list) || [];
    return items.map((item, i) => render(body.replace(/\{\{\.([\w.]+)\}\}/g, (__, k) => {
      const v = k === 'index' ? i + 1 : lookup(item, k);
      return v == null ? '' : String(v);
    }), { ...ctx, item }, depth + 1)).join('');
  });
  out = out.replace(/\{\{#if\s+([\w.]+)\s*\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, body) => {
    const v = lookup(ctx, key);
    return v && (!Array.isArray(v) || v.length) ? body : '';
  });
  out = out.replace(/\{\{img\s+([\w-]+)([^}]*)\}\}/g, (_, key, rest) => imgTag(key, parseAttrs(rest.trim())));
  out = out.replace(/\{\{icon\s+([\w-]+)\s*\}\}/g, (_, name) => `<svg class="icon" aria-hidden="true" focusable="false"><use href="/assets/icons.svg#${name}"></use></svg>`);
  out = out.replace(/\{\{([\w.]+)\}\}/g, (m, key) => {
    const v = lookup(ctx, key);
    return v == null ? m : String(v);
  });
  return out;
}

// Découpe en mots faite à la génération (et non dans le navigateur) pour éviter tout décalage
// de mise en page : titres [data-words] et phrases .lightup.
function splitWords(html) {
  return html.replace(/<(h1|h2|h3|p)(\s[^>]*?(?:data-words|class="[^"]*\blightup\b)[^>]*)>([\s\S]*?)<\/\1>/g, (m, tag, attrs, inner) => {
    let i = 0;
    const out = inner.replace(/(<[^>]+>)|([^<]+)/g, (seg, t, text) => {
      if (t) return t;
      return text.replace(/[^\s]+/g, (w) => `<span class="w" style="--i:${i++}">${w}</span>`);
    });
    return `<${tag}${attrs}>${out}</${tag}>`;
  });
}

// ---------- 5. Pages ----------
const pages = [];
async function collectPages(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) await collectPages(p);
    else if (entry.name.endsWith('.html')) {
      const raw = await read(p);
      const m = raw.match(/^<!--(\{[\s\S]*?\})-->\s*/);
      if (!m) throw new Error(`Métadonnées manquantes : ${p}`);
      pages.push({ meta: JSON.parse(m[1]), body: raw.slice(m[0].length), file: p });
    }
  }
}
function breadcrumbHTML(meta) {
  if (!meta.breadcrumb) return '';
  const items = [['Accueil', '/'], ...meta.breadcrumb];
  const li = items.map(([label, url], i) => i === items.length - 1
    ? `<li aria-current="page">${esc(label)}</li>`
    : `<li><a href="${url}">${esc(label)}</a></li>`).join('');
  return `<nav class="breadcrumb wrap" aria-label="Fil d'Ariane"><ol>${li}</ol></nav>`;
}
function breadcrumbLD(meta) {
  if (!meta.breadcrumb) return '';
  const items = [['Accueil', '/'], ...meta.breadcrumb];
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items.map(([name, url], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.url + url })) });
}
async function buildPages() {
  const layout = await read(path.join(SRC, 'layout.html'));
  for (const page of pages) {
    const meta = page.meta;
    const ctx = { ...site, page: meta, site };
    const body = render(page.body, ctx);
    const ogKey = meta.og || 'og-default';
    const html = render(layout, {
      ...ctx,
      content: '{{CONTENT}}',
      breadcrumb: '{{BREADCRUMB}}',
      canonical: site.url + meta.path,
      ogImage: `${site.url}/assets/img/${ogKey}-${imageMeta[ogKey] ? imageMeta[ogKey].widths[Math.min(2, imageMeta[ogKey].widths.length - 1)] : 960}.webp`,
      bodyClass: meta.bodyClass || '',
      ld: [meta.home ? JSON.stringify(site.organizationLD) : '', breadcrumbLD(meta)].filter(Boolean).map((j) => `<script type="application/ld+json">${j}</script>`).join('\n'),
      navCurrent: meta.nav || '',
      preload: (() => {
        const key = meta.lcp;
        const m = key && imageMeta[key];
        if (!m) return '';
        const set = m.widths.map((w) => `/assets/img/${key}-${w}.avif ${w}w`).join(', ');
        return `<link rel="preload" as="image" type="image/avif" imagesrcset="${set}" imagesizes="100vw" fetchpriority="high">`;
      })(),
      robots: meta.noindex ? '<meta name="robots" content="noindex">' : '',
    }).replace('{{BREADCRUMB}}', breadcrumbHTML(meta)).replace('{{CONTENT}}', body);
    // lien de navigation courant
    const finalHTML = splitWords(html).replace(new RegExp(`data-nav="${meta.nav || '__none__'}"`, 'g'), `data-nav="${meta.nav}" aria-current="page"`);
    const leftover = finalHTML.match(/\{\{[^}]+\}\}/);
    if (leftover) throw new Error(`Variable non résolue ${leftover[0]} dans ${page.file}`);
    if (/\[À CONFIRMER\]/.test(finalHTML)) throw new Error(`Contenu « [À CONFIRMER] » publié dans ${page.file}`);
    const out = meta.path.endsWith('/') ? path.join(DIST, meta.path, 'index.html') : path.join(DIST, meta.path);
    await write(out, finalHTML);
  }
}

// Pages de projets générées depuis src/data/projets.json
async function projectPages() {
  const tpl = await read(path.join(SRC, 'templates', 'projet.html'));
  for (const p of projets) {
    p.nophoto = !p.photo;
    p.contextSection = p.photo ? "" : "section--surface";
    const extra = p.extra ? await read(path.join(SRC, 'templates', p.extra)) : '';
    pages.push({
      meta: {
        title: `${p.name} — ${p.domain} | DAVYCAS International`,
        description: p.summary,
        path: `/nos-actions/${p.slug}/`,
        nav: 'actions',
        breadcrumb: [['Nos actions', '/nos-actions/'], [p.name, `/nos-actions/${p.slug}/`]],
        og: p.photo || 'og-default',
        lcp: p.photo || '',
        bodyClass: p.photo ? 'page-projet has-photo-hero' : 'page-projet',
      },
      body: tpl.replace('{{EXTRA}}', extra).replace(/\{\{p\.([\w]+)\}\}/g, (_, k) => {
        const v = p[k];
        if (Array.isArray(v)) return v.map((x) => `<li>${x}</li>`).join('');
        return v == null ? '' : String(v);
      }).replace(/\{\{#if p\.(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, k, b) => (p[k] && (!Array.isArray(p[k]) || p[k].length) ? b : '')),
      file: `projets.json#${p.slug}`,
    });
  }
}

// ---------- 6. Fichiers techniques ----------
async function buildStatic() {
  const copyDir = async (from, to) => {
    if (!existsSync(from)) return;
    for (const e of await fs.readdir(from, { withFileTypes: true })) {
      const a = path.join(from, e.name); const b = path.join(to, e.name);
      if (e.isDirectory()) await copyDir(a, b); else { await fs.mkdir(to, { recursive: true }); await fs.copyFile(a, b); }
    }
  };
  // Un seul fichier CSS (moins de requêtes bloquantes) : tokens + polices + feuille principale
  const cssParts = await Promise.all(['assets/css/tokens.css', 'assets/css/fonts.css'].map((f) => read(path.join(DIST, f))));
  await write(path.join(DIST, 'assets/css/site.css'), cssParts.join('\n') + '\n' + await read(path.join(SRC, 'css', 'main.css')));
  await copyDir(path.join(SRC, 'js'), path.join(DIST, 'assets/js'));
  await copyDir(path.join(SRC, 'static'), DIST);
  // .htaccess : empreinte CSP du petit script en ligne du gabarit
  const layoutSrc = await read(path.join(SRC, 'layout.html'));
  const inline = layoutSrc.match(/<script>([^<]*)<\/script>/)[1];
  const hash = createHash('sha256').update(inline).digest('base64');
  const ht = path.join(DIST, '.htaccess');
  await write(ht, (await read(ht)).replace('REPLACE_INLINE_HASH', hash));
  // sitemap + robots
  const urls = pages.filter((p) => !p.meta.noindex).map((p) => `  <url><loc>${site.url}${p.meta.path}</loc></url>`).join('\n');
  await write(path.join(DIST, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
  await write(path.join(DIST, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site.url}/sitemap.xml\n`);
}

// ---------- Exécution ----------
const t0 = Date.now();
await fs.rm(DIST, { recursive: true, force: true });
await fs.mkdir(DIST, { recursive: true });
await buildTokens();
await buildFonts();
await buildImages();
await loadPartials();
await collectPages(path.join(SRC, 'pages'));
await projectPages();
await buildPages();
await buildStatic();
console.log(`Site généré dans dist/ : ${pages.length} pages, ${Object.keys(imageMeta).length} images, en ${((Date.now() - t0) / 1000).toFixed(1)} s`);
