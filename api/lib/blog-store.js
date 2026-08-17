'use strict';

const { query, newId } = require('./db');

const POST_SELECT = `
  p.id, p.title, p.slug, p.excerpt, p.content_html, p.featured_image, p.status,
  p.category_id, p.meta_title, p.meta_description, p.author_name, p.read_time_mins,
  p.published_at, p.created_at, p.updated_at,
  c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug
`;

const POST_FROM = `
  FROM blog_posts p
  LEFT JOIN blog_categories c ON c.id = p.category_id
`;

function mapCategory(row) {
  if (!row || !row.cat_id) return null;
  return { id: row.cat_id, name: row.cat_name, slug: row.cat_slug };
}

function mapPost(row, tags = []) {
  if (!row) return null;
  const post = {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content_html: row.content_html,
    featured_image: row.featured_image,
    status: row.status,
    category_id: row.category_id,
    meta_title: row.meta_title,
    meta_description: row.meta_description,
    author_name: row.author_name,
    read_time_mins: row.read_time_mins,
    published_at: row.published_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    blog_categories: mapCategory(row),
  };
  if (tags.length) post.tags = tags;
  return post;
}

async function tagsForPost(postId) {
  return query(
    `SELECT t.id, t.name, t.slug
     FROM blog_tags t
     INNER JOIN blog_post_tags pt ON pt.tag_id = t.id
     WHERE pt.post_id = ?`,
    [postId]
  );
}

async function attachTags(posts) {
  if (!posts.length) return posts;
  const ids = posts.map((p) => p.id);
  const placeholders = ids.map(() => '?').join(', ');
  const rows = await query(
    `SELECT pt.post_id, t.id, t.name, t.slug
     FROM blog_post_tags pt
     INNER JOIN blog_tags t ON t.id = pt.tag_id
     WHERE pt.post_id IN (${placeholders})`,
    ids
  );
  const byPost = new Map();
  for (const row of rows) {
    if (!byPost.has(row.post_id)) byPost.set(row.post_id, []);
    byPost.get(row.post_id).push({ id: row.id, name: row.name, slug: row.slug });
  }
  return posts.map((post) => {
    const mapped = mapPost(post, byPost.get(post.id) || []);
    return mapped;
  });
}

async function listPublishedPosts({ page = 1, pageSize = 12, category = '', tag = '' } = {}) {
  const params = [];
  let where = `WHERE p.status = 'published'`;

  if (category) {
    where += ' AND c.slug = ?';
    params.push(category);
  }

  if (tag) {
    where += ` AND p.id IN (
      SELECT pt.post_id FROM blog_post_tags pt
      INNER JOIN blog_tags t ON t.id = pt.tag_id
      WHERE t.slug = ?
    )`;
    params.push(tag);
  }

  const countRows = await query(
    `SELECT COUNT(*) AS total ${POST_FROM} ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);

  const offset = (Math.max(1, page) - 1) * pageSize;
  const rows = await query(
    `SELECT ${POST_SELECT} ${POST_FROM} ${where}
     ORDER BY p.published_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const posts = await attachTags(rows);
  return { posts, total, page, pageSize };
}

async function getPublishedPostBySlug(slug) {
  const rows = await query(
    `SELECT ${POST_SELECT} ${POST_FROM}
     WHERE p.slug = ? AND p.status = 'published'
     LIMIT 1`,
    [slug]
  );
  if (!rows.length) return null;
  const tags = await tagsForPost(rows[0].id);
  return mapPost(rows[0], tags);
}

async function listPublishedForRss() {
  return query(
    `SELECT title, slug, excerpt, published_at, author_name
     FROM blog_posts
     WHERE status = 'published'
     ORDER BY published_at DESC
     LIMIT 50`
  );
}

async function listPublishedForSitemap() {
  return query(
    `SELECT slug, updated_at, published_at
     FROM blog_posts
     WHERE status = 'published'
     ORDER BY published_at DESC`
  );
}

async function adminListPosts({ status = '', search = '', page = 1, pageSize = 20 } = {}) {
  const params = [];
  let where = 'WHERE 1=1';

  if (status) {
    where += ' AND p.status = ?';
    params.push(status);
  }
  if (search) {
    where += ' AND p.title LIKE ?';
    params.push(`%${search}%`);
  }

  const countRows = await query(
    `SELECT COUNT(*) AS total FROM blog_posts p ${where}`,
    params
  );
  const total = Number(countRows[0]?.total || 0);
  const offset = (Math.max(1, page) - 1) * pageSize;

  const rows = await query(
    `SELECT p.id, p.title, p.slug, p.status, p.author_name, p.published_at, p.updated_at, p.created_at,
            c.name AS cat_name, c.slug AS cat_slug
     FROM blog_posts p
     LEFT JOIN blog_categories c ON c.id = p.category_id
     ${where}
     ORDER BY p.updated_at DESC
     LIMIT ? OFFSET ?`,
    [...params, pageSize, offset]
  );

  const posts = rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.status,
    author_name: row.author_name,
    published_at: row.published_at,
    updated_at: row.updated_at,
    created_at: row.created_at,
    blog_categories: row.cat_slug ? { name: row.cat_name, slug: row.cat_slug } : null,
  }));

  return { posts, total, page, pageSize };
}

async function adminGetPost(id) {
  const rows = await query(
    `SELECT ${POST_SELECT} ${POST_FROM} WHERE p.id = ? LIMIT 1`,
    [id]
  );
  if (!rows.length) return null;
  const tags = await tagsForPost(id);
  return mapPost(rows[0], tags);
}

async function setPostTags(postId, tagIds = []) {
  await query('DELETE FROM blog_post_tags WHERE post_id = ?', [postId]);
  for (const tagId of tagIds) {
    await query('INSERT INTO blog_post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tagId]);
  }
}

async function adminCreatePost(payload, tagIds = []) {
  const id = newId();
  await query(
    `INSERT INTO blog_posts
      (id, title, slug, excerpt, content_html, featured_image, status, category_id,
       meta_title, meta_description, author_name, read_time_mins, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.title,
      payload.slug,
      payload.excerpt,
      payload.content_html,
      payload.featured_image,
      payload.status,
      payload.category_id,
      payload.meta_title,
      payload.meta_description,
      payload.author_name,
      payload.read_time_mins,
      payload.published_at,
    ]
  );
  if (Array.isArray(tagIds) && tagIds.length) {
    await setPostTags(id, tagIds);
  }
  return adminGetPost(id);
}

async function adminUpdatePost(id, patch, tagIds) {
  const fields = [];
  const params = [];

  const allowed = [
    'title', 'slug', 'excerpt', 'content_html', 'featured_image', 'status',
    'category_id', 'meta_title', 'meta_description', 'author_name',
    'read_time_mins', 'published_at',
  ];

  for (const key of allowed) {
    if (patch[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(patch[key]);
    }
  }

  if (fields.length) {
    fields.push('updated_at = CURRENT_TIMESTAMP');
    await query(`UPDATE blog_posts SET ${fields.join(', ')} WHERE id = ?`, [...params, id]);
  }

  if (Array.isArray(tagIds)) {
    await setPostTags(id, tagIds);
  }

  return adminGetPost(id);
}

async function adminDeletePost(id) {
  await query('DELETE FROM blog_posts WHERE id = ?', [id]);
}

module.exports = {
  listPublishedPosts,
  getPublishedPostBySlug,
  listPublishedForRss,
  listPublishedForSitemap,
  adminListPosts,
  adminGetPost,
  adminCreatePost,
  adminUpdatePost,
  adminDeletePost,
};
