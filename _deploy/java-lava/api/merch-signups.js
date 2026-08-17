const TABLE = process.env.SUPABASE_MERCH_SIGNUPS_TABLE || 'merch_notifications';

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

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Merch admin backend is not configured' });
  }

  const base = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${TABLE}`;
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json'
  };

  try {
    if (req.method === 'DELETE') {
      const response = await fetch(`${base}?id=not.is.null`, { method: 'DELETE', headers });
      if (!response.ok) return json(res, 502, { error: 'Could not clear signups', detail: await response.text() });
      return json(res, 200, { ok: true });
    }

    const response = await fetch(`${base}?select=*&order=created_at.desc`, { headers });
    if (!response.ok) return json(res, 502, { error: 'Could not load signups', detail: await response.text() });
    const rows = await response.json();
    return json(res, 200, { signups: rows.map(normalize) });
  } catch (error) {
    return json(res, 500, { error: 'Could not load signups' });
  }
};
