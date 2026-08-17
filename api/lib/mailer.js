const nodemailer = require('nodemailer');

function publicSiteUrl() {
  const explicit = process.env.SITE_URL || process.env.PUBLIC_SITE_URL;
  const value = explicit || 'https://www.javalava.rocks';
  return /^https?:\/\//i.test(value) ? value.replace(/\/$/, '') : `https://${value.replace(/\/$/, '')}`;
}

function absoluteUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  const base = publicSiteUrl();
  if (path.startsWith('/assets/')) {
    return `${new URL(base).origin}${path}`;
  }
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${base.endsWith('/') ? '' : '/'}${cleanPath}`;
}

const BRAND = {
  siteUrl: publicSiteUrl(),
  logo: absoluteUrl('/assets/product-6cafc4.png'),
  hero: absoluteUrl('/assets/img-58314d.webp'),
  gold: '#D4A017',
  ember: '#8F2D1F',
  espresso: '#120C08',
  roast: '#24130D',
  cream: '#F4EBDD',
  muted: '#A99682'
};

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function detailRows(rows) {
  return rows
    .filter((row) => row && row.value)
    .map((row) => `
      <tr>
        <td style="padding:13px 14px;border-top:1px solid #E8DFD2;color:#806F5D;font:700 11px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(row.label)}</td>
        <td style="padding:13px 14px;border-top:1px solid #E8DFD2;color:#24130D;font:500 14px Arial,sans-serif;">${escapeHtml(row.value)}</td>
      </tr>
    `)
    .join('');
}

function brandEmailHtml(options) {
  const eyebrow = escapeHtml(options.eyebrow || 'Java Lava');
  const title = escapeHtml(options.title);
  const intro = escapeHtml(options.intro);
  const body = (options.body || []).map((line) => `<p style="margin:0 0 14px;color:#4B3B2D;font:400 15px/1.65 Arial,sans-serif;">${escapeHtml(line)}</p>`).join('');
  const hasDetails = options.details && options.details.length;
  const details = hasDetails && !options.imageUrl
    ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border-collapse:separate;border-spacing:0;background:#FFF9F0;border:1px solid #E8DFD2;border-radius:14px;overflow:hidden;">${detailRows(options.details)}</table>`
    : '';
  const productBlock = options.imageUrl && hasDetails
    ? `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:22px 0;border-collapse:separate;border-spacing:0;background:#FFF9F0;border:1px solid #E8DFD2;border-radius:14px;overflow:hidden;">
        <tr>
          <td width="172" align="center" valign="middle" style="width:172px;padding:16px;background:#FFF9F0;">
            ${options.imageLinkUrl ? `<a href="${escapeHtml(absoluteUrl(options.imageLinkUrl))}" style="display:inline-block;text-decoration:none;">` : ''}
            <img src="${escapeHtml(absoluteUrl(options.imageUrl))}" alt="${escapeHtml(options.imageAlt || options.title)}" width="128" height="128" style="display:block;width:128px;max-width:128px;height:128px;object-fit:contain;margin:0 auto;border-radius:10px;border:0;">
            ${options.imageLinkUrl ? '</a>' : ''}
          </td>
          <td valign="top" style="padding:0;border-left:1px solid #E8DFD2;">
            <table role="presentation" width="100%" height="100%" cellspacing="0" cellpadding="0" style="height:100%;border-collapse:collapse;background:#FFF9F0;">${detailRows(options.details)}</table>
          </td>
        </tr>
      </table>
    `
    : '';
  const image = options.imageUrl && !hasDetails
    ? `
      <tr>
        <td style="padding:22px 34px 0;">
          <div style="background:#FFF9F0;border:1px solid #E8DFD2;border-radius:16px;padding:14px;text-align:center;">
            ${options.imageLinkUrl ? `<a href="${escapeHtml(absoluteUrl(options.imageLinkUrl))}" style="display:inline-block;text-decoration:none;">` : ''}
            <img src="${escapeHtml(absoluteUrl(options.imageUrl))}" alt="${escapeHtml(options.imageAlt || options.title)}" width="128" height="128" style="display:block;width:128px;max-width:128px;height:128px;object-fit:contain;margin:0 auto;border-radius:10px;border:0;">
            ${options.imageLinkUrl ? '</a>' : ''}
          </div>
        </td>
      </tr>
    `
    : '';
  const button = options.buttonUrl && options.buttonLabel
    ? `
      <p style="margin:28px 0 4px;">
        <a href="${escapeHtml(absoluteUrl(options.buttonUrl))}" style="display:inline-block;background:${BRAND.gold};color:#120C08;text-decoration:none;font:800 13px Arial,sans-serif;letter-spacing:.08em;text-transform:uppercase;padding:14px 20px;border-radius:999px;">${escapeHtml(options.buttonLabel)}</a>
      </p>
    `
    : '';

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#ECE6DC;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#ECE6DC;">
      <tr>
        <td align="center" style="padding:34px 16px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;border-collapse:separate;border-spacing:0;background:#FFFDF8;border-radius:22px;overflow:hidden;box-shadow:0 24px 70px rgba(18,12,8,.18);">
            <tr>
              <td background="${BRAND.hero}" style="background:${BRAND.espresso} url('${BRAND.hero}') center/cover no-repeat;padding:0;">
                <div style="background:linear-gradient(135deg,rgba(18,12,8,.96),rgba(70,24,12,.9) 58%,rgba(143,45,31,.84));padding:22px 34px 24px;">
                  <a href="${BRAND.siteUrl}" style="display:inline-block;text-decoration:none;margin:0 0 16px;">
                    <img src="${BRAND.logo}" alt="Java Lava" width="86" style="display:block;width:86px;height:auto;border:0;">
                  </a>
                  <div style="color:${BRAND.gold};font:800 11px Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px;">${eyebrow}</div>
                  <h1 style="margin:0;color:${BRAND.cream};font:800 26px/1.12 Arial,sans-serif;">${title}</h1>
                  <p style="margin:10px 0 0;color:#F9E8CF;font:400 15px/1.48 Arial,sans-serif;">${intro}</p>
                </div>
              </td>
            </tr>
            ${image}
            <tr>
              <td style="padding:34px;">
                ${body}
                ${productBlock}
                ${details}
                ${button}
                <p style="margin:30px 0 0;color:${BRAND.muted};font:400 13px/1.6 Arial,sans-serif;">Java Lava<br>Coffee liqueur with volcanic energy.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function smtpTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const encryption = String(process.env.SMTP_ENCRYPTION || 'tls').toLowerCase();

  if (!user || !pass) throw new Error('SMTP backend is not configured');

  return nodemailer.createTransport({
    host,
    port,
    secure: encryption === 'ssl' || port === 465,
    requireTLS: encryption === 'tls' || port === 587,
    auth: { user, pass }
  });
}

async function sendMail(message) {
  const from = process.env.CONTACT_EMAIL_FROM || 'Java Lava <contact@javalava.rocks>';
  const transporter = smtpTransporter();
  await transporter.sendMail({ from, ...message });
  return { to: message.to, provider: 'smtp' };
}

module.exports = { absoluteUrl, brandEmailHtml, sendMail };
