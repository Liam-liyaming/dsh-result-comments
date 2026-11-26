/**
 * Result comments — browser half.
 *
 * The text-selection bar offers two directions: 👍 and 🤔 "I have a comment".
 * Both turn the selection into an atomic quote tag in the composer (direction,
 * quoted text, optional comment); the user sends it with their own message.
 * Locally kept records power the underline/badge markers and the sidebar history.
 */

window.__ModuleLoader__.load({
  id: 'dsh-result-comments',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useRef } = React

    /** Locale namespace for every string this plugin owns. */
    const NS = 'dshReview'
    /** Main-panel id; also the sidebar entry id. */
    const PANEL_ID = 'review'
    /** Browser-local record store. */
    const STORAGE_KEY = 'dsh-review/items/v1'
    const MAX_ITEMS = 2000
    const MAX_BYTES = 3 * 1024 * 1024
    const COLLAPSE_KEY = 'dsh-review/collapse/v1'
    const EXCERPT_MAX = 1200
    const QUOTE_MAX = 1200

    // ---------------------------------------------------------------- copy --

    const zh = {
      'panel.title': '我有话说',
      'panel.short': '我有话说',
      'panel.subtitle': '框选 AI 回复里的文字，点 👍 认可，或点 🤔 我有话说写一句评论。评论会作为 tag 放进输入框，随你的消息一起发送。',
      'panel.emptyTitle': '还没有评论记录',
      'panel.emptyBody': '在对话中框选 AI 回复的文字，点浮出的 👍 或 🤔 我有话说。',
      'panel.emptyFilter': '这个方向下还没有记录。',
      'panel.filter.all': '全部',
      'panel.filter.approve': '👍 认可',
      'panel.filter.unsure': '🤔 我有话说',
      'panel.range.today': '今天',
      'panel.range.yesterday': '昨天',
      'panel.range.week': '本周',
      'panel.range.month': '本月',
      'panel.range.all': '全部',
      'panel.pickDay': '选择日期',
      'panel.sessionFilter': '按会话筛选',
      'panel.allSessions': '全部会话',
      'panel.search': '搜索原文或评论',
      'panel.summary': '{n} 条 · 👍 {approve} · 🤔 {unsure} · {sessions} 个会话 · 评论 {chars} 字',
      'panel.storeCount': '本机 {n} 条',
      'panel.heatToday': '今日 24 小时',
      'panel.heatYesterday': '昨天 24 小时',
      'panel.heatWeek': '本周 24 小时',
      'panel.heatMonth': '本月 24 小时',
      'panel.heatAll': '全部 24 小时',
      'panel.heatDay': '{date} · 24 小时',
      'panel.emptyScope': '这个范围没有记录',
      'panel.emptyScopeBody': '换一个日期、会话或关键词试试。',
      'panel.more': '显示更多（还有 {n} 条）',
      'panel.tab.records': '记录',
      'panel.tab.insights': '洞察',
      'panel.tab.graph': '图谱',
      'graph.hint': '点会话展开 · 点标注看记录 · 点关键词搜索 · 滚轮缩放 · 拖动平移',
      'graph.back': '返回总览',
      'graph.legend': '圈大小 = 记录数 · 描边色 = 👍 占比 · 小点 = 标注',
      'graph.tipSession': '{title} · {n} 条 · 👍{approve} 🤔{unsure}',
      'graph.tipWord': '「{word}」· {n} 次',
      'graph.tipRecord': '「{text}」',
      'insights.total': '总记录',
      'insights.approve': '👍 认可',
      'insights.unsure': '🤔 我有话说',
      'insights.commented': '有评论',
      'insights.avgChars': '评论平均字数',
      'insights.days': '标注天数',
      'insights.sessions': '会话数',
      'insights.cloud': '评论词云',
      'insights.cloudHint': '字号 = 词频，颜色 = 👍 占比；点下方词语可在记录里搜索。',
      'insights.cloudLabel': '评论高频词词云',
      'insights.heat': '7×24 热力',
      'insights.heatHint': '周一到周日 × 0–23 点，颜色越深记录越多。',
      'insights.trend': '最近 8 周',
      'insights.day.mon': '一',
      'insights.day.tue': '二',
      'insights.day.wed': '三',
      'insights.day.thu': '四',
      'insights.day.fri': '五',
      'insights.day.sat': '六',
      'insights.day.sun': '日',
      'insights.emptyTitle': '还没有可分析的数据',
      'insights.emptyBody': '先积累一些标注，再回来看词云和热力。',
      'panel.openSession': '打开会话',
      'panel.delete': '删除',
      'panel.deleteConfirm': '确认删除',
      'panel.clear': '清空记录',
      'panel.clearConfirm': '再次点击确认',
      'panel.count': '{n} 条',
      'panel.sessionUnknown': '未命名会话',
      'panel.footer': '评论记录只保存在本机浏览器；发送走输入框，消息进入会话后 AI 与回溯都能看到。',
      'panel.usage': '本机已用：👍 {approve} · 🤔 {comment}',
      'panel.telemetryOn': '匿名统计：开',
      'panel.telemetryOff': '匿名统计：关',
      'panel.telemetryUnavailable': '匿名统计：未配置',
      'panel.telemetryHint': '匿名统计默认开启：只发送事件类型、插件版本、语言和随机安装 ID，不发送选中文字、评论或会话信息；可在右侧随时关闭。',
      'tail.title': '我的评论 · {n} 条',
      'tail.titleBare': '我的评论',
      'tail.unlocatedLine': '另有 {n} 条评论未定位到具体回复',
      'tail.viewAll': '查看全部',
      'tail.requeue': '加入输入框',
      'tail.undo': '已删除',
      'tail.undoAction': '撤销',
      'tail.comment': '我的意见：{text}',
      'tail.quote': '「{text}」',
      'level.approve': '👍 认可',
      'level.unsure': '🤔 我有话说',
      'chip.headApprove': '👍 认可这段',
      'chip.headUnsure': '🤔 我的评论',
      'chip.quote': '引用：「{text}」',
      'chip.comment': '我的意见：{text}',
      'chip.approveLabel': '👍 认可',
      'chip.quoteTitle': '引用原文',
      'chip.unsureLabel': '🤔 评论',
      'bar.approve': '👍 认可',
      'bar.say': '🤔 我有话说',
      'card.title': '🤔 我有话说',
      'card.close': '关闭',
      'card.comment': '想说什么',
      'card.commentPlaceholder': '哪里不对、希望怎么改、你的判断…',
      'card.commentNeeded': '写一句想说的内容',
      'card.insert': '加入输入框',
      'card.cancel': '取消',
      'card.empty': '没有读到选中的文字，请重新框选。',
      'card.insertFailed': '输入框暂不可用，请稍后再试。',
    }

    const en = {
      'panel.title': 'I have a comment',
      'panel.short': 'I have a comment',
      'panel.subtitle': 'Select text in an AI reply, tap 👍 to accept it, or tap 🤔 I have a comment to write one. Each comment becomes a tag in the composer and goes out with your message.',
      'panel.emptyTitle': 'No comments yet',
      'panel.emptyBody': 'Select text in an AI reply and tap 👍 or 🤔 I have a comment.',
      'panel.emptyFilter': 'No comments in this direction yet.',
      'panel.filter.all': 'All',
      'panel.filter.approve': '👍 Accept',
      'panel.filter.unsure': '🤔 I have a comment',
      'panel.range.today': 'Today',
      'panel.range.yesterday': 'Yesterday',
      'panel.range.week': 'This week',
      'panel.range.month': 'This month',
      'panel.range.all': 'All',
      'panel.pickDay': 'Pick a date',
      'panel.sessionFilter': 'Filter by session',
      'panel.allSessions': 'All sessions',
      'panel.search': 'Search quotes or comments',
      'panel.summary': '{n} records · 👍 {approve} · 🤔 {unsure} · {sessions} sessions · {chars} comment characters',
      'panel.storeCount': '{n} local records',
      'panel.heatToday': 'Today · 24 hours',
      'panel.heatYesterday': 'Yesterday · 24 hours',
      'panel.heatWeek': 'This week · 24 hours',
      'panel.heatMonth': 'This month · 24 hours',
      'panel.heatAll': 'All · 24 hours',
      'panel.heatDay': '{date} · 24 hours',
      'panel.emptyScope': 'No records in this range',
      'panel.emptyScopeBody': 'Try another date, session or keyword.',
      'panel.more': 'Show more ({n} left)',
      'panel.tab.records': 'Records',
      'panel.tab.insights': 'Insights',
      'panel.tab.graph': 'Graph',
      'graph.hint': 'Click a session to expand, a marker for its record, a word to search; wheel to zoom, drag to pan.',
      'graph.back': 'Back to overview',
      'graph.legend': 'Circle size = records · ring colour = 👍 share · dots = annotations',
      'graph.tipSession': '{title} · {n} · 👍{approve} 🤔{unsure}',
      'graph.tipWord': '“{word}” · {n} times',
      'graph.tipRecord': '“{text}”',
      'insights.total': 'Total records',
      'insights.approve': '👍 Accept',
      'insights.unsure': '🤔 I have a comment',
      'insights.commented': 'With comments',
      'insights.avgChars': 'Avg comment chars',
      'insights.days': 'Active days',
      'insights.sessions': 'Sessions',
      'insights.cloud': 'Comment cloud',
      'insights.cloudHint': 'Font size = frequency, colour = 👍 share; click a word to search the records.',
      'insights.cloudLabel': 'Comment word cloud',
      'insights.heat': '7×24 activity',
      'insights.heatHint': 'Monday–Sunday × 0–23, darker means more records.',
      'insights.trend': 'Last 8 weeks',
      'insights.day.mon': 'Mon',
      'insights.day.tue': 'Tue',
      'insights.day.wed': 'Wed',
      'insights.day.thu': 'Thu',
      'insights.day.fri': 'Fri',
      'insights.day.sat': 'Sat',
      'insights.day.sun': 'Sun',
      'insights.emptyTitle': 'No data to analyse yet',
      'insights.emptyBody': 'Add a few comments and come back for the cloud and heatmap.',
      'panel.openSession': 'Open session',
      'panel.delete': 'Delete',
      'panel.deleteConfirm': 'Confirm delete',
      'panel.clear': 'Clear records',
      'panel.clearConfirm': 'Click again to confirm',
      'panel.count': '{n}',
      'panel.sessionUnknown': 'Untitled session',
      'panel.footer': 'Comments stay in this browser. Sending happens in the composer, so the agent and later replays see the message.',
      'panel.usage': 'On this device: 👍 {approve} · 🤔 {comment}',
      'panel.telemetryOn': 'Anonymous stats: on',
      'panel.telemetryOff': 'Anonymous stats: off',
      'panel.telemetryUnavailable': 'Anonymous stats: not configured',
      'panel.telemetryHint': 'Anonymous stats are on by default: event type, plugin version, locale and a random install id only — never the selected text, a comment or session data. Turn it off at any time on the right.',
      'tail.title': 'My comments · {n}',
      'tail.titleBare': 'My comments',
      'tail.unlocatedLine': '{n} more comment(s) could not be linked to an answer',
      'tail.viewAll': 'View all',
      'tail.requeue': 'Add to composer',
      'tail.undo': 'Deleted',
      'tail.undoAction': 'Undo',
      'tail.comment': 'My comment: {text}',
      'tail.quote': '“{text}”',
      'level.approve': '👍 Accept',
      'level.unsure': '🤔 I have a comment',
      'chip.headApprove': '👍 I accept this',
      'chip.headUnsure': '🤔 My comment',
      'chip.quote': 'Quoted: “{text}”',
      'chip.comment': 'My comment: {text}',
      'chip.approveLabel': '👍 Accept',
      'chip.quoteTitle': 'Quoted text',
      'chip.unsureLabel': '🤔 Comment',
      'bar.approve': '👍 Accept',
      'bar.say': '🤔 I have a comment',
      'card.title': '🤔 I have a comment',
      'card.close': 'Close',
      'card.comment': 'What do you want to say',
      'card.commentPlaceholder': 'What is wrong, what to change, your judgement…',
      'card.commentNeeded': 'Write what you want to say',
      'card.insert': 'Add to composer',
      'card.cancel': 'Cancel',
      'card.empty': 'No selected text was read. Select it again.',
      'card.insertFailed': 'The composer is unavailable right now. Try again.',
    }

    // -------------------------------------------------------------- levels --

    const LEVELS = [
      { id: 'approve', emoji: '👍', color: 'var(--dsw-alias-state-success-primary)' },
      { id: 'unsure', emoji: '🤔', color: 'var(--dsw-alias-state-warn-primary)' },
    ]

    /** Local calendar day of a timestamp, used for date filters and daily heatmaps. */
    function dayKey(timestamp) {
      const date = new Date(timestamp)
      const pad = (value) => String(value).padStart(2, '0')
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
    }

    /** UTF-8 size of the stored JSON, so the budget tracks real quota use. */
    function serializedBytes(value) {
      try {
        return new TextEncoder().encode(JSON.stringify(value)).length
      } catch {
        return JSON.stringify(value).length
      }
    }

    /** The review level of one record, or undefined. */
    function levelOf(id) {
      for (const level of LEVELS) if (level.id === id) return level
      return undefined
    }

    // --------------------------------------------------------------- store --

    /** One stored record, or undefined when the parsed row is malformed. */
    function parseRecord(value) {
      if (typeof value !== 'object' || value === null) return undefined
      const { id, sessionId, text } = value
      if (typeof id !== 'string' || typeof sessionId !== 'string' || typeof text !== 'string') return undefined
      // The earlier three-direction model folds into today's two directions.
      const level = value.level === 'directive' ? 'unsure' : value.level
      if (levelOf(level) === undefined) return undefined
      const createdAt = typeof value.createdAt === 'number' ? value.createdAt : Date.now()
      return {
        id,
        sessionId,
        sessionTitle: typeof value.sessionTitle === 'string' ? value.sessionTitle : '',
        text,
        comment: typeof value.comment === 'string' ? value.comment : '',
        level,
        turn: typeof value.turn === 'number' && Number.isFinite(value.turn) ? value.turn : null,
        messageId: typeof value.messageId === 'string' && value.messageId !== '' ? value.messageId : null,
        createdAt,
        day: typeof value.day === 'string' && value.day !== '' ? value.day : dayKey(createdAt),
        sentAt: typeof value.sentAt === 'number' ? value.sentAt : null,
      }
    }

    function loadRecords() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY)
        if (raw === null) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        const records = []
        for (const row of parsed) {
          const record = parseRecord(row)
          if (record !== undefined) records.push(record)
        }
        return trimRecords(records)
      } catch {
        return []
      }
    }

    /** Drop the n oldest records, preferring already-sent ones. */
    function dropOldest(records, count) {
      if (count <= 0) return records
      const dropped = new Set()
      for (let index = records.length - 1; index >= 0 && dropped.size < count; index -= 1) {
        if (records[index].sentAt !== null) dropped.add(index)
      }
      for (let index = records.length - 1; index >= 0 && dropped.size < count; index -= 1) {
        if (!dropped.has(index)) dropped.add(index)
      }
      return records.filter((_, index) => !dropped.has(index))
    }

    /** Keep the newest records under both the count and the byte budget. */
    function trimRecords(records) {
      let next = records.length > MAX_ITEMS ? dropOldest(records, records.length - MAX_ITEMS) : records
      while (next.length > 0 && serializedBytes(next) > MAX_BYTES) {
        next = dropOldest(next, 1)
      }
      return next
    }

    function createStore() {
      let records = loadRecords()
      const listeners = new Set()
      const emit = () => { for (const listener of [...listeners]) listener() }
      const persist = () => {
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
        } catch {
          // A browser without writable storage keeps the list for this page only.
        }
      }
      return {
        get() { return records },
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        add(record) {
          records = trimRecords([record, ...records])
          persist()
          emit()
        },
        refresh() {
          records = loadRecords()
          emit()
        },
        remove(id) {
          records = records.filter(record => record.id !== id)
          persist()
          emit()
        },
        /** Persist resolved anchors for reviews saved before anchoring existed. */
        anchor(patches) {
          if (patches.length === 0) return
          const byId = new Map(patches.map(patch => [patch.id, patch]))
          let changed = false
          records = records.map((record) => {
            if (record.turn !== null) return record
            const patch = byId.get(record.id)
            if (patch === undefined) return record
            changed = true
            return { ...record, turn: patch.turn, messageId: patch.messageId }
          })
          if (!changed) return
          persist()
          emit()
        },
        clear() {
          records = []
          persist()
          emit()
        },
      }
    }

    // ----------------------------------------------------------- telemetry --

    /**
     * Optional anonymous usage counting. Default off; enabling it sends only the
     * event type, plugin version, locale and a random install id — never the
     * selected text, a comment, a session id or a title.
     */
    const TELEMETRY_URL = 'https://coloured-shark-d9gd473yra7e31b9a-1301122767.ap-shanghai.app.tcloudbase.com/count'
    const TELEMETRY_KEY = 'dsh-review/telemetry/v1'
    const USAGE_KEY = 'dsh-review/usage/v1'
    const PLUGIN_VERSION = '1.1.0'

    function readStored(key) {
      try {
        const raw = window.localStorage.getItem(key)
        return raw === null ? null : JSON.parse(raw)
      } catch {
        return null
      }
    }

    function writeStored(key, value) {
      try {
        window.localStorage.setItem(key, JSON.stringify(value))
      } catch {
        // Storage-less browsers simply keep no counters.
      }
    }

    function randomId() {
      try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID()
      } catch {
        // Fall back to a timestamp-based id.
      }
      return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
    }

    /** Local counters plus the opt-in beacon. */
    function createTelemetry(localeOf) {
      const storedPrefs = readStored(TELEMETRY_KEY)
      // Anonymous stats are on by default; an explicit off choice is remembered.
      let prefs = storedPrefs === null
        ? { enabled: true, launchSent: false, installId: null }
        : {
          enabled: storedPrefs.enabled !== false,
          launchSent: storedPrefs.launchSent === true,
          installId: typeof storedPrefs.installId === 'string' ? storedPrefs.installId : null,
        }
      const storedUsage = readStored(USAGE_KEY)
      let usage = {
        approve: storedUsage !== null && Number.isFinite(storedUsage.approve) ? storedUsage.approve : 0,
        comment: storedUsage !== null && Number.isFinite(storedUsage.comment) ? storedUsage.comment : 0,
      }
      const listeners = new Set()
      const notify = () => { for (const listener of [...listeners]) listener() }

      const send = (event) => {
        if (!prefs.enabled || TELEMETRY_URL === '') return
        if (prefs.installId === null) {
          prefs = { ...prefs, installId: randomId() }
          writeStored(TELEMETRY_KEY, prefs)
        }
        let body
        try {
          body = JSON.stringify({
            v: 1,
            event,
            id: prefs.installId,
            version: PLUGIN_VERSION,
            locale: localeOf(),
          })
        } catch {
          return
        }
        try {
          // text/plain keeps this a CORS simple request; the Worker answers with '*'.
          fetch(TELEMETRY_URL, {
            method: 'POST',
            headers: { 'content-type': 'text/plain' },
            body,
            keepalive: true,
            mode: 'cors',
          }).catch(() => {})
        } catch {
          // Offline or blocked: the beacon is best-effort only.
        }
      }

      return {
        snapshot() {
          return { ...prefs, usage: { ...usage }, configured: TELEMETRY_URL !== '' }
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        /** Send the one-time launch beacon for this install when stats are enabled. */
        start() {
          if (!prefs.enabled || TELEMETRY_URL === '' || prefs.launchSent) return
          prefs = { ...prefs, launchSent: true }
          writeStored(TELEMETRY_KEY, prefs)
          send('launch')
        },
        setEnabled(enabled) {
          if (enabled === prefs.enabled) return
          prefs = { ...prefs, enabled }
          writeStored(TELEMETRY_KEY, prefs)
          notify()
          if (enabled && !prefs.launchSent) {
            prefs = { ...prefs, launchSent: true }
            writeStored(TELEMETRY_KEY, prefs)
            send('launch')
          }
        },
        track(event) {
          if (event === 'approve' || event === 'comment') {
            usage = { ...usage, [event]: usage[event] + 1 }
            writeStored(USAGE_KEY, usage)
            notify()
          }
          send(event)
        },
      }
    }

    function useTelemetry(telemetry) {
      const [state, setState] = useState(() => telemetry.snapshot())
      useEffect(() => telemetry.subscribe(() => setState(telemetry.snapshot())), [telemetry])
      return state
    }

    // ------------------------------------------------------------- helpers --

    /** Trim text to a display or payload budget, keeping one trailing ellipsis. */
    function trimLabel(text, limit) {
      return text.length > limit ? `${text.slice(0, limit)}…` : text
    }

    function snippet(text, limit) {
      const trimmed = String(text).trim()
      return trimmed.length > limit ? `${trimmed.slice(0, limit)}…` : trimmed
    }

    /** Compare rendered selection text with stored Markdown: drop markup, collapse whitespace. */
    function normalizeText(value) {
      return String(value)
        .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/[`*_>#|~]/g, '')
        .replace(/^\s*[-+]\s+/gm, '')
        .replace(/\s+/g, ' ')
        .trim()
    }

    /** Text of one assistant payload, across prose and reasoning blocks. */
    function assistantText(data) {
      if (data === undefined || data === null || !Array.isArray(data.blocks)) return ''
      return data.blocks
        .filter(block => block !== null && block !== undefined
          && (block.kind === 'text' || block.kind === 'reasoning')
          && typeof block.text === 'string')
        .map(block => block.text)
        .join('\n')
    }

    /**
     * Turn of the current browser selection, read from the host's own chat-row marker.
     * Called while the review card mounts, before focus moves and collapses the selection.
     */
    function selectedTurn() {
      try {
        if (typeof window === 'undefined' || typeof window.getSelection !== 'function') return null
        const selection = window.getSelection()
        if (selection === null || selection.rangeCount === 0) return null
        const start = selection.getRangeAt(0).startContainer
        const element = start !== null
          ? (start.nodeType === 1 ? start : start.parentElement)
          : null
        if (element === null || element === undefined || typeof element.closest !== 'function') return null
        const row = element.closest('[data-chat-turn]')
        if (row === null) return null
        const value = Number(row.getAttribute('data-chat-turn'))
        return Number.isFinite(value) ? value : null
      } catch {
        return null
      }
    }

    /** Collected assistant answers of the loaded conversation, each with its Turn and text. */
    function answerTexts(nodes) {
      const answers = []
      for (const node of nodes) {
        if (node.kind !== 'assistant-step' || node.data === undefined || node.data === null) continue
        if (typeof node.data.turn !== 'number') continue
        const body = normalizeText(assistantText(node.data))
        if (body === '') continue
        answers.push({
          turn: node.data.turn,
          messageId: node.data.finalNode !== undefined && node.data.finalNode !== null
            && typeof node.data.finalNode.messageId === 'string'
            ? node.data.finalNode.messageId : null,
          body,
        })
      }
      return answers
    }

    /**
     * Find the answer that contains a reviewed excerpt. Short probes absorb Markdown the
     * rendered selection no longer carries; the newest matching answer wins.
     */
    function locateReview(answers, excerpt) {
      const full = normalizeText(excerpt)
      const probes = [full]
      if (full.length > 60) probes.push(full.slice(0, 60))
      if (full.length > 30) probes.push(full.slice(0, 30))
      let best = null
      for (const answer of answers) {
        if (!probes.some(probe => probe.length >= 8 && answer.body.includes(probe))) continue
        if (best === null || answer.turn > best.turn) best = answer
      }
      return best
    }

    const HIGHLIGHT_LEVELS = ['approve', 'unsure']

    /** Re-paint the CSS Custom Highlight ranges, one highlight per level. */
    function syncHighlights(entries) {
      try {
        const registry = globalThis.CSS
        if (registry === undefined || registry.highlights === undefined
          || typeof globalThis.Highlight !== 'function') return
        const buckets = { approve: [], unsure: [] }
        for (const entry of entries.values()) {
          const range = entry.range
          if (range.startContainer !== null && range.startContainer.isConnected) {
            buckets[entry.level].push(range)
          }
        }
        for (const level of HIGHLIGHT_LEVELS) {
          const highlight = new globalThis.Highlight(...buckets[level])
          registry.highlights.set(`dsr-${level}`, highlight)
        }
      } catch {
        // A browser without the Custom Highlight API keeps the emoji badge only.
      }
    }

    /**
     * Live underline/badge registry: review id -> animated DOM Range.
     * A range dies when its message re-renders; the Turn card rebuilds it by text.
     */
    function createMarkers() {
      const entries = new Map()
      const listeners = new Set()
      let isSuppressed = false
      const emit = () => {
        syncHighlights(entries)
        for (const listener of [...listeners]) listener()
      }
      return {
        get() { return entries },
        /** True while a text-selection surface is open: the badges would paint over it. */
        get suppressed() { return isSuppressed },
        setSuppressed(value) {
          const next = Boolean(value)
          if (isSuppressed === next) return
          isSuppressed = next
          for (const listener of [...listeners]) listener()
        },
        subscribe(listener) {
          listeners.add(listener)
          return () => { listeners.delete(listener) }
        },
        has(id) {
          const entry = entries.get(id)
          if (entry === undefined || !entry.range.startContainer.isConnected) return false
          const live = entry.range.toString().replace(/\s+/gu, '')
          const probe = String(entry.text).replace(/\s+/gu, '').slice(0, 24)
          return probe === '' || live.includes(probe)
        },
        set(id, range, record) {
          if (range === null || range === undefined || range.startContainer === null
            || range.endContainer === null
            || !range.startContainer.isConnected || !range.endContainer.isConnected) return false
          entries.set(id, {
            range, level: record.level, comment: record.comment, text: record.text,
            sessionId: record.sessionId,
          })
          emit()
          return true
        },
        delete(id) {
          if (entries.delete(id)) emit()
        },
        refresh() {
          syncHighlights(entries)
        },
        prune() {
          let changed = false
          for (const [id] of entries) {
            if (!this.has(id)) {
              entries.delete(id)
              changed = true
            }
          }
          if (changed) emit()
        },
      }
    }

    /** Locate an excerpt inside a Turn's rendered rows and return a visible Range. */
    function findTextRange(turn, excerpt) {
      const probe = String(excerpt).replace(/\s+/gu, '')
      if (probe.length < 4) return null
      const needle = Array.from(probe).slice(0, 80).join('')
      let rows = []
      try {
        // Scope to the mounted conversation so another panel's rows cannot match.
        const root = document.querySelector('[data-conversation-scroll]') ?? document
        rows = [...root.querySelectorAll(`[data-chat-turn="${turn}"]`)]
      } catch {
        return null
      }
      for (const row of rows) {
        for (const source of row.querySelectorAll('[data-text-interaction-source]')) {
          const range = rangeOfText(source, needle)
          if (range !== null) return range
        }
        const range = rangeOfText(row, needle)
        if (range !== null) return range
      }
      return null
    }

    /**
     * Range for the first occurrence of `needle` in the row's visible text, compared
     * without whitespace so Markdown line breaks and block boundaries do not matter.
     */
    function rangeOfText(root, needle) {
      let flat = ''
      const points = []
      const walk = (node) => {
        if (node.nodeType === 3) {
          const value = node.nodeValue ?? ''
          for (let index = 0; index < value.length; index += 1) {
            const char = value[index]
            if (/\s/u.test(char)) continue
            flat += char
            points.push({ node, offset: index })
          }
          return
        }
        if (node.nodeType !== 1) return
        if (node.hidden
          || node.matches('button, [aria-hidden="true"], [data-text-interaction-exclude], .katex-mathml, .sr-only')) return
        for (const child of node.childNodes) walk(child)
      }
      walk(root)
      let from = 0
      while (from <= flat.length) {
        const index = flat.indexOf(needle, from)
        if (index < 0) return null
        const start = points[index]
        const end = points[index + needle.length - 1]
        if (start !== undefined && end !== undefined) {
          try {
            const range = document.createRange()
            range.setStart(start.node, start.offset)
            range.setEnd(end.node, end.offset + 1)
            // A match inside collapsed content would paint nothing and hide the marker.
            if (range.getClientRects().length > 0) return range
          } catch {
            // Try the next occurrence.
          }
        }
        from = index + 1
      }
      return null
    }

    /** Re-render trigger for the marker registry (the Map itself is mutated in place). */
    function useMarkerVersion(markers) {
      const [version, setVersion] = useState(0)
      useEffect(() => markers.subscribe(() => { setVersion(value => value + 1) }), [markers])
      return version
    }

    /**
     * Frame-wide layer: paints the stored review ranges (CSS Custom Highlight) and
     * floats the level emoji at the end of each marked selection.
     * @param props - locale, registry, store, and the panel opener.
     */
    /**
     * Inline mark badges: each badge rides the right corner of its marked line, and when
     * that line scrolls out of the transcript band the badge stays parked on the band's
     * edge instead of disappearing.
     */
    function ReviewMarkerLayer(props) {
      const { t, markers, store } = props
      useMarkerVersion(markers)
      const [view, setView] = useState({ items: [] })
      const [hovered, setHovered] = useState(null)

      useEffect(() => {
        let frame
        let lastKey = ''
        const clear = () => {
          if (lastKey === '') return
          lastKey = ''
          setView({ items: [] })
        }
        const update = () => {
          frame = undefined
          // A selection surface lives in the Chat column; this layer rides the frame
          // overlay, so it can only get out of the way instead of outranking it.
          if (markers.suppressed) { clear(); return }
          const scroll = document.querySelector('[data-conversation-scroll]')
          if (scroll === null) { clear(); return }
          const rect = scroll.getBoundingClientRect()
          const composer = document.querySelector('[data-composer-seat]')
          const floor = Math.min(
            window.innerHeight,
            rect.bottom,
            composer === null ? window.innerHeight : composer.getBoundingClientRect().top,
          )
          // Badges park inside this band: they never ride over the tabs above it, and
          // never over the composer below it.
          const ceiling = rect.top + 26
          if (floor <= ceiling) { clear(); return }
          // The layer belongs to the conversation on screen: markers from another
          // session are dropped rather than shown next to this one's marks.
          const owner = document.querySelector('[data-conversation-content]')
            ?.getAttribute('data-conversation-session') ?? ''
          const items = []
          const foreign = []
          for (const [id, entry] of markers.get()) {
            if (owner !== '' && entry.sessionId !== undefined && entry.sessionId !== owner) {
              foreign.push(id)
              continue
            }
            const range = entry.range
            if (!range.startContainer.isConnected || !range.endContainer.isConnected) continue
            const rects = range.getClientRects()
            // Last visible line: the badge hangs above the end of the marked text.
            let anchor = null
            for (let index = rects.length - 1; index >= 0; index -= 1) {
              if (rects[index].width > 0 && rects[index].height > 0) { anchor = rects[index]; break }
            }
            if (anchor === null) continue
            items.push({
              id,
              level: entry.level,
              comment: entry.comment,
              text: entry.text,
              top: Math.max(ceiling, Math.min(floor - 2, anchor.top - 1)),
              left: Math.max(rect.left + 4, Math.min(rect.right - 26, anchor.right - 6)),
            })
          }
          for (const id of foreign) markers.delete(id)
          const key = `${Math.round(ceiling)}:${Math.round(floor)}:`
            + items.map(item => `${item.id}:${Math.round(item.top)}:${Math.round(item.left)}`).join(',')
          if (key === lastKey) return
          lastKey = key
          setView({ items })
        }
        const schedule = () => {
          if (frame === undefined) frame = requestAnimationFrame(update)
        }
        schedule()
        const unsubscribeMarkers = markers.subscribe(schedule)
        const unsubscribeStore = store.subscribe(() => {
          const live = new Set(store.get().map(record => record.id))
          for (const id of [...markers.get().keys()]) {
            if (!live.has(id)) markers.delete(id)
          }
          schedule()
        })
        document.addEventListener('scroll', schedule, true)
        window.addEventListener('resize', schedule)
        // Layout changes from switching panels or sessions do not always emit scroll or
        // resize; a light tick keeps the parked badges in sync with the transcript band.
        const tick = setInterval(schedule, 1000)
        return () => {
          if (frame !== undefined) cancelAnimationFrame(frame)
          clearInterval(tick)
          unsubscribeMarkers()
          unsubscribeStore()
          document.removeEventListener('scroll', schedule, true)
          window.removeEventListener('resize', schedule)
        }
      }, [markers, store])

      const { items } = view
      const active = hovered === null ? null : items.find(item => item.id === hovered) ?? null
      if (items.length === 0) return h(Styles)

      /** Centre the transcript on one mark; the badge itself may be parked on a band edge. */
      const jumpTo = (id) => {
        const entry = markers.get().get(id)
        const scroll = document.querySelector('[data-conversation-scroll]')
        if (entry === undefined || scroll === null) return
        let rect = null
        try { rect = entry.range.getBoundingClientRect() } catch { rect = null }
        if (rect === null || (rect.width === 0 && rect.height === 0)) {
          const node = entry.range.startContainer
          const host = node.nodeType === 1 ? node : node.parentElement
          if (host === null) return
          rect = host.getBoundingClientRect()
        }
        const box = scroll.getBoundingClientRect()
        const target = scroll.scrollTop + (rect.top - box.top) - (box.height / 2) + (rect.height / 2)
        setHovered(null)
        try {
          scroll.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
        } catch {
          scroll.scrollTop = Math.max(0, target)
        }
      }

      const badges = items.map((item) => {
        const level = levelOf(item.level) ?? LEVELS[0]
        const label = [t(`level.${item.level}`), item.comment]
          .filter(part => part !== undefined && part !== '').join(' · ')
        return h('button', {
          key: item.id,
          type: 'button',
          className: 'dsr-mark dsr-mark--float',
          style: {
            top: `${item.top}px`,
            left: `${item.left}px`,
            '--dsr-level-color': level.color,
          },
          title: label,
          'aria-label': label,
          onMouseEnter: () => { setHovered(item.id) },
          onFocus: () => { setHovered(item.id) },
          onMouseLeave: () => { setHovered(null) },
          onClick: () => { jumpTo(item.id) },
        }, level.emoji)
      })

      const card = active === null ? null : h('div', {
        className: 'dsr-tip',
        role: 'tooltip',
        style: {
          top: `${Math.min(active.top + 8, window.innerHeight - 24)}px`,
          left: `${Math.max(8, active.left - 10)}px`,
        },
      },
      h('div', { className: 'dsr-tip-head' }, t(`level.${active.level}`)),
      active.text === undefined ? null
        : h('blockquote', { className: 'dsr-tip-quote' }, snippet(active.text, 160)),
      active.comment === undefined || active.comment === '' ? null
        : h('p', { className: 'dsr-tip-comment' }, active.comment))

      return h(React.Fragment, null,
        h(Styles),
        h('div', { className: 'dsr-marks' }, badges),
        card)
    }

    /** Newest Turn that already produced an answer; a still-running Turn does not count. */
    function latestAnswerTurn(nodes) {
      let latest = -1
      for (const node of nodes) {
        if (node.kind !== 'assistant-step' || node.data === undefined || node.data === null) continue
        if (node.data.status === 'running') continue
        if (typeof node.data.turn === 'number' && node.data.turn > latest) latest = node.data.turn
      }
      return latest
    }

    /** Composer-quote payload and its compact summary for one review. */
    function chipPayload(t, level, text, comment) {
      const head = t(level === 'approve' ? 'chip.headApprove' : 'chip.headUnsure')
      const lines = [head, t('chip.quote', { text: snippet(text, 300) })]
      if (comment !== '') lines.push(t('chip.comment', { text: comment }))
      const summary = comment === ''
        ? {
          label: t('chip.approveLabel'),
          title: t('chip.quoteTitle'),
          body: snippet(text, 300),
        }
        : {
          label: t('chip.unsureLabel'),
          title: snippet(text, 80),
          body: comment,
        }
      return { text: lines.join('\n'), summary }
    }

    function newId() {
      return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    }

    function formatTime(stamp) {
      try {
        const value = new Date(stamp)
        const now = new Date()
        const time = value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        if (value.toDateString() === now.toDateString()) return time
        return `${value.toLocaleDateString([], { month: 'numeric', day: 'numeric' })} ${time}`
      } catch {
        return ''
      }
    }

    function useRecords(store) {
      const [records, setRecords] = useState(store.get)
      useEffect(() => store.subscribe(() => { setRecords(store.get()) }), [store])
      return records
    }

    // -------------------------------------------------------------- styles --

    const STYLES = `
::highlight(dsr-approve) {
  background-color: color-mix(in srgb, var(--dsw-alias-state-success-primary) 12%, transparent);
  text-decoration-line: underline;
  text-decoration-color: var(--dsw-alias-state-success-primary);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}
::highlight(dsr-unsure) {
  background-color: color-mix(in srgb, var(--dsw-alias-state-warn-primary) 12%, transparent);
  text-decoration-line: underline;
  text-decoration-style: dashed;
  text-decoration-color: var(--dsw-alias-state-warn-primary);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

/* Mark badges. They ride the frame-level overlay slot, which sits above the Chat
   column — so while a selection surface is open the badges step aside instead of
   trying to outrank it with z-index. */
.dsr-marks {
  position: fixed; inset: 0; z-index: 5; pointer-events: none;
}
.dsr-mark {
  flex: none; cursor: pointer;
  display: grid; place-items: center;
  width: 22px; height: 22px; padding: 0;
  border-radius: 999px;
  background: var(--dsw-alias-bg-overlay);
  border: 1px solid color-mix(in srgb, var(--dsr-level-color) 55%, transparent);
  box-shadow: var(--dsw-elevation-panel);
  font-size: 13px; line-height: 1;
  color: var(--dsw-alias-label-primary);
}
.dsr-mark:hover { border-color: var(--dsr-level-color); }
/* The inline badge hangs above the right corner of the marked line, clear of the text. */
.dsr-mark--float {
  position: absolute; pointer-events: auto; transform: translate(0, -100%);
}
.dsr-tip {
  position: fixed; z-index: 6;
  width: max-content; max-width: min(420px, 50vw);
  padding: 9px 11px; border-radius: 12px;
  background: var(--dsw-alias-bg-overlay);
  box-shadow: var(--dsw-elevation-panel);
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-xs-13, 13px/1.55 system-ui, sans-serif);
  pointer-events: none;
}
.dsr-tip-head { font-size: 11px; color: var(--dsw-alias-label-secondary); margin-bottom: 4px; }
.dsr-tip-quote {
  margin: 0 0 6px; padding-left: 8px;
  border-left: 2px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  white-space: pre-wrap; word-break: break-word;
}
.dsr-tip-comment { margin: 0; white-space: pre-wrap; word-break: break-word; }
/* The host's quote tag is plain inline text (no border or fill); its own hover
   swaps the quote glyph for a close glyph. Keep that language: separate adjacent
   tags, give the text room on the right, and mark hover with a soft fill only. */
[data-composer-quote] {
  margin: 0 4px;
  padding: 0 4px;
  border-radius: 6px;
  transition: background-color 100ms ease;
}
[data-composer-quote]:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsr-mark:focus-visible { outline: 2px solid var(--dsr-level-color); outline-offset: 1px; }

.dsrt-card {
  margin-top: 10px; padding: 10px 12px;
  border: 1px solid var(--dsw-alias-border-l1); border-left: 2px solid var(--dsw-alias-brand-primary);
  border-radius: 10px; background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-xs-13, 13px/1.5 system-ui, sans-serif);
}
.dsrt-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dsrt-title { font-size: 12.5px; font-weight: 500; }
.dsrt-spacer { flex: 1; }
.dsrt-link {
  border: 0; background: transparent; padding: 0; cursor: pointer;
  color: var(--dsw-alias-brand-primary); font: inherit; font-size: 12px;
}
.dsrt-link:focus-visible {
  outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px;
}
.dsrt-unlocated-line { margin: 8px 0 0; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.dsrt-requeue {
  flex: none; border: 0; background: transparent; padding: 0 2px; cursor: pointer;
  color: var(--dsw-alias-brand-primary); font: inherit; font-size: 12px;
}
.dsrt-requeue:hover { text-decoration: underline; }
.dsrt-remove { color: var(--dsw-alias-label-secondary); }
.dsrt-remove:hover { color: var(--dsw-alias-state-error-primary); }
.dsrt-undo {
  display: flex; align-items: center; gap: 8px;
  margin: 8px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary);
}
.dsrt-list { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
.dsrt-item { display: flex; flex-direction: column; gap: 3px; }
.dsrt-line { display: flex; align-items: center; gap: 8px; min-width: 0; }
.dsrt-badge {
  flex: none; display: inline-flex; align-items: center; padding: 0 8px; border-radius: 999px;
  font-size: 11.5px; line-height: 20px; color: var(--dsr-level-color);
  border: 1px solid color-mix(in srgb, var(--dsr-level-color) 45%, transparent);
  background: color-mix(in srgb, var(--dsr-level-color) 10%, transparent);
}
.dsrt-quote {
  margin: 2px 0 0; color: var(--dsw-alias-label-secondary); font-size: 12.5px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
  white-space: pre-wrap; word-break: break-word;
}
.dsrt-quote-inline {
  flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-size: 12.5px; color: var(--dsw-alias-label-secondary);
}
.dsrt-state { flex: none; margin-left: auto; font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.dsrt-comment { margin: 0; font-size: 12.5px; white-space: pre-wrap; word-break: break-word; }
.dsr-bar {
  display: flex; align-items: center; gap: 2px; padding: 3px;
  border-radius: 999px;
  background: var(--dsw-alias-button-floating-fill, var(--dsw-alias-bg-overlay));
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l3);
  box-shadow: var(--dsw-elevation-panel);
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-xs-13, 13px/1.4 system-ui, sans-serif);
}
.dsr-bar-btn {
  border: 0; background: transparent; color: inherit; font: inherit;
  padding: 5px 11px; border-radius: 999px; cursor: pointer; white-space: nowrap;
}
.dsr-bar-btn:hover { background: var(--dsw-alias-button-floating-hover, var(--dsw-alias-bg-layer-2)); }
.dsr-bar-btn:focus-visible { outline: 2px solid var(--dsw-alias-brand-primary); outline-offset: 1px; }
.dsr-bar-btn--quiet { color: var(--dsw-alias-label-secondary); font-size: 12px; }
.dsr-bar-btn--emoji { font-size: 16px; line-height: 1; padding: 4px 7px; }
.dsr-bar-divider {
  flex: none; width: 1px; height: 16px; margin: 0 3px;
  background: var(--dsw-alias-border-l1);
}

.dsr-card {
  box-sizing: border-box; width: 360px; max-width: 100%; max-height: inherit; overflow: auto;
  display: flex; flex-direction: column; gap: 12px; padding: 12px;
  border: 0; border-radius: var(--dsw-radius-xl, 20px);
  --dsw-elevation-stroke-color: var(--dsw-alias-border-l2-darkmode-thin);
  background: var(--dsw-specific-input-major, var(--dsw-alias-bg-overlay));
  box-shadow: var(--dsw-elevation-panel);
  color: var(--dsw-alias-label-primary);
  font: var(--dsw-font-xs-13, 13px/1.5 system-ui, sans-serif);
}
.dsr-head { display: flex; align-items: center; gap: 8px; }
.dsr-eyebrow {
  flex: 1; min-width: 0;
  font-size: 14px; font-weight: 500; line-height: 20px;
  color: var(--dsw-alias-label-primary);
}
.dsr-icon-btn {
  flex: none; display: grid; place-items: center; width: 28px; height: 28px;
  margin: -4px -4px -4px 0;
  border: 0; border-radius: 999px; background: transparent; cursor: pointer;
  color: var(--dsw-alias-label-secondary); font-size: 16px; line-height: 1;
}
.dsr-icon-btn:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-primary); }

