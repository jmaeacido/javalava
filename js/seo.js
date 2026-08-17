/**
 * Build crawlable <head> SEO tags from a seoData entry (Obsidian-style pageMetadata).
 */
'use strict';

const {
  SITE_URL,
  BRAND_NAME,
  DEFAULT_OG_IMAGE,
  seoData,
} = require('./seoData');

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const escapeAttr = (value) =>
  escapeHtml(value).replace(/"/g, '&quot;');

const canonicalUrl = (path) => {
  if (!path || path === '/') return `${SITE_URL}/`;
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

const fullTitle = (title) =>
  title.includes(BRAND_NAME) ? title : `${title} | ${BRAND_NAME}`;

/** @param {import('./seoData').SeoEntry} entry */
const pageHeadTags = (entry) => {
  const title = fullTitle(entry.title);
  const description = entry.description;
  const url = canonicalUrl(entry.path);
  const twitterTitle = entry.socialTitle ?? title;
  const twitterDescription = entry.socialDescription ?? description;
  const openGraphTitle = entry.ogTitle ?? entry.socialTitle ?? title;
  const openGraphDescription =
    entry.ogDescription ?? entry.socialDescription ?? description;
  const image = entry.ogImage ?? DEFAULT_OG_IMAGE;
  const robots = entry.noIndex ? 'noindex, nofollow' : 'index, follow';

  const lines = [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeAttr(description)}" />`,
  ];

  if (entry.focusKeyword) {
    lines.push(`<meta name="keywords" content="${escapeAttr(entry.focusKeyword)}" />`);
  }

  lines.push(
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeAttr(BRAND_NAME)}" />`,
    `<meta property="og:title" content="${escapeAttr(openGraphTitle)}" />`,
    `<meta property="og:description" content="${escapeAttr(openGraphDescription)}" />`,
    `<meta property="og:image" content="${escapeAttr(image)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(twitterTitle)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(twitterDescription)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(image)}" />`
  );

  return lines.join('\n');
};

/** Look up a central seoData entry and build head tags. */
const seoFor = (key) => {
  const entry = seoData[key];
  if (!entry) throw new Error(`Unknown SEO key: ${key}`);
  return pageHeadTags(entry);
};

module.exports = {
  SITE_URL,
  BRAND_NAME,
  DEFAULT_OG_IMAGE,
  canonicalUrl,
  pageHeadTags,
  seoFor,
  seoData,
};
