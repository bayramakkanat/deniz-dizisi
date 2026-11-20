/* Upstash Redis (Vercel Marketplace) REST istemcisi — bağımlılıksız.
   Ortam değişkenleri: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
   (eski adlandırma: KV_REST_API_URL / KV_REST_API_TOKEN) */
const DB_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const DB_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const KEEP_SECONDS = 90 * 24 * 3600;

async function cmd(args) {
  if (!DB_URL || !DB_TOKEN) throw new Error('db-not-configured');
  const r = await fetch(DB_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(args)
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || ('db-' + r.status));
  return j.result;
}

const boardKey = (date) => 'deniz:daily:' + date;

async function getEntry(date, pid) {
  const v = await cmd(['HGET', boardKey(date), pid]);
  return v ? JSON.parse(v) : null;
}
async function setEntry(date, pid, entry) {
  await cmd(['HSET', boardKey(date), pid, JSON.stringify(entry)]);
  await cmd(['EXPIRE', boardKey(date), KEEP_SECONDS]);
}
async function loadEntries(date) {
  const flat = await cmd(['HGETALL', boardKey(date)]);
  const out = [];
  for (let i = 0; i + 1 < (flat || []).length; i += 2) {
    try { const e = JSON.parse(flat[i + 1]); e.pid = flat[i]; out.push(e); } catch (_) {}
  }
  out.sort((a, b) => (a.moves - b.moves) || (a.sec - b.sec) || (a.ts - b.ts));
  return out;
}
function cleanName(n) {
  return String(n == null ? '' : n).replace(/[<>&"'`\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
}
const PID_RE = /^[A-Za-z0-9_-]{16,64}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

module.exports = { getEntry, setEntry, loadEntries, cleanName, PID_RE, DATE_RE };