.dsr-quote {
  margin: 0; padding: 2px 0 2px 10px;
  border-left: 2px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  font-size: 13px; line-height: 20px;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  white-space: pre-wrap; word-break: break-word;
}

.dsr-comment {
  box-sizing: border-box; width: 100%; min-height: 96px; max-height: 168px; resize: none;
  padding: 8px 12px; border-radius: var(--dsw-radius-lg, 16px);
  border: 0.5px solid var(--dsw-alias-border-l4); outline: none;
  background: var(--dsw-alias-bg-module-platform);
  color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 14px; line-height: 24px;
  transition: border-color 100ms ease;
}
.dsr-comment::placeholder { color: var(--dsw-alias-label-caption); }
.dsr-comment:focus { border-color: var(--dsw-alias-state-business-primary); }

.dsr-actions { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.dsr-btn {
  flex: none; height: 32px; padding: 0 14px;
  border: 0; border-radius: 999px;
  background: transparent; color: var(--dsw-alias-label-secondary);
  font: inherit; font-size: 13px; font-weight: 500; line-height: 20px; cursor: pointer;
  transition: background-color 100ms ease, color 100ms ease;
}
.dsr-btn:hover:not(:disabled) {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsr-btn:disabled { opacity: 0.4; cursor: default; }
.dsr-btn--brand {
  background: var(--dsw-alias-button-info-fill);
  color: var(--dsw-alias-label-on-color);
}
.dsr-btn--brand:hover:not(:disabled) {
  background: var(--dsw-alias-button-info-hover);
  color: var(--dsw-alias-label-on-color);
}
/* A disabled primary action reads as a neutral control, not a faded blue one. */
.dsr-btn--brand:disabled {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-tertiary);
  opacity: 1;
}
.dsr-btn:focus-visible, .dsr-icon-btn:focus-visible {
  outline: 2px solid var(--dsw-alias-state-business-primary); outline-offset: 2px;
}
.dsr-status { margin-right: auto; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-caption); }
.dsr-status--error { color: var(--dsw-alias-state-error-primary); }

