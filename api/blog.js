/**
 * Unified Blog API — /api/blog
 *
 * Dispatch by ?action= query param:
 *
 * PUBLIC (no auth needed):
 *   GET  ?action=posts            — paginated list of published posts
 *   GET  ?action=posts&slug=...   — single post by slug (includes tags)
 *   GET  ?action=posts&category=  — filter by category slug
 *   GET  ?action=posts&tag=       — filter by tag
 *   GET  ?action=rss              — RSS 2.0 XML feed
 *   GET  ?action=sitemap          — XML sitemap of published posts
 *
 * ADMIN (requires header  x-admin-key: <BLOG_ADMIN_KEY>):
 *   GET    ?action=admin           — list all posts (any status)
 *   GET    ?action=admin&id=...    — single post by id
 *   POST   ?action=admin           — create post
 *   PATCH  ?action=admin&id=...    — update post
 *   DELETE ?action=admin&id=...    — hard-delete post
 */

'use strict';

const { isConfigured } = require('./lib/db');
const blogStore = require('./lib/blog-store');

const ADMIN_KEY = process.env.BLOG_ADMIN_KEY;
const SITE_URL = (process.env.SITE_URL || 'https://www.javalava.rocks').replace(/\/$/, '');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, x-admin-key');
  res.end(JSON.stringify(body));
}

function xml(res, body) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/xml; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=3600');
  res.end(body);
}

function rssXml(res, body) {
  res.statusCode = 200;
  res.setHeader('content-type', 'application/rss+xml; charset=utf-8');
  res.setHeader('cache-control', 'public, max-age=3600');
  res.end(body);
}

function escXml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function clean(v, max) { return String(v || '').trim().slice(0, max); }

function slugify(text) {
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '').trim()
    .replace(/\s+/g, '-').replace(/-+/g, '-');
}

