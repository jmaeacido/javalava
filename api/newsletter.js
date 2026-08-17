const TABLE = process.env.SUPABASE_NEWSLETTER_TABLE || 'newsletter_subscribers';
const DEFAULT_CONTACT_TO = 'contact@javalava.rocks';
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

function newsletterAutoReplyMessage() {
  return [
    'Hi there,',
    '',
    'Thanks for joining the Java Lava mailing list. You are on the list for product news, merch updates, and Java Lava announcements.',
    '',
    'Java Lava'
  ].join('\n');
}

function newsletterNotificationMessage(subscriber) {
  return [
    'New Java Lava newsletter signup',
    '',
    `Email: ${subscriber.email}`,
    `Source: ${subscriber.source || 'Newsletter'}`
  ].join('\n');
}

async function sendNewsletterAutoReply(subscriber) {
  const email = await sendMail({
    to: subscriber.email,
    replyTo: process.env.CONTACT_EMAIL_TO || 'contact@javalava.rocks',
    subject: 'Welcome to Java Lava updates',
    html: brandEmailHtml({
      eyebrow: 'You are on the list',
      title: 'Join the flow',
      intro: 'You are now on the mailing list for product news, merch drops, and Java Lava updates.',
      body: [
        'We will only reach out when there is something worth sipping on: launch notes, availability updates, and fresh merch details.',
        'Thanks for joining the Java Lava circle.'
      ],
      details: [
        { label: 'Subscribed email', value: subscriber.email },
        { label: 'Source', value: subscriber.source || 'Newsletter' }
      ]
    }),
    text: newsletterAutoReplyMessage()
  });

  return { ...email, subscriberId: subscriber && subscriber.id };
}

async function sendNewsletterNotification(subscriber) {
  const email = await sendMail({
    to: process.env.CONTACT_EMAIL_TO || DEFAULT_CONTACT_TO,
    replyTo: subscriber.email,
    subject: `Java Lava newsletter signup: ${subscriber.email}`,
    html: brandEmailHtml({
      eyebrow: 'Stay in the loop',
      title: 'New newsletter signup',
      intro: `${subscriber.email} joined the Java Lava mailing list.`,
      body: [
        'The subscriber was saved and can now receive Java Lava product news, merch drops, and availability updates.'
      ],
      details: [
        { label: 'Subscribed email', value: subscriber.email },
        { label: 'Source', value: subscriber.source || 'Newsletter' }
      ]
    }),
    text: newsletterNotificationMessage(subscriber)
  });

  return { ...email, subscriberId: subscriber && subscriber.id };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return json(res, 500, { error: 'Newsletter backend is not configured' });
  }

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON payload' });
  }

  const email = clean(body.email, 254).toLowerCase();
  if (!validEmail(email)) return json(res, 400, { error: 'Valid email is required' });

  const payload = {
    email,
    source: clean(body.source, 80) || 'homepage-newsletter',
    user_agent: clean(req.headers['user-agent'], 500),
    updated_at: new Date().toISOString()
  };

  try {
    const base = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${TABLE}`;
    const response = await fetch(`${base}?on_conflict=email`, {
      method: 'POST',
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
        'content-type': 'application/json',
        prefer: 'resolution=ignore-duplicates,return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.text();
      return json(res, 502, { error: 'Could not save newsletter signup', detail });
    }

    const rows = await response.json();
    const subscriber = rows[0] || payload;
    if (!rows[0]) {
      const existingResponse = await fetch(`${base}?select=*&email=${encodeURIComponent(`eq.${email}`)}&limit=1`, {
        headers: {
          apikey: serviceRoleKey,
          authorization: `Bearer ${serviceRoleKey}`,
          'content-type': 'application/json'
        }
      });
      const existingRows = existingResponse.ok ? await existingResponse.json() : [];
      return json(res, 200, {
        ok: true,
        duplicate: true,
        emailsSkipped: true,
        subscriber: existingRows[0] || subscriber
      });
    }

    try {
      const [autoReply, notification] = await Promise.all([
        sendNewsletterAutoReply(subscriber),
        sendNewsletterNotification(subscriber)
      ]);
      return json(res, 200, { ok: true, subscriber, autoReply, notification });
    } catch (emailError) {
      return json(res, 502, {
        error: 'Newsletter signup was saved, but one or more emails could not be sent',
        subscriber,
        emailError: emailError.message
      });
    }
  } catch (error) {
    return json(res, 500, { error: 'Could not save newsletter signup' });
  }
};
