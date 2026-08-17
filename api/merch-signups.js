const { isConfigured } = require('./lib/db');
const formsStore = require('./lib/forms-store');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'GET, DELETE, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type, x-java-lava-admin-token');
  res.end(JSON.stringify(body));
}

function authorized(req) {
  const expected = process.env.JAVA_LAVA_ADMIN_TOKEN;
  const received = req.headers['x-java-lava-admin-token'] || '';
  return expected && received === expected;
}

function normalize(row) {
  return {
    id: row.id,
    email: row.email,
    productId: row.product_id,
    variantId: row.variant_id,
    variantLabel: row.variant_label,
    productTitle: row.product_title,
    size: row.size,
    quantity: row.quantity,
    price: row.price,
    source: row.source,
    submittedAt: row.created_at || row.submitted_at
  };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return json(res, 405, { error: 'Method not allowed' });
  }
  if (!authorized(req)) return json(res, 401, { error: 'Admin token required' });
  if (!isConfigured()) return json(res, 500, { error: 'Merch admin backend is not configured' });

  try {
    if (req.method === 'DELETE') {
      await formsStore.clearMerchSignups();
      return json(res, 200, { ok: true });
    }

    const rows = await formsStore.listMerchSignups();
    return json(res, 200, { signups: rows.map(normalize) });
  } catch (error) {
    console.error('[merch-signups]', error);
    return json(res, 500, { error: 'Could not load signups' });
  }
};
