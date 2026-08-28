// api/admin-verify.js
// Checks the admin dashboard password against a server-side env var, so the
// password itself is never shipped in the page source. This dashboard reads
// data directly from each restaurant's Firestore (client-side, anonymous
// auth — the same model each restaurant's own admin panel already uses), so
// this endpoint's only job is gating the dashboard UI itself.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  const expected = process.env.GRABNGO_ADMIN_PASSWORD;

  if (!expected) {
    return res.status(500).json({ error: 'Admin password not configured' });
  }
  if (!password || password !== expected) {
    return res.status(401).json({ ok: false });
  }
  return res.status(200).json({ ok: true });
};
