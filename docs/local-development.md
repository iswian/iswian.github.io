# 本地开发

## 环境要求

- Node.js 22 或更高版本
- pnpm 11

## 首次配置

```bash
pnpm install --frozen-lockfile
pnpm --dir cwd-api install --frozen-lockfile
pnpm setup:api
```

仓库已提供 `.env.example` 和 `cwd-api/.dev.vars.example`。本地实际使用的
`.env`、`cwd-api/.dev.vars` 不会提交到 Git；如需接入 COS、飞书或邮件网关，
请把对应凭据填入本地文件，不要写入示例文件。

## 启动

打开两个终端：

```bash
# 终端 1：Astro，默认 http://localhost:4321
pnpm dev

# 终端 2：Cloudflare Worker，默认 http://127.0.0.1:8787
pnpm dev:api
```

只开发页面、不需要评论功能时，可以清空 `.env` 中的
`PUBLIC_CWD_API_BASE_URL`。

## 验证

```bash
pnpm check
pnpm check:api
pnpm build
```

`pnpm test:api` 可用于后续添加的 Worker 单元测试；当前仓库尚未包含测试文件。