function estimateReadTime(html) {
  const words = (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function parseBody(req) {
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  return req.body || {};
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (!isConfigured()) return json(res, 500, { error: 'Blog backend is not configured' });

  const q = req.query || {};
  const action = (q.action || 'posts').trim();

  try {
    if (action === 'rss') {
      const posts = await blogStore.listPublishedForRss();
      const items = posts.map((p) => `
  <item>
    <title>${escXml(p.title)}</title>
    <link>${SITE_URL}/blog-post?slug=${escXml(p.slug)}</link>
    <description>${escXml(p.excerpt || '')}</description>
    <pubDate>${new Date(p.published_at).toUTCString()}</pubDate>
    <guid isPermaLink="true">${SITE_URL}/blog-post?slug=${escXml(p.slug)}</guid>
    <author>${escXml(p.author_name || 'Java Lava')}</author>
  </item>`).join('');

      return rssXml(res, `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Java Lava — Blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Cocktail culture, coffee knowledge, and spirit stories from the Java Lava team.</description>
    <language>en-us</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${items}
  </channel>
</rss>`);
    }

    if (action === 'sitemap') {
      const posts = await blogStore.listPublishedForSitemap();
      const urls = posts.map((p) => `
  <url>
    <loc>${SITE_URL}/blog-post?slug=${p.slug}</loc>
    <lastmod>${new Date(p.updated_at || p.published_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('');

      return xml(res, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/blog</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  ${urls}
</urlset>`);
    }

    if (action === 'admin') {
      const adminKey = req.headers['x-admin-key'] || '';
      if (!ADMIN_KEY || adminKey !== ADMIN_KEY) return json(res, 401, { error: 'Unauthorized' });

      const id = (q.id || '').trim();

      if (req.method === 'GET' && id) {
        const post = await blogStore.adminGetPost(id);
        if (!post) return json(res, 404, { error: 'Post not found' });
        return json(res, 200, { post });
      }

      if (req.method === 'GET') {
        const result = await blogStore.adminListPosts({
          status: (q.status || '').trim(),
          search: (q.search || '').trim(),
          page: Math.max(1, parseInt(q.page || '1', 10)),
          pageSize: Math.min(50, Math.max(1, parseInt(q.pageSize || '20', 10))),
        });
        return json(res, 200, result);
      }

      if (req.method === 'POST') {
        let body;
        try { body = parseBody(req); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
        const title = clean(body.title, 200);
        if (!title) return json(res, 400, { error: 'title is required' });
        const contentHtml = body.content_html || '';
        const payload = {
          title,
          slug: clean(body.slug, 200) || slugify(title),
          excerpt: clean(body.excerpt, 500),
          content_html: contentHtml,
          featured_image: clean(body.featured_image, 500),
          status: ['draft', 'published', 'archived'].includes(body.status) ? body.status : 'draft',
          category_id: body.category_id || null,
          meta_title: clean(body.meta_title, 200),
          meta_description: clean(body.meta_description, 300),
          author_name: clean(body.author_name, 120) || 'Java Lava',
          read_time_mins: body.read_time_mins ? parseInt(body.read_time_mins, 10) : estimateReadTime(contentHtml),
          published_at: body.status === 'published' ? (body.published_at || new Date()) : null,
        };
        const post = await blogStore.adminCreatePost(payload, body.tag_ids);
        return json(res, 201, { post });
      }

      if (req.method === 'PATCH') {
        if (!id) return json(res, 400, { error: 'id is required' });
        let body;
        try { body = parseBody(req); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
        const patch = {};
        if (body.title !== undefined) patch.title = clean(body.title, 200);
        if (body.slug !== undefined) patch.slug = clean(body.slug, 200);
        if (body.excerpt !== undefined) patch.excerpt = clean(body.excerpt, 500);
        if (body.content_html !== undefined) patch.content_html = body.content_html;
        if (body.featured_image !== undefined) patch.featured_image = clean(body.featured_image, 500);
        if (body.category_id !== undefined) patch.category_id = body.category_id || null;
        if (body.meta_title !== undefined) patch.meta_title = clean(body.meta_title, 200);
        if (body.meta_description !== undefined) patch.meta_description = clean(body.meta_description, 300);
        if (body.author_name !== undefined) patch.author_name = clean(body.author_name, 120);
        if (body.read_time_mins !== undefined) patch.read_time_mins = parseInt(body.read_time_mins, 10);
        if (body.status !== undefined && ['draft', 'published', 'archived'].includes(body.status)) {
          patch.status = body.status;
          if (body.status === 'published' && !body.published_at) patch.published_at = new Date();
        }
        if (body.published_at !== undefined) patch.published_at = body.published_at;
        if (body.content_html !== undefined && !body.read_time_mins) {
          patch.read_time_mins = estimateReadTime(body.content_html);
        }
        const tagIds = Array.isArray(body.tag_ids) ? body.tag_ids : undefined;
        const post = await blogStore.adminUpdatePost(id, patch, tagIds);
        if (!post) return json(res, 404, { error: 'Post not found' });
        return json(res, 200, { post });
      }

      if (req.method === 'DELETE') {
        if (!id) return json(res, 400, { error: 'id is required' });
        await blogStore.adminDeletePost(id);
        return json(res, 200, { ok: true });
      }

      return json(res, 405, { error: 'Method not allowed' });
    }

    if (action === 'posts') {
      if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

      const slug = (q.slug || '').trim();
      const category = (q.category || '').trim();
      const tag = (q.tag || '').trim();
      const page = Math.max(1, parseInt(q.page || '1', 10));
      const pageSize = Math.min(50, Math.max(1, parseInt(q.pageSize || '12', 10)));

      if (slug) {
        const post = await blogStore.getPublishedPostBySlug(slug);
        if (!post) return json(res, 404, { error: 'Post not found' });
        return json(res, 200, { post });
      }

      const result = await blogStore.listPublishedPosts({ page, pageSize, category, tag });
      return json(res, 200, result);
    }

    return json(res, 404, { error: 'Unknown action' });
  } catch (error) {
    console.error('[blog]', error);
    return json(res, 500, { error: 'Blog request failed' });
  }
};
