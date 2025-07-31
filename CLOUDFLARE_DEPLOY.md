# Sub-Store Cloudflare 部署配置

## 环境变量配置

在 Cloudflare Pages 项目设置中添加以下环境变量：

```bash
# 生产环境
NODE_ENV=production
VITE_API_URL=/api
VITE_CLOUDFLARE_PAGES=true
SUB_STORE_FRONTEND_BACKEND_PATH=/api
SUB_STORE_DATA_BASE_PATH=/data
```

## Cloudflare 资源创建命令

### 1. 创建 KV 命名空间
```bash
# 生产环境
wrangler kv:namespace create "SUB_STORE_KV"

# 开发环境
wrangler kv:namespace create "SUB_STORE_KV" --preview
```

### 2. 创建 D1 数据库
```bash
# 创建数据库
wrangler d1 create sub-store

# 初始化数据库表
wrangler d1 execute sub-store --file=schema.sql
```

### 3. 绑定资源到 Pages 项目
```bash
# 绑定 KV
wrangler pages secret put SUB_STORE_KV_ID

# 绑定 D1
wrangler pages secret put SUB_STORE_DB_ID
```

## GitHub Secrets 配置

在 GitHub 仓库设置 > Secrets and variables > Actions 中添加：

```
CLOUDFLARE_API_TOKEN=你的API令牌
CLOUDFLARE_ACCOUNT_ID=你的账户ID
CLOUDFLARE_KV_NAMESPACE_ID=KV命名空间ID
CLOUDFLARE_D1_DATABASE_ID=D1数据库ID
```

## 获取 Cloudflare 配置信息

### API Token
1. 访问 https://dash.cloudflare.com/profile/api-tokens
2. 点击 "创建令牌"
3. 选择 "自定义令牌"
4. 权限设置：
   - Zone:Zone:Read
   - Account:Cloudflare Pages:Edit
   - Account:D1:Edit
   - Account:Workers KV Storage:Edit

### Account ID
1. 访问 https://dash.cloudflare.com/
2. 在右侧边栏查看 "账户 ID"

### KV Namespace ID
```bash
wrangler kv:namespace list
```

### D1 Database ID
```bash
wrangler d1 list
```

## 部署验证

部署完成后访问分配的域名，检查：

1. 前端页面是否正常加载
2. API 接口是否可以访问 (访问 /api/health)
3. 数据库连接是否正常
4. KV 存储是否工作正常

## 故障排除

### 常见问题

1. **函数执行超时**
   - 检查 wrangler.toml 中的兼容性设置
   - 确保 compatibility_flags 包含 "nodejs_compat"

2. **数据库连接失败**
   - 确认 D1 数据库 ID 正确
   - 检查数据库是否已初始化

3. **KV 存储失败**
   - 确认 KV 命名空间 ID 正确
   - 检查权限配置

4. **CORS 错误**
   - 检查 API 函数中的 CORS 头设置
   - 确认前端请求路径正确

### 日志查看

```bash
# 查看 Pages 函数日志
wrangler pages deployment tail

# 查看特定部署的日志
wrangler pages deployment tail [deployment-id]
```
