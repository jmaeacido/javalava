const TABLES = {
  merch: process.env.SUPABASE_MERCH_SIGNUPS_TABLE || 'merch_notifications',
  newsletter: process.env.SUPABASE_NEWSLETTER_TABLE || 'newsletter_subscribers',
  contact: process.env.SUPABASE_CONTACT_SUBMISSIONS_TABLE || 'contact_submissions'
};

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, x-java-lava-admin-token');
  res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.JAVA_LAVA_ADMIN_TOKEN;
  const received = req.headers['x-java-lava-admin-token'] || '';
  return expected && received === expected;
}

function cleanDate(value) {
  return value || null;
}

function normalizeMerch(row) {
  return {
    type: 'Merch',
    id: row.id,
    email: row.email,
    name: '',
    subject: row.product_title || row.product_id || 'Merch notification',
    source: row.source || 'merch',
    productId: row.product_id,
    variantId: row.variant_id,
    variantLabel: row.variant_label,
    productTitle: row.product_title,
    size: row.size,
    quantity: row.quantity,
    price: row.price,
    message: row.variant_label ? `Variant: ${row.variant_label}` : '',
    submittedAt: cleanDate(row.created_at || row.submitted_at || row.updated_at)
  };
}

function normalizeNewsletter(row) {
  return {
    type: 'Newsletter',
    id: row.id || row.email,
    email: row.email,
    name: '',
    subject: 'Newsletter subscriber',
    source: row.source || 'newsletter',
    productId: '',
    productTitle: '',
    size: '',
    quantity: '',
    price: '',
    message: '',
    submittedAt: cleanDate(row.updated_at || row.created_at || row.submitted_at)
  };
}

function normalizeContact(row) {
  const firstName = row.first_name || row.firstName || '';
  const lastName = row.last_name || row.lastName || '';
  return {
    type: 'Contact',
    id: row.id,
    email: row.email,
    name: [firstName, lastName].filter(Boolean).join(' '),
    subject: row.subject || 'Contact submission',
    source: row.source || 'contact',
    productId: '',
    productTitle: '',
    size: '',
    quantity: '',
    price: '',
    message: [row.mail_to ? `Mail to: ${row.mail_to}` : '', row.message || ''].filter(Boolean).join('\n\n'),
    submittedAt: cleanDate(row.created_at || row.submitted_at || row.updated_at)
  };
}

async function fetchTable(base, table, headers) {
  const response = await fetch(`${base}/${table}?select=*`, { headers });
  if (!response.ok) {
    return { ok: false, rows: [], detail: await response.text() };
  }
  return { ok: true, rows: await response.json(), detail: '' };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Admin token required' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Mailing records backend is not configured' });
  }

  const base = `${supabaseUrl.replace(/\/$/, '')}/rest/v1`;
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json'
  };

  try {
    const [merch, newsletter, contact] = await Promise.all([
      fetchTable(base, TABLES.merch, headers),
      fetchTable(base, TABLES.newsletter, headers),
      fetchTable(base, TABLES.contact, headers)
    ]);
    const errors = [];
    if (!merch.ok) errors.push({ table: TABLES.merch, detail: merch.detail });
    if (!newsletter.ok) errors.push({ table: TABLES.newsletter, detail: newsletter.detail });
    if (!contact.ok) errors.push({ table: TABLES.contact, detail: contact.detail });

    const records = []
      .concat(merch.rows.map(normalizeMerch))
      .concat(newsletter.rows.map(normalizeNewsletter))
      .concat(contact.rows.map(normalizeContact))
      .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));

    return json(res, errors.length ? 207 : 200, {
      ok: errors.length === 0,
      records,
      counts: {
        merch: merch.rows.length,
        newsletter: newsletter.rows.length,
        contact: contact.rows.length,
        total: records.length
      },
      errors
    });
  } catch (error) {
    return json(res, 500, { error: 'Could not load mailing records' });
  }
};
