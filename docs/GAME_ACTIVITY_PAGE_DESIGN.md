# "游戏活动"页面设计方案

## 📋 概述

在"峰迷荟萃"和"关于本站"之间新增"游戏活动"页面，展示与汪峰歌曲相关的互动游戏和投票活动。

**页面路由**: `/game-activity`
**导航位置**: "峰迷荟萃" 和 "关于本站" 之间
**目标用户**: 粉丝、爱好者
**主要内容**: 常驻游戏 + 时限活动

---

## 🎨 UI设计规范

### 色彩系统
遵循现有设计规范：
- **主色**: Wang Feng Purple (`#8B5CF6`)
- **强调色**: Light Purple (`#A855F7`)
- **背景**: 深色（深灰/黑色）/ 浅色（白色/浅灰）
- **边框**: `border-wangfeng-purple/30` (深色模式) / `border-gray-200` (浅色模式)

### 文字颜色
- **标题**: 主紫色文字，支持发光动画 (`animate-pulse-glow`)
- **正文**: 灰白色文字
- **按钮**: 紫色背景 + 白色文字，支持悬停效果

### 排版
- **主标题**: `text-5xl md:text-7xl font-bebas tracking-wider`
- **副标题**: `text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple`
- **卡片标题**: `text-xl font-semibold`
- **正文**: `text-base text-gray-300`

---

## 📐 页面结构

### 总体布局
```
┌─────────────────────────────────┐
│  页面标题 + 英文副标题           │
│  "游戏活动" Games & Activities   │
├─────────────────────────────────┤
│  内容区域 (主体部分)              │
│  ┌─────────────────────────────┐ │
│  │ 常驻游戏区块                 │ │
│  │ - 歌词猜歌名                │ │
│  │ - 填词游戏                  │ │
│  │ - ...                       │ │
│  └─────────────────────────────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │ 时限活动/投票区块            │ │
│  │ - 最喜欢的歌投票             │ │
│  │ - 最喜欢的专辑投票           │ │
│  │ - ...                       │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

---

## 🎮 内容板块详细设计

### 1. 页面头部 (Hero Section)

```tsx
// 设计要点：
- 标题: "游戏 <发光的'活动'>", 占据屏幕宽度
- 英文副标题: "Games & Activities on Wang Feng"
- 使用 Framer Motion 实现淡入动画 (opacity 0→1, y: 50→0)
- 同 FengMiLiaoFeng 页面保持一致的风格
```

**代码参考**:
```tsx
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.8 }}
  className="text-center mb-16"
>
  <h1 className="text-5xl md:text-7xl font-bebas tracking-wider theme-text-primary mb-4">
    游戏 <span className="text-wangfeng-purple animate-pulse-glow">活动</span>
  </h1>
  <h2 className="text-2xl md:text-3xl font-bebas tracking-wider text-wangfeng-purple">
    Games & Activities on Wang Feng
  </h2>
</motion.div>
```

---

### 2. 常驻游戏区块 (Fixed Games Section)

#### 2.1 整体结构
- **标题**: "常驻游戏" / "Regular Games"
- **布局**: 响应式网格 (1列 -> 2列 -> 3列或4列)
- **卡片样式**: 参考 ArticleCard，支持悬停效果

#### 2.2 游戏卡片设计

```tsx
// 游戏卡片结构：
interface GameCard {
  id: string;
  title: string;           // 游戏名称 (如: "歌词猜歌名")
  icon: React.ReactNode;   // 游戏图标
  description: string;     // 简短描述
  difficulty: 'easy' | 'medium' | 'hard';  // 难度等级
  playCount?: number;      // 已玩次数
  link: string;            // 跳转链接 (可为 #game-{id})
  color?: string;          // 主题色 (用于动画边框)
}
```

#### 2.3 卡片样式实现

```tsx
// 游戏卡片
<motion.div
  whileHover={{ scale: 1.05 }}
  className={cn(
    "relative rounded-xl border overflow-hidden cursor-pointer group",
    "transition-all duration-300",
    isLight
      ? "bg-white border-gray-200 hover:border-wangfeng-purple hover:shadow-lg"
      : "bg-black/40 border-wangfeng-purple/30 hover:bg-wangfeng-purple/10"
  )}
