# 腾讯云开发（CloudBase）统计端点

适用于国内网络（`*.workers.dev` 在国内会被 DNS 污染 / SNI 阻断）。接口与 Cloudflare 版一致，插件侧只改 `TELEMETRY_URL`。

## 部署步骤

1. 打开 [云开发控制台](https://tcb.cloud.tencent.com/)，创建一个环境（免费额度足够）。
2. **数据库 → 新建集合** `counters`，权限选「仅管理端可读写」。
3. 在本目录执行 `npm install`，把 `index.js`、`package.json`、`node_modules` 一起压缩成 zip。
4. **云函数 → 新建云函数**：名称 `dsh-result-comments-analytics`，运行时 Node.js 18，上传刚打的 zip。
5. **HTTP 访问服务 → 新建路径**：路径 `/count`，绑定该云函数；控制台会给一个 `https://<env>.service.tcloudbase.com/count` 形式的地址（以实际显示为准）。
6. 用浏览器或 curl 验证：

   ```bash
   curl -X POST https://<你的地址>/count \
     -H 'content-type: text/plain' \
     --data '{"v":1,"event":"launch","id":"self-test","version":"0.1.0","locale":"zh"}'
   # → {"ok":true}
   ```

7. 把该 URL 填进插件 `client.js` 的 `TELEMETRY_URL`。

## 查看计数

云开发控制台 → 数据库 → `counters` 集合：

- `day:2026-01-01:approve` / `:comment` / `:launch`：每天每事件的数量
- `install:<id>`：去重安装标记
- `installs:total`：去重后的累计安装数

## 说明

- 函数使用云开发当前环境的数据库权限，无需在代码里放任何密钥；
- 只接受 `text/plain` JSON，返回 `Access-Control-Allow-Origin: *`，浏览器可直接跨域调用；
- 采集内容仅 `event / id / version / locale`，不含任何用户内容。
