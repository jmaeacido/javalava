'use strict';

const { query, newId } = require('./db');

function rowToMerch(row) {
  return {
    id: row.id,
    email: row.email,
    product_id: row.product_id,
    variant_id: row.variant_id,
    variant_label: row.variant_label,
    product_title: row.product_title,
    size: row.size,
    quantity: row.quantity,
    price: row.price,
    source: row.source,
    user_agent: row.user_agent,
    created_at: row.created_at,
  };
}

async function insertContact(payload) {
  const id = newId();
  await query(
    `INSERT INTO contact_submissions
      (id, first_name, last_name, email, subject, mail_to, message, source, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.first_name,
      payload.last_name,
      payload.email,
      payload.subject,
      payload.mail_to,
      payload.message,
      payload.source,
      payload.user_agent,
    ]
  );
  const rows = await query('SELECT * FROM contact_submissions WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function upsertNewsletter(payload) {
  const existing = await query(
    'SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1',
    [payload.email]
  );

  if (existing.length) {
    await query(
      'UPDATE newsletter_subscribers SET source = ?, user_agent = ?, updated_at = CURRENT_TIMESTAMP WHERE email = ?',
      [payload.source, payload.user_agent, payload.email]
    );
    const rows = await query('SELECT * FROM newsletter_subscribers WHERE email = ? LIMIT 1', [payload.email]);
    return { subscriber: rows[0], duplicate: true };
  }

  const id = newId();
  await query(
    `INSERT INTO newsletter_subscribers (id, email, source, user_agent)
     VALUES (?, ?, ?, ?)`,
    [id, payload.email, payload.source, payload.user_agent]
  );
  const rows = await query('SELECT * FROM newsletter_subscribers WHERE id = ? LIMIT 1', [id]);
  return { subscriber: rows[0], duplicate: false };
}

async function insertMerchSignup(payload) {
  const id = newId();
  await query(
    `INSERT INTO merch_notifications
      (id, email, product_id, variant_id, variant_label, product_title, size, quantity, price, source, user_agent)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      payload.email,
      payload.product_id,
      payload.variant_id,
      payload.variant_label,
      payload.product_title,
      payload.size,
      payload.quantity,
      payload.price,
      payload.source,
      payload.user_agent,
    ]
  );
  const rows = await query('SELECT * FROM merch_notifications WHERE id = ? LIMIT 1', [id]);
  return rows[0];
}

async function listMerchSignups() {
  const rows = await query('SELECT * FROM merch_notifications ORDER BY created_at DESC');
  return rows.map(rowToMerch);
}

async function clearMerchSignups() {
  await query('DELETE FROM merch_notifications');
}

async function listContactSubmissions() {
  return query('SELECT * FROM contact_submissions ORDER BY created_at DESC');
}

async function listNewsletterSubscribers() {
  return query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
}

module.exports = {
  insertContact,
  upsertNewsletter,
  insertMerchSignup,
  listMerchSignups,
  clearMerchSignups,
  listContactSubmissions,
  listNewsletterSubscribers,
};
