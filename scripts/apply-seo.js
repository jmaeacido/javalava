/**
 * Inject seoData head tags into mirrored HTML pages + write sitemap/robots.
 * Usage: node scripts/apply-seo.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  SITE_URL,
  seoData,
  pageHeadTags,
  canonicalUrl,
} = require('../js/seo');

const ROOT = path.join(__dirname, '..');

const MIRROR_DIRS = [
  ROOT,
  path.join(ROOT, 'site'),
  path.join(ROOT, 'site', 'concept-a'),
  path.join(ROOT, '_deploy', 'java-lava'),
  path.join(ROOT, '_deploy', 'java-lava', 'concept-a'),
];

const SEO_BLOCK_RE =
  /<title\b[^>]*>[\s\S]*?<\/title>\s*(?:<(?:meta|link)\b[^>]*?(?:name=["'](?:description|keywords|robots|twitter:[^"']+)["']|property=["']og:[^"']+["']|rel=["']canonical["'])[^>]*\/?>\s*)*/i;

function patchHtml(filePath, entry) {
  if (!fs.existsSync(filePath)) return false;
  const html = fs.readFileSync(filePath, 'utf8');
  const block = pageHeadTags(entry);
  if (!SEO_BLOCK_RE.test(html)) {
    console.warn(`skip (no title block): ${path.relative(ROOT, filePath)}`);
    return false;
  }
  const next = html.replace(SEO_BLOCK_RE, () => `${block}\n`);
  if (next === html) {
    console.warn(`unchanged: ${path.relative(ROOT, filePath)}`);
    return false;
  }
  fs.writeFileSync(filePath, next, 'utf8');
  console.log(`updated: ${path.relative(ROOT, filePath)}`);
  return true;
}

function writeSitemap() {
  const publicEntries = Object.values(seoData).filter((e) => !e.noIndex);
  const urls = publicEntries
    .map((entry) => {
      const loc = canonicalUrl(entry.path).replace(/\/$/, entry.path === '/' ? '/' : '');
      const priority =
        entry.path === '/' ? '1.0' : entry.path.startsWith('/privacy') || entry.path.includes('policy') || entry.path.includes('terms') || entry.path.includes('accessibility')
          ? '0.3'
          : entry.path === '/contact'
            ? '0.7'
            : '0.8';
      const changefreq =
        entry.path === '/'
          ? 'weekly'
          : priority === '0.3'
            ? 'yearly'
            : 'monthly';
      return `  <url>
    <loc>${loc === `${SITE_URL}` ? `${SITE_URL}/` : loc}</loc>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

  for (const dir of [ROOT, path.join(ROOT, 'site'), path.join(ROOT, '_deploy', 'java-lava')]) {
    if (!fs.existsSync(dir)) continue;
    const out = path.join(dir, 'sitemap.xml');
    fs.writeFileSync(out, xml, 'utf8');
    console.log(`wrote: ${path.relative(ROOT, out)}`);
  }
}

function writeRobots() {
  const body = `User-agent: *
Allow: /

Disallow: /admin
Disallow: /email-admin
Disallow: /merch-admin

Sitemap: ${SITE_URL}/sitemap.xml
`;

  for (const dir of [ROOT, path.join(ROOT, 'site'), path.join(ROOT, '_deploy', 'java-lava')]) {
    if (!fs.existsSync(dir)) continue;
    const out = path.join(dir, 'robots.txt');
    fs.writeFileSync(out, body, 'utf8');
    console.log(`wrote: ${path.relative(ROOT, out)}`);
  }
}

let updated = 0;
for (const entry of Object.values(seoData)) {
  for (const dir of MIRROR_DIRS) {
    const filePath = path.join(dir, entry.file);
    if (patchHtml(filePath, entry)) updated += 1;
  }
}

writeSitemap();
writeRobots();
console.log(`Done. Patched ${updated} HTML file(s).`);
