const { isConfigured } = require('./lib/db');
const formsStore = require('./lib/forms-store');

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

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' });
  if (!authorized(req)) return json(res, 401, { error: 'Admin token required' });
  if (!isConfigured()) return json(res, 500, { error: 'Mailing records backend is not configured' });

  try {
    const [merchRows, newsletterRows, contactRows] = await Promise.all([
      formsStore.listMerchSignups(),
      formsStore.listNewsletterSubscribers(),
      formsStore.listContactSubmissions()
    ]);

    const records = []
      .concat(merchRows.map(normalizeMerch))
      .concat(newsletterRows.map(normalizeNewsletter))
      .concat(contactRows.map(normalizeContact))
      .sort((a, b) => String(b.submittedAt || '').localeCompare(String(a.submittedAt || '')));

    return json(res, 200, {
      ok: true,
      records,
      counts: {
        merch: merchRows.length,
        newsletter: newsletterRows.length,
        contact: contactRows.length,
        total: records.length
      },
      errors: []
    });
  } catch (error) {
    console.error('[mailing-records]', error);
    return json(res, 500, { error: 'Could not load mailing records' });
  }
};
