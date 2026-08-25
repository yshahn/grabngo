// api/contact.js
// Receives the "Get Started" lead form from the GrabNgo Solution website
// and emails it to the team via Resend.

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;
  const toList = Array.isArray(to) ? to : [to];
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'GrabNgo Solution <support@grabngosolution.com>', to: toList, subject, html }),
    });
    return r.ok;
  } catch(e) { return false; }
}

function esc(s) {
  return String(s || '').replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    restaurantName, ownerName, phone, email, address,
    website, cuisine, revenue, monthlyOrders,
  } = req.body || {};

  if (!restaurantName || !ownerName || !phone || !email || !address || !cuisine || !revenue || !monthlyOrders) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const rows = [
    ['Restaurant', restaurantName],
    ['Owner', ownerName],
    ['Phone', phone],
    ['Email', email],
    ['Address', address],
    ['Website', website || '—'],
    ['Cuisine / Type', cuisine],
    ['Monthly Revenue', revenue],
    ['Monthly Togo Orders', monthlyOrders],
  ].map(([k, v]) => `
    <tr>
      <td style="padding:8px 12px;font-weight:600;color:#3C4F6E;border-bottom:1px solid #E4E1D6;">${esc(k)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #E4E1D6;">${esc(v)}</td>
    </tr>`).join('');

  const notifyTo = (process.env.LEADS_NOTIFY_EMAILS || 'yonghahn@grabngosolution.com').split(',').map(e => e.trim());

  const ok = await sendEmail({
    to: notifyTo,
    subject: `🆕 New Lead: ${restaurantName}`,
    html: `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#FCFBF8;">
  <div style="background:#fff;border-radius:12px;padding:28px;box-shadow:0 2px 8px rgba(5,32,77,0.08);">
    <h1 style="font-size:20px;color:#05204D;margin:0 0 4px;">New Restaurant Inquiry</h1>
    <p style="font-size:13px;color:#3C4F6E;margin:0 0 20px;">Submitted via grabngosolution.com</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">${rows}</table>
  </div>
</body></html>`,
  });

  if (!ok) return res.status(502).json({ error: 'Failed to send notification email' });
  return res.status(200).json({ success: true });
};
