# 🚀 快速开始指南 - 权限系统测试

## 📋 系统检查清单

### ✅ 后端就绪状态
- [x] 数据库迁移完成
- [x] API路由已注册
- [x] 权限检查函数已实现
- [x] 应用加载成功

### ✅ 前端就绪状态
- [x] API客户端已实现
- [x] 审核面板已实现
- [x] AdminLayout已更新
- [x] 组件集成完成

---

## 🏃 5分钟快速测试

### 第一步: 启动后端服务

```bash
cd /Users/yger/WithFaith/wangfeng-fan-website/backend
python3 start.py
```

预期输出:
```
INFO:     Uvicorn running on http://0.0.0.0:1994
```

✅ **验证**: 打开 http://localhost:1994/docs 看到API文档

### 第二步: 启动前端服务

```bash
cd /Users/yger/WithFaith/wangfeng-fan-website/frontend
pnpm dev
```

预期输出:
```
  ➜  Local:   http://localhost:1997
```

✅ **验证**: 打开 http://localhost:1997 看到网站

### 第三步: 登录管理后台

1. 访问 http://localhost:1997/admin
2. 使用管理员账号登录
3. 应该看到侧边栏多了"审核面板"菜单项

---

## 🧪 核心功能测试

### 测试场景1: 用户创建并提交文章

#### 前置条件
- 以普通用户身份登录

#### 操作步骤
```
1. 进入管理后台
2. 点击"我的文章"
3. 点击"创建文章"按钮
4. 填写:
   - 标题: "测试文章"
   - 内容: "这是一篇测试文章"
   - 分类: "峰言峰语"
5. 点击"保存为草稿"
6. 页面应显示: 状态=draft
```

#### 期望结果
- ✅ 文章创建成功
- ✅ 初始状态为 `pending` (待审核)
- ✅ 用户可编辑
- ✅ 用户可提交审核

### 测试场景2: 管理员审核文章

#### 前置条件
- 已创建待审核文章
- 以管理员身份登录

#### 操作步骤
```
1. 进入"审核面板" (/admin/review-panel)
2. 应该看到刚才创建的文章
3. 点击文章查看详情
4. 点击"批准发布"按钮
5. 文章从列表消失
```

#### 期望结果
- ✅ 审核面板加载成功
- ✅ 显示待审核的文章
- ✅ 批准后发布成功
- ✅ 文章自动从待审核列表移除

### 测试场景3: 拒绝文章

#### 操作步骤
```
1. 在审核面板选择一篇文章
2. 点击"拒绝"按钮
3. 输入拒绝原因，例如: "图片不清楚"
4. 点击"确认拒绝"
5. 文章消失，状态变为 rejected
```

#### 期望结果
- ✅ 拒绝对话框出现
- ✅ 可输入拒绝原因
- ✅ 拒绝成功后消失

### 测试场景4: 权限检查

#### 测试游客权限
```
1. 不登录访问 /admin/review-panel
2. 应该看到权限不足提示
```

#### 测试用户权限
```
1. 以普通用户身份查看 /admin/review-panel
2. 应该看到权限不足提示（仅ADMIN+可访问）
```

#### 期望结果
- ✅ 权限检查正确
- ✅ 无权限用户被拦截

---

## 🔌 API端点测试

### 使用Postman或curl测试

#### 1. 创建文章
```bash
curl -X POST http://localhost:1994/api/v3/content/articles \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试文章",
    "content": "文章内容",
    "author": "测试用户",
    "category_primary": "峰言峰语",
    "category_secondary": "个人感悟"
  }'
```

期望响应:
```json
{
  "id": "uuid-string",
  "title": "测试文章",
  "review_status": "pending",
  "created_by_id": 1,
  "created_at": "2025-01-01T00:00:00"
}
```

#### 2. 获取待审核列表
```bash
curl -X GET http://localhost:1994/api/v3/content/pending-review \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

期望: 返回待审核文章数组

#### 3. 批准文章
```bash
curl -X POST http://localhost:1994/api/v3/content/articles/{id}/approve \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

期望: 返回更新后的文章，`review_status` = "approved"

#### 4. 拒绝文章
```bash
curl -X POST "http://localhost:1994/api/v3/content/articles/{id}/reject?reason=理由" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

期望: 返回更新后的文章，`review_status` = "rejected"

---

## 🔍 调试技巧

### 检查后端日志
```bash
# 查看FastAPI日志
tail -f /Users/yger/WithFaith/wangfeng-fan-website/logs/backend.log