.dsrp-page {
  display: flex; flex-direction: column; width: 100%; height: 100%;
  min-width: 0; min-height: 0; overflow: hidden;
  background: var(--dsw-alias-bg-base); color: var(--dsw-alias-label-primary);
  font-size: 14px; line-height: 1.6;
}
.dsrp-scroll { flex: 1; min-height: 0; overflow: auto; scrollbar-gutter: stable; }
.dsrp-content { max-width: 960px; margin: 0 auto; padding: 0 clamp(24px, 4vw, 48px) 48px; }
.dsrp-head {
  display: flex; align-items: flex-start; justify-content: space-between;
  gap: 16px; padding-top: 28px; margin-bottom: 20px;
}
[data-platform='darwin'] .dsrp-head { padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px)); }
.dsrp-head h1 { margin: 0; font-size: 20px; line-height: 28px; font-weight: 500; }
.dsrp-sub { margin: 6px 0 0; max-width: 640px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.dsrp-toolbar { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 14px 0 16px; }
.dsrp-filters { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 14px 0 0; }
.dsrp-range { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; }
.dsrp-select, .dsrp-date, .dsrp-search {
  height: 30px; border: 0.5px solid var(--dsw-alias-border-l4); border-radius: 8px;
  background: var(--dsw-specific-input-major); color: var(--dsw-alias-label-primary);
  font: inherit; font-size: 12.5px; padding: 0 8px;
}
.dsrp-date { padding: 0 6px; }
.dsrp-date--active { border-color: var(--dsw-alias-state-business-primary); }
.dsrp-select { max-width: 220px; }
.dsrp-search { flex: 1 1 160px; min-width: 140px; max-width: 260px; }
.dsrp-summary { margin: 10px 0 0; font-size: 12.5px; color: var(--dsw-alias-label-secondary); }
.dsrp-heat {
  margin: 10px 0 0; padding: 10px 12px;
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-lg);
  background: var(--dsw-alias-bg-module-platform);
}
.dsrp-heat-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 12px; color: var(--dsw-alias-label-caption); }
.dsrp-heat-cells { display: grid; grid-template-columns: repeat(24, 1fr); gap: 2px; margin-top: 8px; }
.dsrp-heat-cell { display: block; min-width: 0; }
.dsrp-heat-track {
  display: flex; flex-direction: column-reverse; height: 28px;
  border-radius: 3px; overflow: hidden; background: var(--dsw-alias-bg-layer-2);
}
.dsrp-heat-approve { width: 100%; background: var(--dsw-alias-state-success-primary); }
.dsrp-heat-unsure { width: 100%; background: var(--dsw-alias-state-warn-primary); }
.dsrp-heat-ticks { display: flex; justify-content: space-between; margin-top: 4px; font-size: 10.5px; color: var(--dsw-alias-label-caption); }
.dsrp-fold {
  display: flex; align-items: center; gap: 6px; min-width: 0;
  border: 0; background: transparent; padding: 0; color: inherit; font: inherit;
  cursor: pointer; text-align: left;
}
.dsrp-caret { flex: none; width: 12px; font-size: 11px; color: var(--dsw-alias-label-tertiary); }
.dsrp-group-foot { padding: 6px 14px 10px; }
.dsrp-more { border: 0; background: transparent; padding: 0; color: var(--dsw-alias-brand-primary); font: inherit; font-size: 12px; cursor: pointer; }
.dsrp-more:hover { text-decoration: underline; }
.dsrp-tabs { display: flex; gap: 4px; margin: 18px 0 0; border-bottom: 1px solid var(--dsw-alias-border-l1); }
.dsrp-tab {
  border: 0; background: transparent; padding: 8px 12px; cursor: pointer;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 13px;
  border-bottom: 2px solid transparent;
}
.dsrp-tab[aria-pressed='true'] { color: var(--dsw-alias-label-primary); border-bottom-color: var(--dsw-alias-brand-primary); }
.dsrp-insights { display: flex; flex-direction: column; gap: 14px; margin-top: 16px; }
.dsrp-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 10px; }
.dsrp-stat {
  padding: 10px 12px; border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md); background: var(--dsw-alias-bg-module-platform);
}
.dsrp-stat-label { display: block; font-size: 11.5px; color: var(--dsw-alias-label-caption); }
.dsrp-stat-value { display: block; margin-top: 4px; font-size: 17px; font-weight: 500; font-variant-numeric: tabular-nums; }
.dsrp-card {
  padding: 14px 16px; border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-lg); background: var(--dsw-alias-bg-module-platform);
}
.dsrp-card h2 { margin: 0; font-size: 14px; font-weight: 500; }
.dsrp-card-sub { margin: 4px 0 0; font-size: 12px; color: var(--dsw-alias-label-caption); }
.dsrp-cloud { position: relative; width: 100%; margin-top: 8px; }
.dsrp-cloud canvas { display: block; width: 100%; }
.dsrp-wordlist { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-direction: column; gap: 1px; }
.dsrp-word {
  display: flex; align-items: center; gap: 8px; width: 100%;
  border: 0; background: transparent; padding: 5px 4px; border-radius: 6px;
  color: var(--dsw-alias-label-primary); font: inherit; font-size: 12.5px; cursor: pointer; text-align: left;
}
.dsrp-word:hover { background: var(--dsw-alias-interactive-bg-hover); }
.dsrp-word-rank { width: 18px; color: var(--dsw-alias-label-caption); font-variant-numeric: tabular-nums; }
.dsrp-word-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsrp-word-count { color: var(--dsw-alias-label-secondary); font-variant-numeric: tabular-nums; }
.dsrp-word-split { width: 86px; text-align: right; color: var(--dsw-alias-label-caption); font-size: 11.5px; }
.dsrp-matrix { margin-top: 10px; display: flex; flex-direction: column; gap: 3px; }
.dsrp-matrix-head, .dsrp-matrix-row {
  display: grid; grid-template-columns: 22px repeat(24, minmax(0, 1fr));
  gap: 2px; align-items: center;
}
.dsrp-matrix-day { font-size: 10.5px; color: var(--dsw-alias-label-caption); text-align: right; padding-right: 2px; }
.dsrp-matrix-hour { font-size: 9.5px; color: var(--dsw-alias-label-caption); text-align: left; }
.dsrp-matrix-cell { display: block; height: 14px; border-radius: 2px; }
.dsrp-trend { display: flex; align-items: flex-end; gap: 12px; margin-top: 10px; height: 112px; }
.dsrp-trend-col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; gap: 4px; height: 100%; min-width: 0; }
.dsrp-trend-bar {
  display: flex; flex-direction: column-reverse; height: 86px;
  border-radius: 3px; overflow: hidden; background: var(--dsw-alias-bg-layer-2);
}
.dsrp-trend-approve { width: 100%; background: var(--dsw-alias-state-success-primary); }
.dsrp-trend-unsure { width: 100%; background: var(--dsw-alias-state-warn-primary); }
.dsrp-trend-label { font-size: 10px; color: var(--dsw-alias-label-caption); text-align: center; }
.dsrp-graph-wrap { margin-top: 16px; }
.dsrp-graph-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.dsrp-graph {
  position: relative; margin-top: 8px; overflow: hidden;
  border: 0.5px solid var(--dsw-alias-border-l2); border-radius: var(--dsw-radius-lg);
  background: var(--dsw-alias-bg-module-platform);
}
.dsrp-graph-canvas { display: block; width: 100%; height: 520px; cursor: grab; touch-action: none; }
.dsrp-graph-canvas:active { cursor: grabbing; }
.dsrp-graph-tip {
  position: absolute; transform: translate(12px, 12px); max-width: 280px;
  padding: 6px 8px; border-radius: 6px;
  background: var(--dsw-alias-bg-overlay); border: 0.5px solid var(--dsw-alias-border-l2);
  box-shadow: var(--dsw-elevation-panel);
  font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-primary);
  pointer-events: none; white-space: pre-wrap;
}
.dsrp-spacer { flex: 1; }
.dsrp-chip {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 3px 11px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--dsw-alias-border-l1); background: var(--dsw-alias-bg-layer-1);
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12.5px;
}
.dsrp-chip:hover { color: var(--dsw-alias-label-primary); border-color: var(--dsw-alias-border-l2); }
.dsrp-chip:disabled { opacity: 0.5; cursor: default; }
.dsrp-chip[aria-pressed='true'] {
  color: var(--dsw-alias-brand-primary);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 55%, transparent);
  background: color-mix(in srgb, var(--dsw-alias-brand-primary) 10%, transparent);
}
.dsrp-chip-count { font-variant-numeric: tabular-nums; opacity: 0.75; }
.dsrp-notice { font-size: 12.5px; color: var(--dsw-alias-state-error-primary); margin: 0 0 12px; }
.dsrp-group {
  margin-bottom: 16px; overflow: hidden;
  border: 1px solid var(--dsw-alias-border-l1); border-radius: 12px;
  background: var(--dsw-alias-bg-layer-1);
}
.dsrp-group-head {
  display: flex; align-items: center; flex-wrap: wrap; gap: 10px;
  padding: 10px 14px; border-bottom: 1px solid var(--dsw-alias-border-l1);
  background: var(--dsw-alias-bg-layer-2);
}
.dsrp-session { font-weight: 500; font-size: 13.5px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dsrp-meta { font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dsrp-item { display: flex; flex-direction: column; gap: 6px; padding: 12px 14px; }
.dsrp-item + .dsrp-item { border-top: 1px solid var(--dsw-alias-border-l1); }
.dsrp-item-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dsrp-badge {
  display: inline-flex; align-items: center; padding: 0 8px; border-radius: 999px;
  font-size: 11.5px; line-height: 20px;
  color: var(--dsr-level-color);
  border: 1px solid color-mix(in srgb, var(--dsr-level-color) 45%, transparent);
  background: color-mix(in srgb, var(--dsr-level-color) 10%, transparent);
}
.dsrp-time { font-size: 11.5px; color: var(--dsw-alias-label-secondary); }
.dsrp-item-actions { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.dsrp-mini {
  border: 0; background: transparent; padding: 2px 6px; border-radius: 6px;
  color: var(--dsw-alias-label-secondary); font: inherit; font-size: 12px; cursor: pointer;
}
.dsrp-mini:hover { background: var(--dsw-alias-bg-layer-2); color: var(--dsw-alias-label-primary); }
.dsrp-mini:disabled { opacity: 0.5; cursor: default; }
.dsrp-quote {
  margin: 0; padding: 1px 0 1px 9px; font-size: 13px;
  border-left: 2px solid var(--dsw-alias-border-l2);
  color: var(--dsw-alias-label-secondary);
  white-space: pre-wrap; word-break: break-word;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.dsrp-comment { margin: 0; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
.dsrp-empty {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 64px 16px; text-align: center;
  border: 1px dashed var(--dsw-alias-border-l1); border-radius: 12px;
}
.dsrp-empty h2 { margin: 0; font-size: 15px; font-weight: 500; }
.dsrp-empty p { margin: 0; max-width: 420px; font-size: 13px; color: var(--dsw-alias-label-secondary); }
.dsrp-footer { margin: 8px 0 0; font-size: 12px; color: var(--dsw-alias-label-secondary); }
.dsrp-usage {
  display: flex; align-items: center; flex-wrap: wrap; gap: 8px;
  margin-top: 20px;
}
.dsrp-usage-hint { margin: 6px 0 0; font-size: 11.5px; line-height: 18px; color: var(--dsw-alias-label-caption); }
`

    /** Stylesheet for every mount of this plugin's surfaces. */
    function Styles() {
      return h('style', null, STYLES)
    }

    // ------------------------------------------------------------- surfaces --

    /**
     * The floating selection action and the review card that replaces it.
     * @param props - area-local text interaction, session seats, and this plugin's injected actions.
     */
    function SurfaceView(props) {
      const { t, variant, readText, clearSelection, dismiss, inputActions, sessionId, focusComposer } = props
      const [open, setOpen] = useState(variant === 'card')
      const [comment, setComment] = useState('')
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState(null)
      const commentRef = useRef(null)
      const excerpt = useMemo(() => snippet(readText() ?? '', EXCERPT_MAX), [readText])
      const chat = props.useChat(state => state.nodes)
      // Captured on the first render: the selection is still live here, and the host's
      // chat rows already say which Turn it belongs to.
      const domTurn = useRef(undefined)
      if (domTurn.current === undefined) domTurn.current = selectedTurn()
      // The live Range behind that selection, cloned before focus can collapse it.
      const domRange = useRef(undefined)
      if (domRange.current === undefined) {
        let captured = null
        try {
          const selection = window.getSelection()
          if (selection !== null && selection.rangeCount > 0) captured = selection.getRangeAt(0).cloneRange()
        } catch {
          captured = null
        }
        domRange.current = captured
      }
      const sessionTitle = props.useSessions((state) => {
        const row = state.byId[sessionId]
        return row === undefined ? '' : row.displayTitle
      })
      const writable = props.useSession(state => !state.removed
        && (state.subagent === null || state.subagent.address.mode === 'continuable'))

      useEffect(() => {
        if (open && commentRef.current !== null) commentRef.current.focus({ preventScroll: true })
      }, [open])

      useEffect(() => {
        if (!writable) dismiss()
      }, [writable, dismiss])

      // This surface is mounted inside the Chat column; the badge layer is not, so a
      // badge would be painted over the bar or the card. Hide badges while either is up.
      useEffect(() => {
        props.markers.setSuppressed(true)
        return () => { props.markers.setSuppressed(false) }
      }, [props.markers])

      const buildRecord = (levelValue, commentValue) => {
        const answers = answerTexts(chat.values())
        const fromRow = domTurn.current
        const located = fromRow === null ? locateReview(answers, excerpt) : null
        const turn = fromRow === null ? (located === null ? null : located.turn) : fromRow
        const messageId = turn === null
          ? null
          : (answers.find(answer => answer.turn === turn) || { messageId: null }).messageId
        return {
          id: newId(),
          sessionId,
          sessionTitle,
          text: excerpt,
          comment: commentValue,
          level: levelValue,
          turn,
          messageId,
          createdAt: Date.now(),
          day: dayKey(Date.now()),
          sentAt: null,
        }
      }

      /** Register the underline/badge range, rebuilding it from the Turn when the live range died. */
      const mark = (record) => {
        if (props.markers.set(record.id, domRange.current, record)) return
        if (record.turn === null) return
        const rebuilt = findTextRange(record.turn, record.text)
        if (rebuilt !== null) props.markers.set(record.id, rebuilt, record)
      }

      /**
       * Put one review tag into the composer as an atomic quote: the message carries the
       * full text, the composer shows the compact label and its hover summary.
       */
      const insert = (levelId, commentText) => {
        if (excerpt === '') {
          setError(t('card.empty'))
          return false
        }
        setError(null)
        const payload = chipPayload(t, levelId, excerpt, commentText)
        if (inputActions.insertQuote(payload.text, payload.summary) === false) {
          setError(t('card.insertFailed'))
          return false
        }
        const record = buildRecord(levelId, commentText)
        props.store.add(record)
        mark(record)
        props.telemetry.track(levelId === 'approve' ? 'approve' : 'comment')
        return true
      }

      const approveNow = () => {
        if (busy) return
        setBusy(true)
        if (insert('approve', '')) {
          clearSelection()
          dismiss()
          setTimeout(() => { focusComposer() }, 0)
          return
        }
        setBusy(false)
        setOpen(true)
      }

      const submitComment = () => {
        const text = comment.trim()
        if (busy || text === '') return
        setBusy(true)
        if (insert('unsure', text)) {
          clearSelection()
          dismiss()
          setTimeout(() => { focusComposer() }, 0)
          return
        }
        setBusy(false)
      }

      if (!writable) return null

      if (!open) {
        return h(React.Fragment, null,
          h(Styles),
          h('div', { className: 'dsr-bar dsr-bar--levels' },
            h('button', {
              type: 'button',
              className: 'dsr-bar-btn dsr-bar-btn--emoji',
              title: t('bar.approve'),
              'aria-label': t('bar.approve'),
              disabled: busy,
              onPointerDown: (event) => { event.preventDefault() },
              onClick: approveNow,
            }, '👍'),
            h('button', {
              type: 'button', className: 'dsr-bar-btn',
              onPointerDown: (event) => { event.preventDefault() },
              onClick: () => { setOpen(true) },
            }, t('bar.say'))))
      }

      return h(React.Fragment, null,
        h(Styles),
        h('div', {
          className: 'dsr-card',
          role: 'group',
          'aria-label': t('card.title'),
          'data-text-interaction-exclude': '',
          onKeyDown: (event) => {
            if (event.key !== 'Escape' || comment === '') return
            event.preventDefault()
            event.stopPropagation()
          },
        },
          h('div', { className: 'dsr-head' },
            h('span', { className: 'dsr-eyebrow' }, t('card.title')),
            h('button', {
              type: 'button', className: 'dsr-icon-btn', 'aria-label': t('card.close'),
              onClick: () => { dismiss() },
            }, '×')),
          h('blockquote', { className: 'dsr-quote', title: excerpt }, excerpt === '' ? t('card.empty') : excerpt),
          h('textarea', {
            ref: commentRef,
            className: 'dsr-comment',
            rows: 3,
            value: comment,
            placeholder: t('card.commentPlaceholder'),
            'aria-label': t('card.comment'),
            onChange: (event) => { setComment(event.target.value) },
            onKeyDown: (event) => {
              if (event.key === 'Escape') {
                // Keep a written comment from being thrown away by the host's global Escape dismissal.
                if (comment !== '') { event.preventDefault(); event.stopPropagation() }
                return
              }
              if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
                if ((event.nativeEvent !== undefined && event.nativeEvent.isComposing === true) || event.isComposing === true) return
                event.preventDefault()
                submitComment()
              } else if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
                event.preventDefault()
                submitComment()
              }
            },
          }),
          h('div', { className: 'dsr-actions' },
            error !== null
              ? h('span', { className: 'dsr-status dsr-status--error', role: 'status' }, error)
              : (comment.trim() === '' ? h('span', { className: 'dsr-status' }, t('card.commentNeeded')) : null),
            h('button', {
              type: 'button', className: 'dsr-btn',
              disabled: busy,
              onClick: () => { dismiss() },
            }, t('card.cancel')),
            h('button', {
              type: 'button', className: 'dsr-btn dsr-btn--brand',
              disabled: busy || comment.trim() === '',
              onClick: submitComment,
            }, t('card.insert')))))
    }

    // ---------------------------------------------------------------- panel --

    /** Decorative empty-state drawing; colors follow the theme. */
    function EmptyArt() {
      return h('svg', { width: 92, height: 74, viewBox: '0 0 92 74', fill: 'none', 'aria-hidden': true },
        h('rect', {
          x: 6, y: 5, width: 66, height: 46, rx: 10,
          stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2,
        }),
        h('path', {
          d: 'M22 51 16 62l17-11',
          stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2, strokeLinejoin: 'round',
        }),
        h('path', {
          d: 'M22 21h34M22 31h22',
          stroke: 'var(--dsw-alias-border-l2)', strokeWidth: 2, strokeLinecap: 'round',
        }),
        h('circle', {
          cx: 72, cy: 55, r: 13,
          style: { fill: 'color-mix(in srgb, var(--dsw-alias-brand-primary) 14%, transparent)' },
          stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 2,
        }),
        h('path', {
          d: 'm66 55.4 3.9 3.9 6.9-7.4',
          stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 2.2,
          strokeLinecap: 'round', strokeLinejoin: 'round',
        }))
    }

    /** Sidebar entry glyph; the sidebar owns the accessible name. */
    function ReviewIcon({ size }) {
      return h('span', {
        'aria-hidden': true,
        style: {
          display: 'grid',
          placeItems: 'center',
          width: size,
          height: size,
          fontSize: Math.round(size * 0.9),
          lineHeight: 1,
        },
      }, '🤔')
    }

    // ------------------------------------------------------------ insights --

    /** Common filler words dropped from the comment cloud. */
    const STOP_WORDS = new Set([
      '的', '了', '是', '我', '你', '他', '她', '它', '们', '这', '那', '就', '也', '都', '还', '又',
      '很', '太', '把', '被', '让', '给', '在', '有', '和', '与', '或', '但', '但是', '因为', '所以',
      '如果', '然后', '现在', '可以', '一个', '这个', '那个', '什么', '怎么', '已经', '觉得', '感觉',
      '应该', '需要', '还是', '就是', '不是', '没有', '我们', '你们', '他们', '自己', '这里', '那里',
      '时候', '问题', '东西', '地方', '知道', '看到', '其实', '比较', '非常', '真的', '一下', '一点',
      '一样', '这样', '那样', '以及', '并且', '而且', '不过', '虽然', '然而', '因此', '于是', '只是',
      '还有', '的话', '方面', '内容', '情况', '进行', '通过', '对于', '关于', '根据', '目前', '或者',
      'the', 'and', 'for', 'with', 'this', 'that', 'are', 'was', 'were', 'not', 'but', 'you', 'your',
      'can', 'will', 'just', 'have', 'has', 'had', 'from', 'they', 'them', 'then', 'than', 'what',
      'when', 'where', 'which', 'how', 'all', 'any', 'our', 'out', 'too', 'very', 'more', 'some',
      'such', 'only', 'also', 'into', 'over', 'after', 'before', 'should', 'would', 'could', 'about',
      'there', 'their', 'been', 'being', 'does', 'did', 'doing', 'because', 'while', 'until', 'during',
      'without', 'within', 'really', 'maybe', 'like', 'get', 'got', 'make', 'made', 'use', 'used',
      'one', 'two', 'its', 'it\'s', 'i\'m', 'don\'t', 'doesn\'t', 'isn\'t', 'can\'t', 'won\'t',
    ])

    let wordSegmenter

    /** Tokenize a comment, preferring the browser's Chinese word segmenter. */
    function segmentWords(text) {
      try {
        if (wordSegmenter === undefined) {
          wordSegmenter = typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
            ? new Intl.Segmenter('zh', { granularity: 'word' })
            : null
        }
        if (wordSegmenter !== null) {
          const words = []
          for (const part of wordSegmenter.segment(text)) {
            if (part.isWordLike) words.push(part.segment.toLowerCase())
          }
          return words
        }
      } catch {
        // Fall through to the bigram heuristic.
      }
      const latin = text.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) || []
      const cjk = []
      for (const run of text.replace(/[^\u4e00-\u9fff]+/g, ' ').trim().split(/\s+/)) {
        for (let index = 0; index + 1 < run.length; index += 1) cjk.push(run.slice(index, index + 2))
      }
      return [...latin, ...cjk]
    }

    function usefulWord(word) {
      if (word.length < 2 || STOP_WORDS.has(word) || /^\d+$/.test(word)) return false
      if (!/[\u4e00-\u9fff]/.test(word) && !/^[a-z]{3,}$/.test(word)) return false
      return true
    }

    /** Comment word frequencies with the per-level split. */
    function buildWordStats(records) {
      const map = new Map()
      for (const record of records) {
        const comment = record.comment.trim()
        if (comment === '') continue
        const seen = new Set()
        for (const raw of segmentWords(comment)) {
          const word = raw.trim()
          if (!usefulWord(word)) continue
          const entry = map.get(word) ?? { word, count: 0, approve: 0, unsure: 0 }
          entry.count += 1
          if (!seen.has(word)) {
            if (record.level === 'approve') entry.approve += 1
            else entry.unsure += 1
            seen.add(word)
          }
          map.set(word, entry)
        }
      }
      return [...map.values()].sort((left, right) => right.count - left.count
        || left.word.localeCompare(right.word))
    }

    function startOfWeek(date) {
      const start = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
      return start
    }

    /** Last eight calendar weeks, oldest first. */
    function buildWeeklyTrend(records) {
      const current = startOfWeek(new Date())
      const bins = []
      for (let index = 7; index >= 0; index -= 1) {
        const start = new Date(current)
        start.setDate(current.getDate() - index * 7)
        bins.push({
          start: start.getTime(),
          label: `${start.getMonth() + 1}/${start.getDate()}`,
          approve: 0,
          unsure: 0,
          total: 0,
        })
      }
      for (const record of records) {
        const start = startOfWeek(new Date(record.createdAt)).getTime()
        const bin = bins.find(item => item.start === start)
        if (bin === undefined) continue
        bin.total += 1
        if (record.level === 'approve') bin.approve += 1
        else bin.unsure += 1
      }
      return bins
    }

    /** 7 weekdays x 24 hours, Monday first. */
    function buildWeekdayMatrix(records) {
      const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => ({ approve: 0, unsure: 0 })))
      let max = 1
      for (const record of records) {
        const date = new Date(record.createdAt)
        const cell = matrix[(date.getDay() + 6) % 7][date.getHours()]
        if (record.level === 'approve') cell.approve += 1
        else cell.unsure += 1
        const total = cell.approve + cell.unsure
        if (total > max) max = total
      }
      return { matrix, max }
    }

    /** Session clusters (overview) or one session's annotations + keywords (focus). */
    function buildGraph(records, focusId, titleOf) {
      const sessions = []
      const index = new Map()
      for (const record of records) {
        let entry = index.get(record.sessionId)
        if (entry === undefined) {
          entry = {
            id: record.sessionId,
            title: record.sessionTitle,
            count: 0,
            approve: 0,
            unsure: 0,
            words: new Map(),
          }
          index.set(record.sessionId, entry)
          sessions.push(entry)
        }
        entry.count += 1
        if (record.level === 'approve') entry.approve += 1
        else entry.unsure += 1
        if (record.comment.trim() !== '') {
          for (const word of segmentWords(record.comment)) {
            if (usefulWord(word)) entry.words.set(word, (entry.words.get(word) ?? 0) + 1)
          }
        }
      }

      const nodes = []
      const edges = []
      if (focusId === null) {
        sessions.sort((left, right) => right.count - left.count)
        const max = Math.max(1, ...sessions.map(session => session.count))
        const radius = sessions.length <= 1 ? 0 : Math.min(175, 70 + sessions.length * 8)
        sessions.forEach((session, position) => {
          const angle = -Math.PI / 2 + (position / sessions.length) * Math.PI * 2
          nodes.push({
            kind: 'session',
            id: session.id,
            x: sessions.length <= 1 ? 0 : Math.cos(angle) * radius,
            y: sessions.length <= 1 ? 0 : Math.sin(angle) * radius,
            r: 15 + Math.sqrt(session.count / max) * 24,
            title: titleOf(session.id, session.title),
            count: session.count,
            approve: session.approve,
            unsure: session.unsure,
          })
        })
        const top = sessions.map(session => new Set([...session.words.entries()]
          .sort((left, right) => right[1] - left[1])
          .slice(0, 3)
          .map(([word]) => word)))
        for (let left = 0; left < sessions.length; left += 1) {
          for (let right = left + 1; right < sessions.length; right += 1) {
            if ([...top[left]].some(word => top[right].has(word))) {
              edges.push({ from: sessions[left].id, to: sessions[right].id, kind: 'shared' })
            }
          }
        }
      } else {
        const focusRecords = records.filter(record => record.sessionId === focusId)
        const session = index.get(focusId) ?? {
          id: focusId, title: '', count: focusRecords.length, approve: 0, unsure: 0,
        }
        nodes.push({
          kind: 'session',
          id: focusId,
          x: 0,
          y: 0,
          r: 28,
          title: titleOf(focusId, session.title),
          count: session.count,
          approve: session.approve,
          unsure: session.unsure,
        })
        const words = buildWordStats(focusRecords).slice(0, 10)
        words.forEach((word, position) => {
          const angle = -Math.PI / 2 + (position / Math.max(1, words.length)) * Math.PI * 2
          nodes.push({
            kind: 'word',
            id: `word:${word.word}`,
            word: word.word,
            x: Math.cos(angle) * 118,
            y: Math.sin(angle) * 118,
            r: 8 + Math.min(14, Math.sqrt(word.count) * 3),
            count: word.count,
          })
          edges.push({ from: focusId, to: `word:${word.word}`, kind: 'word' })
        })
        const visible = focusRecords.slice()
          .sort((left, right) => left.createdAt - right.createdAt)
          .slice(0, 60)
        visible.forEach((record, position) => {
          const angle = -Math.PI / 2 + (position / Math.max(1, visible.length)) * Math.PI * 2
          nodes.push({
            kind: 'record',
            id: record.id,
            record,
            x: Math.cos(angle) * 196,
            y: Math.sin(angle) * 196,
            r: 6,
          })
          edges.push({ from: focusId, to: record.id, kind: 'record', level: record.level })
        })
      }
      return { nodes, edges }
    }

    /** Canvas word cloud: font size by frequency, colour by 👍 share. */
    function WordCloud({ words, t }) {
      const wrapRef = useRef(null)
      const canvasRef = useRef(null)

      useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (canvas === null || wrap === null) return undefined
        let frame = 0
        const draw = () => {
          const width = Math.max(320, Math.round(wrap.clientWidth))
          const height = 260
          const dpr = Math.min(2, window.devicePixelRatio || 1)
          canvas.width = Math.round(width * dpr)
          canvas.height = Math.round(height * dpr)
          canvas.style.width = `${width}px`
          canvas.style.height = `${height}px`
          const context = canvas.getContext('2d')
          if (context === null) return
          context.setTransform(dpr, 0, 0, dpr, 0, 0)
          context.clearRect(0, 0, width, height)
          const style = getComputedStyle(canvas)
          const success = style.getPropertyValue('--dsw-alias-state-success-primary').trim() || '#2f8f5b'
          const warn = style.getPropertyValue('--dsw-alias-state-warn-primary').trim() || '#b7791f'
          const ink = style.getPropertyValue('--dsw-alias-label-primary').trim() || '#111111'
          const items = words.slice(0, 40)
          const max = Math.max(1, ...items.map(item => item.count))
          const placed = []
          for (const item of items) {
            const weight = Math.sqrt(item.count / max)
            const fontSize = Math.round(12 + weight * 30)
            context.font = `600 ${fontSize}px system-ui, -apple-system, "PingFang SC", sans-serif`
            const textWidth = context.measureText(item.word).width
            const boxHeight = fontSize * 1.15
            let angle = 0
            let radius = 0
            let spot = null
            for (let step = 0; step < 900; step += 1) {
              const x = width / 2 + Math.cos(angle) * radius * 1.7 - textWidth / 2
              const y = height / 2 + Math.sin(angle) * radius - boxHeight / 2
              if (x >= 4 && y >= 4 && x + textWidth <= width - 4 && y + boxHeight <= height - 4) {
                const hit = placed.some(other => !(x + textWidth < other.x
                  || other.x + other.width < x
                  || y + boxHeight < other.y
                  || other.y + other.height < y))
                if (!hit) {
                  spot = { x, y }
                  placed.push({ x, y, width: textWidth, height: boxHeight })
                  break
                }
              }
              angle += 0.42
              radius += 0.85
            }
            if (spot !== null) {
              const ratio = item.approve + item.unsure === 0
                ? 0.5
                : item.approve / (item.approve + item.unsure)
              context.fillStyle = ratio >= 0.6 ? success : (ratio <= 0.4 ? warn : ink)
              context.globalAlpha = 0.9
              context.fillText(item.word, spot.x, spot.y + fontSize)
            }
          }
          context.globalAlpha = 1
        }
        draw()
        const observer = typeof ResizeObserver === 'function'
          ? new ResizeObserver(() => {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(draw)
          })
          : null
        if (observer !== null) observer.observe(wrap)
        return () => {
          if (observer !== null) observer.disconnect()
          cancelAnimationFrame(frame)
        }
      }, [words])

      return h('div', { className: 'dsrp-cloud', ref: wrapRef },
        h('canvas', { ref: canvasRef, 'aria-label': t('insights.cloudLabel') }))
    }

    /** Stacked weekly bars. */
    function TrendBars({ bins }) {
      const max = Math.max(1, ...bins.map(bin => bin.total))
      return h('div', { className: 'dsrp-trend' }, bins.map(bin => h('div', {
        key: bin.start, className: 'dsrp-trend-col',
      },
      h('div', {
        className: 'dsrp-trend-bar',
        title: `${bin.label} · 👍${bin.approve} 🤔${bin.unsure}`,
      },
      h('span', { className: 'dsrp-trend-approve', style: { height: `${(bin.approve / max) * 100}%` } }),
      h('span', { className: 'dsrp-trend-unsure', style: { height: `${(bin.unsure / max) * 100}%` } })),
      h('span', { className: 'dsrp-trend-label' }, bin.label))))
    }

    /** 7x24 intensity grid. */
    function WeekdayMatrix({ matrix, max, labels }) {
      const names = labels === undefined ? ['一', '二', '三', '四', '五', '六', '日'] : labels
      return h('div', { className: 'dsrp-matrix' },
        h('div', { className: 'dsrp-matrix-head' },
          h('span', { className: 'dsrp-matrix-day' }, ''),
          Array.from({ length: 24 }, (_, hour) => h('span', {
            key: hour, className: 'dsrp-matrix-hour',
          }, hour % 6 === 0 ? String(hour).padStart(2, '0') : ''))),
        matrix.map((row, day) => h('div', { key: day, className: 'dsrp-matrix-row' },
          h('span', { className: 'dsrp-matrix-day' }, names[day]),
          row.map((cell, hour) => {
            const total = cell.approve + cell.unsure
            return h('span', {
              key: hour,
              className: 'dsrp-matrix-cell',
              style: {
                background: total > 0
                  ? 'var(--dsw-alias-state-business-primary)'
                  : 'var(--dsw-alias-border-l2)',
                opacity: total === 0 ? 0.35 : 0.18 + 0.82 * (total / max),
              },
              title: `${names[day]} ${String(hour).padStart(2, '0')}:00 · 👍${cell.approve} 🤔${cell.unsure}`,
            })
          }))))
    }

    /**
     * The review inbox: every record grouped by Session, filterable by level,
     * with per-record and per-session sending.
     * @param props - root-scope seats plus this plugin's store and actions.
     */
    /** Canvas session graph with focus, hover, wheel zoom and drag pan. */
    function GraphView({ records, t, titleOf, onOpenSession, onSearchWord }) {
      const wrapRef = useRef(null)
      const canvasRef = useRef(null)
      const cameraRef = useRef({ scale: 1, x: 0, y: 0 })
      const hoverRef = useRef(null)
      const dragRef = useRef(null)
      const drawRef = useRef(null)
      const titleOfRef = useRef(titleOf)
      titleOfRef.current = titleOf
      const [focusId, setFocusId] = useState(null)
      const [tip, setTip] = useState(null)

      const effectiveFocus = focusId !== null && records.some(record => record.sessionId === focusId)
        ? focusId
        : null
      const graph = useMemo(
        () => buildGraph(records, effectiveFocus, (id, stored) => titleOfRef.current(id, stored)),
        [records, effectiveFocus],
      )

      useEffect(() => {
        cameraRef.current = { scale: 1, x: 0, y: 0 }
        hoverRef.current = null
        setTip(null)
      }, [effectiveFocus])

      useEffect(() => {
        const canvas = canvasRef.current
        const wrap = wrapRef.current
        if (canvas === null || wrap === null) return undefined

        const draw = () => {
          const width = Math.max(320, Math.round(wrap.clientWidth))
          const height = 520
          const dpr = Math.min(2, window.devicePixelRatio || 1)
          canvas.width = Math.round(width * dpr)
          canvas.height = Math.round(height * dpr)
          canvas.style.width = `${width}px`
          canvas.style.height = `${height}px`
          const context = canvas.getContext('2d')
          if (context === null) return
          context.setTransform(dpr, 0, 0, dpr, 0, 0)
          context.clearRect(0, 0, width, height)
          const style = getComputedStyle(canvas)
          const success = style.getPropertyValue('--dsw-alias-state-success-primary').trim() || '#2f8f5b'
          const warn = style.getPropertyValue('--dsw-alias-state-warn-primary').trim() || '#b7791f'
          const ink = style.getPropertyValue('--dsw-alias-label-primary').trim() || '#111111'
          const secondary = style.getPropertyValue('--dsw-alias-label-secondary').trim() || '#666666'
          const border = style.getPropertyValue('--dsw-alias-border-l2').trim() || '#dddddd'
          const surface = style.getPropertyValue('--dsw-alias-bg-layer-2').trim() || '#ffffff'
          const camera = cameraRef.current
          context.save()
          context.translate(width / 2 + camera.x, height / 2 + camera.y)
          context.scale(camera.scale, camera.scale)
          const byId = new Map(graph.nodes.map(node => [node.id, node]))
          for (const edge of graph.edges) {
            const from = byId.get(edge.from)
            const to = byId.get(edge.to)
            if (from === undefined || to === undefined) continue
            context.beginPath()
            context.moveTo(from.x, from.y)
            context.lineTo(to.x, to.y)
            context.strokeStyle = edge.kind === 'record'
              ? (edge.level === 'approve' ? success : warn)
              : border
            context.globalAlpha = edge.kind === 'record' ? 0.3 : 0.55
            context.lineWidth = 1
            context.stroke()
          }
          context.globalAlpha = 1
          const ordered = graph.nodes.slice().sort((left, right) => {
            const rank = (node) => (node.kind === 'record' ? 0 : node.kind === 'word' ? 1 : 2)
            return rank(left) - rank(right)
          })
          context.textAlign = 'center'
          context.textBaseline = 'middle'
          for (const node of ordered) {
            const hovered = hoverRef.current !== null && hoverRef.current.id === node.id
            if (node.kind === 'session') {
              const ratio = node.approve + node.unsure === 0 ? 0.5 : node.approve / (node.approve + node.unsure)
              const ring = ratio >= 0.6 ? success : ratio <= 0.4 ? warn : secondary
              context.beginPath()
              context.arc(node.x, node.y, node.r, 0, Math.PI * 2)
              context.fillStyle = surface
              context.fill()
              context.lineWidth = hovered ? 3.5 : 2
              context.strokeStyle = ring
              context.stroke()
              context.fillStyle = ink
              context.font = '600 12px system-ui, -apple-system, "PingFang SC", sans-serif'
              context.fillText(String(node.count), node.x, node.y + 1)
              if (camera.scale >= 0.72) {
                context.fillStyle = secondary
                context.font = '12px system-ui, -apple-system, "PingFang SC", sans-serif'
                context.fillText(trimLabel(node.title, 18), node.x, node.y + node.r + 14)
              }
            } else if (node.kind === 'word') {
              context.beginPath()
              context.arc(node.x, node.y, node.r, 0, Math.PI * 2)
              context.fillStyle = surface
              context.fill()
              context.lineWidth = hovered ? 2.5 : 1.2
              context.strokeStyle = hovered ? ink : border
              context.stroke()
              context.fillStyle = secondary
              context.font = '11px system-ui, -apple-system, "PingFang SC", sans-serif'
              context.fillText(trimLabel(node.word, 12), node.x, node.y + node.r + 12)
            } else {
              context.beginPath()
              context.arc(node.x, node.y, hovered ? node.r + 3 : node.r, 0, Math.PI * 2)
              context.fillStyle = node.record.level === 'approve' ? success : warn
              context.globalAlpha = hovered ? 1 : 0.85
              context.fill()
              context.globalAlpha = 1
              if (hovered) {
                context.lineWidth = 2
                context.strokeStyle = ink
                context.stroke()
              }
            }
          }
          context.restore()
        }

        drawRef.current = draw
        draw()
        const observer = typeof ResizeObserver === 'function'
          ? new ResizeObserver(() => { draw() })
          : null
        if (observer !== null) observer.observe(wrap)

        const onWheel = (event) => {
          event.preventDefault()
          const rect = canvas.getBoundingClientRect()
          const mx = event.clientX - rect.left - rect.width / 2
          const my = event.clientY - rect.top - rect.height / 2
          const camera = cameraRef.current
          const next = Math.min(2.4, Math.max(0.55, camera.scale * (event.deltaY < 0 ? 1.12 : 0.89)))
          if (next === camera.scale) return
          camera.x = mx - (mx - camera.x) * (next / camera.scale)
          camera.y = my - (my - camera.y) * (next / camera.scale)
          camera.scale = next
          draw()
        }
        canvas.addEventListener('wheel', onWheel, { passive: false })

        return () => {
          if (observer !== null) observer.disconnect()
          canvas.removeEventListener('wheel', onWheel)
          drawRef.current = null
        }
      }, [graph, t])

      const hitTest = (event) => {
        const canvas = canvasRef.current
        if (canvas === null) return null
        const rect = canvas.getBoundingClientRect()
        const camera = cameraRef.current
        const x = (event.clientX - rect.left - rect.width / 2 - camera.x) / camera.scale
        const y = (event.clientY - rect.top - rect.height / 2 - camera.y) / camera.scale
        for (let index = graph.nodes.length - 1; index >= 0; index -= 1) {
          const node = graph.nodes[index]
          const dx = x - node.x
          const dy = y - node.y
          if (dx * dx + dy * dy <= (node.r + 4) * (node.r + 4)) return node
        }
        return null
      }

      const tipText = (node) => {
        if (node.kind === 'session') {
          return t('graph.tipSession', {
            title: node.title, n: node.count, approve: node.approve, unsure: node.unsure,
          })
        }
        if (node.kind === 'word') return t('graph.tipWord', { word: node.word, n: node.count })
        const comment = node.record.comment.trim()
        return `${t('graph.tipRecord', { text: snippet(node.record.text, 80) })}${comment === '' ? '' : `\n${comment}`}`
      }

      const onPointerDown = (event) => {
        const canvas = canvasRef.current
        if (canvas === null) return
        canvas.setPointerCapture(event.pointerId)
        dragRef.current = {
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          x: cameraRef.current.x,
          y: cameraRef.current.y,
          moved: false,
        }
      }

      const onPointerMove = (event) => {
        const drag = dragRef.current
        if (drag !== null && drag.pointerId === event.pointerId) {
          const dx = event.clientX - drag.startX
          const dy = event.clientY - drag.startY
          if (Math.abs(dx) + Math.abs(dy) > 4) drag.moved = true
          cameraRef.current = { ...cameraRef.current, x: drag.x + dx, y: drag.y + dy }
          if (drawRef.current !== null) drawRef.current()
          return
        }
        const node = hitTest(event)
        const changed = (hoverRef.current === null ? null : hoverRef.current.id) !== (node === null ? null : node.id)
        if (changed) {
          hoverRef.current = node
          if (drawRef.current !== null) drawRef.current()
        }
        if (node === null) {
          setTip(null)
          return
        }
        const canvas = canvasRef.current
        if (canvas === null) return
        const rect = canvas.getBoundingClientRect()
        setTip({
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
          text: tipText(node),
        })
      }

      const onPointerUp = (event) => {
        const drag = dragRef.current
        dragRef.current = null
        if (drag === null || drag.pointerId !== event.pointerId || drag.moved) return
        const node = hitTest(event)
        if (node === null) {
          if (effectiveFocus !== null) setFocusId(null)
          return
        }
        if (node.kind === 'session') {
          setFocusId(effectiveFocus === null ? node.id : null)
        } else if (node.kind === 'word') {
          onSearchWord(node.word)
        } else if (node.kind === 'record') {
          onOpenSession(node.record.sessionId)
        }
      }

      const onPointerLeave = () => {
        dragRef.current = null
        hoverRef.current = null
        setTip(null)
        if (drawRef.current !== null) drawRef.current()
      }

      return h('div', { className: 'dsrp-graph-wrap' },
        h('div', { className: 'dsrp-graph-head' },
          h('span', { className: 'dsrp-card-sub' }, t('graph.hint')),
          effectiveFocus === null ? null : h('button', {
            type: 'button', className: 'dsrp-mini', onClick: () => { setFocusId(null) },
          }, t('graph.back'))),
        h('div', { className: 'dsrp-graph', ref: wrapRef },
          h('canvas', {
            ref: canvasRef,
            className: 'dsrp-graph-canvas',
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerLeave,
          }),
          tip === null ? null : h('div', {
            className: 'dsrp-graph-tip',
            style: { left: `${tip.x}px`, top: `${tip.y}px` },
          }, tip.text)),
        h('p', { className: 'dsrp-card-sub' }, t('graph.legend')))
    }

    function PanelView(props) {
      const { t, store, useSessions, openSession, telemetry } = props
      const telemetryState = useTelemetry(telemetry)
      const records = useRecords(store)
      const byId = useSessions((state) => state.byId)
      const [view, setView] = useState('records')
      const [filter, setFilter] = useState('all')
      const [range, setRange] = useState('today')
      const [selectedDay, setSelectedDay] = useState(() => dayKey(Date.now()))
      const [sessionFilter, setSessionFilter] = useState('all')
      const [query, setQuery] = useState('')
      const [rowLimit, setRowLimit] = useState(100)
      const [collapsed, setCollapsed] = useState(() => {
        try {
          const raw = window.localStorage.getItem(COLLAPSE_KEY)
          const parsed = raw === null ? {} : JSON.parse(raw)
          return typeof parsed === 'object' && parsed !== null ? parsed : {}
        } catch {
          return {}
        }
      })
      const [deleteArmed, setDeleteArmed] = useState(null)
      const [clearArmed, setClearArmed] = useState(false)

      useEffect(() => {
        if (!clearArmed) return undefined
        const timer = setTimeout(() => { setClearArmed(false) }, 4000)
        return () => { clearTimeout(timer) }
      }, [clearArmed])

      useEffect(() => {
        if (deleteArmed === null) return undefined
        const timer = setTimeout(() => { setDeleteArmed(null) }, 4000)
        return () => { clearTimeout(timer) }
      }, [deleteArmed])

      const today = dayKey(Date.now())
      const yesterday = dayKey(Date.now() - 86400000)
      const weekStart = (() => {
        const now = new Date()
        const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
        return dayKey(monday.getTime())
      })()
      const monthStart = (() => {
        const now = new Date()
        return dayKey(new Date(now.getFullYear(), now.getMonth(), 1).getTime())
      })()

      const titleOf = (sessionId, storedTitle) => {
        const row = byId[sessionId]
        const live = row === undefined ? '' : row.displayTitle
        return live !== '' ? live : (storedTitle !== '' ? storedTitle : t('panel.sessionUnknown'))
      }

      const sessionOptions = useMemo(() => {
        const seen = new Map()
        for (const record of records) {
          const current = seen.get(record.sessionId)
          if (current === undefined) {
            seen.set(record.sessionId, { id: record.sessionId, title: record.sessionTitle, count: 1 })
          } else {
            current.count += 1
          }
        }
        return [...seen.values()].sort((left, right) => right.count - left.count)
      }, [records])
      const activeSession = sessionOptions.some(option => option.id === sessionFilter) ? sessionFilter : 'all'

      const dayOf = (record) => (record.day !== undefined && record.day !== '' ? record.day : dayKey(record.createdAt))
      const matchesRange = (record) => {
        const day = dayOf(record)
        if (range === 'today') return day === today
        if (range === 'yesterday') return day === yesterday
        if (range === 'week') return day >= weekStart && day <= today
        if (range === 'month') return day >= monthStart && day <= today
        if (range === 'day') return day === selectedDay
        return true
      }
      const needle = query.trim().toLowerCase()
      const matchesQuery = (record) => needle === ''
        || record.text.toLowerCase().includes(needle)
        || record.comment.toLowerCase().includes(needle)
      const scoped = records.filter(record => matchesRange(record)
        && (activeSession === 'all' || record.sessionId === activeSession)
        && matchesQuery(record))

      const counts = { all: scoped.length, approve: 0, unsure: 0 }
      for (const record of scoped) counts[record.level] += 1
      const scopedSessions = new Set(scoped.map(record => record.sessionId)).size
      const commentChars = scoped.reduce((sum, record) => sum + record.comment.length, 0)

      const visible = filter === 'all' ? scoped : scoped.filter(record => record.level === filter)
      const groups = []
      const index = new Map()
      for (const record of visible) {
        let group = index.get(record.sessionId)
        if (group === undefined) {
          group = { sessionId: record.sessionId, title: record.sessionTitle, records: [] }
          index.set(record.sessionId, group)
          groups.push(group)
        }
        group.records.push(record)
      }

      const toggleGroup = (sessionId, folded) => {
        const next = { ...collapsed, [sessionId]: !folded }
        setCollapsed(next)
        try {
          window.localStorage.setItem(COLLAPSE_KEY, JSON.stringify(next))
        } catch {
          // Collapse state is a convenience only.
        }
      }

      const hours = Array.from({ length: 24 }, () => ({ approve: 0, unsure: 0 }))
      for (const record of scoped) {
        const hour = new Date(record.createdAt).getHours()
        if (hours[hour] !== undefined) hours[hour][record.level] += 1
      }
      const maxHour = Math.max(1, ...hours.map(cell => cell.approve + cell.unsure))
      const heatApprove = hours.reduce((sum, cell) => sum + cell.approve, 0)
      const heatUnsure = hours.reduce((sum, cell) => sum + cell.unsure, 0)
      const heatLabel = range === 'today' ? t('panel.heatToday')
        : range === 'yesterday' ? t('panel.heatYesterday')
          : range === 'week' ? t('panel.heatWeek')
            : range === 'month' ? t('panel.heatMonth')
              : range === 'all' ? t('panel.heatAll')
                : t('panel.heatDay', { date: selectedDay })

      const insights = useMemo(() => {
        const words = buildWordStats(records)
        const commented = records.filter(record => record.comment.trim() !== '')
        const chars = commented.reduce((sum, record) => sum + record.comment.length, 0)
        return {
          words,
          trend: buildWeeklyTrend(records),
          heat: buildWeekdayMatrix(records),
          total: records.length,
          approve: records.filter(record => record.level === 'approve').length,
          unsure: records.filter(record => record.level === 'unsure').length,
          commented: commented.length,
          avgChars: commented.length === 0 ? 0 : Math.round(chars / commented.length),
          days: new Set(records.map(record => dayOf(record))).size,
          sessions: new Set(records.map(record => record.sessionId)).size,
        }
      }, [records])

      const percent = (part, total) => (total === 0 ? 0 : Math.round((part / total) * 100))
      const statCard = (label, value) => h('div', { className: 'dsrp-stat', key: label },
        h('span', { className: 'dsrp-stat-label' }, label),
        h('span', { className: 'dsrp-stat-value' }, value))

      const tabs = h('div', { className: 'dsrp-tabs' },
        [['records', 'panel.tab.records'], ['insights', 'panel.tab.insights'], ['graph', 'panel.tab.graph']].map(([id, key]) => h('button', {
          key: id,
          type: 'button',
          className: 'dsrp-tab',
          'aria-pressed': view === id ? 'true' : 'false',
          onClick: () => { setView(id) },
        }, t(key))))

      const insightsBody = records.length === 0
        ? h('div', { className: 'dsrp-empty' },
          h(EmptyArt),
          h('h2', null, t('insights.emptyTitle')),
          h('p', null, t('insights.emptyBody')))
        : h('div', { className: 'dsrp-insights' },
          h('div', { className: 'dsrp-stats' },
            statCard(t('insights.total'), String(insights.total)),
            statCard(t('insights.approve'), `${insights.approve} · ${percent(insights.approve, insights.total)}%`),
            statCard(t('insights.unsure'), `${insights.unsure} · ${percent(insights.unsure, insights.total)}%`),
            statCard(t('insights.commented'), `${percent(insights.commented, insights.total)}%`),
            statCard(t('insights.avgChars'), String(insights.avgChars)),
            statCard(t('insights.days'), String(insights.days)),
            statCard(t('insights.sessions'), String(insights.sessions))),
          h('section', { className: 'dsrp-card' },
            h('h2', null, t('insights.cloud')),
            h('p', { className: 'dsrp-card-sub' }, t('insights.cloudHint')),
            h(WordCloud, { words: insights.words.slice(0, 40), t }),
            insights.words.length === 0 ? null : h('ol', { className: 'dsrp-wordlist' },
              insights.words.slice(0, 20).map((word, index) => h('li', { key: word.word },
                h('button', {
                  type: 'button',
                  className: 'dsrp-word',
                  onClick: () => {
                    setSessionFilter('all')
                    setRange('all')
                    setQuery(word.word)
                    setView('records')
                  },
                },
                h('span', { className: 'dsrp-word-rank' }, String(index + 1)),
                h('span', { className: 'dsrp-word-text' }, word.word),
                h('span', { className: 'dsrp-word-count' }, String(word.count)),
                h('span', { className: 'dsrp-word-split' }, `👍${word.approve} 🤔${word.unsure}`)))))),
          h('section', { className: 'dsrp-card' },
            h('h2', null, t('insights.heat')),
            h('p', { className: 'dsrp-card-sub' }, t('insights.heatHint')),
            h(WeekdayMatrix, {
              matrix: insights.heat.matrix,
              max: insights.heat.max,
              labels: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => t(`insights.day.${day}`)),
            })),
          h('section', { className: 'dsrp-card' },
            h('h2', null, t('insights.trend')),
            h(TrendBars, { bins: insights.trend })))

      const graphBody = records.length === 0
        ? h('div', { className: 'dsrp-empty' },
          h(EmptyArt),
          h('h2', null, t('insights.emptyTitle')),
          h('p', null, t('insights.emptyBody')))
        : h(GraphView, {
          records,
          t,
          titleOf,
          onOpenSession: (sessionId) => {
            setView('records')
            setRange('all')
            setSessionFilter(sessionId)
            setQuery('')
          },
          onSearchWord: (word) => {
            setView('records')
            setRange('all')
            setSessionFilter('all')
            setQuery(word)
          },
        })

      const rangeBar = h('div', { className: 'dsrp-range' },
        [['today', 'panel.range.today'], ['yesterday', 'panel.range.yesterday'],
          ['week', 'panel.range.week'], ['month', 'panel.range.month'],
          ['all', 'panel.range.all']].map(([id, key]) => h('button', {
          key: id,
          type: 'button',
          className: 'dsrp-chip',
          'aria-pressed': range === id ? 'true' : 'false',
          onClick: () => {
            setRange(id)
            setSelectedDay(id === 'yesterday' ? yesterday : today)
          },
        }, t(key))))

      const clearButton = records.length === 0 ? null : h('button', {
        type: 'button',
        className: 'dsrp-chip',
        onClick: () => {
          if (!clearArmed) { setClearArmed(true); return }
          store.clear()
          setClearArmed(false)
          setDeleteArmed(null)
        },
      }, clearArmed ? t('panel.clearConfirm') : t('panel.clear'))

      const filters = h('div', { className: 'dsrp-filters' },
        rangeBar,
        h('input', {
          type: 'date',
          className: range === 'day' ? 'dsrp-date dsrp-date--active' : 'dsrp-date',
          value: selectedDay,
          'aria-label': t('panel.pickDay'),
          onChange: (event) => {
            const value = event.target.value
            if (value === '') return
            setSelectedDay(value)
            setRange('day')
          },
        }),
        h('select', {
          className: 'dsrp-select',
          value: activeSession,
          'aria-label': t('panel.sessionFilter'),
          onChange: (event) => { setSessionFilter(event.target.value) },
        },
        h('option', { value: 'all' }, t('panel.allSessions')),
        sessionOptions.map(option => h('option', { key: option.id, value: option.id },
          `${titleOf(option.id, option.title)} (${option.count})`))),
        h('input', {
          type: 'search',
          className: 'dsrp-search',
          value: query,
          placeholder: t('panel.search'),
          'aria-label': t('panel.search'),
          onChange: (event) => { setQuery(event.target.value) },
        }),
        h('span', { className: 'dsrp-spacer' }),
        clearButton)

      const toolbar = h('div', { className: 'dsrp-toolbar' },
        ['all', 'approve', 'unsure'].map(id => h('button', {
          key: id,
          type: 'button',
          className: 'dsrp-chip',
          'aria-pressed': filter === id ? 'true' : 'false',
          onClick: () => { setFilter(id) },
        },
        t(id === 'all' ? 'panel.filter.all' : `panel.filter.${id}`),
        h('span', { className: 'dsrp-chip-count' }, String(counts[id])))),
        h('span', { className: 'dsrp-spacer' }),
        h('span', { className: 'dsrp-meta' }, t('panel.storeCount', { n: records.length })))

      const body = records.length === 0
        ? h('div', { className: 'dsrp-empty' },
          h(EmptyArt),
          h('h2', null, t('panel.emptyTitle')),
          h('p', null, t('panel.emptyBody')))
        : scoped.length === 0
          ? h('div', { className: 'dsrp-empty' },
            h(EmptyArt),
            h('h2', null, t('panel.emptyScope')),
            h('p', null, t('panel.emptyScopeBody')))
          : groups.length === 0
            ? h('div', { className: 'dsrp-empty' },
              h(EmptyArt),
              h('h2', null, t('panel.emptyFilter')),
              h('p', null, t('panel.emptyScopeBody')))
            : groups.map(group => {
              const title = titleOf(group.sessionId, group.title)
              const hasToday = group.records.some(record => dayOf(record) === today)
              const stored = collapsed[group.sessionId]
              const folded = typeof stored === 'boolean' ? stored : !hasToday
              const shown = group.records.slice(0, rowLimit)
              return h('section', { key: group.sessionId, className: 'dsrp-group' },
                h('header', { className: 'dsrp-group-head' },
                  h('button', {
                    type: 'button',
                    className: 'dsrp-fold',
                    'aria-expanded': !folded,
                    onClick: () => { toggleGroup(group.sessionId, folded) },
                  },
                  h('span', { className: 'dsrp-caret' }, folded ? '▸' : '▾'),
                  h('span', { className: 'dsrp-session', title }, title)),
                  h('span', { className: 'dsrp-meta' }, t('panel.count', { n: group.records.length })),
                  h('span', { className: 'dsrp-spacer' }),
                  h('button', {
                    type: 'button', className: 'dsrp-mini',
                    onClick: () => { openSession(group.sessionId) },
                  }, t('panel.openSession'))),
                folded ? null : shown.map(record => {
                  const level = levelOf(record.level) ?? LEVELS[0]
                  return h('article', {
                    key: record.id, className: 'dsrp-item', style: { '--dsr-level-color': level.color },
                  },
                  h('div', { className: 'dsrp-item-top' },
                    h('span', { className: 'dsrp-badge', title: t(`level.${record.level}`) }, t(`panel.filter.${record.level}`)),
                    h('span', { className: 'dsrp-time' }, formatTime(record.createdAt)),
                    h('span', { className: 'dsrp-item-actions' },
                      h('button', {
                        type: 'button', className: 'dsrp-mini',
                        onClick: () => {
                          if (deleteArmed !== record.id) { setDeleteArmed(record.id); return }
                          setDeleteArmed(null)
                          store.remove(record.id)
                        },
                      }, deleteArmed === record.id ? t('panel.deleteConfirm') : t('panel.delete')))),
                  h('blockquote', { className: 'dsrp-quote', title: record.text }, `「${record.text}」`),
                  record.comment === '' ? null : h('p', { className: 'dsrp-comment' }, record.comment))
                }),
                folded || group.records.length <= rowLimit ? null : h('div', { className: 'dsrp-group-foot' },
                  h('button', {
                    type: 'button', className: 'dsrp-more',
                    onClick: () => { setRowLimit(limit => limit + 100) },
                  }, t('panel.more', { n: group.records.length - rowLimit }))))
            })

      const heat = records.length === 0 ? null : h('div', { className: 'dsrp-heat' },
        h('div', { className: 'dsrp-heat-head' },
          h('span', null, heatLabel),
          h('span', { className: 'dsrp-meta' }, `👍 ${heatApprove} · 🤔 ${heatUnsure}`)),
        h('div', { className: 'dsrp-heat-cells' }, hours.map((cell, hour) => h('span', {
          key: hour,
          className: 'dsrp-heat-cell',
          title: `${String(hour).padStart(2, '0')}:00 · 👍${cell.approve} 🤔${cell.unsure}`,
        },
        h('span', { className: 'dsrp-heat-track' },
          h('span', { className: 'dsrp-heat-approve', style: { height: `${(cell.approve / maxHour) * 100}%` } }),
          h('span', { className: 'dsrp-heat-unsure', style: { height: `${(cell.unsure / maxHour) * 100}%` } }))))),
        h('div', { className: 'dsrp-heat-ticks' },
          ['00:00', '06:00', '12:00', '18:00', '23:00'].map(label => h('span', { key: label }, label))))

      return h(React.Fragment, null,
        h(Styles),
        h('div', { className: 'dsrp-page' },
          h('div', { className: 'dsrp-scroll' },
            h('div', { className: 'dsrp-content' },
              h('header', { className: 'dsrp-head' },
                h('div', null,
                  h('h1', null, t('panel.title')),
                  h('p', { className: 'dsrp-sub' }, t('panel.subtitle')))),
              tabs,
              view === 'records'
                ? h(React.Fragment, null,
                  filters,
                  h('p', { className: 'dsrp-summary' }, t('panel.summary', {
                    n: scoped.length,
                    approve: counts.approve,
                    unsure: counts.unsure,
                    sessions: scopedSessions,
                    chars: commentChars,
                  })),
                  heat,
                  toolbar,
                  h('div', null, body))
                : view === 'insights' ? insightsBody : graphBody,
              h('div', { className: 'dsrp-usage' },
                h('span', null, t('panel.usage', {
                  approve: telemetryState.usage.approve,
                  comment: telemetryState.usage.comment,
                })),
                h('span', { className: 'dsrp-spacer' }),
                telemetryState.configured
                  ? h('button', {
                    type: 'button',
                    className: 'dsrp-chip',
                    'aria-pressed': telemetryState.enabled ? 'true' : 'false',
                    title: t('panel.telemetryHint'),
                    onClick: () => { telemetry.setEnabled(!telemetryState.enabled) },
                  }, telemetryState.enabled ? t('panel.telemetryOn') : t('panel.telemetryOff'))
                  : h('span', { className: 'dsrp-meta' }, t('panel.telemetryUnavailable'))),
              h('p', { className: 'dsrp-usage-hint' }, t('panel.telemetryHint')),
              h('p', { className: 'dsrp-footer' }, t('panel.footer'))))))
    }

    // --------------------------------------------------------------- inline --

    /**
     * The inline marker: one card under a completed Turn listing the reviews whose
     * quote belongs to that Turn. Records saved without an anchor are matched by text.
     * @param props - the Turn location, its Session, and this plugin's store and actions.
     */
    function TurnReviewTailView(props) {
      const { t, store, sessionId, turn, openPanel, markers, inputActions, focusComposer } = props
      const records = useRecords(store)
      const markerVersion = useMarkerVersion(markers)
      const [undo, setUndo] = useState(null)
      const attempted = useRef('')

      useEffect(() => {
        if (undo === null) return undefined
        const timer = setTimeout(() => { setUndo(null) }, 5000)
        return () => { clearTimeout(timer) }
      }, [undo])
      // `nodes` is identity-stable, so the second selector is the change signal: it returns a
      // number and re-renders only when a newer finished answer exists.
      const chat = props.useChat(state => state.nodes)
      const latestTurn = props.useChat(state => latestAnswerTurn(state.nodes.values()))
      const turnNumber = turn !== undefined && turn !== null && typeof turn.turn === 'number' ? turn.turn : null
      const targetTurn = turnNumber === null ? -1 : turnNumber
      const targetIsLatest = targetTurn === latestTurn

      const anchored = records.filter(record => record.sessionId === sessionId && record.turn === targetTurn)
      // Reviews whose quote never resolved stay on the newest answer's card as a count only.
      const unlocated = targetIsLatest
        ? records.filter(record => record.sessionId === sessionId && record.turn === null)
        : []
      const signature = unlocated.map(record => record.id).join(',')

      // Rebuild underline/badge ranges for this Turn after a reload or a re-render.
      // The panel switch unmounts the conversation; on return this effect can run
      // before the answer text is mounted, so retry until the text exists.
      useEffect(() => {
        const targets = records.filter(record => record.sessionId === sessionId
          && record.turn === targetTurn)
        if (targets.length === 0) return undefined
        let cancelled = false
        let timer = 0
        let attempts = 0
        const run = () => {
          if (cancelled) return
          let missing = false
          for (const record of targets) {
            if (markers.has(record.id)) continue
            const range = findTextRange(targetTurn, record.text)
            if (range === null) {
              missing = true
              continue
            }
            markers.set(record.id, range, record)
          }
          if (missing && attempts < 50) {
            attempts += 1
            timer = setTimeout(run, attempts < 15 ? 100 : 250)
          }
        }
        run()
        let observer = null
        try {
          const row = document.querySelector(`[data-chat-turn="${targetTurn}"]`)
          if (row !== null && typeof MutationObserver === 'function') {
            observer = new MutationObserver(() => { run() })
            observer.observe(row, { childList: true, subtree: true, characterData: true })
          }
        } catch {
          // The row is not mounted yet; the retry loop still applies.
        }
        return () => {
          cancelled = true
          clearTimeout(timer)
          if (observer !== null) observer.disconnect()
        }
      }, [records, sessionId, targetTurn, markers, markerVersion])

      // Resolve older reviews once, from the newest answer's card, so the scan is bounded.
      useEffect(() => {
        if (!targetIsLatest || signature === '') return
        const answers = answerTexts(chat.values())
        if (answers.length === 0) return
        const attemptKey = `${signature}|${answers.length}`
        if (attempted.current === attemptKey) return
        attempted.current = attemptKey
        const patches = []
        for (const record of unlocated) {
          const found = locateReview(answers, record.text)
          if (found !== null) patches.push({ id: record.id, turn: found.turn, messageId: found.messageId })
        }
        if (patches.length > 0) store.anchor(patches)
      }, [targetIsLatest, signature, store, chat, unlocated])

      if (anchored.length === 0 && unlocated.length === 0 && undo === null) return null

      const requeue = (record) => {
        if (inputActions === undefined) return
        const payload = chipPayload(t, record.level, record.text, record.comment)
        if (inputActions.insertQuote(payload.text, payload.summary) === false) return
        if (focusComposer !== undefined) setTimeout(() => { focusComposer() }, 0)
      }

      return h(React.Fragment, null,
        h('section', {
          className: 'dsrt-card',
          'data-text-interaction-exclude': '',
          'aria-label': anchored.length === 0 ? t('tail.titleBare') : t('tail.title', { n: anchored.length }),
        },
          h('header', { className: 'dsrt-head' },
            h('span', { className: 'dsrt-title' },
              anchored.length === 0 ? t('tail.titleBare') : t('tail.title', { n: anchored.length })),
            h('span', { className: 'dsrt-spacer' }),
            h('button', {
              type: 'button', className: 'dsrt-link', onClick: () => { openPanel() },
            }, t('tail.viewAll'))),
          anchored.length === 0 ? null : h('ul', { className: 'dsrt-list' },
            anchored.map(record => {
              const level = levelOf(record.level) ?? LEVELS[0]
              return h('li', {
                key: record.id, className: 'dsrt-item', style: { '--dsr-level-color': level.color },
              },
              h('div', { className: 'dsrt-line' },
                h('span', { className: 'dsrt-badge', title: t(`level.${record.level}`) }, t(`panel.filter.${record.level}`)),
                h('span', {
                  className: 'dsrt-quote-inline',
                  title: record.text,
                }, t('tail.quote', { text: record.text })),
                h('button', {
                  type: 'button', className: 'dsrt-requeue', onClick: () => { requeue(record) },
                }, t('tail.requeue')),
                h('button', {
                  type: 'button',
                  className: 'dsrt-requeue dsrt-remove',
                  onClick: () => {
                    setUndo({ record })
                    markers.delete(record.id)
                    store.remove(record.id)
                  },
                }, t('panel.delete')),
                h('span', { className: 'dsrt-state' }, formatTime(record.createdAt))),
              record.comment === ''
                ? null
                : h('p', { className: 'dsrt-comment' }, t('tail.comment', { text: record.comment })))
            })),
          unlocated.length === 0 ? null : h('p', { className: 'dsrt-unlocated-line' },
            t('tail.unlocatedLine', { n: unlocated.length })),
          undo === null ? null : h('p', { className: 'dsrt-undo' },
            t('tail.undo'),
            h('button', {
              type: 'button',
              className: 'dsrt-link',
              onClick: () => {
                const record = undo.record
                setUndo(null)
                store.add(record)
              },
            }, t('tail.undoAction')))))
    }

    // --------------------------------------------------------------- plugin --

    return {
      inject: ['slots', 'locale', 'sessions', 'uiConversation'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-review: dictionaries')
        const t = ctx.locale.bind(NS)
        const store = createStore()
        const markers = createMarkers()
        const telemetry = createTelemetry(() => {
          try {
            return ctx.locale.getSnapshot().active
          } catch {
            return 'unknown'
          }
        })
        telemetry.start()
        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
          ctx.effect(() => {
            const onStorage = (event) => { if (event.key === STORAGE_KEY) store.refresh() }
            window.addEventListener('storage', onStorage)
            return () => { window.removeEventListener('storage', onStorage) }
          }, 'dsh-review: storage sync')
        }

        /** Return the keyboard to the composer after a chip is inserted. */
        const focusComposer = (sessionId) => {
          try {
            const conversation = ctx.get('conversation')
            const sessions = ctx.get('sessions')
            if (conversation === undefined || sessions === undefined) return
            const actx = sessions.scope(sessionId)
            if (actx === undefined) return
            conversation.input.for(actx).focus()
          } catch {
            // The composer is not mounted yet; nothing to focus.
          }
        }

        const openPanel = () => {
          const layout = ctx.get('layout')
          if (layout !== undefined && typeof layout.selectPanel === 'function') layout.selectPanel(PANEL_ID)
        }

        const openSession = (sessionId) => {
          const workspace = ctx.get('uiWorkspace')
          if (workspace !== undefined && typeof workspace.openSession === 'function') workspace.openSession(sessionId)
          const layout = ctx.get('layout')
          if (layout !== undefined && typeof layout.selectPanel === 'function') layout.selectPanel('conversation')
        }

        // Left-sidebar entry and the central page it selects.
        ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
          name: 'sidebar.panellist',
          id: PANEL_ID,
          order: 30,
          label: () => t('panel.short'),
        }, ReviewIcon))
        ctx.slots.inject('main', () => ctx.slots.register({
          name: 'main',
          key: PANEL_ID,
        }, function ReviewPanel(props) {
          return h(PanelView, {
            ...props, t, store, openSession, telemetry,
          })
        }))

        // Selection gesture: the "quote" cell also carries the Review action,
        // so a text selection offers both in one floating bar.
        // The shipped Quote plugin owns this cell at priority 0; a lower priority shadows it (lowest renders).
        ctx.slots.inject('conversation.chat.text-interaction', () => ctx.slots.register({
          name: 'conversation.chat.text-interaction',
          key: 'quote',
          priority: -1,
        }, function QuoteSelectionBar(props) {
          return h(SurfaceView, {
            ...props, t, store, markers, telemetry, focusComposer: () => { focusComposer(props.sessionId) }, variant: 'bar',
          })
        }))

        // Selection bar and comment card layer. Badges are hidden while either is open:
        // this layer lives in the frame overlay, so a badge would always paint on top.
        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'review-marks',
          order: 10,
        }, function ReviewMarksLayer() {
          return h(ReviewMarkerLayer, { t, markers, store, openPanel })
        }))

        // Inline marker under each completed answer, showing this plugin's own reviews.
        ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({
          name: 'conversation.chat.turnTail',
          id: 'review',
          order: 30,
        }, function TurnReviewTail(props) {
          return h(TurnReviewTailView, {
            ...props, t, store, openPanel, markers, focusComposer: () => { focusComposer(props.sessionId) },
          })
        }))

        // Right-click fallback: only while Quote no longer offers a selection surface, so a normal
        // right-click keeps its browser menu and the floating bar stays the one selection entry.
        const quoteSurfaceLive = () => {
          const registry = ctx.uiConversation.interactions
          const ids = typeof registry.getSnapshot === 'function' ? registry.getSnapshot() : []
          return Array.isArray(ids) && ids.includes('quote')
        }
        ctx.effect(() => ctx.uiConversation.interactions.register({
          id: 'review',
          onInteraction(request) {
            if (request.trigger !== 'contextmenu' || !request.hasSelection) return
            if (quoteSurfaceLive()) return
            const text = request.readText()
            if (text === null || text.trim() === '') return
            request.preventDefault()
            request.open()
          },
        }), 'dsh-review: context-menu fallback')
        ctx.slots.inject('conversation.chat.text-interaction', () => ctx.slots.register({
          name: 'conversation.chat.text-interaction',
          key: 'review',
        }, function ReviewSelectionCard(props) {
          return h(SurfaceView, {
            ...props, t, store, markers, telemetry, focusComposer: () => { focusComposer(props.sessionId) }, variant: 'card',
          })
        }))
      },
    }
  },
})
