const { createHash, timingSafeEqual } = require('node:crypto');

// Called by a Supabase INSERT webhook, never directly by the public form.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const secret = process.env.INQUIRY_WEBHOOK_SECRET;
  const apiKey = process.env.RESEND_API_KEY;
  if (!secret || secret.length < 32 || !apiKey) return res.status(503).json({ error: 'Email notifications not configured' });
  const authorization = req.headers.authorization;
  const digest = value => createHash('sha256').update(value).digest();
  if (typeof authorization !== 'string' || !timingSafeEqual(digest(authorization), digest(`Bearer ${secret}`))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  let payload;
  try { payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
  catch { return res.status(400).json({ error: 'Invalid JSON' }); }
  if (payload?.type !== 'INSERT' || payload?.schema !== 'public' || payload?.table !== 'inquiries') {
    return res.status(400).json({ error: 'Invalid event' });
  }
  const record = payload.record;
  const textField = (value, min, max) => typeof value === 'string' && value.trim().length >= min && value.length <= max;
  if (!record || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(record.id || '') ||
      !textField(record.name, 1, 100) || !textField(record.email, 3, 160) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(record.email) ||
      !textField(record.service, 1, 100) || !textField(record.timeline, 0, 100) ||
      !textField(record.message, 20, 1800)) {
    return res.status(400).json({ error: 'Invalid inquiry' });
  }
  const email = {
    from: process.env.INQUIRY_EMAIL_FROM || 'White Grain Studio <onboarding@resend.dev>',
    to: ['whitegrainstudio@gmail.com'],
    reply_to: record.email,
    subject: 'Kërkesë e re bashkëpunimi — White Grain Studio',
    text: [
      'Ke një kërkesë të re nga faqja White Grain Studio.', '',
      `Emri: ${record.name}`, `Email: ${record.email}`, `Shërbimi: ${record.service}`,
      `Afati: ${record.timeline || 'Për t’u diskutuar'}`, '', record.message, '',
      'Shiko dhe menaxho kërkesën: https://whitegrainstudio.vercel.app/admin',
      `ID: ${record.id}`
    ].join('\n')
  };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': `inquiry/${record.id}` },
      body: JSON.stringify(email),
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) {
      // Do not log personal data, API responses or secrets.
      console.error('Inquiry email provider rejected request:', response.status);
      return res.status(502).json({ error: 'Email provider rejected notification' });
    }
    return res.status(200).json({ accepted: true });
  } catch {
    console.error('Inquiry email provider unavailable');
    return res.status(502).json({ error: 'Email provider unavailable' });
  }
};
