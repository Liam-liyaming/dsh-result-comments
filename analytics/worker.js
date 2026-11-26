/**
 * Cloudflare Worker: anonymous usage counting for the Result comments plugin.
 *
 * Accepts POST text/plain JSON { v, event, id, version, locale } and stores
 * per-day event totals plus a unique-install total in KV. It never receives
 * selected text, comments, session ids or titles.
 */
const EVENTS = new Set(['launch', 'approve', 'comment'])
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}

export default {
  /**
   * @param {Request} request
   * @param {{ COUNTERS?: KVNamespace }} env
   */
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })
    if (request.method !== 'POST') return new Response('ok', { headers: CORS })

    let payload = null
    try { payload = JSON.parse(await request.text()) } catch {}
    if (payload === null || typeof payload !== 'object') return json({ ok: false }, 400)

    const event = EVENTS.has(payload.event) ? payload.event : 'unknown'
    const id = typeof payload.id === 'string' && payload.id.length <= 80 ? payload.id : 'anonymous'
    const day = new Date().toISOString().slice(0, 10)

    if (env.COUNTERS) {
      const key = `day:${day}:${event}`
      const current = Number(await env.COUNTERS.get(key)) || 0
      await env.COUNTERS.put(key, String(current + 1))

      if (event === 'launch') {
        const installKey = `install:${id}`
        if (await env.COUNTERS.get(installKey) === null) {
          await env.COUNTERS.put(installKey, '1', { expirationTtl: 60 * 60 * 24 * 365 })
          const total = Number(await env.COUNTERS.get('installs:total')) || 0
          await env.COUNTERS.put('installs:total', String(total + 1))
        }
      }
    }
    return json({ ok: true })
  },
}

function json(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  })
}
