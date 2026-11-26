# 匿名使用统计（Cloudflare Worker）

> 国内网络无法访问 `*.workers.dev`（DNS 污染 / SNI 阻断）时，请改用 [tencent-cloudbase/](tencent-cloudbase/) 版本，接口完全一致。

插件默认**不联网**。用户在「结果评论」面板里打开「匿名统计」后，插件才会向这个 Worker 发一条请求，内容包括：

- 事件类型：`launch` / `approve` / `comment`
- 插件版本、界面语言
- 一个随机安装 ID（首次开启时生成，不含任何账号或会话信息）

**不包含**：选中的文字、评论内容、会话 ID、标题、时间以外的任何用户数据。

## 部署

1. 安装 Wrangler 并登录：`npm i -g wrangler && wrangler login`
2. 创建 KV：`wrangler kv namespace create COUNTERS`，把返回的 `id` 填进 `wrangler.toml`
3. 在本目录执行 `wrangler deploy`，得到形如 `https://dsh-result-comments-analytics.<you>.workers.dev` 的地址
4. 把该地址填到插件 `client.js` 里的 `TELEMETRY_URL`（当前为空字符串）
5. 重新安装/发布插件，面板里才会出现可开启的「匿名统计」开关

## 看数据

- `wrangler kv:key list --binding COUNTERS --prefix "day:"` 列出每天每事件的键
- `wrangler kv:key get --binding COUNTERS "day:2026-01-01:approve"` 读取某天某事件的计数
- `installs:total` 是去重后的累计安装数；`install:<id>` 是带 365 天 TTL 的去重标记

若想换成别的后端（Vercel、Deta、自建），只要接受 `text/plain` JSON 并返回 CORS `*` 即可，插件侧不需要改协议。
