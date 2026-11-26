/**
 * 腾讯云开发（CloudBase）HTTP 云函数：结果评论插件的匿名使用统计。
 *
 * 接收 text/plain JSON：{ v, event, id, version, locale }
 * 在云数据库集合 `counters` 中累计每事件/每天的计数：
 *   day:YYYY-MM-DD:approve|comment|launch
 *   install:<随机安装 id>（去重）
 *   installs:total（去重后的累计安装数）
 * 不接收选中文字、评论、会话 ID 或标题。
 */
const cloudbase = require('@cloudbase/node-sdk')

const EVENTS = new Set(['launch', 'approve', 'comment'])
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

let cached = null

function database() {
  if (cached === null) {
    const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV })
    const db = app.database()
    cached = { db, command: db.command, counters: db.collection('counters') }
  }
  return cached
}

function respond(statusCode, body, contentType = 'text/plain; charset=utf-8') {
  return {
    statusCode,
    headers: { ...CORS, 'content-type': contentType },
    body,
  }
}

function requestOf(event) {
  const method = (event && (event.httpMethod
    || (event.requestContext && event.requestContext.http && event.requestContext.http.method)))
    || 'GET'
  let body = event && typeof event.body === 'string' ? event.body : ''
  if (event && event.isBase64Encoded && body !== '') {
    body = Buffer.from(body, 'base64').toString('utf8')
  }
  return { method, body }
}

async function bump(key) {
  const { command, counters } = database()
  const found = await counters.doc(key).get().catch(() => ({ data: [] }))
  if (found && Array.isArray(found.data) && found.data.length > 0) {
    await counters.doc(key).update({ n: command.inc(1) })
    return
  }
  // First write wins; a duplicate creation race leaves the extra write harmless.
  await counters.doc(key).set({ n: 1 })
}

async function markInstall(id) {
  const { counters } = database()
  const key = `install:${id}`
  const found = await counters.doc(key).get().catch(() => ({ data: [] }))
  if (found && Array.isArray(found.data) && found.data.length > 0) return
  await counters.doc(key).set({ first: Date.now() })
  await bump('installs:total')
}

exports.main = async (event) => {
  const { method, body } = requestOf(event)
  if (method === 'OPTIONS') return respond(204, '')
  if (method !== 'POST') return respond(200, 'ok')

  let payload = null
  try { payload = JSON.parse(body) } catch { payload = null }
  if (payload === null || typeof payload !== 'object') {
    return respond(400, JSON.stringify({ ok: false }), 'application/json; charset=utf-8')
  }

  const eventName = EVENTS.has(payload.event) ? payload.event : 'unknown'
  const id = typeof payload.id === 'string' && payload.id.length <= 80 ? payload.id : 'anonymous'
  const day = new Date().toISOString().slice(0, 10)

  try {
    await bump(`day:${day}:${eventName}`)
    if (eventName === 'launch') await markInstall(id)
  } catch {
    // 统计失败不影响客户端（客户端本来就忽略失败）。
  }
  return respond(200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8')
}

// 腾讯云 SCF 默认入口名；与 main 指向同一实现。
exports.main_handler = exports.main
