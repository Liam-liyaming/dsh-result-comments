# 收录到 awesome-dsh-plugin（DSH 插件市场）

来源：https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/blob/main/contributing.md

## 前置条件（缺一不可）

- [ ] 公开 GitHub 仓库，且**创建满 1 天**（CI 自动检查）；
- [ ] 仓库根 `package.json` 声明 `dsh.bundle`（本仓库已有）；
- [ ] 仓库添加 **`dsh-plugin`** topic；
- [ ] 真实可用的代码（本仓库满足）；
- [ ] npm 包的 `repository` 字段指回该仓库（发布 1.0.1 时补上，市场才会关联下载量）；
- [ ] 仓库自带 `assets/icon-180.png`（已生成，GitHub 图床位图）。

## 操作顺序

1. 在 GitHub 建公开仓库 `dsh-result-comments`；
2. 推送本地仓库：

   ```bash
   git remote add origin git@github.com:Liam-liyaming/dsh-result-comments.git
   git push -u origin main
   ```

3. 仓库 Settings → Topics 添加 `dsh-plugin`；
4. 把 `package.json` 加上：

   ```json
   "repository": { "type": "git", "url": "https://github.com/Liam-liyaming/dsh-result-comments" },
   "homepage": "https://github.com/Liam-liyaming/dsh-result-comments#readme"
   ```

   然后 `npm version patch`（1.0.1）并发布，让 npm 包与仓库关联；
5. 等仓库满 1 天后，Fork `awesome-dsh-plugin/awesome-dsh-plugin`；
6. 新建 `data/plugins/Liam-liyaming__dsh-result-comments.yml`：

   ```yaml
   url: https://github.com/Liam-liyaming/dsh-result-comments
   name: Liam-liyaming/dsh-result-comments
   category: ui
   description:
     en: 'Select text in an AI reply, mark it 👍 or write a 🤔 comment, and send each comment as a composer tag.'
     zh: '框选 AI 回复中的文字，用 👍 认可或写 🤔 评论，并把评论作为输入框 tag 随消息发送。'
   icon: https://raw.githubusercontent.com/Liam-liyaming/dsh-result-comments/main/assets/icon-180.png
   ```

7. 提 PR；CI 会检查 `dsh.bundle`、仓库年龄、文件名与 YAML；维护者会读代码核对描述。

## 注意事项

- 文件名必须由 `url` 推出：`Liam-liyaming__dsh-result-comments.yml`；
- `description.en` 必填、单行、以句号结尾；含 `: ` 时要加引号；
- 分类选最贴近的即可（本插件建议 `ui`，维护者可能微调）；
- 一个 PR 最多 3 条；
- 截图可选：在仓库根放 `screenshots.json`（1–8 张，路径相对于该文件），市场会自动展示；不写则从 README 抽图。
- GitHub 访问受限时，用手机/个人网络完成建仓和 PR。
