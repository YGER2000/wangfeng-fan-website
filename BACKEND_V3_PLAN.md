# v3 后台重构方案（Strapi + Mantine + MySQL/Redis）

## 1. 项目目标

- **双版本共存**：保留 v2 后台（FastAPI）与现有业务逻辑，同时在 `/admin/v3` 引入全新后台。
- **标准化工作流**：使用 Strapi + 社区版 `strapi-plugin-review-workflow` 构建标准审核流程。
- **统一体验**：前端基于 React18 + Vite + Mantine，实现统一的 UI 组件与交互逻辑。配色和现有配色一致，并支持深浅色模式。
- **权限重塑**：
  - 游客：前台只读。
  - 用户：可创建/编辑/删除自己的文章、视频、图组；所有提交/修改需进入审核；可创建新标签。
  - 管理员：可创建内容（同样需要审核）、查看并审核所有投稿（通过、编辑、驳回）；无全局删除权限，仅能删除自己创建的内容；可管理行程、标签分类。
  - 超级管理员：拥有全部权限，可对任意内容执行删除等操作。

## 2. 技术栈与基础设施

| 模块 | 技术栈 | 备注 |
| --- | --- | --- |
| CMS | Strapi 5 + `strapi-plugin-review-workflow` | 数据库使用 MySQL 8；缓存使用 Redis 7 |
| 后端服务 | FastAPI（现有 v2）、新增 Strapi 服务 | Docker Compose / k8s 部署 |
| 前端 | React 18 + Vite + Mantine + Zustand + TanStack Query | `/admin/v3` |
| 鉴权 | Strapi JWT + Refresh Token | 统一前端封装 |
| 文件存储 | 阿里云OSS | - |
| 富文本编辑器 | TipTap（Mantine 集成） | - |
| 测试 | Jest + Testing Library（前端）、Jest（Strapi hooks）、Playwright（E2E） | - |

### 基础容器（开发环境示例）

```yaml
services:
  mysql:
    image: mysql:8
    environment:
      MYSQL_ROOT_PASSWORD: your_root_pw
      MYSQL_DATABASE: strapi_v3
      MYSQL_USER: strapi
      MYSQL_PASSWORD: strapi_pw
    ports: ["3306:3306"]
  redis:
    image: redis:7
    ports: ["6379:6379"]
  strapi:
    build: ./backend/strapi
    environment:
      DATABASE_CLIENT: mysql
      DATABASE_HOST: mysql
      DATABASE_PORT: 3306
      DATABASE_NAME: strapi_v3
      DATABASE_USERNAME: strapi
      DATABASE_PASSWORD: strapi_pw
      REDIS_HOST: redis
      REDIS_PORT: 6379
    depends_on:
      - mysql
      - redis
    ports: ["1337:1337"]
  fastapi:
    build: ./backend/api
    ports: ["1994:1994"]
```

## 3. 数据模型（Strapi）

### 3.1 核心内容类型

| 模型 | 主要字段 |
| --- | --- |
| `article` | title, slug, content (rich text), excerpt, cover, category_primary, category_secondary, tags, workflowState, reviewNotes, isPublished, publishedAt, author(User relation) |
| `video` | title, bvid, description, category, cover_thumb, cover_local, cover_url, workflowState, reviewNotes, isPublished, publishedAt, author |
| `photo-group` | title, category, description, date, cover_image, workflowState, reviewNotes, isPublished, author |
| `photo` | photo_group (relation), image, description, sort_order |
| `schedule` | theme, date, city, venue, category, description, cover_image, workflowState, reviewNotes, isPublished (仅管理员/超管可创建) |

### 3.2 支撑模型

| 模型 | 说明 |
| --- | --- |
| `tag` | name, slug, type (article/video/gallery/common), createdBy, approved |
| `category-primary` | name, order, applicable types |
| `category-secondary` | name, parent(primary)、order |
| `review-log` | contentType, contentId, action(submit/approve/reject/edit/delete), actor, remarks, timestamp |

### 3.3 工作流状态

| 状态 | 描述 |
| --- | --- |
| `draft` | 草稿（仅作者可见） |
| `pending` | 已提交审核 |
| `approved` | 审核通过（等待发布） |
| `rejected` | 被驳回，附带 reviewNotes |
| `published` | 已发布，前台可见 |

`isPublished` 字段用于控制前台展示；`workflowState` 用于区分审核流程节点。

## 4. 权限与策略

### 4.1 角色映射

| 角色 | Strapi Role | 权限摘要 |
| --- | --- | --- |
| 游客 | `public` | 只读公开接口 |
| 用户 | `authenticated` | create/update/delete own content, submit for review, create tags |
| 管理员 | 自定义 `editor` | 查看所有投稿、编辑、审核（通过/驳回）、创建行程、维护标签；删除仅限自己创建内容 |
| 超级管理员 | `super-admin` | 所有操作（含全局删除、配置） |

### 4.2 自定义策略 / Middleware

1. **OwnershipPolicy**：限制删除操作仅对作者/或超管开放。
2. **ReviewerPolicy**：确保只有管理员/超管可以调用审核 API。
3. **AuditLogMiddleware**：每次状态流转写入 `review-log`。

## 5. 前端 v3 架构

### 5.1 目录结构建议