# 查看数据库查询
# 在MySQL中查看最近的操作
SELECT * FROM articles WHERE review_status = 'pending' ORDER BY created_at DESC LIMIT 10;
```

### 检查前端控制台
```javascript
// 在浏览器Console中检查token
localStorage.getItem('token')

// 检查当前用户信息
// (在AuthContext中可查看)
```

### 检查网络请求
```
1. 打开浏览器DevTools (F12)
2. 切换到Network标签
3. 执行操作
4. 查看请求/响应
```

---

## 📊 测试矩阵

### 权限检查测试

| 用户角色 | 操作 | 预期 | 实际 | 状态 |
|---------|------|------|------|------|
| 游客 | 访问审核面板 | ❌ 拒绝 | ? | ⬜ |
| 用户 | 访问审核面板 | ❌ 拒绝 | ? | ⬜ |
| 管理员 | 访问审核面板 | ✅ 允许 | ? | ⬜ |
| 超管 | 访问审核面板 | ✅ 允许 | ? | ⬜ |

### API端点测试

| 端点 | 方法 | 权限 | 预期 | 实际 | 状态 |
|------|------|------|------|------|------|
| `/articles` | POST | USER+ | 201 Created | ? | ⬜ |
| `/articles/{id}` | PUT | 作者 | 200 OK | ? | ⬜ |
| `/articles/{id}/submit-review` | POST | 作者 | 200 OK | ? | ⬜ |
| `/articles/{id}/approve` | POST | ADMIN+ | 200 OK | ? | ⬜ |
| `/articles/{id}/reject` | POST | ADMIN+ | 200 OK | ? | ⬜ |
| `/pending-review` | GET | ADMIN+ | 200 OK | ? | ⬜ |
| `/my-articles` | GET | USER+ | 200 OK | ? | ⬜ |

---

## 🐛 常见问题排查

### 问题1: 后端启动失败

**症状**: `ModuleNotFoundError: No module named 'app'`

**解决**:
```bash
cd /Users/yger/WithFaith/wangfeng-fan-website/backend
python3 start.py
```
确保在backend目录下启动

### 问题2: 数据库连接失败

**症状**: `ERROR 1045 (28000): Access denied`

**解决**:
```bash
# 检查MySQL是否运行
mysql -h localhost -u root -p123456 -e "SELECT 1;"

# 检查数据库是否存在
mysql -h localhost -u root -p123456 -e "SHOW DATABASES;"

# 如果没有wangfeng_fan_website数据库，创建它
mysql -h localhost -u root -p123456 -e "CREATE DATABASE wangfeng_fan_website;"
```

### 问题3: 前端无法连接后端API

**症状**: CORS错误或404

**解决**:
1. 检查后端是否在运行: http://localhost:1994/health
2. 检查前端环境变量: `frontend/.env`
3. 检查CORS配置: `backend/app/main.py` 第55-64行

### 问题4: 审核面板不显示

**症状**: `/admin/review-panel` 显示空白或404

**解决**:
1. 检查路由是否注册: `frontend/src/App.tsx` 中是否有ReviewPanel路由
2. 检查权限: 确保以管理员身份登录
3. 查看浏览器控制台错误

---

## 📝 测试报告模板

请复制此模板记录测试结果:

```markdown
## 测试报告 - [日期]

### 环境
- 后端: Python 3.x, FastAPI, MySQL
- 前端: React 18, TypeScript
- 浏览器: Chrome/Firefox

### 测试场景

#### 场景1: [场景名称]
- [x] 前置条件
- [x] 操作步骤
- [x] 预期结果: ___
- [x] 实际结果: ___
- 状态: ✅ 通过 / ❌ 失败

### 总结
- 通过数: X
- 失败数: X
- 发现问题:
  1. ...
  2. ...
```

---

## 🎓 下一步

1. **立即**: 运行快速测试 (5分钟)
2. **今天**: 完成测试矩阵 (1小时)
3. **本周**: 进行完整E2E测试 (4小时)
4. **下周**: 用户验收测试 (UAT)

---

## 📞 需要帮助?

- 查看 `FINAL_DELIVERY_REPORT.md` - 完整实现说明
- 查看 `PERMISSION_IMPLEMENTATION_PLAN.md` - 详细设计文档
- 查看源代码注释 - 每个函数都有详细说明

**祝测试顺利！** 🎉

