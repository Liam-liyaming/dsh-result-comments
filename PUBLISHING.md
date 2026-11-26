# 发布清单（作者用）

## 1. 统计端点

国内网络建议用 [analytics/tencent-cloudbase/](analytics/tencent-cloudbase/)（腾讯云开发 HTTP 云函数，已带可上传 zip）；海外或有代理的网络可用 [analytics/README.md](analytics/README.md) 的 Cloudflare Worker。把最终地址填进 `client.js`：

```js
const TELEMETRY_URL = 'https://dsh-result-comments-analytics.<you>.workers.dev'
```

未填写时插件完全离线，面板显示「匿名统计：未配置」。

## 2. 改包名（npm 上 `dsh-review` 已被占用）

发布名用 `dsh-result-comments`，需要同时改三处，缺一不可：

| 位置 | 旧 | 新 |
| --- | --- | --- |
| `package.json` | `"name": "dsh-review"` | `"name": "dsh-result-comments"` |
| `client.js` | `id: 'dsh-review'` | `id: 'dsh-result-comments'` |
| `cordis.patch.yml` | `name: dsh-review` | `name: dsh-result-comments` |

改完后本地插件会失效，需要重新安装并重启 DSH：

```
plugin_manager remove_bundle  target: dsh-result-comments
plugin_manager install_bundle target: <本目录>
```

## 3. 版本与发布

> 首次发布会进入 npm 的 **staged publishing**：注册表先出现 `0.0.0-stage` 占位，真正的版本在暂存队列，需要用 2FA 在 npmjs.com 的 **Staged Packages**（账号设置）或包的 **Versions** 标签里批准。`1.0.0` 已发布成功，后续发版仍可能触发暂存，按控制台提示批准即可。

- `package.json` 当前版本 `1.0.1`（1.0.0 为首发，1.0.1 补 repository 关联）；
- 同版本号必须与 `client.js` 里的 `PLUGIN_VERSION` 一致（统计上报用）；
- 确认 `npm whoami` 已登录，然后：

```
npm publish --access public
```

- 发布后再用 `plugin_manager install_bundle` 指定 npm 包名即可安装：`dsh-result-comments`。

## 4. 隐私检查

- payload 只含 `v / event / id / version / locale`；
- 默认关闭，面板可开关；
- README 与插件详情页已披露统计范围；
- 不要把 Worker 的 KV 写权限或任何密钥放进插件代码。