>
  {/* 背景渐变 */}
  <div className="absolute inset-0 bg-gradient-to-br from-wangfeng-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

  {/* 内容 */}
  <div className="relative p-6 h-full flex flex-col">
    {/* 图标 + 标题 */}
    <div className="flex items-start gap-4 mb-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <h3 className="text-xl font-semibold theme-text-primary">{title}</h3>
        <span className="text-xs px-2 py-1 rounded-full bg-wangfeng-purple/20 text-wangfeng-purple mt-2 inline-block">
          {difficultyLabel}
        </span>
      </div>
    </div>

    {/* 描述 */}
    <p className={cn(
      "flex-1 mb-4",
      isLight ? "text-gray-600" : "text-gray-400"
    )}>
      {description}
    </p>

    {/* 底部信息和按钮 */}
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-500">{playCount} 人已玩</span>
      <button className={cn(
        "px-4 py-2 rounded-lg font-semibold transition-all",
        "bg-wangfeng-purple text-white hover:bg-wangfeng-dark"
      )}>
        开始游戏 →
      </button>
    </div>
  </div>
</motion.div>
```

#### 2.4 计划的游戏

```
1. 📝 歌词猜歌名 (Lyrics Guesser)
   - 展示歌词片段，猜测歌曲
   - 难度: Easy

2. 🎵 填词游戏 (Fill in the Lyrics)
   - 缺少单词或句子，填空
   - 难度: Medium

3. 🎸 歌曲配对 (Song Matcher)
   - 匹配歌曲与专辑/年份
   - 难度: Medium

4. 🎤 发音挑战 (Pronunciation Challenge)
   - 听音频，选择正确的歌词
   - 难度: Hard

5. 📅 时间线挑战 (Timeline Challenge)
   - 按时间顺序排列歌曲
   - 难度: Medium

...后续可扩展
```

---

### 3. 时限活动/投票区块 (Limited-time Activities & Polls Section)

#### 3.1 整体结构
- **标题**: "时限活动" / "Limited-time Activities"
- **子标题**: "投票、评选、互动..."
- **标签**: "火热进行中 🔥", "即将开始", "已结束"
- **布局**: 竖向列表或卡片网格

#### 3.2 投票卡片设计

```tsx
// 投票项目结构：
interface PollItem {
  id: string;
  title: string;              // 投票标题 (如: "最喜欢的歌曲投票")
  description: string;        // 投票描述
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'active' | 'ended';  // 状态
  totalVotes: number;         // 总投票数
  options: PollOption[];      // 投票选项
  userVote?: string;          // 用户已投票选项ID
}

interface PollOption {
  id: string;
  label: string;              // 选项标签
  voteCount: number;
  percentage: number;
  image?: string;             // 专辑/歌曲封面
}
```

#### 3.3 投票卡片样式实现

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  className={cn(
    "rounded-xl border overflow-hidden",
    "transition-all duration-300",
    isLight
      ? "bg-white border-gray-200"
      : "bg-black/40 border-wangfeng-purple/30"
  )}
>
  {/* 头部 */}
  <div className={cn(
    "px-6 py-4 border-b",
    isLight
      ? "bg-gray-50 border-gray-200"
      : "bg-black/60 border-wangfeng-purple/20"
  )}>
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-xl font-semibold theme-text-primary">{poll.title}</h3>
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-semibold",
            poll.status === 'active'
              ? "bg-red-500/20 text-red-400"
              : poll.status === 'upcoming'
              ? "bg-blue-500/20 text-blue-400"
              : "bg-gray-500/20 text-gray-400"
          )}>
            {statusLabel}
          </span>
        </div>
        <p className={isLight ? "text-gray-600" : "text-gray-400"}>
          {poll.description}
        </p>
      </div>
      <div className="text-right text-sm text-gray-500">
        <div>投票数: {poll.totalVotes}</div>
        <div>剩余时间: {timeRemaining}</div>
      </div>
    </div>
  </div>

  {/* 投票选项 */}
  <div className="p-6 space-y-4">
    {poll.options.map((option) => (
      <div key={option.id} className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-3 cursor-pointer flex-1">
            <input
              type="radio"
              checked={userVote === option.id}
              onChange={() => handleVote(option.id)}
              disabled={poll.status !== 'active'}
              className="w-4 h-4"
            />
            <span className={isLight ? "text-gray-700" : "text-gray-300"}>
              {option.label}
            </span>
            {option.image && (
              <img src={option.image} alt={option.label} className="w-8 h-8 rounded" />
            )}
          </label>
          <span className="text-sm text-gray-500">{option.percentage}%</span>
        </div>
        {/* 进度条 */}
        <div className={cn(
          "h-2 rounded-full overflow-hidden",
          isLight ? "bg-gray-200" : "bg-gray-700"
        )}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${option.percentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-wangfeng-purple to-wangfeng-light"
          />
        </div>
      </div>
    ))}
  </div>
</motion.div>
```

#### 3.4 计划的投票活动