```
frontend/src/apps/admin-v3/
  main.tsx
  routes/
    index.tsx
    dashboard.tsx
    content/
      articles.tsx
      videos.tsx
      galleries.tsx
      schedules.tsx
    review-center.tsx
    tags.tsx
    profile.tsx
  components/
    layout/
    cards/
    forms/
    workflow/
  hooks/
  store/
  services/strapi-client.ts
```

### 5.2 核心组件

- **AppShell**：Mantine `AppShell` + 侧边导航、顶部操作栏、主题切换。
- **DataTable**：基于 `@mantine/datatable`（或 `mantine-react-table`）+ React Query，封装分页、排序、过滤。
- **ContentCard**：文章/视频/图组统一卡片组件，支持状态徽章、操作菜单。
- **WorkflowDrawer**：审核操作面板（通过、驳回、退回修改）。
- **FormBuilder**：Mantine 表单 + Zod 验证，覆盖多步骤表单需求。
- **通知系统**：Mantine `notifications` 统一处理成功/错误提示。

### 5.3 数据接入

- 使用 Axios + React Query，统一封装 Strapi REST API。
- 前端存储 token（localStorage + refresh flow）。
- 全局错误处理（401/403 重定向、workflow 错误提示）。

## 6. 工作流流程说明

1. **投稿（用户/管理员）**
   - 创建或编辑后点击「提交审核」，状态从 `draft` → `pending`。
   - 生成 `review-log` (action: submit)。

2. **审核（管理员/超管）**
   - 审核中心展示 `pending` 任务。
   - 操作：
     - **通过**：状态 → `approved`，并设置 `isPublished = true`、`publishedAt`。
     - **驳回**：状态 → `rejected`，强制填写 `reviewNotes`，通知作者。
     - **编辑后提交**：可在审核流程中编辑内容并重新提交，状态保持 `pending`。

3. **删除策略**
   - `authenticated`：仅可删除自己创建的内容。
   - `editor`：仅当 `createdBy` 为自己时允许删除；审核列表禁用删除按钮。
   - `super-admin`：拥有删除权限。

4. **审计**
   - 每次状态变更在 `review-log` 中记录操作者、动作、时间、备注。
   - 提供审计查询页面（按内容、时间、操作者筛选）。

## 7. 数据迁移策略

1. **阶段性方案**
   - 初期：Strapi 使用空数据库完成 v3 功能开发与测试。
   - 迁移阶段：编写迁移脚本（Python/FastAPI）读取旧 MySQL，将数据写入 Strapi（通过 REST API 或直接写入数据库）。
   - 图片处理：批量上传到 Strapi Upload（保持旧地址兼容）。

2. **迁移顺序**
   1. 标签、分类。
   2. 文章。
   3. 视频。
   4. 图组 + 图片。
   5. 行程。
   6. 审核日志（可选）。

3. **前台切换策略**
   - 添加 Feature Flag，允许分页面或分用户逐步读取 Strapi API。
   - 运行一段时间后再将默认数据源切换到 Strapi。

## 8. 开发步骤与时间规划

| 阶段 | 时长 (估) | 交付物 |
| --- | --- | --- |
| **Step 1. 环境准备** | 1 周 | Docker Compose、Strapi 实例、Redis、MySQL、v3 入口路由 |
| **Step 2. Strapi 建模 & 权限** | 1 周 | 内容类型、工作流插件、角色权限、Policy/Middleware |
| **Step 3. 前端骨架** | 1~1.5 周 | `/admin/v3` AppShell、主题、认证、导航、React Query 基础 |
| **Step 4. 内容管理页面** | 2 周 | 文章/视频/图组/行程列表、卡片、过滤器、表单、我的内容页 |
| **Step 5. 审核中心 & Workflow** | 1 周 | 审核操作面板、状态流转、审核日志记录 |
| **Step 6. 标签/行程管理** | 0.5~1 周 | 标签 CRUD、分类维护、行程管理表单 |
| **Step 7. 数据迁移脚本** | 1 周 | 旧数据库 → Strapi 的迁移脚本、迁移文档 |
| **Step 8. 前台适配 & Feature Flag** | 1 周 | 前台读取 Strapi 数据、开关控制 |
| **Step 9. 测试 & 上线准备** | 1 周 | 单元测试、E2E、Sentry、部署脚本、验收文档 |

> 实际可根据团队人力、并行度进行调整。

## 9. 推荐 GitHub 资源

- **Strapi**：<https://github.com/strapi/strapi>
- **Workflow 插件**：<https://github.com/strapi-community/strapi-plugin-review-workflow>
- **Mantine**：<https://github.com/mantinedev/mantine>
- **React Query**：<https://github.com/TanStack/query>
- **Zustand**：<https://github.com/pmndrs/zustand>
- **TipTap**：<https://github.com/ueberdosis/tiptap>
- **Playwright**：<https://github.com/microsoft/playwright>
- **Refine (可选 admin 框架)**：<https://github.com/refinedev/refine>

## 10. 后续迭代建议

1. **通知系统**：站内消息或邮件提醒（被驳回时提醒作者）。
2. **多级审核 / 审核分派**：利用 Workflow 配置二级审批、审核人分配。
3. **操作日志导出**：支持审核日志报表、统计。
4. **自动化发布**：加入定时发布、自动归档。

---

> 本方案覆盖架构、数据模型、权限、前端、迁移、测试与资源推荐，可作为 v3 后台重构的整体实施蓝图。
