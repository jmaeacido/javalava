const TABLE = process.env.SUPABASE_MERCH_SIGNUPS_TABLE || 'merch_notifications';
const DEFAULT_CONTACT_TO = 'contact@javalava.rocks';
const { merchImageUrl, merchProductUrl } = require('./lib/merch-images');
const { brandEmailHtml, sendMail } = require('./lib/mailer');

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json; charset=utf-8');
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'content-type');
  res.end(JSON.stringify(body));
}

function clean(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function merchAutoReplyMessage(signup) {
  const product = signup.product_title || 'your selected Java Lava merch item';
  const details = [
    signup.size ? `Size: ${signup.size}` : '',
    signup.quantity ? `Quantity: ${signup.quantity}` : '',
    signup.price ? `Price: ${signup.price}` : ''
  ].filter(Boolean);

  return [
    'Hi there,',
    '',
    `Thanks for joining the waitlist for ${product}. We saved your request and will email you when availability updates are ready.`,
    details.length ? '' : null,
    ...details,
    '',
    'Java Lava'
  ].filter((line) => line !== null).join('\n');
}

function merchNotificationMessage(signup) {
  const details = [
    signup.variant_label ? `Variant: ${signup.variant_label}` : '',
    signup.size ? `Size: ${signup.size}` : '',
    signup.quantity ? `Quantity: ${signup.quantity}` : '',
    signup.price ? `Price: ${signup.price}` : ''
  ].filter(Boolean);

  return [
    'New Java Lava merch signup',
    '',
    `Email: ${signup.email}`,
    `Product: ${signup.product_title || signup.product_id}`,
    ...details,
    `Source: ${signup.source || 'merch-available-soon'}`
  ].join('\n');
}

async function sendMerchAutoReply(signup) {
  const imageUrl = merchImageUrl(signup.product_id, signup.variant_id);
  const productUrl = merchProductUrl(signup.product_id, signup.variant_id);
  const email = await sendMail({
    to: signup.email,
    replyTo: process.env.CONTACT_EMAIL_TO || 'contact@javalava.rocks',
    subject: 'We received your Java Lava merch request',
    html: brandEmailHtml({
      eyebrow: 'Merch request saved',
      title: 'You are on the waitlist',
      intro: `We saved your request for ${signup.product_title || 'Java Lava merch'} and will email you when availability updates are ready.`,
      body: [
        'Your spot is recorded. When this piece is ready for the next step, Java Lava will send the update to this email address.'
      ],
      details: [
        { label: 'Product', value: signup.product_title },
        { label: 'Variant', value: signup.variant_label },
        { label: 'Size', value: signup.size },
        { label: 'Quantity', value: signup.quantity },
        { label: 'Price', value: signup.price }
      ],
      imageUrl,
      imageAlt: signup.product_title,
      imageLinkUrl: productUrl,
      buttonLabel: 'View This Merch',
      buttonUrl: productUrl
    }),
    text: merchAutoReplyMessage(signup)
  });

  return { ...email, signupId: signup && signup.id };
}

async function sendMerchNotification(signup) {
  const imageUrl = merchImageUrl(signup.product_id, signup.variant_id);
  const productUrl = merchProductUrl(signup.product_id, signup.variant_id);
  const email = await sendMail({
    to: process.env.CONTACT_EMAIL_TO || DEFAULT_CONTACT_TO,
    replyTo: signup.email,
    subject: `Java Lava merch signup: ${signup.product_title || signup.product_id}`,
    html: brandEmailHtml({
      eyebrow: 'New merch signup',
      title: 'New merch waitlist request',
      intro: `${signup.email} joined the waitlist for ${signup.product_title || 'Java Lava merch'}.`,
      body: [
        'The request has been saved in Supabase and is ready for merch follow-up.'
      ],
      details: [
        { label: 'Email', value: signup.email },
        { label: 'Product', value: signup.product_title },
        { label: 'Variant', value: signup.variant_label },
        { label: 'Size', value: signup.size },
        { label: 'Quantity', value: signup.quantity },
        { label: 'Price', value: signup.price },
        { label: 'Source', value: signup.source }
      ],
      imageUrl,
      imageAlt: signup.product_title,
      imageLinkUrl: productUrl,
      buttonLabel: 'View This Merch',
      buttonUrl: productUrl
    }),
    text: merchNotificationMessage(signup)
  });

  return { ...email, signupId: signup && signup.id };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Merch notification backend is not configured' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON payload' });
  }

  const email = clean(body.email, 254).toLowerCase();
  const productId = clean(body.productId || body.product_id, 160);
  const variantId = clean(body.variantId || body.variant_id, 120);
  const variantLabel = clean(body.variantLabel || body.variant_label, 120);

  if (!validEmail(email)) return json(res, 400, { error: 'Valid email is required' });
  if (!productId) return json(res, 400, { error: 'Product ID is required' });

  const payload = {
    email,
    product_id: productId,
    variant_id: variantId,
    variant_label: variantLabel,
    product_title: clean(body.productTitle || body.product_title, 220),
    size: clean(body.size, 30),
    quantity: Math.max(1, parseInt(body.quantity, 10) || 1),
    price: clean(body.price, 40),
    source: clean(body.source, 80) || 'merch-available-soon',
    user_agent: clean(req.headers['user-agent'], 500)
  };

  try {
    const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
        prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.text();
      return json(res, 502, { error: 'Could not save merch signup', detail });
    }

    const rows = await response.json();
    const signup = rows[0] || payload;

    try {
      const [autoReply, notification] = await Promise.all([
        sendMerchAutoReply(signup),
        sendMerchNotification(signup)
      ]);
      return json(res, 200, { ok: true, signup, autoReply, notification });
    } catch (emailError) {
      return json(res, 502, {
        error: 'Merch signup was saved, but one or more emails could not be sent',
        signup,
        emailError: emailError.message
      });
    }
  } catch (error) {
    return json(res, 500, { error: 'Could not save merch signup' });
  }
};