```
1. 🎵 最喜欢的歌曲投票
   - 投票选出粉丝最喜欢的歌
   - 周期: 一月一期

2. 💿 最喜欢的专辑投票
   - 评选最受欢迎的专辑
   - 周期: 一季度一期

3. 🎤 最想听的现场演绎
   - 选择想听哪个历史演出
   - 动态更新中

4. 🌟 歌词最有共鸣的诗句
   - 选出最触动心弦的歌词
   - 周期: 不定期

5. 🎸 乐器独奏挑战赛
   - 选出最想听的乐器表演
   - 周期: 不定期

...后续可扩展
```

---

### 4. 响应式设计

#### 桌面端 (lg及以上)
- 游戏卡片: 4列网格
- 投票卡片: 并排2个
- 间距: `gap-6`

#### 平板端 (md-lg)
- 游戏卡片: 3列网格
- 投票卡片: 单列
- 间距: `gap-4`

#### 手机端 (sm-md)
- 游戏卡片: 2列网格
- 投票卡片: 单列
- 间距: `gap-3`

#### 极小屏幕 (sm以下)
- 游戏卡片: 1列网格
- 投票卡片: 单列
- 间距: `gap-2`

---

## 🔌 数据结构 & API设计

### 后端数据表

#### 1. `games` 表
```sql
CREATE TABLE games (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  icon_emoji VARCHAR(10),
  play_count INT DEFAULT 0,
  route_path VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 2. `polls` 表
```sql
CREATE TABLE polls (
  id VARCHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status ENUM('upcoming', 'active', 'ended') DEFAULT 'upcoming',
  total_votes INT DEFAULT 0,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. `poll_options` 表
```sql
CREATE TABLE poll_options (
  id VARCHAR(36) PRIMARY KEY,
  poll_id VARCHAR(36) NOT NULL,
  label VARCHAR(255) NOT NULL,
  image_url VARCHAR(512),
  vote_count INT DEFAULT 0,
  sort_order INT,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  UNIQUE(poll_id, label)
);
```

#### 4. `poll_votes` 表 (记录用户投票)
```sql
CREATE TABLE poll_votes (
  id VARCHAR(36) PRIMARY KEY,
  poll_id VARCHAR(36) NOT NULL,
  option_id VARCHAR(36) NOT NULL,
  user_ip VARCHAR(45),  -- 记录IP用于防重复投票
  user_id VARCHAR(36),  -- 如果有登录用户
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
  FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
  UNIQUE(poll_id, user_ip)  -- 防止同一IP重复投票
);
```

### API端点 (FastAPI)

#### 游戏相关
```
GET /api/games                    # 获取所有游戏列表
GET /api/games/{id}              # 获取单个游戏详情
POST /api/games/record-play      # 记录游戏玩过
```

#### 投票相关
```
GET /api/polls                      # 获取所有投票
GET /api/polls/{id}                # 获取单个投票详情
GET /api/polls/{id}/options        # 获取投票选项
POST /api/polls/{id}/vote          # 提交投票
```

#### 管理后台
```
POST /admin/api/games             # 创建游戏
PUT /admin/api/games/{id}         # 更新游戏
DELETE /admin/api/games/{id}      # 删除游戏

POST /admin/api/polls             # 创建投票
PUT /admin/api/polls/{id}         # 更新投票
DELETE /admin/api/polls/{id}      # 删除投票
POST /admin/api/polls/{id}/options  # 添加投票选项
```

---

## 🎯 交互细节

### 1. 游戏卡片交互
- **Hover**:
  - 卡片放大 (scale: 1.05)
  - 边框变为紫色
  - 背景渐变显示
  - 阴影增强
- **Click**: 跳转到游戏详情页或打开游戏模态框

### 2. 投票交互
- **选择选项**: 单选按钮，实时显示百分比
- **提交投票**: 自动保存到后端（可选：需要确认）
- **防重复投票**: 通过IP地址或用户ID记录
- **实时更新**: 投票后立即显示新的投票数和百分比

### 3. 动画效果
- **页面进入**: 标题淡入 + 上移 (0.8s)
- **卡片进入**: 错误排列，逐个淡入 (Stagger animation)
- **悬停效果**: 缩放 + 边框变色 (0.3s)
- **投票进度条**: 从0动画到目标百分比 (0.5s)

---

## 🚀 开发步骤

### Phase 1: 基础页面框架 (Week 1)
- [ ] 创建 `GameActivity.tsx` 页面组件
- [ ] 设计页面布局和样式
- [ ] 集成到导航栏和路由

### Phase 2: 游戏模块 (Week 2)
- [ ] 创建 `GameCard.tsx` 组件
- [ ] 设计游戏卡片样式和交互
- [ ] 创建后端 Game 模型和API

### Phase 3: 投票模块 (Week 2-3)
- [ ] 创建 `PollCard.tsx` 组件
- [ ] 设计投票卡片和进度条
- [ ] 创建后端 Poll 模型和API
- [ ] 实现投票逻辑和防重复投票

### Phase 4: 管理后台 (Week 3)
- [ ] 创建 GameManager 管理页面
- [ ] 创建 PollManager 管理页面
- [ ] 实现后台管理功能

### Phase 5: 测试和优化 (Week 4)
- [ ] 端到端测试
- [ ] 性能优化
- [ ] 浅色/深色模式测试

---

## 📝 文件清单

### 前端文件
```
frontend/src/
├── components/
│   ├── pages/
│   │   └── GameActivity.tsx           # 主页面
│   └── ui/
│       ├── GameCard.tsx               # 游戏卡片
│       ├── PollCard.tsx               # 投票卡片
│       └── PollProgressBar.tsx        # 投票进度条
└── utils/
    └── gameAPI.ts                     # 游戏和投票API函数
```

### 后端文件
```
backend/app/
├── models/
│   ├── game.py                        # Game 模型
│   └── poll.py                        # Poll 模型
├── schemas/
│   ├── game.py                        # Game Pydantic Schema
│   └── poll.py                        # Poll Pydantic Schema
├── routers/
│   ├── games.py                       # 游戏相关路由
│   └── polls.py                       # 投票相关路由
└── services/
    ├── game_service.py                # 游戏业务逻辑
    └── poll_service.py                # 投票业务逻辑
```

---

## 💾 CSS变量和主题配置

```css
/* 已有的 Wang Feng 主题色 */
--wangfeng-purple: #8B5CF6;
--wangfeng-dark: #7C3AED;
--wangfeng-light: #A855F7;

/* 建议添加的新类 */
.theme-text-primary     { /* 主文本颜色，随主题变化 */ }
.theme-text-secondary   { /* 次要文本颜色 */ }
.theme-bg-card         { /* 卡片背景颜色 */ }
.theme-border-primary  { /* 主边框颜色 */ }
```

---

## 🎬 动画参考

参考现有项目中的动画类：
- `animate-pulse-glow`: 用于标题发光效果
- `animate-float`: 用于浮动元素
- Framer Motion: `whileHover`, `whileInView`, `transition`

---

## 📱 浅色/深色模式兼容性

所有组件必须支持浅色和深色模式：

```tsx
const { theme } = useTheme();
const isLight = theme === 'white';

// 在所有背景、边框、文本上使用条件样式
className={cn(
  "...",
  isLight
    ? "bg-white border-gray-200 text-gray-900"
    : "bg-black/40 border-wangfeng-purple/30 text-white"
)}
```

---

## 🔗 导航链接更新

在 `Header.tsx` 中的 `navigation` 数组添加：

```typescript
{ name: '游戏活动', path: '/game-activity' },
```

位置: "峰迷荟萃" 和 "关于本站" 之间

---

## 📚 参考已有实现

学习这些文件的实现模式：
- [FengMiLiaoFeng.tsx](../frontend/src/components/pages/FengMiLiaoFengNew.tsx) - 页面结构和类别过滤
- [Gallery.tsx](../frontend/src/components/pages/Gallery.tsx) - 复杂数据处理和模态框
- [ArticleCard.tsx](../frontend/src/components/ui/ArticleCard.tsx) - 卡片设计和动画
- [LIGHT_MODE_DESIGN_GUIDE.md](./LIGHT_MODE_DESIGN_GUIDE.md) - 浅色模式规范

---

## ✅ 质量检查清单

实现前必须确认：
- [ ] 所有色彩符合 Wang Feng 主题
- [ ] 支持浅色和深色模式
- [ ] 响应式设计在所有设备上正常
- [ ] 遵循现有的动画和交互规范
- [ ] TypeScript 类型完整
- [ ] API 数据结构清晰
- [ ] 后端模型和模式定义完善
- [ ] 防止重复投票的逻辑完善

---

## 🎨 设计总结

该页面设计遵循以下原则：

1. **一致性**: 与现有页面（FengMiLiaoFeng、Gallery）保持一致的视觉风格
2. **可扩展性**: 游戏和投票卡片易于添加和管理
3. **交互性**: 丰富的悬停、点击和动画反馈
4. **可访问性**: 支持浅色/深色模式和响应式设计
5. **易维护性**: 清晰的组件结构和API设计

