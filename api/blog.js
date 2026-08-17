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

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_KEY    = process.env.BLOG_ADMIN_KEY;
const SITE_URL     = 'https://www.javalava.rocks';
const BASE         = SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1` : null;

// ── helpers ────────────────────────────────────────────────────────────────

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

function sbHeaders(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    authorization: `Bearer ${SERVICE_KEY}`,
    'content-type': 'application/json',
    prefer: 'return=representation',
    ...extra
  };
}

async function sb(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { headers: sbHeaders(opts.extra || {}), ...opts });
  const body = r.headers.get('content-type')?.includes('json') ? await r.json() : await r.text();
  const total = parseInt(r.headers.get('content-range')?.split('/')[1] ?? '0', 10);
  return { ok: r.ok, body, total, status: r.status };
}

// ── main handler ────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (!BASE || !SERVICE_KEY) return json(res, 500, { error: 'Blog backend is not configured' });

  const q      = req.query || {};
  const action = (q.action || 'posts').trim();

  // ── RSS feed ──────────────────────────────────────────────────────────────
  if (action === 'rss') {
    const { ok, body: posts } = await sb(
      `/blog_posts?status=eq.published&select=title,slug,excerpt,published_at,author_name&order=published_at.desc&limit=50`
    );
    const items = (ok && Array.isArray(posts) ? posts : []).map(p => `
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

  // ── Blog sitemap ──────────────────────────────────────────────────────────
  if (action === 'sitemap') {
    const { ok, body: posts } = await sb(
      `/blog_posts?status=eq.published&select=slug,updated_at,published_at&order=published_at.desc`
    );
    const urls = (ok && Array.isArray(posts) ? posts : []).map(p => `
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

  // ── Admin CRUD ────────────────────────────────────────────────────────────
  if (action === 'admin') {
    const adminKey = req.headers['x-admin-key'] || '';
    if (!ADMIN_KEY || adminKey !== ADMIN_KEY) return json(res, 401, { error: 'Unauthorized' });

    const id = (q.id || '').trim();

    // GET single
    if (req.method === 'GET' && id) {
      const { ok, body: rows } = await sb(
        `/blog_posts?id=eq.${id}&select=*,blog_categories(id,name,slug)&limit=1`
      );
      if (!ok || !Array.isArray(rows) || !rows.length) return json(res, 404, { error: 'Post not found' });
      const post = rows[0];
      const { body: pts } = await sb(`/blog_post_tags?post_id=eq.${id}&select=blog_tags(id,name,slug)`);
      post.tags = (Array.isArray(pts) ? pts : []).map(r => r.blog_tags).filter(Boolean);
      return json(res, 200, { post });
    }

    // GET list
    if (req.method === 'GET') {
      const status  = (q.status || '').trim();
      const search  = (q.search || '').trim();
      const page    = Math.max(1, parseInt(q.page || '1', 10));
      const size    = Math.min(50, Math.max(1, parseInt(q.pageSize || '20', 10)));
      const from    = (page - 1) * size;
      let path = `/blog_posts?select=id,title,slug,status,author_name,published_at,updated_at,created_at,blog_categories(name,slug)&order=updated_at.desc&limit=${size}&offset=${from}`;
      if (status) path += `&status=eq.${encodeURIComponent(status)}`;
      if (search) path += `&title=ilike.*${encodeURIComponent(search)}*`;
      const { ok, body: posts, total } = await sb(path, { extra: { prefer: 'count=exact,return=representation' } });
      return json(res, 200, { posts: ok && Array.isArray(posts) ? posts : [], total, page, pageSize: size });
    }

    // POST (create)
    if (req.method === 'POST') {
      let body = {};
      try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}; }
      catch { return json(res, 400, { error: 'Invalid JSON' }); }
      const title = clean(body.title, 200);
      if (!title) return json(res, 400, { error: 'title is required' });
      const contentHtml = body.content_html || '';
      const payload = {
        title,
        slug:             clean(body.slug, 200) || slugify(title),
        excerpt:          clean(body.excerpt, 500),
        content_html:     contentHtml,
        featured_image:   clean(body.featured_image, 500),
        status:           ['draft','published','archived'].includes(body.status) ? body.status : 'draft',
        category_id:      body.category_id || null,
        meta_title:       clean(body.meta_title, 200),
        meta_description: clean(body.meta_description, 300),
        author_name:      clean(body.author_name, 120) || 'Java Lava',
        read_time_mins:   body.read_time_mins ? parseInt(body.read_time_mins, 10) : estimateReadTime(contentHtml),
        published_at:     body.status === 'published' ? (body.published_at || new Date().toISOString()) : null,
      };
      const { ok, body: rows } = await sb(`/blog_posts`, { method: 'POST', body: JSON.stringify(payload) });
      if (!ok) return json(res, 502, { error: 'Could not create post', detail: rows });
      const post = Array.isArray(rows) ? rows[0] : rows;
      if (Array.isArray(body.tag_ids) && body.tag_ids.length && post?.id) {
        const links = body.tag_ids.map(tid => ({ post_id: post.id, tag_id: tid }));
        await sb(`/blog_post_tags`, { method: 'POST', body: JSON.stringify(links) });
      }
      return json(res, 201, { post });
    }

    // PATCH (update)
    if (req.method === 'PATCH') {
      if (!id) return json(res, 400, { error: 'id is required' });
      let body = {};
      try { body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}; }
      catch { return json(res, 400, { error: 'Invalid JSON' }); }
      const patch = {};
      if (body.title            !== undefined) patch.title            = clean(body.title, 200);
      if (body.slug             !== undefined) patch.slug             = clean(body.slug, 200);
      if (body.excerpt          !== undefined) patch.excerpt          = clean(body.excerpt, 500);
      if (body.content_html     !== undefined) patch.content_html     = body.content_html;
      if (body.featured_image   !== undefined) patch.featured_image   = clean(body.featured_image, 500);
      if (body.category_id      !== undefined) patch.category_id      = body.category_id || null;
      if (body.meta_title       !== undefined) patch.meta_title       = clean(body.meta_title, 200);
      if (body.meta_description !== undefined) patch.meta_description = clean(body.meta_description, 300);
      if (body.author_name      !== undefined) patch.author_name      = clean(body.author_name, 120);
      if (body.read_time_mins   !== undefined) patch.read_time_mins   = parseInt(body.read_time_mins, 10);
      if (body.status !== undefined && ['draft','published','archived'].includes(body.status)) {
        patch.status = body.status;
        if (body.status === 'published' && !body.published_at) patch.published_at = new Date().toISOString();
      }
      if (body.published_at !== undefined) patch.published_at = body.published_at;
      if (body.content_html !== undefined && !body.read_time_mins) patch.read_time_mins = estimateReadTime(body.content_html);

      const { ok, body: rows } = await sb(`/blog_posts?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
      if (!ok) return json(res, 502, { error: 'Could not update post', detail: rows });

      if (Array.isArray(body.tag_ids)) {
        await sb(`/blog_post_tags?post_id=eq.${id}`, { method: 'DELETE' });
        if (body.tag_ids.length) {
          const links = body.tag_ids.map(tid => ({ post_id: id, tag_id: tid }));
          await sb(`/blog_post_tags`, { method: 'POST', body: JSON.stringify(links) });
        }
      }
      return json(res, 200, { post: Array.isArray(rows) ? rows[0] : patch });
    }

    // DELETE
    if (req.method === 'DELETE') {
      if (!id) return json(res, 400, { error: 'id is required' });
      const r = await fetch(`${BASE}/blog_posts?id=eq.${id}`, { method: 'DELETE', headers: sbHeaders() });
      if (!r.ok) return json(res, 502, { error: 'Could not delete post' });
      return json(res, 200, { ok: true });
    }

    return json(res, 405, { error: 'Method not allowed' });
  }

  // ── Public posts ──────────────────────────────────────────────────────────
  if (action === 'posts') {
    if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });

    const slug     = (q.slug     || '').trim();
    const category = (q.category || '').trim();
    const tag      = (q.tag      || '').trim();
    const page     = Math.max(1, parseInt(q.page     || '1',  10));
    const pageSize = Math.min(50, Math.max(1, parseInt(q.pageSize || '12', 10)));

    // Single post by slug
    if (slug) {
      const { ok, body } = await sb(
        `/blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=*,blog_categories(id,name,slug)&limit=1`
      );
      if (!ok || !Array.isArray(body) || !body.length) return json(res, 404, { error: 'Post not found' });
      const post = body[0];
      const { body: ptRows } = await sb(`/blog_post_tags?post_id=eq.${post.id}&select=blog_tags(id,name,slug)`);
      post.tags = (Array.isArray(ptRows) ? ptRows : []).map(r => r.blog_tags).filter(Boolean);
      return json(res, 200, { post });
    }

    // List
    const from = (page - 1) * pageSize;
    let path = `/blog_posts?status=eq.published&select=id,title,slug,excerpt,featured_image,author_name,read_time_mins,published_at,blog_categories(id,name,slug)&order=published_at.desc`;

    if (category) {
      const { body: cats } = await sb(`/blog_categories?slug=eq.${encodeURIComponent(category)}&select=id&limit=1`);
      if (Array.isArray(cats) && cats[0]) path += `&category_id=eq.${cats[0].id}`;
      else return json(res, 200, { posts: [], total: 0, page, pageSize });
    }

    if (tag) {
      const { body: tagRows } = await sb(`/blog_tags?slug=eq.${encodeURIComponent(tag)}&select=id&limit=1`);
      if (Array.isArray(tagRows) && tagRows[0]) {
        const { body: ptRows } = await sb(`/blog_post_tags?tag_id=eq.${tagRows[0].id}&select=post_id`);
        const postIds = (Array.isArray(ptRows) ? ptRows : []).map(r => r.post_id);
        if (!postIds.length) return json(res, 200, { posts: [], total: 0, page, pageSize });
        path += `&id=in.(${postIds.join(',')})`;
      } else {
        return json(res, 200, { posts: [], total: 0, page, pageSize });
      }
    }

    const { ok, body: posts, total } = await sb(
      `${path}&limit=${pageSize}&offset=${from}`,
      { extra: { prefer: 'count=exact' } }
    );
    if (!ok) return json(res, 502, { error: 'Could not load posts' });
    return json(res, 200, { posts: Array.isArray(posts) ? posts : [], total, page, pageSize });
  }

  return json(res, 404, { error: 'Unknown action' });
};
