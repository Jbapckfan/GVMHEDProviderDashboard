// Email + SMS notifier. Resend for email (free tier).
// SMS is stubbed behind NOTIFY_SMS_ENABLED for now.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM = process.env.NOTIFY_FROM || 'GVMH ED Schedule <onboarding@resend.dev>';

async function sendEmail({ to, subject, html, text }) {
  if (!to) return { skipped: true, reason: 'no-recipient' };
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log('[notifier] RESEND_API_KEY not set — would have sent:', { to, subject });
    return { skipped: true, reason: 'no-api-key' };
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, subject, html, text }),
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Resend ${response.status}: ${body}`);
    error.status = response.status;
    throw error;
  }
  return await response.json();
}

async function sendSms({ to, body }) {
  if (process.env.NOTIFY_SMS_ENABLED !== 'true') {
    return { skipped: true, reason: 'sms-disabled' };
  }
  // Wire Twilio (or similar) here when enabling SMS.
  console.log('[notifier] SMS path not yet wired — would have sent:', { to, body });
  return { skipped: true, reason: 'not-implemented' };
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = { sendEmail, sendSms, escapeHtml };
