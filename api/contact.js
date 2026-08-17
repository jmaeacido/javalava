const DEFAULT_CONTACT_TO = 'contact@javalava.rocks';
const DEFAULT_WHOLESALE_TO = 'sharon@johnnyrocks.co';
const { isConfigured } = require('./lib/db');
const formsStore = require('./lib/forms-store');
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

function contactRecipient(subject) {
  return /wholesale|stockist/i.test(subject)
    ? process.env.WHOLESALE_EMAIL_TO || DEFAULT_WHOLESALE_TO
    : process.env.CONTACT_EMAIL_TO || DEFAULT_CONTACT_TO;
}

function plainTextMessage(payload) {
  return [
    `Name: ${payload.first_name} ${payload.last_name}`,
    `Email: ${payload.email}`,
    `Subject: ${payload.subject}`,
    `Source: ${payload.source}`,
    '',
    payload.message
  ].join('\n');
}

async function sendContactNotification(payload, submission) {
  const to = payload.mail_to || contactRecipient(payload.subject);
  const email = await sendMail({
    to,
    replyTo: payload.email,
    subject: `Java Lava contact: ${payload.subject}`,
    html: brandEmailHtml({
      eyebrow: 'New contact submission',
      title: payload.subject,
      intro: `${payload.first_name} ${payload.last_name} sent a message through the Java Lava contact form.`,
      body: [
        'The submission has been saved and is ready for follow-up.'
      ],
      details: [
        { label: 'Name', value: `${payload.first_name} ${payload.last_name}` },
        { label: 'Email', value: payload.email },
        { label: 'Subject', value: payload.subject },
        { label: 'Source', value: payload.source },
        { label: 'Message', value: payload.message }
      ]
    }),
    text: plainTextMessage(payload)
  });

  return { ...email, submissionId: submission && submission.id };
}

function contactAutoReplyMessage(payload) {
  return [
    `Hi ${payload.first_name},`,
    '',
    'Thanks for reaching out to Java Lava. We received your message and someone from our team will follow up soon.',
    '',
    'Your message details:',
    `Subject: ${payload.subject}`,
    `Message: ${payload.message}`,
    '',
    'Java Lava'
  ].join('\n');
}

async function sendContactAutoReply(payload, submission) {
  const email = await sendMail({
    to: payload.email,
    replyTo: payload.mail_to || contactRecipient(payload.subject),
    subject: 'We received your Java Lava message',
    html: brandEmailHtml({
      eyebrow: 'Message received',
      title: 'Your note reached Java Lava',
      intro: 'Thanks for writing in. Your message is saved and routed to the right Java Lava inbox.',
      body: [
        'The Java Lava team will review your note and follow up with the right next step soon.',
        'Here is the message we received, so you have a copy for your records.'
      ],
      details: [
        { label: 'Subject', value: payload.subject },
        { label: 'Message', value: payload.message }
      ]
    }),
    text: contactAutoReplyMessage(payload)
  });

  return { ...email, submissionId: submission && submission.id };
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return json(res, 204, {});
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  if (!isConfigured()) return json(res, 500, { error: 'Contact backend is not configured' });

  let body = {};
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {};
  } catch (error) {
    return json(res, 400, { error: 'Invalid JSON payload' });
  }

  const firstName = clean(body.firstName || body.first_name, 80);
  const lastName = clean(body.lastName || body.last_name, 80);
  const email = clean(body.email, 254).toLowerCase();
  const subject = clean(body.subject, 120) || 'General enquiry';
  const message = clean(body.message, 2000);

  if (!firstName) return json(res, 400, { error: 'First name is required' });
  if (!lastName) return json(res, 400, { error: 'Last name is required' });
  if (!validEmail(email)) return json(res, 400, { error: 'Valid email is required' });
  if (!message) return json(res, 400, { error: 'Message is required' });

  const payload = {
    first_name: firstName,
    last_name: lastName,
    email,
    subject,
    mail_to: contactRecipient(subject),
    message,
    source: clean(body.source, 80) || 'contact-page',
    user_agent: clean(req.headers['user-agent'], 500)
  };

  try {
    const submission = await formsStore.insertContact(payload);

    try {
      const emailResult = await sendContactNotification(payload, submission);
      const autoReply = await sendContactAutoReply(payload, submission);
      return json(res, 200, { ok: true, submission, email: emailResult, autoReply });
    } catch (emailError) {
      return json(res, 502, {
        error: 'Contact submission was saved, but one or more emails could not be sent',
        submission,
        emailError: emailError.message
      });
    }
  } catch (error) {
    console.error('[contact]', error);
    return json(res, 500, { error: 'Could not save contact submission' });
  }
};
